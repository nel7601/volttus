import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { decrypt } from "@/lib/encryption"
import { pollAlectraBill } from "@/lib/alectra"

/**
 * Cron endpoint: poll Alectra for invoice amounts on AUTO-mode properties.
 *
 * Runs daily after billing close. For each active property with
 * invoiceMode=AUTO and a linked AlectraAccount, it polls the utility API.
 * If a new bill is detected, it updates both the property's
 * monthlyInvoiceAmount and the latest BillingRecord (recalculating toPay).
 *
 * NOTE: Alectra API is currently blocked by Cloudflare WAF from server-side
 * requests. This endpoint will log errors until a browser-based polling
 * solution is implemented (e.g. Playwright on a VPS or Browserless.io).
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Find all active AUTO properties with an Alectra account
  const properties = await prisma.property.findMany({
    where: {
      isActive: true,
      invoiceMode: "AUTO",
      alectraAccount: { isNot: null },
    },
    include: { alectraAccount: true },
  })

  const results: Array<{
    propertyId: string
    status: string
    invoiceAmount?: number
    error?: string
  }> = []

  for (const property of properties) {
    const alectra = property.alectraAccount
    if (!alectra) continue

    try {
      const password = decrypt(alectra.encryptedPassword)
      const result = await pollAlectraBill(
        alectra.username,
        password,
        alectra.accountNumber
      )

      // Update poll tracking
      await prisma.alectraAccount.update({
        where: { id: alectra.id },
        data: {
          lastPollAt: new Date(),
          lastPollResult: result.success ? "success" : result.error,
          lastLoginAt: result.success ? new Date() : alectra.lastLoginAt,
        },
      })

      if (!result.success) {
        results.push({
          propertyId: property.id,
          status: "poll_failed",
          error: result.error,
        })
        continue
      }

      // Check if this is a new bill period
      const billPeriodKey = `${result.billPeriodStart}_${result.billPeriodEnd}`
      const isNewBill = property.lastBillPeriod !== billPeriodKey

      if (isNewBill) {
        // Update property with new invoice amount
        await prisma.property.update({
          where: { id: property.id },
          data: {
            monthlyInvoiceAmount: result.currentCharges,
            lastBillPeriod: billPeriodKey,
            lastBillFetchedAt: new Date(),
          },
        })

        // Also update the latest billing record if it exists and has no invoice
        const latestRecord = await prisma.billingRecord.findFirst({
          where: { propertyId: property.id },
          orderBy: { billingPeriodEnd: "desc" },
          include: { items: true },
        })

        if (latestRecord && latestRecord.monthlyInvoiceAmount === null) {
          await updateRecordInvoice(latestRecord, result.currentCharges)
        }
      }

      results.push({
        propertyId: property.id,
        status: isNewBill ? "updated" : "no_change",
        invoiceAmount: result.currentCharges,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      results.push({
        propertyId: property.id,
        status: "error",
        error: message,
      })
    }
  }

  return NextResponse.json({ processed: results.length, results })
}

/**
 * Update a billing record's invoice amount and recalculate toPay for all items.
 */
async function updateRecordInvoice(
  record: {
    id: string
    totalConsumptionKwh: number
    commonAreaSplit: string
    items: Array<{
      id: string
      groupType: string
      kwh: number
    }>
  },
  invoiceAmount: number
) {
  const totalIncomeKwh = record.totalConsumptionKwh
  const commonItems = record.items.filter((i) => i.groupType === "COMMON")
  const apartmentItems = record.items.filter((i) => i.groupType === "APARTMENT")

  const totalCommonKwh = commonItems.reduce((s, i) => s + i.kwh, 0)
  const totalApartmentKwh = apartmentItems.reduce((s, i) => s + i.kwh, 0)

  const commonCost =
    totalIncomeKwh > 0
      ? (totalCommonKwh / totalIncomeKwh) * invoiceAmount
      : 0

  const updates = apartmentItems.map((item) => {
    const ownCost =
      totalIncomeKwh > 0 ? (item.kwh / totalIncomeKwh) * invoiceAmount : 0
    let commonShare = 0
    if (commonCost > 0 && apartmentItems.length > 0) {
      if (record.commonAreaSplit === "EQUAL") {
        commonShare = commonCost / apartmentItems.length
      } else {
        commonShare =
          totalApartmentKwh > 0
            ? commonCost * (item.kwh / totalApartmentKwh)
            : 0
      }
    }
    return prisma.billingRecordItem.update({
      where: { id: item.id },
      data: { toPay: ownCost + commonShare },
    })
  })

  await prisma.$transaction([
    prisma.billingRecord.update({
      where: { id: record.id },
      data: { monthlyInvoiceAmount: invoiceAmount },
    }),
    ...updates,
  ])
}

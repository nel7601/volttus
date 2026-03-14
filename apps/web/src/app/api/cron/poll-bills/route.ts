import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { decrypt } from "@/lib/encryption"
import { pollAlectraBill } from "@/lib/alectra"

/**
 * Daily billing poll endpoint.
 *
 * Logic:
 * 1. Find all properties with an Alectra account and a billingClosingDay set.
 * 2. For each property, check if today is >= billingClosingDay and we haven't
 *    already captured a bill for this billing period.
 * 3. If so, poll Alectra for the current bill.
 * 4. If the bill period is new (different from lastBillPeriod), update
 *    monthlyInvoiceAmount and mark the period as captured.
 * 5. If the bill is the same period we already have, skip — the new bill
 *    hasn't been posted yet. We'll try again tomorrow.
 *
 * Designed to be called once daily by an external cron (e.g., Vercel Cron, GitHub Actions).
 * Protected by CRON_SECRET header.
 */

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const results: {
    propertyId: string
    propertyName: string
    status: string
    details?: string
  }[] = []

  try {
    // Get all properties with Alectra accounts and a billing closing day
    const properties = await prisma.property.findMany({
      where: {
        isActive: true,
        billingClosingDay: { not: null },
        alectraAccount: { isNot: null },
      },
      include: {
        alectraAccount: true,
      },
    })

    const today = new Date()
    const currentDay = today.getDate()

    for (const property of properties) {
      const alectra = property.alectraAccount
      if (!alectra || alectra.status !== "active") {
        results.push({
          propertyId: property.id,
          propertyName: property.propertyName,
          status: "skipped",
          details: "No active Alectra account",
        })
        continue
      }

      const closingDay = property.billingClosingDay!

      // Only poll if we're on or past the closing day for this month
      // (poll from closingDay to closingDay + 15 to cover late bills)
      const daysSinceClosing = currentDay - closingDay
      if (daysSinceClosing < 0 || daysSinceClosing > 15) {
        results.push({
          propertyId: property.id,
          propertyName: property.propertyName,
          status: "skipped",
          details: `Not in polling window (closing day: ${closingDay}, today: ${currentDay})`,
        })
        continue
      }

      // Poll Alectra
      try {
        const password = decrypt(alectra.encryptedPassword)
        const result = await pollAlectraBill(
          alectra.username,
          password,
          alectra.accountNumber
        )

        // Update last poll timestamp
        await prisma.alectraAccount.update({
          where: { id: alectra.id },
          data: {
            lastPollAt: new Date(),
            lastPollResult: result.success ? "success" : result.error,
          },
        })

        if (!result.success) {
          results.push({
            propertyId: property.id,
            propertyName: property.propertyName,
            status: "error",
            details: result.error,
          })
          continue
        }

        // Check if this is a new bill period
        const billPeriodKey = `${result.billPeriodStart}_${result.billPeriodEnd}`

        if (property.lastBillPeriod === billPeriodKey) {
          results.push({
            propertyId: property.id,
            propertyName: property.propertyName,
            status: "skipped",
            details: `Bill already captured for period ${result.billPeriodStart} to ${result.billPeriodEnd}`,
          })
          continue
        }

        // New bill! Update the property
        await prisma.property.update({
          where: { id: property.id },
          data: {
            monthlyInvoiceAmount: result.currentCharges,
            lastBillPeriod: billPeriodKey,
            lastBillFetchedAt: new Date(),
          },
        })

        results.push({
          propertyId: property.id,
          propertyName: property.propertyName,
          status: "updated",
          details: `Invoice updated to $${result.currentCharges} (period: ${result.billPeriodStart} to ${result.billPeriodEnd})`,
        })
      } catch (err) {
        results.push({
          propertyId: property.id,
          propertyName: property.propertyName,
          status: "error",
          details: err instanceof Error ? err.message : String(err),
        })
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      propertiesChecked: properties.length,
      results,
    })
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    )
  }
}

"use server"

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { generateBillingRecord } from "@/lib/billing"
import { revalidatePath } from "next/cache"

export async function closeBillingPeriod(propertyId: string) {
  const session = await getSession()
  if (!session || (session.role !== "ADMIN" && session.role !== "LANDLORD")) {
    throw new Error("Unauthorized")
  }

  const record = await generateBillingRecord(propertyId)

  revalidatePath("/landlord")
  revalidatePath("/landlord/history")

  return { id: record.id }
}

export async function updateBillingInvoice(
  recordId: string,
  invoiceAmount: number
) {
  const session = await getSession()
  if (!session || (session.role !== "ADMIN" && session.role !== "LANDLORD")) {
    throw new Error("Unauthorized")
  }

  const record = await prisma.billingRecord.findUnique({
    where: { id: recordId },
    include: { items: true },
  })
  if (!record) throw new Error("Record not found")

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
      totalIncomeKwh > 0
        ? (item.kwh / totalIncomeKwh) * invoiceAmount
        : 0
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
      where: { id: recordId },
      data: { monthlyInvoiceAmount: invoiceAmount },
    }),
    ...updates,
  ])

  revalidatePath("/landlord/history")
}

"use server"

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { encrypt } from "@/lib/encryption"
import { alectraAccountSchema } from "@/lib/validations"
import { pollAlectraBill } from "@/lib/alectra"
import { revalidatePath } from "next/cache"

export async function createAlectraAccount(formData: FormData) {
  const session = await getSession()
  if (!session || (session.role !== "ADMIN" && session.role !== "LANDLORD")) {
    return { success: false, error: "Unauthorized" }
  }

  const parsed = alectraAccountSchema.parse({
    username: formData.get("username"),
    password: formData.get("password"),
    accountNumber: formData.get("accountNumber"),
    meterNumber: formData.get("meterNumber") || undefined,
    propertyId: formData.get("propertyId"),
  })

  // Verify credentials against Alectra API before saving
  const verification = await pollAlectraBill(
    parsed.username,
    parsed.password,
    parsed.accountNumber
  )

  if (!verification.success) {
    return {
      success: false,
      error: `Could not connect to Alectra: ${verification.error}`,
    }
  }

  // Credentials verified — save account
  await prisma.alectraAccount.create({
    data: {
      propertyId: parsed.propertyId,
      username: parsed.username,
      encryptedPassword: encrypt(parsed.password),
      accountNumber: parsed.accountNumber,
      meterNumber: parsed.meterNumber || null,
      lastPollAt: new Date(),
      lastPollResult: "success",
      lastLoginAt: new Date(),
    },
  })

  // Also update the property with the first bill data
  const billPeriodKey = `${verification.billPeriodStart}_${verification.billPeriodEnd}`
  await prisma.property.update({
    where: { id: parsed.propertyId },
    data: {
      monthlyInvoiceAmount: verification.currentCharges,
      lastBillPeriod: billPeriodKey,
      lastBillFetchedAt: new Date(),
    },
  })

  revalidatePath("/admin/properties")
  revalidatePath("/landlord")

  return {
    success: true,
    bill: {
      currentCharges: verification.currentCharges,
      totalAmountDue: verification.totalAmountDue,
      billPeriodStart: verification.billPeriodStart,
      billPeriodEnd: verification.billPeriodEnd,
    },
  }
}

export async function deleteAlectraAccount(id: string) {
  const session = await getSession()
  if (!session || (session.role !== "ADMIN" && session.role !== "LANDLORD")) {
    return { success: false, error: "Unauthorized" }
  }

  await prisma.alectraAccount.delete({ where: { id } })
  revalidatePath("/admin/properties")
  revalidatePath("/landlord")

  return { success: true }
}

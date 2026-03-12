"use server"

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

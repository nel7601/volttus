"use server"

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function updatePropertySettings(formData: FormData) {
  const session = await getSession()
  if (!session || (session.role !== "ADMIN" && session.role !== "LANDLORD")) {
    throw new Error("Unauthorized")
  }

  const propertyId = formData.get("propertyId") as string
  const billingClosingDay = Number(formData.get("billingClosingDay")) || null
  const monthlyInvoiceAmount =
    Number(formData.get("monthlyInvoiceAmount")) || null

  await prisma.property.update({
    where: { id: propertyId },
    data: { billingClosingDay, monthlyInvoiceAmount },
  })

  revalidatePath("/landlord")
}

export async function updateCommonAreaSplit(
  propertyId: string,
  method: "EQUAL" | "PROPORTIONAL"
) {
  const session = await getSession()
  if (!session || (session.role !== "ADMIN" && session.role !== "LANDLORD")) {
    throw new Error("Unauthorized")
  }

  await prisma.property.update({
    where: { id: propertyId },
    data: { commonAreaSplit: method },
  })

  revalidatePath("/landlord")
}

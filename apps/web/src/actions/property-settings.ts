"use server"

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function updatePropertyDetails(formData: FormData) {
  const session = await getSession()
  if (!session || (session.role !== "ADMIN" && session.role !== "LANDLORD")) {
    throw new Error("Unauthorized")
  }

  const propertyId = formData.get("propertyId") as string
  const propertyName = formData.get("propertyName") as string
  const addressLine1 = formData.get("addressLine1") as string
  const addressLine2 = (formData.get("addressLine2") as string) || null
  const city = formData.get("city") as string
  const billingClosingDay = Number(formData.get("billingClosingDay")) || null

  await prisma.property.update({
    where: { id: propertyId },
    data: { propertyName, addressLine1, addressLine2, city, billingClosingDay },
  })

  revalidatePath("/landlord")
}

export async function updateMonthlyInvoice(formData: FormData) {
  const session = await getSession()
  if (!session || (session.role !== "ADMIN" && session.role !== "LANDLORD")) {
    throw new Error("Unauthorized")
  }

  const propertyId = formData.get("propertyId") as string
  const monthlyInvoiceAmount =
    Number(formData.get("monthlyInvoiceAmount")) || null

  await prisma.property.update({
    where: { id: propertyId },
    data: { monthlyInvoiceAmount },
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

export async function assignTenantToGroup(groupId: string, tenantId: string) {
  const session = await getSession()
  if (!session || (session.role !== "ADMIN" && session.role !== "LANDLORD")) {
    throw new Error("Unauthorized")
  }

  // Get the group to know its propertyId
  const group = await prisma.channelGroup.findUnique({
    where: { id: groupId },
    select: { propertyId: true },
  })
  if (!group) throw new Error("Group not found")

  // Clear any existing tenant on this group
  await prisma.user.updateMany({
    where: { apartmentGroupId: groupId },
    data: { apartmentGroupId: null },
  })

  // Assign the new tenant to the group and property
  await prisma.user.update({
    where: { id: tenantId },
    data: {
      apartmentGroupId: groupId,
      propertyId: group.propertyId,
    },
  })

  revalidatePath("/landlord")
}

export async function removeTenantFromGroup(groupId: string) {
  const session = await getSession()
  if (!session || (session.role !== "ADMIN" && session.role !== "LANDLORD")) {
    throw new Error("Unauthorized")
  }

  await prisma.user.updateMany({
    where: { apartmentGroupId: groupId },
    data: { apartmentGroupId: null },
  })

  revalidatePath("/landlord")
}

"use server"

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { propertySchema } from "@/lib/validations"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createProperty(formData: FormData) {
  const session = await getSession()
  if (session?.role !== "ADMIN") throw new Error("Unauthorized")

  const parsed = propertySchema.parse({
    propertyName: formData.get("propertyName"),
    addressLine1: formData.get("addressLine1"),
    addressLine2: formData.get("addressLine2") || undefined,
    city: formData.get("city"),
    provinceState: formData.get("provinceState") || undefined,
    postalCode: formData.get("postalCode") || undefined,
    country: formData.get("country") || "HR",
    timezone: formData.get("timezone") || "Europe/Zagreb",
    landlordId: formData.get("landlordId"),
  })

  await prisma.property.create({ data: parsed })
  revalidatePath("/admin/properties")
}

export async function updateProperty(formData: FormData) {
  const session = await getSession()
  if (session?.role !== "ADMIN") throw new Error("Unauthorized")

  const propertyId = formData.get("propertyId") as string
  if (!propertyId) throw new Error("Property ID required")

  const parsed = propertySchema.parse({
    propertyName: formData.get("propertyName"),
    addressLine1: formData.get("addressLine1"),
    addressLine2: formData.get("addressLine2") || undefined,
    city: formData.get("city"),
    provinceState: formData.get("provinceState") || undefined,
    postalCode: formData.get("postalCode") || undefined,
    country: formData.get("country") || "CA",
    timezone: formData.get("timezone") || "America/Toronto",
    landlordId: formData.get("landlordId"),
  })

  const billingClosingDay = Number(formData.get("billingClosingDay")) || null
  const isActive = formData.get("isActive") === "true"

  await prisma.property.update({
    where: { id: propertyId },
    data: {
      ...parsed,
      billingClosingDay,
      isActive,
    },
  })

  revalidatePath("/admin/properties")
  revalidatePath("/landlord")
  redirect(`/admin/properties/${propertyId}`)
}

export async function deleteProperty(id: string) {
  const session = await getSession()
  if (session?.role !== "ADMIN") throw new Error("Unauthorized")

  await prisma.property.delete({ where: { id } })
  revalidatePath("/admin/properties")
}

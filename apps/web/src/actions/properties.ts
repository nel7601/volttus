"use server"

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { propertySchema } from "@/lib/validations"
import { revalidatePath } from "next/cache"

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

export async function deleteProperty(id: string) {
  const session = await getSession()
  if (session?.role !== "ADMIN") throw new Error("Unauthorized")

  await prisma.property.delete({ where: { id } })
  revalidatePath("/admin/properties")
}

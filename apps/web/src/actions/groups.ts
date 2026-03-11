"use server"

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { groupSchema } from "@/lib/validations"
import { revalidatePath } from "next/cache"

export async function createGroup(formData: FormData) {
  const session = await getSession()
  if (session?.role !== "ADMIN") throw new Error("Unauthorized")

  const parsed = groupSchema.parse({
    groupName: formData.get("groupName"),
    groupType: formData.get("groupType"),
    apartmentNumber: formData.get("apartmentNumber") || undefined,
    displayOrder: formData.get("displayOrder") || 0,
    propertyId: formData.get("propertyId"),
  })

  await prisma.channelGroup.create({ data: parsed })
  revalidatePath(`/admin/properties/${parsed.propertyId}/groups`)
}

export async function deleteGroup(id: string, propertyId: string) {
  const session = await getSession()
  if (session?.role !== "ADMIN") throw new Error("Unauthorized")

  await prisma.channelGroup.delete({ where: { id } })
  revalidatePath(`/admin/properties/${propertyId}/groups`)
}

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

export async function updateGroup(formData: FormData) {
  const session = await getSession()
  if (session?.role !== "ADMIN") throw new Error("Unauthorized")

  const id = formData.get("id") as string
  const propertyId = formData.get("propertyId") as string

  await prisma.channelGroup.update({
    where: { id },
    data: {
      groupName: formData.get("groupName") as string,
      groupType: formData.get("groupType") as "INCOME" | "COMMON" | "APARTMENT",
      apartmentNumber: (formData.get("apartmentNumber") as string) || null,
      displayOrder: Number(formData.get("displayOrder")) || 0,
    },
  })

  revalidatePath(`/admin/properties/${propertyId}/groups`)
}

export async function deleteGroup(formData: FormData) {
  const session = await getSession()
  if (session?.role !== "ADMIN") throw new Error("Unauthorized")

  const id = formData.get("id") as string
  const propertyId = formData.get("propertyId") as string

  // Check if group has tenants assigned
  const tenantCount = await prisma.user.count({
    where: { apartmentGroupId: id, role: "TENANT" },
  })

  if (tenantCount > 0) {
    throw new Error(
      `Cannot delete group: ${tenantCount} tenant(s) are assigned to it. Remove tenants first.`
    )
  }

  // Delete group measurements first (FK constraint)
  await prisma.groupMeasurement.deleteMany({
    where: { groupId: id },
  })

  // Unassign any channels from this group
  await prisma.channel.updateMany({
    where: { assignedGroupId: id },
    data: { assignedGroupId: null },
  })

  await prisma.channelGroup.delete({ where: { id } })
  revalidatePath(`/admin/properties/${propertyId}/groups`)
}

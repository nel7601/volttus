"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function updateChannelMapping(
  channelId: string,
  data: {
    displayName?: string
    assignedGroupId?: string | null
    isEnabled?: boolean
  }
) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized")

  await prisma.channel.update({
    where: { id: channelId },
    data,
  })
}

export async function bulkUpdateChannelMappings(
  propertyId: string,
  mappings: Array<{
    channelId: string
    displayName: string
    assignedGroupId: string | null
    isEnabled: boolean
  }>
) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized")

  await prisma.$transaction(
    mappings.map((m) =>
      prisma.channel.update({
        where: { id: m.channelId },
        data: {
          displayName: m.displayName,
          assignedGroupId: m.assignedGroupId,
          isEnabled: m.isEnabled,
        },
      })
    )
  )

  revalidatePath(`/admin/properties/${propertyId}/channels`)
}

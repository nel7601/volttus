"use server"

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { encrypt } from "@/lib/encryption"
import { emporiaAccountSchema } from "@/lib/validations"
import { revalidatePath } from "next/cache"

export async function createEmporiaAccount(formData: FormData) {
  const session = await getSession()
  if (session?.role !== "ADMIN") throw new Error("Unauthorized")

  const parsed = emporiaAccountSchema.parse({
    accountEmail: formData.get("accountEmail"),
    password: formData.get("password"),
    propertyId: formData.get("propertyId"),
  })

  await prisma.emporiaAccount.create({
    data: {
      propertyId: parsed.propertyId,
      accountEmail: parsed.accountEmail,
      encryptedPassword: encrypt(parsed.password),
    },
  })

  revalidatePath("/admin/properties")
}

export async function deleteEmporiaAccount(id: string) {
  const session = await getSession()
  if (session?.role !== "ADMIN") throw new Error("Unauthorized")

  await prisma.emporiaAccount.delete({ where: { id } })
  revalidatePath("/admin/properties")
}

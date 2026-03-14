"use server"

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { encrypt } from "@/lib/encryption"
import { alectraAccountSchema } from "@/lib/validations"
import { revalidatePath } from "next/cache"

export async function createAlectraAccount(formData: FormData) {
  const session = await getSession()
  if (!session || (session.role !== "ADMIN" && session.role !== "LANDLORD")) {
    throw new Error("Unauthorized")
  }

  const parsed = alectraAccountSchema.parse({
    username: formData.get("username"),
    password: formData.get("password"),
    accountNumber: formData.get("accountNumber"),
    meterNumber: formData.get("meterNumber") || undefined,
    propertyId: formData.get("propertyId"),
  })

  await prisma.alectraAccount.create({
    data: {
      propertyId: parsed.propertyId,
      username: parsed.username,
      encryptedPassword: encrypt(parsed.password),
      accountNumber: parsed.accountNumber,
      meterNumber: parsed.meterNumber || null,
    },
  })

  revalidatePath("/admin/properties")
  revalidatePath("/landlord")
}

export async function deleteAlectraAccount(id: string) {
  const session = await getSession()
  if (!session || (session.role !== "ADMIN" && session.role !== "LANDLORD")) {
    throw new Error("Unauthorized")
  }

  await prisma.alectraAccount.delete({ where: { id } })
  revalidatePath("/admin/properties")
  revalidatePath("/landlord")
}

"use server"

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

export async function createTenant(formData: FormData) {
  const session = await getSession()
  if (!session || (session.role !== "ADMIN" && session.role !== "LANDLORD")) {
    throw new Error("Unauthorized")
  }

  const fullName = formData.get("fullName") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const propertyId = formData.get("propertyId") as string
  const apartmentGroupId = (formData.get("apartmentGroupId") as string) || null

  if (!fullName || !email || !password || !propertyId) {
    throw new Error("Missing required fields")
  }

  const passwordHash = await bcrypt.hash(password, 10)

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName,
      role: "TENANT",
      propertyId,
      apartmentGroupId,
    },
  })

  revalidatePath("/landlord/settings")
  revalidatePath("/landlord")
}

export async function updateTenant(formData: FormData) {
  const session = await getSession()
  if (!session || (session.role !== "ADMIN" && session.role !== "LANDLORD")) {
    throw new Error("Unauthorized")
  }

  const id = formData.get("id") as string
  const fullName = formData.get("fullName") as string
  const email = formData.get("email") as string
  const newPassword = (formData.get("newPassword") as string) || null
  const apartmentGroupId = (formData.get("apartmentGroupId") as string) || null

  const data: Record<string, unknown> = {
    fullName,
    email,
    apartmentGroupId,
  }

  if (newPassword && newPassword.length >= 6) {
    data.passwordHash = await bcrypt.hash(newPassword, 10)
  }

  await prisma.user.update({
    where: { id },
    data,
  })

  revalidatePath("/landlord/settings")
  revalidatePath("/landlord")
}

export async function toggleTenantArchive(tenantId: string) {
  const session = await getSession()
  if (!session || (session.role !== "ADMIN" && session.role !== "LANDLORD")) {
    throw new Error("Unauthorized")
  }

  const user = await prisma.user.findUnique({ where: { id: tenantId } })
  if (!user) throw new Error("Tenant not found")

  await prisma.user.update({
    where: { id: tenantId },
    data: { isActive: !user.isActive },
  })

  revalidatePath("/landlord/settings")
  revalidatePath("/landlord")
}

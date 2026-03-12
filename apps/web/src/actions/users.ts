"use server"

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { userSchema } from "@/lib/validations"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

export async function createUser(formData: FormData) {
  const session = await getSession()
  if (session?.role !== "ADMIN") throw new Error("Unauthorized")

  const parsed = userSchema.parse({
    email: formData.get("email"),
    fullName: formData.get("fullName"),
    password: formData.get("password"),
    role: formData.get("role"),
    companyName: formData.get("companyName") || undefined,
    phone: formData.get("phone") || undefined,
    propertyId: formData.get("propertyId") || undefined,
    apartmentGroupId: formData.get("apartmentGroupId") || undefined,
  })

  const passwordHash = await bcrypt.hash(parsed.password, 10)

  await prisma.user.create({
    data: {
      email: parsed.email,
      passwordHash,
      fullName: parsed.fullName,
      role: parsed.role,
      companyName: parsed.role === "LANDLORD" ? parsed.companyName : undefined,
      phone: parsed.role === "LANDLORD" ? parsed.phone : undefined,
      propertyId: parsed.role === "TENANT" ? parsed.propertyId : undefined,
      apartmentGroupId: parsed.role === "TENANT" ? parsed.apartmentGroupId : undefined,
    },
  })

  revalidatePath("/admin/users")
}

export async function updateUser(formData: FormData) {
  const session = await getSession()
  if (session?.role !== "ADMIN") throw new Error("Unauthorized")

  const id = formData.get("id") as string
  const fullName = formData.get("fullName") as string
  const email = formData.get("email") as string
  const companyName = (formData.get("companyName") as string) || null
  const phone = (formData.get("phone") as string) || null
  const propertyId = (formData.get("propertyId") as string) || null
  const apartmentGroupId = (formData.get("apartmentGroupId") as string) || null

  await prisma.user.update({
    where: { id },
    data: { fullName, email, companyName, phone, propertyId, apartmentGroupId },
  })

  revalidatePath("/admin/users")
}

export async function archiveUser(formData: FormData) {
  const session = await getSession()
  if (session?.role !== "ADMIN") throw new Error("Unauthorized")

  const id = formData.get("id") as string
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) throw new Error("User not found")

  await prisma.user.update({
    where: { id },
    data: { isActive: !user.isActive },
  })

  revalidatePath("/admin/users")
}

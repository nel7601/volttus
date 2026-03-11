"use server"

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { tenantSchema } from "@/lib/validations"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

export async function createTenant(formData: FormData) {
  const session = await getSession()
  if (session?.role !== "ADMIN") throw new Error("Unauthorized")

  const parsed = tenantSchema.parse({
    email: formData.get("email"),
    fullName: formData.get("fullName"),
    password: formData.get("password"),
    propertyId: formData.get("propertyId"),
    apartmentGroupId: formData.get("apartmentGroupId"),
  })

  const passwordHash = await bcrypt.hash(parsed.password, 10)

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: parsed.email,
        passwordHash,
        fullName: parsed.fullName,
        role: "TENANT",
      },
    })

    await tx.tenant.create({
      data: {
        userId: user.id,
        propertyId: parsed.propertyId,
        apartmentGroupId: parsed.apartmentGroupId,
      },
    })
  })

  revalidatePath("/admin/tenants")
}

export async function deleteTenant(tenantId: string) {
  const session = await getSession()
  if (session?.role !== "ADMIN") throw new Error("Unauthorized")

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { userId: true },
  })

  if (tenant) {
    await prisma.user.delete({ where: { id: tenant.userId } })
  }

  revalidatePath("/admin/tenants")
}

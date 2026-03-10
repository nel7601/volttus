"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

export async function createLandlord(formData: FormData) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized")

  const email = formData.get("email") as string
  const fullName = formData.get("fullName") as string
  const password = formData.get("password") as string
  const companyName = (formData.get("companyName") as string) || undefined
  const phone = (formData.get("phone") as string) || undefined

  const passwordHash = await bcrypt.hash(password, 10)

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        role: "LANDLORD",
      },
    })

    await tx.landlord.create({
      data: {
        userId: user.id,
        companyName,
        phone,
      },
    })
  })

  revalidatePath("/admin/properties")
}

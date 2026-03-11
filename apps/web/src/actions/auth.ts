"use server"

import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { createSession, deleteSession } from "@/lib/auth"
import { loginSchema } from "@/lib/validations"

export async function loginAction(_prevState: { error: string }, formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { error: "Invalid email or password" }
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  })

  if (!user || !user.isActive) {
    return { error: "Invalid email or password" }
  }

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash)
  if (!valid) {
    return { error: "Invalid email or password" }
  }

  await createSession({
    id: user.id,
    email: user.email,
    name: user.fullName,
    role: user.role,
  })

  // Redirect based on role
  if (user.role === "ADMIN") redirect("/admin")
  if (user.role === "LANDLORD") redirect("/landlord")
  if (user.role === "TENANT") redirect("/tenant")
  redirect("/")
}

export async function logoutAction() {
  await deleteSession()
  redirect("/login")
}

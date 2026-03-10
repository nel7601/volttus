import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const dynamic = "force-dynamic"

export async function GET() {
  const checks: Record<string, unknown> = {}

  try {
    checks.dbUrlSet = !!process.env.DATABASE_URL
    checks.dbUrlPrefix = process.env.DATABASE_URL?.substring(0, 30) || "NOT SET"

    const userCount = await prisma.user.count()
    checks.dbConnection = "OK"
    checks.userCount = userCount

    const user = await prisma.user.findUnique({
      where: { email: "admin@volttus.com" },
      select: { id: true, email: true, role: true, isActive: true, passwordHash: true },
    })
    checks.adminFound = !!user
    checks.adminRole = user?.role
    checks.adminActive = user?.isActive

    if (user) {
      const valid = await bcrypt.compare("admin123", user.passwordHash)
      checks.passwordValid = valid
    }
  } catch (e) {
    checks.error = e instanceof Error ? e.message : String(e)
    checks.stack = e instanceof Error ? e.stack?.split("\n").slice(0, 5) : undefined
  }

  return NextResponse.json(checks)
}

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const dynamic = "force-dynamic"

export async function GET() {
  const checks: Record<string, unknown> = {}

  try {
    // Check 1: DB connection
    const userCount = await prisma.user.count()
    checks.dbConnection = "OK"
    checks.userCount = userCount

    // Check 2: Find admin user
    const user = await prisma.user.findUnique({
      where: { email: "admin@volttus.com" },
      select: { id: true, email: true, role: true, isActive: true, passwordHash: true },
    })
    checks.adminFound = !!user
    checks.adminRole = user?.role
    checks.adminActive = user?.isActive

    // Check 3: Password verify
    if (user) {
      const valid = await bcrypt.compare("admin123", user.passwordHash)
      checks.passwordValid = valid
    }

    // Check env vars
    checks.hasDbUrl = !!process.env.DATABASE_URL
    checks.hasAuthSecret = !!process.env.AUTH_SECRET
    checks.nodeEnv = process.env.NODE_ENV
  } catch (e) {
    checks.error = e instanceof Error ? e.message : String(e)
    checks.stack = e instanceof Error ? e.stack?.split("\n").slice(0, 5) : undefined
  }

  return NextResponse.json(checks)
}

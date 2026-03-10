import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json({
    hasDbUrl: !!process.env.DATABASE_URL,
    dbUrlPrefix: process.env.DATABASE_URL?.substring(0, 30) || "NOT SET",
    hasDirectUrl: !!process.env.DIRECT_URL,
    hasAuthSecret: !!process.env.AUTH_SECRET,
    hasAuthUrl: !!process.env.AUTH_URL,
    hasEncKey: !!process.env.EMPORIA_ENCRYPTION_KEY,
    nodeEnv: process.env.NODE_ENV,
    allEnvKeys: Object.keys(process.env).filter(
      (k) => k.startsWith("DATABASE") || k.startsWith("AUTH") || k.startsWith("EMPORIA") || k.startsWith("DIRECT") || k.startsWith("VERCEL") || k.startsWith("NEXT")
    ),
  })
}

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateBillingRecord } from "@/lib/billing"

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Find all active properties with billingClosingDay set
  const properties = await prisma.property.findMany({
    where: {
      isActive: true,
      billingClosingDay: { not: null },
      monthlyInvoiceAmount: { not: null },
    },
    select: {
      id: true,
      billingClosingDay: true,
      timezone: true,
    },
  })

  const today = new Date()
  const results: Array<{ propertyId: string; status: string; error?: string }> =
    []

  for (const property of properties) {
    // Check if today matches the closing day in the property's timezone
    const localDate = new Date(
      today.toLocaleString("en-US", { timeZone: property.timezone })
    )
    const dayOfMonth = localDate.getDate()

    if (dayOfMonth !== property.billingClosingDay) {
      continue
    }

    try {
      await generateBillingRecord(property.id)
      results.push({ propertyId: property.id, status: "ok" })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      results.push({ propertyId: property.id, status: "error", error: message })
    }
  }

  return NextResponse.json({ processed: results.length, results })
}

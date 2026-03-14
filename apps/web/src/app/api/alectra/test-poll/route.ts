import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { decrypt } from "@/lib/encryption"
import { pollAlectraBill } from "@/lib/alectra"
import { getSession } from "@/lib/auth"

/**
 * Manual test endpoint for polling a single property's Alectra bill.
 * Requires authenticated ADMIN or LANDLORD session.
 *
 * POST /api/alectra/test-poll
 * Body: { propertyId: string }
 */
export async function POST(request: Request) {
  const session = await getSession()
  if (!session || (session.role !== "ADMIN" && session.role !== "LANDLORD")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { propertyId } = await request.json()
  if (!propertyId) {
    return NextResponse.json({ error: "propertyId required" }, { status: 400 })
  }

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: { alectraAccount: true },
  })

  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 })
  }

  if (!property.alectraAccount) {
    return NextResponse.json(
      { error: "No Alectra account linked to this property" },
      { status: 400 }
    )
  }

  const alectra = property.alectraAccount
  const password = decrypt(alectra.encryptedPassword)
  const result = await pollAlectraBill(alectra.username, password, alectra.accountNumber)

  // Update last poll info
  await prisma.alectraAccount.update({
    where: { id: alectra.id },
    data: {
      lastPollAt: new Date(),
      lastPollResult: result.success ? "success" : result.error,
      lastLoginAt: result.success ? new Date() : alectra.lastLoginAt,
    },
  })

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 })
  }

  // Check if new period and update
  const billPeriodKey = `${result.billPeriodStart}_${result.billPeriodEnd}`
  const isNewBill = property.lastBillPeriod !== billPeriodKey

  if (isNewBill) {
    await prisma.property.update({
      where: { id: property.id },
      data: {
        monthlyInvoiceAmount: result.currentCharges,
        lastBillPeriod: billPeriodKey,
        lastBillFetchedAt: new Date(),
      },
    })
  }

  return NextResponse.json({
    success: true,
    isNewBill,
    bill: result,
    message: isNewBill
      ? `Invoice updated to $${result.currentCharges}`
      : `Bill already captured for this period ($${result.currentCharges})`,
  })
}

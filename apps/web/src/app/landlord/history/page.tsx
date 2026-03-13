import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import {
  BillingHistory,
  type BillingRecordData,
} from "@/components/landlord/billing-history"
import { computeCurrentPeriodData } from "@/lib/billing"

export const dynamic = "force-dynamic"

export default async function LandlordHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ propertyId?: string; year?: string; month?: string }>
}) {
  const session = await getSession()
  if (!session) redirect("/login")

  const landlord = await prisma.user.findUnique({
    where: { id: session.id },
    include: { properties: true },
  })

  if (!landlord || landlord.properties.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        No properties found.
      </div>
    )
  }

  const params = await searchParams
  const selectedPropertyId = params.propertyId ?? landlord.properties[0].id
  const property = landlord.properties.find((p) => p.id === selectedPropertyId)
  if (!property) redirect("/landlord/history")

  const now = new Date()
  const selectedYear = params.year ? parseInt(params.year, 10) : now.getFullYear()
  const selectedMonth = params.month ? parseInt(params.month, 10) : null

  // Build date range filter
  let dateFrom: Date
  let dateTo: Date

  if (selectedMonth !== null) {
    dateFrom = new Date(selectedYear, selectedMonth - 1, 1)
    dateTo = new Date(selectedYear, selectedMonth, 1)
  } else {
    dateFrom = new Date(selectedYear, 0, 1)
    dateTo = new Date(selectedYear + 1, 0, 1)
  }

  const records = await prisma.billingRecord.findMany({
    where: {
      propertyId: selectedPropertyId,
      billingPeriodEnd: {
        gte: dateFrom,
        lt: dateTo,
      },
    },
    orderBy: { billingPeriodEnd: "desc" },
    include: {
      items: {
        orderBy: { groupType: "asc" },
      },
    },
  })

  // Get available years from existing records
  const yearRecords = await prisma.billingRecord.findMany({
    where: { propertyId: selectedPropertyId },
    select: { billingPeriodEnd: true },
    distinct: ["billingPeriodEnd"],
  })

  const availableYears = [
    ...new Set(yearRecords.map((r) => r.billingPeriodEnd.getFullYear())),
  ].sort((a, b) => b - a)

  // Always include current year
  if (!availableYears.includes(now.getFullYear())) {
    availableYears.unshift(now.getFullYear())
  }

  // Compute current (open) period live data
  const currentPeriod = await computeCurrentPeriodData(selectedPropertyId)

  // Serialize dates for client component
  const serializedRecords: BillingRecordData[] = records.map((r) => ({
    id: r.id,
    billingPeriodStart: r.billingPeriodStart.toISOString(),
    billingPeriodEnd: r.billingPeriodEnd.toISOString(),
    billingClosingDay: r.billingClosingDay,
    totalConsumptionKwh: r.totalConsumptionKwh,
    monthlyInvoiceAmount: r.monthlyInvoiceAmount,
    commonAreaSplit: r.commonAreaSplit,
    createdAt: r.createdAt.toISOString(),
    items: r.items.map((item) => ({
      id: item.id,
      groupName: item.groupName,
      groupType: item.groupType,
      kwh: item.kwh,
      percentage: item.percentage,
      toPay: item.toPay,
      tenantName: item.tenantName,
    })),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/landlord?propertyId=${selectedPropertyId}`}
          className="text-muted-foreground hover:text-foreground"
        >
          &larr; Dashboard
        </Link>
        <h2 className="text-xl font-bold">
          {property.propertyName} — Billing History
        </h2>
      </div>

      <BillingHistory
        records={serializedRecords}
        currentPeriod={currentPeriod}
        propertyId={selectedPropertyId}
        propertyName={property.propertyName}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        availableYears={availableYears}
      />
    </div>
  )
}

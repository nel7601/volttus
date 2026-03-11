import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import {
  LandlordDashboard,
  type PropertyData,
  type GroupData,
} from "@/components/landlord/landlord-dashboard"

export const dynamic = "force-dynamic"

function getLastClosingDate(billingClosingDay: number | null): Date {
  if (!billingClosingDay) {
    // Default: first day of current month
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  }
  const now = new Date()
  const thisMonthClosing = new Date(
    now.getFullYear(),
    now.getMonth(),
    billingClosingDay
  )
  if (now >= thisMonthClosing) return thisMonthClosing
  // Go to previous month's closing day
  return new Date(now.getFullYear(), now.getMonth() - 1, billingClosingDay)
}

export default async function LandlordPage({
  searchParams,
}: {
  searchParams: Promise<{ propertyId?: string }>
}) {
  const session = await getSession()
  if (!session) redirect("/login")

  const landlord = await prisma.landlord.findUnique({
    where: { userId: session.id },
    include: { properties: true },
  })

  if (!landlord || landlord.properties.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        No properties assigned to your account yet.
      </div>
    )
  }

  const { propertyId } = await searchParams
  const selectedId = propertyId ?? landlord.properties[0].id
  const property = landlord.properties.find((p) => p.id === selectedId)
  if (!property) redirect("/landlord")

  const lastClosingDate = getLastClosingDate(property.billingClosingDay)

  // Fetch groups with tenants and consumption since last closing
  const groups = await prisma.channelGroup.findMany({
    where: { propertyId: property.id, isActive: true },
    orderBy: { displayOrder: "asc" },
    include: {
      tenants: {
        include: { user: { select: { fullName: true } } },
        take: 1,
      },
    },
  })

  // Get consumption per group since last closing date using GroupMeasurement
  const groupConsumption: Record<string, number> = {}
  for (const group of groups) {
    const result = await prisma.groupMeasurement.aggregate({
      where: {
        groupId: group.id,
        measurementTs: { gte: lastClosingDate },
      },
      _sum: { totalKwh: true },
    })
    groupConsumption[group.id] = result._sum.totalKwh ?? 0
  }

  // Find total income consumption
  const incomeGroup = groups.find((g) => g.groupType === "INCOME")
  const totalIncomeKwh = incomeGroup
    ? groupConsumption[incomeGroup.id] ?? 0
    : 0

  // Build props
  const propertiesData: PropertyData[] = landlord.properties.map((p) => ({
    id: p.id,
    propertyName: p.propertyName,
    addressLine1: p.addressLine1,
    addressLine2: p.addressLine2,
    city: p.city,
    country: p.country,
    billingClosingDay: p.billingClosingDay,
    commonAreaSplit: p.commonAreaSplit,
    monthlyInvoiceAmount: p.monthlyInvoiceAmount,
  }))

  const groupsData: GroupData[] = groups.map((g) => ({
    id: g.id,
    groupName: g.groupName,
    groupType: g.groupType,
    apartmentNumber: g.apartmentNumber,
    consumptionKwh: groupConsumption[g.id] ?? 0,
    tenant: g.tenants[0]
      ? { id: g.tenants[0].id, fullName: g.tenants[0].user.fullName }
      : null,
  }))

  // Chart data: income total + all non-income groups
  const chartData = []
  if (incomeGroup) {
    chartData.push({
      name: "Total (Income)",
      kwh: totalIncomeKwh,
      type: "INCOME",
    })
  }
  for (const g of groups) {
    if (g.groupType === "INCOME") continue
    chartData.push({
      name: g.groupName,
      kwh: groupConsumption[g.id] ?? 0,
      type: g.groupType,
    })
  }

  return (
    <LandlordDashboard
      properties={propertiesData}
      selectedPropertyId={selectedId}
      groups={groupsData}
      totalIncomeKwh={totalIncomeKwh}
      chartData={chartData}
    />
  )
}

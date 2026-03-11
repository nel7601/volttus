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

  // Fetch only groups that have at least one enabled channel assigned
  const groups = await prisma.channelGroup.findMany({
    where: {
      propertyId: property.id,
      isActive: true,
      channels: { some: { isEnabled: true } },
    },
    orderBy: { displayOrder: "asc" },
    include: {
      tenants: {
        include: { user: { select: { fullName: true } } },
        take: 1,
      },
    },
  })

  // Get consumption per group since last closing date using Measurement table
  // Aggregate kWh from individual channel measurements grouped by their assigned group
  const groupConsumption: Record<string, number> = {}
  const groupIds = groups.map((g) => g.id)

  if (groupIds.length > 0) {
    const channelsWithConsumption = await prisma.channel.findMany({
      where: {
        propertyId: property.id,
        isEnabled: true,
        assignedGroupId: { in: groupIds },
      },
      select: {
        assignedGroupId: true,
        measurements: {
          where: { measurementTs: { gte: lastClosingDate } },
          select: { kwh: true },
        },
      },
    })

    for (const ch of channelsWithConsumption) {
      if (!ch.assignedGroupId) continue
      // Only sum positive kWh values (ignore export/negative readings)
      const totalKwh = ch.measurements.reduce(
        (sum, m) => sum + Math.max(0, m.kwh ?? 0),
        0
      )
      groupConsumption[ch.assignedGroupId] =
        (groupConsumption[ch.assignedGroupId] ?? 0) + totalKwh
    }
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

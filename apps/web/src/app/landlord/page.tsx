import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getLastClosingDate } from "@/lib/billing"
import { redirect } from "next/navigation"
import {
  LandlordDashboard,
  type PropertyData,
  type GroupData,
  type TenantOption,
} from "@/components/landlord/landlord-dashboard"

export const dynamic = "force-dynamic"

export default async function LandlordPage({
  searchParams,
}: {
  searchParams: Promise<{ propertyId?: string }>
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
        No properties assigned to your account yet.
      </div>
    )
  }

  const { propertyId } = await searchParams
  const selectedId = propertyId ?? landlord.properties[0].id
  const property = landlord.properties.find((p) => p.id === selectedId)
  if (!property) redirect("/landlord")

  const lastClosingDate = getLastClosingDate(property.billingClosingDay)

  // Fetch groups with enabled channels OR virtual groups (no channels needed)
  const groups = await prisma.channelGroup.findMany({
    where: {
      propertyId: property.id,
      isActive: true,
      OR: [
        { channels: { some: { isEnabled: true } } },
        { isVirtual: true },
      ],
    },
    orderBy: { displayOrder: "asc" },
    include: {
      tenants: {
        select: { id: true, fullName: true },
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

  // Calculate virtual group consumption:
  // Virtual consumption = Income - sum of all non-virtual, non-income groups
  const virtualGroups = groups.filter((g) => g.isVirtual)
  if (virtualGroups.length > 0) {
    const sumNonVirtualConsumption = groups
      .filter((g) => !g.isVirtual && g.groupType !== "INCOME")
      .reduce((sum, g) => sum + (groupConsumption[g.id] ?? 0), 0)

    const remainingKwh = Math.max(0, totalIncomeKwh - sumNonVirtualConsumption)
    const perVirtualKwh = remainingKwh / virtualGroups.length

    for (const vg of virtualGroups) {
      groupConsumption[vg.id] = perVirtualKwh
    }
  }

  // Fetch tenants that belong to this landlord's properties
  const landlordPropertyIds = landlord.properties.map((p) => p.id)
  const tenants = await prisma.user.findMany({
    where: {
      role: "TENANT",
      isActive: true,
      propertyId: { in: landlordPropertyIds },
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      apartmentGroupId: true,
    },
    orderBy: { fullName: "asc" },
  })

  const tenantsData: TenantOption[] = tenants.map((t) => ({
    id: t.id,
    fullName: t.fullName,
    email: t.email,
    apartmentGroupId: t.apartmentGroupId,
  }))

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
    isVirtual: g.isVirtual,
    tenant: g.tenants[0]
      ? { id: g.tenants[0].id, fullName: g.tenants[0].fullName }
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
      isVirtual: g.isVirtual,
    })
  }

  return (
    <LandlordDashboard
      properties={propertiesData}
      selectedPropertyId={selectedId}
      groups={groupsData}
      totalIncomeKwh={totalIncomeKwh}
      chartData={chartData}
      tenants={tenantsData}
    />
  )
}

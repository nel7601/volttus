import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getLastClosingDate } from "@/lib/billing"
import { redirect } from "next/navigation"
import {
  TenantDashboard,
  type TenantPropertyInfo,
  type TenantBillingRecord,
  type TenantChartData,
} from "@/components/tenant/tenant-dashboard"

export const dynamic = "force-dynamic"

export default async function TenantPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>
}) {
  const session = await getSession()
  if (!session) redirect("/login")

  const tenant = await prisma.user.findUnique({
    where: { id: session.id },
    include: {
      property: {
        include: {
          landlord: {
            select: {
              fullName: true,
              email: true,
              phone: true,
              companyName: true,
            },
          },
        },
      },
      apartmentGroup: true,
    },
  })

  if (!tenant || !tenant.apartmentGroup || !tenant.property) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        Your account is not assigned to any apartment yet.
      </div>
    )
  }

  const property = tenant.property
  const group = tenant.apartmentGroup
  const landlord = property.landlord

  // --- Property info ---
  const propertyInfo: TenantPropertyInfo = {
    propertyName: property.propertyName,
    address: [property.addressLine1, property.addressLine2, property.city]
      .filter(Boolean)
      .join(", "),
    billingClosingDay: property.billingClosingDay,
    landlordName: landlord.companyName || landlord.fullName,
    landlordEmail: landlord.email,
    landlordPhone: landlord.phone,
  }

  // --- Current consumption (since last closing date) ---
  const lastClosingDate = getLastClosingDate(property.billingClosingDay)

  // Get channels for this group (non-virtual) or compute virtual
  let currentKwh = 0

  if (group.isVirtual) {
    // Virtual group: income - sum of all non-virtual non-income groups
    const allGroups = await prisma.channelGroup.findMany({
      where: { propertyId: property.id, isActive: true },
      select: { id: true, groupType: true, isVirtual: true },
    })

    const nonVirtualNonIncomeIds = allGroups
      .filter((g) => !g.isVirtual && g.groupType !== "INCOME")
      .map((g) => g.id)
    const incomeIds = allGroups
      .filter((g) => g.groupType === "INCOME")
      .map((g) => g.id)

    const allGroupIds = [...nonVirtualNonIncomeIds, ...incomeIds]

    if (allGroupIds.length > 0) {
      const channels = await prisma.channel.findMany({
        where: {
          propertyId: property.id,
          isEnabled: true,
          assignedGroupId: { in: allGroupIds },
        },
        select: {
          assignedGroupId: true,
          measurements: {
            where: { measurementTs: { gte: lastClosingDate } },
            select: { kwh: true },
          },
        },
      })

      const groupKwh: Record<string, number> = {}
      for (const ch of channels) {
        if (!ch.assignedGroupId) continue
        const total = ch.measurements.reduce(
          (sum, m) => sum + Math.max(0, m.kwh ?? 0),
          0
        )
        groupKwh[ch.assignedGroupId] =
          (groupKwh[ch.assignedGroupId] ?? 0) + total
      }

      const incomeKwh = incomeIds.reduce(
        (sum, id) => sum + (groupKwh[id] ?? 0),
        0
      )
      const nonVirtualKwh = nonVirtualNonIncomeIds.reduce(
        (sum, id) => sum + (groupKwh[id] ?? 0),
        0
      )
      const virtualCount = allGroups.filter((g) => g.isVirtual).length
      currentKwh = Math.max(0, incomeKwh - nonVirtualKwh) / virtualCount
    }
  } else {
    // Non-virtual: sum kWh from assigned channels
    const channels = await prisma.channel.findMany({
      where: {
        propertyId: property.id,
        isEnabled: true,
        assignedGroupId: group.id,
      },
      select: {
        measurements: {
          where: { measurementTs: { gte: lastClosingDate } },
          select: { kwh: true },
        },
      },
    })

    currentKwh = channels.reduce(
      (sum, ch) =>
        sum +
        ch.measurements.reduce(
          (s, m) => s + Math.max(0, m.kwh ?? 0),
          0
        ),
      0
    )
  }

  // Compute current estimated toPay (simplified: own proportion of invoice)
  let currentToPay: number | null = null
  if (property.monthlyInvoiceAmount && property.billingClosingDay) {
    // Get total income kWh for proportion
    const incomeGroup = await prisma.channelGroup.findFirst({
      where: {
        propertyId: property.id,
        groupType: "INCOME",
        isActive: true,
      },
      select: { id: true },
    })

    if (incomeGroup) {
      const incomeChannels = await prisma.channel.findMany({
        where: {
          propertyId: property.id,
          isEnabled: true,
          assignedGroupId: incomeGroup.id,
        },
        select: {
          measurements: {
            where: { measurementTs: { gte: lastClosingDate } },
            select: { kwh: true },
          },
        },
      })

      const totalIncomeKwh = incomeChannels.reduce(
        (sum, ch) =>
          sum +
          ch.measurements.reduce(
            (s, m) => s + Math.max(0, m.kwh ?? 0),
            0
          ),
        0
      )

      if (totalIncomeKwh > 0) {
        currentToPay =
          (currentKwh / totalIncomeKwh) * property.monthlyInvoiceAmount
      }
    }
  }

  // --- Billing records (filtered by year/month) ---
  const params = await searchParams
  const now = new Date()
  const selectedYear = params.year
    ? parseInt(params.year, 10)
    : now.getFullYear()
  const selectedMonth = params.month ? parseInt(params.month, 10) : null

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
      propertyId: property.id,
      billingPeriodEnd: { gte: dateFrom, lt: dateTo },
    },
    orderBy: { billingPeriodEnd: "desc" },
    include: {
      items: {
        where: { groupId: group.id },
        take: 1,
      },
    },
  })

  const billingRecords: TenantBillingRecord[] = records.map((r) => ({
    id: r.id,
    billingPeriodEnd: r.billingPeriodEnd.toISOString(),
    kwh: r.items[0]?.kwh ?? 0,
    toPay: r.items[0]?.toPay ?? null,
  }))

  // Available years
  const yearRecords = await prisma.billingRecord.findMany({
    where: { propertyId: property.id },
    select: { billingPeriodEnd: true },
    distinct: ["billingPeriodEnd"],
  })
  const availableYears = [
    ...new Set(yearRecords.map((r) => r.billingPeriodEnd.getFullYear())),
  ].sort((a, b) => b - a)
  if (!availableYears.includes(now.getFullYear())) {
    availableYears.unshift(now.getFullYear())
  }

  // --- Chart data: last 12 billing records ---
  const last12 = await prisma.billingRecord.findMany({
    where: { propertyId: property.id },
    orderBy: { billingPeriodEnd: "desc" },
    take: 12,
    include: {
      items: {
        where: { groupId: group.id },
        take: 1,
      },
    },
  })

  const chartData: TenantChartData[] = last12
    .reverse()
    .map((r) => {
      const d = r.billingPeriodEnd
      const label = d.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      })
      return {
        month: label,
        kwh: r.items[0]?.kwh ?? 0,
      }
    })

  return (
    <TenantDashboard
      propertyInfo={propertyInfo}
      groupName={group.groupName}
      currentConsumption={{
        kwh: currentKwh,
        periodStart: lastClosingDate.toISOString(),
        toPay: currentToPay,
      }}
      billingRecords={billingRecords}
      chartData={chartData}
      selectedYear={selectedYear}
      selectedMonth={selectedMonth}
      availableYears={availableYears}
    />
  )
}

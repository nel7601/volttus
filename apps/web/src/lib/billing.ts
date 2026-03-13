import { prisma } from "@/lib/prisma"

/**
 * Get the most recent closing date before now, based on the billing closing day.
 * If no closing day is set, defaults to the 1st of the current month.
 */
export function getLastClosingDate(billingClosingDay: number | null): Date {
  if (!billingClosingDay) {
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
  return new Date(now.getFullYear(), now.getMonth() - 1, billingClosingDay)
}

/**
 * Get the closing date before the last one (i.e. the start of the most recent billing period).
 */
export function getPreviousClosingDate(
  billingClosingDay: number,
  referenceDate: Date
): Date {
  return new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth() - 1,
    billingClosingDay
  )
}

/**
 * Generate a billing record for the current (most recent completed) billing period.
 * Idempotent: if a record already exists for the same period end, it returns the existing one.
 */
export async function generateBillingRecord(propertyId: string) {
  // 1. Load property settings
  const property = await prisma.property.findUniqueOrThrow({
    where: { id: propertyId },
    select: {
      id: true,
      billingClosingDay: true,
      monthlyInvoiceAmount: true,
      commonAreaSplit: true,
    },
  })

  if (!property.billingClosingDay) {
    throw new Error("Property does not have a billing closing day configured")
  }
  if (!property.monthlyInvoiceAmount) {
    throw new Error("Property does not have a monthly invoice amount configured")
  }

  // 2. Compute period dates
  const billingPeriodEnd = getLastClosingDate(property.billingClosingDay)
  const billingPeriodStart = getPreviousClosingDate(
    property.billingClosingDay,
    billingPeriodEnd
  )

  // 3. Check for existing record (idempotent)
  const existing = await prisma.billingRecord.findUnique({
    where: {
      propertyId_billingPeriodEnd: {
        propertyId,
        billingPeriodEnd,
      },
    },
  })
  if (existing) return existing

  // 4. Fetch groups with channels or virtual
  const groups = await prisma.channelGroup.findMany({
    where: {
      propertyId,
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

  // 5. Query channel measurements in period, aggregate kWh per group
  const groupConsumption: Record<string, number> = {}
  const groupIds = groups.map((g) => g.id)

  if (groupIds.length > 0) {
    const channelsWithConsumption = await prisma.channel.findMany({
      where: {
        propertyId,
        isEnabled: true,
        assignedGroupId: { in: groupIds },
      },
      select: {
        assignedGroupId: true,
        measurements: {
          where: {
            measurementTs: {
              gte: billingPeriodStart,
              lt: billingPeriodEnd,
            },
          },
          select: { kwh: true },
        },
      },
    })

    for (const ch of channelsWithConsumption) {
      if (!ch.assignedGroupId) continue
      const totalKwh = ch.measurements.reduce(
        (sum, m) => sum + Math.max(0, m.kwh ?? 0),
        0
      )
      groupConsumption[ch.assignedGroupId] =
        (groupConsumption[ch.assignedGroupId] ?? 0) + totalKwh
    }
  }

  // 6. Compute virtual group consumption
  const incomeGroup = groups.find((g) => g.groupType === "INCOME")
  const totalIncomeKwh = incomeGroup
    ? groupConsumption[incomeGroup.id] ?? 0
    : 0

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

  // 7. Compute "To Pay" per group (same logic as dashboard)
  const displayGroups = groups.filter(
    (g) => g.groupType === "APARTMENT" || g.groupType === "COMMON"
  )
  const apartmentGroups = displayGroups.filter(
    (g) => g.groupType === "APARTMENT"
  )
  const commonGroups = displayGroups.filter((g) => g.groupType === "COMMON")

  const totalCommonKwh = commonGroups.reduce(
    (sum, g) => sum + (groupConsumption[g.id] ?? 0),
    0
  )
  const totalApartmentKwh = apartmentGroups.reduce(
    (sum, g) => sum + (groupConsumption[g.id] ?? 0),
    0
  )

  const commonCost =
    totalIncomeKwh > 0
      ? (totalCommonKwh / totalIncomeKwh) * property.monthlyInvoiceAmount
      : 0

  function getGroupToPay(
    group: (typeof groups)[number],
    kwh: number
  ): number | null {
    if (totalIncomeKwh <= 0) return null
    if (group.groupType === "COMMON") return null

    const ownCost =
      (kwh / totalIncomeKwh) * property.monthlyInvoiceAmount!

    let commonShare = 0
    if (commonCost > 0 && apartmentGroups.length > 0) {
      if (property.commonAreaSplit === "EQUAL") {
        commonShare = commonCost / apartmentGroups.length
      } else {
        commonShare =
          totalApartmentKwh > 0 ? commonCost * (kwh / totalApartmentKwh) : 0
      }
    }

    return ownCost + commonShare
  }

  // 8. Build items and create record in a transaction
  const items = displayGroups.map((g) => {
    const kwh = groupConsumption[g.id] ?? 0
    const percentage = totalIncomeKwh > 0 ? (kwh * 100) / totalIncomeKwh : 0
    const toPay = getGroupToPay(g, kwh)
    const tenant = g.tenants[0] ?? null

    return {
      groupId: g.id,
      groupName: g.groupName,
      groupType: g.groupType,
      kwh,
      percentage,
      toPay,
      tenantName: tenant?.fullName ?? null,
      tenantId: tenant?.id ?? null,
    }
  })

  const record = await prisma.billingRecord.create({
    data: {
      propertyId,
      billingPeriodStart,
      billingPeriodEnd,
      billingClosingDay: property.billingClosingDay,
      totalConsumptionKwh: totalIncomeKwh,
      monthlyInvoiceAmount: property.monthlyInvoiceAmount,
      commonAreaSplit: property.commonAreaSplit,
      items: { create: items },
    },
    include: { items: true },
  })

  return record
}

/**
 * Compute live data for the current (open) billing period without persisting.
 * Returns a shape compatible with BillingRecordData for display in history.
 */
export async function computeCurrentPeriodData(propertyId: string) {
  const property = await prisma.property.findUniqueOrThrow({
    where: { id: propertyId },
    select: {
      id: true,
      billingClosingDay: true,
      monthlyInvoiceAmount: true,
      commonAreaSplit: true,
    },
  })

  if (!property.billingClosingDay || !property.monthlyInvoiceAmount) {
    return null
  }

  const periodStart = getLastClosingDate(property.billingClosingDay)
  const now = new Date()

  // Fetch groups
  const groups = await prisma.channelGroup.findMany({
    where: {
      propertyId,
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

  // Aggregate kWh per group since period start
  const groupConsumption: Record<string, number> = {}
  const groupIds = groups.map((g) => g.id)

  if (groupIds.length > 0) {
    const channelsWithConsumption = await prisma.channel.findMany({
      where: {
        propertyId,
        isEnabled: true,
        assignedGroupId: { in: groupIds },
      },
      select: {
        assignedGroupId: true,
        measurements: {
          where: { measurementTs: { gte: periodStart } },
          select: { kwh: true },
        },
      },
    })

    for (const ch of channelsWithConsumption) {
      if (!ch.assignedGroupId) continue
      const totalKwh = ch.measurements.reduce(
        (sum, m) => sum + Math.max(0, m.kwh ?? 0),
        0
      )
      groupConsumption[ch.assignedGroupId] =
        (groupConsumption[ch.assignedGroupId] ?? 0) + totalKwh
    }
  }

  // Virtual group consumption
  const incomeGroup = groups.find((g) => g.groupType === "INCOME")
  const totalIncomeKwh = incomeGroup
    ? groupConsumption[incomeGroup.id] ?? 0
    : 0

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

  // Compute to pay
  const displayGroups = groups.filter(
    (g) => g.groupType === "APARTMENT" || g.groupType === "COMMON"
  )
  const apartmentGroups = displayGroups.filter(
    (g) => g.groupType === "APARTMENT"
  )
  const commonGroups = displayGroups.filter((g) => g.groupType === "COMMON")

  const totalCommonKwh = commonGroups.reduce(
    (sum, g) => sum + (groupConsumption[g.id] ?? 0),
    0
  )
  const totalApartmentKwh = apartmentGroups.reduce(
    (sum, g) => sum + (groupConsumption[g.id] ?? 0),
    0
  )

  const commonCost =
    totalIncomeKwh > 0
      ? (totalCommonKwh / totalIncomeKwh) * property.monthlyInvoiceAmount
      : 0

  const items = displayGroups.map((g) => {
    const kwh = groupConsumption[g.id] ?? 0
    const percentage = totalIncomeKwh > 0 ? (kwh * 100) / totalIncomeKwh : 0

    let toPay: number | null = null
    if (totalIncomeKwh > 0 && g.groupType !== "COMMON") {
      const ownCost =
        (kwh / totalIncomeKwh) * property.monthlyInvoiceAmount!
      let commonShare = 0
      if (commonCost > 0 && apartmentGroups.length > 0) {
        if (property.commonAreaSplit === "EQUAL") {
          commonShare = commonCost / apartmentGroups.length
        } else {
          commonShare =
            totalApartmentKwh > 0 ? commonCost * (kwh / totalApartmentKwh) : 0
        }
      }
      toPay = ownCost + commonShare
    }

    const tenant = g.tenants[0] ?? null
    return {
      id: `current-${g.id}`,
      groupName: g.groupName,
      groupType: g.groupType as "INCOME" | "COMMON" | "APARTMENT",
      kwh,
      percentage,
      toPay,
      tenantName: tenant?.fullName ?? null,
    }
  })

  return {
    id: "current-period",
    billingPeriodStart: periodStart.toISOString(),
    billingPeriodEnd: now.toISOString(),
    billingClosingDay: property.billingClosingDay,
    totalConsumptionKwh: totalIncomeKwh,
    monthlyInvoiceAmount: property.monthlyInvoiceAmount,
    commonAreaSplit: property.commonAreaSplit as "EQUAL" | "PROPORTIONAL",
    createdAt: now.toISOString(),
    isCurrent: true as const,
    items,
  }
}

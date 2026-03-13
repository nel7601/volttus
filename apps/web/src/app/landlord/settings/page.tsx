import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import {
  LandlordSettings,
  type SettingsLandlordData,
  type SettingsPropertyData,
  type SettingsTenantData,
  type SettingsGroupOption,
} from "@/components/landlord/landlord-settings"

export const dynamic = "force-dynamic"

export default async function LandlordSettingsPage() {
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

  const landlordData: SettingsLandlordData = {
    id: landlord.id,
    fullName: landlord.fullName,
    email: landlord.email,
    companyName: landlord.companyName,
    phone: landlord.phone,
  }

  const propertiesData: SettingsPropertyData[] = landlord.properties.map((p) => ({
    id: p.id,
    propertyName: p.propertyName,
    addressLine1: p.addressLine1,
    addressLine2: p.addressLine2,
    city: p.city,
    billingClosingDay: p.billingClosingDay,
    commonAreaSplit: p.commonAreaSplit,
    monthlyInvoiceAmount: p.monthlyInvoiceAmount,
  }))

  // Fetch all tenants across all landlord properties
  const propertyIds = landlord.properties.map((p) => p.id)

  const tenants = await prisma.user.findMany({
    where: {
      role: "TENANT",
      propertyId: { in: propertyIds },
    },
    include: {
      apartmentGroup: {
        select: { groupName: true },
      },
    },
    orderBy: [{ isActive: "desc" }, { fullName: "asc" }],
  })

  const tenantsData: SettingsTenantData[] = tenants.map((t) => ({
    id: t.id,
    fullName: t.fullName,
    email: t.email,
    isActive: t.isActive,
    apartmentGroupId: t.apartmentGroupId,
    apartmentGroupName: t.apartmentGroup?.groupName ?? null,
  }))

  // Fetch all apartment groups across all properties
  const groups = await prisma.channelGroup.findMany({
    where: {
      propertyId: { in: propertyIds },
      groupType: "APARTMENT",
      isActive: true,
    },
    select: { id: true, groupName: true },
    orderBy: { displayOrder: "asc" },
  })

  const groupOptions: SettingsGroupOption[] = groups.map((g) => ({
    id: g.id,
    groupName: g.groupName,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/landlord"
          className="text-muted-foreground hover:text-foreground"
        >
          &larr; Dashboard
        </Link>
        <h2 className="text-xl font-bold">Settings</h2>
      </div>

      <LandlordSettings
        landlord={landlordData}
        properties={propertiesData}
        tenants={tenantsData}
        apartmentGroups={groupOptions}
      />
    </div>
  )
}

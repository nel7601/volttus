import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import {
  LandlordSettings,
  type SettingsPropertyData,
  type SettingsTenantData,
  type SettingsGroupOption,
} from "@/components/landlord/landlord-settings"

export const dynamic = "force-dynamic"

export default async function LandlordSettingsPage({
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
        No properties found.
      </div>
    )
  }

  const params = await searchParams
  const selectedPropertyId = params.propertyId ?? landlord.properties[0].id
  const property = landlord.properties.find((p) => p.id === selectedPropertyId)
  if (!property) redirect("/landlord/settings")

  const propertyData: SettingsPropertyData = {
    id: property.id,
    propertyName: property.propertyName,
    addressLine1: property.addressLine1,
    addressLine2: property.addressLine2,
    city: property.city,
    billingClosingDay: property.billingClosingDay,
    commonAreaSplit: property.commonAreaSplit,
    monthlyInvoiceAmount: property.monthlyInvoiceAmount,
  }

  // Fetch all tenants for this property (active + archived)
  const tenants = await prisma.user.findMany({
    where: {
      role: "TENANT",
      propertyId: property.id,
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

  // Fetch apartment groups for assignment dropdown
  const groups = await prisma.channelGroup.findMany({
    where: {
      propertyId: property.id,
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
          href={`/landlord?propertyId=${selectedPropertyId}`}
          className="text-muted-foreground hover:text-foreground"
        >
          &larr; Dashboard
        </Link>
        <h2 className="text-xl font-bold">
          {property.propertyName} — Settings
        </h2>
      </div>

      <LandlordSettings
        property={propertyData}
        tenants={tenantsData}
        apartmentGroups={groupOptions}
      />
    </div>
  )
}

import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PropertyEditForm } from "./property-edit-form"
import { DeviceCard } from "./device-card"

export const dynamic = "force-dynamic"
export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [property, landlords] = await Promise.all([
    prisma.property.findUnique({
      where: { id },
      include: {
        landlord: true,
        emporiaAccount: true,
        devices: { include: { channels: true } },
        channelGroups: { orderBy: { displayOrder: "asc" } },
        tenants: { include: { apartmentGroup: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: "LANDLORD", isActive: true },
      select: { id: true, fullName: true, email: true },
      orderBy: { fullName: "asc" },
    }),
  ])

  if (!property) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/properties"
            className="text-muted-foreground hover:text-foreground"
          >
            &larr; Properties
          </Link>
          <h1 className="text-2xl font-bold">{property.propertyName}</h1>
          <Badge
            variant={property.isActive ? "default" : "secondary"}
            className={
              property.isActive
                ? "bg-emerald-100 text-emerald-800"
                : "bg-gray-100 text-gray-600"
            }
          >
            {property.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      {/* Property Details Form (client component) */}
      <PropertyEditForm
        property={{
          id: property.id,
          propertyName: property.propertyName,
          addressLine1: property.addressLine1,
          addressLine2: property.addressLine2,
          city: property.city,
          provinceState: property.provinceState,
          postalCode: property.postalCode,
          country: property.country,
          timezone: property.timezone,
          billingClosingDay: property.billingClosingDay,
          invoiceMode: property.invoiceMode,
          isActive: property.isActive,
          landlordId: property.landlordId,
        }}
        landlords={landlords}
      />

      {/* Device (Emporia / Refoss / Wallfront) */}
      <DeviceCard
        propertyId={property.id}
        emporiaAccount={
          property.emporiaAccount
            ? {
                id: property.emporiaAccount.id,
                accountEmail: property.emporiaAccount.accountEmail,
                status: property.emporiaAccount.status,
              }
            : null
        }
        devices={property.devices.map((d) => ({
          id: d.id,
          deviceName: d.deviceName,
          emporiaDeviceGid: d.emporiaDeviceGid,
          channelCount: d.channelCount,
          serialNumber: d.serialNumber,
          lastSuccessfulSyncAt: d.lastSuccessfulSyncAt?.toISOString() ?? null,
        }))}
      />

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href={`/admin/properties/${property.id}/groups`}>
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center justify-between py-4">
              <span className="font-medium">Groups</span>
              <Badge variant="outline">{property.channelGroups.length}</Badge>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/admin/properties/${property.id}/channels`}>
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center justify-between py-4">
              <span className="font-medium">Channels</span>
              <Badge variant="outline">
                {property.devices.reduce((s, d) => s + d.channels.length, 0)}
              </Badge>
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <span className="font-medium">Tenants</span>
            <Badge variant="outline">{property.tenants.length}</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

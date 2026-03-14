import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createEmporiaAccount, deleteEmporiaAccount } from "@/actions/emporia-accounts"
import { PropertyEditForm } from "./property-edit-form"

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
          isActive: property.isActive,
          landlordId: property.landlordId,
        }}
        landlords={landlords}
      />

      {/* Emporia Account */}
      <Card>
        <CardHeader>
          <CardTitle>Emporia Account</CardTitle>
        </CardHeader>
        <CardContent>
          {property.emporiaAccount ? (
            <div className="flex items-center justify-between">
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Email:</span>{" "}
                  {property.emporiaAccount.accountEmail}
                </p>
                <div className="flex items-center gap-2">
                  <Badge>{property.emporiaAccount.status}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {property.devices.length} device{property.devices.length !== 1 ? "s" : ""} connected
                  </span>
                </div>
              </div>
              <form action={deleteEmporiaAccount.bind(null, property.emporiaAccount.id)}>
                <Button type="submit" variant="destructive" size="sm">
                  Disconnect
                </Button>
              </form>
            </div>
          ) : (
            <form action={createEmporiaAccount} className="space-y-4">
              <input type="hidden" name="propertyId" value={property.id} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Emporia Email</Label>
                  <Input name="accountEmail" type="email" required />
                </div>
                <div className="space-y-1">
                  <Label>Emporia Password</Label>
                  <Input name="password" type="password" required />
                </div>
              </div>
              <Button type="submit" size="sm">
                Connect Emporia
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Devices */}
      {property.devices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Devices ({property.devices.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {property.devices.map((device) => (
                <div
                  key={device.id}
                  className="flex items-center justify-between p-3 rounded border"
                >
                  <div>
                    <p className="font-medium">{device.deviceName}</p>
                    <p className="text-xs text-muted-foreground">
                      GID: {device.emporiaDeviceGid} | {device.channelCount} channels |{" "}
                      Serial: {device.serialNumber ?? "N/A"}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    {device.lastSuccessfulSyncAt
                      ? `Last sync: ${device.lastSuccessfulSyncAt.toLocaleString()}`
                      : "Never synced"}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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

import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createEmporiaAccount } from "@/actions/emporia-accounts"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export const dynamic = "force-dynamic"
export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      landlord: true,
      emporiaAccount: true,
      devices: { include: { channels: true } },
      channelGroups: { orderBy: { displayOrder: "asc" } },
      tenants: { include: { apartmentGroup: true } },
    },
  })

  if (!property) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/properties"
          className="text-muted-foreground hover:text-foreground"
        >
          &larr; Properties
        </Link>
        <h1 className="text-2xl font-bold">{property.propertyName}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Info</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p>{property.addressLine1}</p>
            <p>
              {property.city}, {property.country}
            </p>
            <p>Landlord: {property.landlord.fullName}</p>
            <p>Timezone: {property.timezone}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Emporia Account</CardTitle>
          </CardHeader>
          <CardContent>
            {property.emporiaAccount ? (
              <div className="space-y-1 text-sm">
                <p>{property.emporiaAccount.accountEmail}</p>
                <Badge>{property.emporiaAccount.status}</Badge>
              </div>
            ) : (
              <form action={createEmporiaAccount} className="space-y-3">
                <input type="hidden" name="propertyId" value={property.id} />
                <div className="space-y-1">
                  <Label className="text-xs">Emporia Email</Label>
                  <Input name="accountEmail" type="email" required />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Emporia Password</Label>
                  <Input name="password" type="password" required />
                </div>
                <Button type="submit" size="sm">
                  Connect
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href={`/admin/properties/${property.id}/groups`}>
              <Button variant="outline" size="sm" className="w-full justify-start">
                Groups ({property.channelGroups.length})
              </Button>
            </Link>
            <Link href={`/admin/properties/${property.id}/channels`}>
              <Button variant="outline" size="sm" className="w-full justify-start">
                Channels ({property.devices.reduce((s, d) => s + d.channels.length, 0)})
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {property.devices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {property.devices.map((device) => (
                <div
                  key={device.id}
                  className="flex items-center justify-between p-2 rounded border"
                >
                  <div>
                    <p className="font-medium">{device.deviceName}</p>
                    <p className="text-xs text-muted-foreground">
                      GID: {device.emporiaDeviceGid} | {device.channelCount} channels
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
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
    </div>
  )
}

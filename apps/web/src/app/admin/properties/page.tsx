import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Settings, Zap } from "lucide-react"

export const dynamic = "force-dynamic"
export default async function PropertiesPage() {
  const properties = await prisma.property.findMany({
    include: {
      landlord: true,
      emporiaAccount: true,
      devices: true,
      channelGroups: true,
      tenants: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Properties</h1>
        <Link href="/admin/properties/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Property
          </Button>
        </Link>
      </div>

      {properties.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No properties yet. Create one to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {properties.map((property) => (
            <Card key={property.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{property.propertyName}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {property.addressLine1}, {property.city}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {property.emporiaAccount ? (
                    <Badge variant="default">
                      <Zap className="h-3 w-3 mr-1" />
                      Emporia Connected
                    </Badge>
                  ) : (
                    <Badge variant="secondary">No Emporia Account</Badge>
                  )}
                  <Badge variant="outline">
                    {property.devices.length} devices
                  </Badge>
                  <Badge variant="outline">
                    {property.channelGroups.length} groups
                  </Badge>
                  <Badge variant="outline">
                    {property.tenants.length} tenants
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Landlord: {property.landlord.fullName}</span>
                  <span className="mx-2">|</span>
                  <Link
                    href={`/admin/properties/${property.id}/groups`}
                    className="text-primary hover:underline"
                  >
                    Groups
                  </Link>
                  <Link
                    href={`/admin/properties/${property.id}/channels`}
                    className="text-primary hover:underline"
                  >
                    Channels
                  </Link>
                  <Link
                    href={`/admin/properties/${property.id}`}
                    className="ml-auto"
                  >
                    <Button variant="outline" size="sm">
                      <Settings className="h-3 w-3 mr-1" />
                      Manage
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

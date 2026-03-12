import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CreateTenantForm } from "./create-tenant-form"

export const dynamic = "force-dynamic"
export default async function TenantsPage() {
  const [tenants, properties] = await Promise.all([
    prisma.tenant.findMany({
      include: {
        user: true,
        property: true,
        apartmentGroup: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.property.findMany({
      include: {
        channelGroups: {
          where: { groupType: "APARTMENT", isActive: true },
          orderBy: { displayOrder: "asc" },
        },
      },
    }),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tenants</h1>

      <CreateTenantForm
        properties={properties.map((p) => ({
          id: p.id,
          propertyName: p.propertyName,
          channelGroups: p.channelGroups.map((g) => ({
            id: g.id,
            groupName: g.groupName,
          })),
        }))}
      />

      <Card>
        <CardHeader>
          <CardTitle>All Tenants</CardTitle>
        </CardHeader>
        <CardContent>
          {tenants.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No tenants yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Apartment</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">
                      {t.user.fullName}
                    </TableCell>
                    <TableCell>{t.user.email}</TableCell>
                    <TableCell>{t.property.propertyName}</TableCell>
                    <TableCell>{t.apartmentGroup.groupName}</TableCell>
                    <TableCell>
                      <Badge
                        variant={t.user.isActive ? "default" : "secondary"}
                      >
                        {t.user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

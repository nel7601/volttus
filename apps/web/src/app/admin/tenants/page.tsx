import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { createTenant } from "@/actions/tenants"
import { Plus } from "lucide-react"

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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            <Plus className="h-4 w-4 inline mr-1" />
            Create Tenant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createTenant} className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Full Name</Label>
              <Input name="fullName" required />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input name="email" type="email" required />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Password</Label>
              <Input name="password" type="password" required minLength={6} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Property</Label>
              <Select name="propertyId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.propertyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Apartment Group</Label>
              <Select name="apartmentGroupId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select apartment" />
                </SelectTrigger>
                <SelectContent>
                  {properties.flatMap((p) =>
                    p.channelGroups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {p.propertyName} - {g.groupName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="submit">Create Tenant</Button>
            </div>
          </form>
        </CardContent>
      </Card>

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

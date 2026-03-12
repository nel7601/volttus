import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreateUserForm } from "./create-user-form"
import { UserRow } from "./user-row"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export const dynamic = "force-dynamic"

export default async function UsersPage() {
  const [users, properties] = await Promise.all([
    prisma.user.findMany({
      include: {
        _count: { select: { properties: true } },
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
      <h1 className="text-2xl font-bold">Users</h1>

      <CreateUserForm
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
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No users yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <UserRow
                    key={u.id}
                    user={{
                      id: u.id,
                      fullName: u.fullName,
                      email: u.email,
                      role: u.role,
                      isActive: u.isActive,
                      companyName: u.companyName,
                      phone: u.phone,
                      propertyName: u.property?.propertyName ?? null,
                      apartmentGroupName: u.apartmentGroup?.groupName ?? null,
                      propertyCount: u._count.properties,
                    }}
                    properties={properties.map((p) => ({
                      id: p.id,
                      propertyName: p.propertyName,
                      channelGroups: p.channelGroups.map((g) => ({
                        id: g.id,
                        groupName: g.groupName,
                      })),
                    }))}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

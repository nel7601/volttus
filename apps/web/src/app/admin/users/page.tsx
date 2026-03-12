import { prisma } from "@/lib/prisma"
import { CreateUserForm } from "./create-user-form"
import { UserTable } from "./user-table"

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

  const landlords = users
    .filter((u) => u.role === "LANDLORD" && u.isActive)
    .map((u) => ({ id: u.id, fullName: u.fullName }))

  const propertiesData = properties.map((p) => ({
    id: p.id,
    propertyName: p.propertyName,
    landlordId: p.landlordId,
    channelGroups: p.channelGroups.map((g) => ({
      id: g.id,
      groupName: g.groupName,
    })),
  }))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Users</h1>

      <CreateUserForm properties={propertiesData} landlords={landlords} />

      <UserTable
        users={users.map((u) => ({
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
        }))}
        properties={propertiesData}
        landlords={landlords}
      />
    </div>
  )
}

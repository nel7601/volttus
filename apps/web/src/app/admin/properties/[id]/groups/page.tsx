import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { GroupCard } from "./group-card"
import { CreateGroupForm } from "./create-group-form"

export const dynamic = "force-dynamic"
export default async function GroupsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      channelGroups: {
        orderBy: { displayOrder: "asc" },
        include: {
          channels: true,
          tenants: { include: { user: true } },
          _count: { select: { groupMeasurements: true } },
        },
      },
    },
  })

  if (!property) notFound()

  const groupTypeColors: Record<string, string> = {
    INCOME: "bg-green-100 text-green-800",
    COMMON: "bg-blue-100 text-blue-800",
    APARTMENT: "bg-orange-100 text-orange-800",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/admin/properties/${id}`}
          className="text-muted-foreground hover:text-foreground"
        >
          &larr; {property.propertyName}
        </Link>
        <h1 className="text-2xl font-bold">Channel Groups</h1>
      </div>

      <CreateGroupForm propertyId={id} />

      <div className="grid gap-3">
        {property.channelGroups.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            propertyId={id}
            typeColors={groupTypeColors}
          />
        ))}
        {property.channelGroups.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No groups yet. Create Income, Common, and Apartment groups above.
          </p>
        )}
      </div>
    </div>
  )
}

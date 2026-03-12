import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createGroup } from "@/actions/groups"
import { Plus } from "lucide-react"
import { GroupCard } from "./group-card"

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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create Group</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createGroup} className="flex items-end gap-3">
            <input type="hidden" name="propertyId" value={id} />
            <div className="space-y-1 flex-1">
              <Label className="text-xs">Name</Label>
              <Input name="groupName" placeholder="e.g. Apartment 1" required />
            </div>
            <div className="space-y-1 w-40">
              <Label className="text-xs">Type</Label>
              <Select name="groupType" required>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INCOME">Income</SelectItem>
                  <SelectItem value="COMMON">Common</SelectItem>
                  <SelectItem value="APARTMENT">Apartment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 w-32">
              <Label className="text-xs">Apt Number</Label>
              <Input name="apartmentNumber" placeholder="e.g. 1" />
            </div>
            <div className="space-y-1 w-20">
              <Label className="text-xs">Order</Label>
              <Input name="displayOrder" type="number" defaultValue="0" />
            </div>
            <Button type="submit" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </form>
        </CardContent>
      </Card>

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

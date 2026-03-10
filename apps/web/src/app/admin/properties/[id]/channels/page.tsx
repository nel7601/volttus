import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChannelMappingTable } from "./channel-mapping-table"

export const dynamic = "force-dynamic"
export default async function ChannelsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      channelGroups: { orderBy: { displayOrder: "asc" } },
      channels: {
        orderBy: { channelNumber: "asc" },
        include: { device: true, assignedGroup: true },
      },
    },
  })

  if (!property) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/admin/properties/${id}`}
          className="text-muted-foreground hover:text-foreground"
        >
          &larr; {property.propertyName}
        </Link>
        <h1 className="text-2xl font-bold">Channel Mapping</h1>
      </div>

      {property.channels.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No channels found. Channels are created automatically when the
            ingestion service syncs with Emporia for the first time.
          </CardContent>
        </Card>
      ) : (
        <ChannelMappingTable
          propertyId={id}
          channels={property.channels.map((ch) => ({
            id: ch.id,
            channelNumber: ch.channelNumber,
            rawName: ch.rawName,
            displayName: ch.displayName,
            assignedGroupId: ch.assignedGroupId,
            isMainChannel: ch.isMainChannel,
            isEnabled: ch.isEnabled,
            deviceName: ch.device.deviceName,
          }))}
          groups={property.channelGroups.map((g) => ({
            id: g.id,
            groupName: g.groupName,
            groupType: g.groupType,
          }))}
        />
      )}
    </div>
  )
}

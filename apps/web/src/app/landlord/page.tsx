import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
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
import Link from "next/link"

export const dynamic = "force-dynamic"
export default async function LandlordDashboard() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const landlord = await prisma.landlord.findUnique({
    where: { userId: session.user.id },
    include: { properties: true },
  })

  if (!landlord || landlord.properties.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        No properties assigned to your account yet.
      </div>
    )
  }

  const property = landlord.properties[0]

  const [groups, device, channels] = await Promise.all([
    prisma.channelGroup.findMany({
      where: { propertyId: property.id, isActive: true },
      orderBy: { displayOrder: "asc" },
      include: { channels: { where: { isEnabled: true } } },
    }),
    prisma.device.findFirst({
      where: { propertyId: property.id },
    }),
    prisma.channel.findMany({
      where: { propertyId: property.id, isEnabled: true },
      include: {
        assignedGroup: true,
        measurements: {
          orderBy: { measurementTs: "desc" },
          take: 1,
        },
      },
      orderBy: { channelNumber: "asc" },
    }),
  ])

  // Compute latest group totals from channel measurements
  const groupTotals: Record<string, { watts: number; kwh: number }> = {}
  for (const ch of channels) {
    if (!ch.assignedGroupId) continue
    if (!groupTotals[ch.assignedGroupId]) {
      groupTotals[ch.assignedGroupId] = { watts: 0, kwh: 0 }
    }
    const latest = ch.measurements[0]
    if (latest) {
      groupTotals[ch.assignedGroupId].watts += latest.watts ?? 0
      groupTotals[ch.assignedGroupId].kwh += latest.kwh ?? 0
    }
  }

  const totalWatts = Object.values(groupTotals).reduce(
    (s, g) => s + g.watts,
    0
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{property.propertyName}</h2>
        <div className="flex items-center gap-2">
          {device?.lastSuccessfulSyncAt ? (
            <Badge variant="outline" className="text-xs">
              Last sync: {device.lastSuccessfulSyncAt.toLocaleString()}
            </Badge>
          ) : (
            <Badge variant="secondary">Never synced</Badge>
          )}
          <Link href="/landlord/history">
            <Badge variant="default" className="cursor-pointer">
              View History
            </Badge>
          </Link>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalWatts.toFixed(0)} W
            </div>
          </CardContent>
        </Card>
        {groups.map((group) => (
          <Card key={group.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {group.groupName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(groupTotals[group.id]?.watts ?? 0).toFixed(0)} W
              </div>
              <p className="text-xs text-muted-foreground">
                {group.channels.length} channels
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Channel table */}
      <Card>
        <CardHeader>
          <CardTitle>Channels</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Group</TableHead>
                <TableHead className="text-right">Watts</TableHead>
                <TableHead className="text-right">kWh</TableHead>
                <TableHead>Last Update</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {channels.map((ch) => {
                const latest = ch.measurements[0]
                return (
                  <TableRow key={ch.id}>
                    <TableCell>{ch.channelNumber}</TableCell>
                    <TableCell className="font-medium">
                      {ch.displayName}
                    </TableCell>
                    <TableCell>
                      {ch.assignedGroup ? (
                        <Badge variant="outline">
                          {ch.assignedGroup.groupName}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {latest?.watts?.toFixed(1) ?? "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {latest?.kwh?.toFixed(3) ?? "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {latest
                        ? latest.measurementTs.toLocaleString()
                        : "-"}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

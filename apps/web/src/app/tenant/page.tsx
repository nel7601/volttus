import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export const dynamic = "force-dynamic"
export default async function TenantDashboard() {
  const session = await getSession()
  if (!session) redirect("/login")

  const tenant = await prisma.user.findUnique({
    where: { id: session.id },
    include: {
      property: true,
      apartmentGroup: {
        include: {
          channels: {
            where: { isEnabled: true },
            include: {
              measurements: {
                orderBy: { measurementTs: "desc" },
                take: 1,
              },
            },
          },
        },
      },
    },
  })

  if (!tenant || !tenant.apartmentGroup) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        Your account is not assigned to any apartment yet.
      </div>
    )
  }

  const group = tenant.apartmentGroup
  const channels = group.channels
  const totalWatts = channels.reduce(
    (sum, ch) => sum + (ch.measurements[0]?.watts ?? 0),
    0
  )
  const lastUpdate = channels
    .map((ch) => ch.measurements[0]?.measurementTs)
    .filter(Boolean)
    .sort((a, b) => b!.getTime() - a!.getTime())[0]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{group.groupName}</h2>
        <Link href="/tenant/history">
          <Badge variant="default" className="cursor-pointer">
            View History
          </Badge>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Current Consumption
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{totalWatts.toFixed(0)} W</div>
          {lastUpdate && (
            <p className="text-xs text-muted-foreground mt-1">
              Last update: {lastUpdate.toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Channels</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Channel</TableHead>
                <TableHead className="text-right">Watts</TableHead>
                <TableHead className="text-right">kWh</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {channels.map((ch) => {
                const latest = ch.measurements[0]
                return (
                  <TableRow key={ch.id}>
                    <TableCell className="font-medium">
                      {ch.displayName}
                    </TableCell>
                    <TableCell className="text-right">
                      {latest?.watts?.toFixed(1) ?? "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {latest?.kwh?.toFixed(3) ?? "-"}
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

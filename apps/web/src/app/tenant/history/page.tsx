import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConsumptionChart } from "@/components/dashboard/consumption-chart"
import Link from "next/link"

export const dynamic = "force-dynamic"
export default async function TenantHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const session = await getSession()
  if (!session) redirect("/login")

  const { period = "24h" } = await searchParams

  const tenant = await prisma.tenant.findUnique({
    where: { userId: session.id },
    include: {
      apartmentGroup: {
        include: { channels: { where: { isEnabled: true } } },
      },
    },
  })

  if (!tenant) {
    return <div className="py-16 text-center text-muted-foreground">No apartment assigned.</div>
  }

  const channelIds = tenant.apartmentGroup.channels.map((ch) => ch.id)

  const periodMs: Record<string, number> = {
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
  }

  const startDate = new Date(Date.now() - (periodMs[period] ?? periodMs["24h"]))

  const measurements = await prisma.measurement.findMany({
    where: {
      channelId: { in: channelIds },
      measurementTs: { gte: startDate },
    },
    orderBy: { measurementTs: "asc" },
    select: {
      measurementTs: true,
      watts: true,
    },
  })

  const timeMap = new Map<string, number>()
  for (const m of measurements) {
    const key = m.measurementTs.toISOString()
    timeMap.set(key, (timeMap.get(key) ?? 0) + (m.watts ?? 0))
  }

  const chartData = Array.from(timeMap.entries())
    .map(([timestamp, value]) => ({
      timestamp: new Date(timestamp).toLocaleString(),
      value: Math.round(value),
    }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/tenant" className="text-muted-foreground hover:text-foreground">
            &larr; Dashboard
          </Link>
          <h2 className="text-xl font-bold">
            {tenant.apartmentGroup.groupName} - History
          </h2>
        </div>
        <div className="flex gap-2">
          {["24h", "7d", "30d"].map((p) => (
            <Link
              key={p}
              href={`/tenant/history?period=${p}`}
              className={`px-3 py-1 rounded text-sm ${
                period === p
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Apartment Consumption (W)</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ConsumptionChart data={chartData} />
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No data for this period.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

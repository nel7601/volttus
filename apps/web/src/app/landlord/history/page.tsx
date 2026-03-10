import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConsumptionChart } from "@/components/dashboard/consumption-chart"
import Link from "next/link"

export const dynamic = "force-dynamic"
export default async function LandlordHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { period = "24h" } = await searchParams

  const landlord = await prisma.landlord.findUnique({
    where: { userId: session.user.id },
    include: { properties: true },
  })

  if (!landlord || landlord.properties.length === 0) {
    return <div className="py-16 text-center text-muted-foreground">No properties found.</div>
  }

  const property = landlord.properties[0]

  const periodMs: Record<string, number> = {
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
  }

  const startDate = new Date(Date.now() - (periodMs[period] ?? periodMs["24h"]))

  const measurements = await prisma.measurement.findMany({
    where: {
      propertyId: property.id,
      measurementTs: { gte: startDate },
    },
    orderBy: { measurementTs: "asc" },
    select: {
      measurementTs: true,
      watts: true,
      kwh: true,
      channel: { select: { displayName: true, assignedGroupId: true } },
    },
  })

  // Aggregate by timestamp
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
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/landlord" className="text-muted-foreground hover:text-foreground">
            &larr; Dashboard
          </Link>
          <h2 className="text-xl font-bold">
            {property.propertyName} - History
          </h2>
        </div>
        <div className="flex gap-2">
          {["24h", "7d", "30d"].map((p) => (
            <Link
              key={p}
              href={`/landlord/history?period=${p}`}
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
          <CardTitle>Total Consumption (W)</CardTitle>
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

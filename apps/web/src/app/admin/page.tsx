import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, Plug, Zap } from "lucide-react"

export const dynamic = "force-dynamic"
export default async function AdminDashboard() {
  const [propertyCount, tenantCount, deviceCount, lastRun] = await Promise.all([
    prisma.property.count(),
    prisma.user.count({ where: { role: "TENANT" } }),
    prisma.device.count(),
    prisma.ingestionRun.findFirst({
      orderBy: { startedAt: "desc" },
      select: { status: true, startedAt: true, recordsInserted: true },
    }),
  ])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Properties</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{propertyCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tenants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenantCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Devices</CardTitle>
            <Plug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deviceCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Last Ingestion</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lastRun ? lastRun.status : "N/A"}
            </div>
            {lastRun && (
              <p className="text-xs text-muted-foreground">
                {lastRun.recordsInserted} records
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

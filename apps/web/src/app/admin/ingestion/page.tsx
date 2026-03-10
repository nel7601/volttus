import { prisma } from "@/lib/prisma"
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

export const dynamic = "force-dynamic"

export default async function IngestionPage() {
  const runs = await prisma.ingestionRun.findMany({
    include: {
      property: true,
      device: true,
      errors: true,
    },
    orderBy: { startedAt: "desc" },
    take: 50,
  })

  const statusColors: Record<string, string> = {
    SUCCESS: "bg-green-100 text-green-800",
    RUNNING: "bg-blue-100 text-blue-800",
    PARTIAL: "bg-yellow-100 text-yellow-800",
    FAILED: "bg-red-100 text-red-800",
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Ingestion Runs</h1>

      <Card>
        <CardContent className="pt-6">
          {runs.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No ingestion runs yet. The ingestion service will create entries
              here when it runs.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Started</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Records</TableHead>
                  <TableHead>Errors</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell className="text-sm">
                      {run.startedAt.toLocaleString()}
                    </TableCell>
                    <TableCell>{run.property.propertyName}</TableCell>
                    <TableCell className="text-sm">
                      {run.device.deviceName}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[run.status] || ""}>
                        {run.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{run.recordsInserted}</TableCell>
                    <TableCell>
                      {run.errors.length > 0 ? (
                        <Badge variant="destructive">
                          {run.errors.length}
                        </Badge>
                      ) : (
                        "0"
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{run.triggerType}</TableCell>
                    <TableCell className="text-sm">
                      {run.finishedAt
                        ? `${((run.finishedAt.getTime() - run.startedAt.getTime()) / 1000).toFixed(1)}s`
                        : "Running..."}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

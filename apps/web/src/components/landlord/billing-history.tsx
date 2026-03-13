"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FileText, AlertCircle } from "lucide-react"
import { closeBillingPeriod } from "@/actions/billing"

export interface BillingRecordData {
  id: string
  billingPeriodStart: string
  billingPeriodEnd: string
  billingClosingDay: number
  totalConsumptionKwh: number
  monthlyInvoiceAmount: number
  commonAreaSplit: "EQUAL" | "PROPORTIONAL"
  createdAt: string
  items: BillingRecordItemData[]
}

export interface BillingRecordItemData {
  id: string
  groupName: string
  groupType: "INCOME" | "COMMON" | "APARTMENT"
  kwh: number
  percentage: number
  toPay: number | null
  tenantName: string | null
}

interface BillingHistoryProps {
  records: BillingRecordData[]
  propertyId: string
  propertyName: string
  selectedYear: number
  selectedMonth: number | null
  availableYears: number[]
}

export function BillingHistory({
  records,
  propertyId,
  propertyName,
  selectedYear,
  selectedMonth,
  availableYears,
}: BillingHistoryProps) {
  const router = useRouter()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleYearChange(value: string | null) {
    if (!value) return
    router.push(`/landlord/history?propertyId=${propertyId}&year=${value}`)
  }

  function handleMonthChange(value: string | null) {
    if (!value) return
    if (value === "all") {
      router.push(
        `/landlord/history?propertyId=${propertyId}&year=${selectedYear}`
      )
    } else {
      router.push(
        `/landlord/history?propertyId=${propertyId}&year=${selectedYear}&month=${value}`
      )
    }
  }

  function handleClosePeriod() {
    setError(null)
    startTransition(async () => {
      try {
        await closeBillingPeriod(propertyId)
        setConfirmOpen(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to close period")
      }
    })
  }

  const months = [
    { value: "all", label: "All Months" },
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ]

  return (
    <div className="space-y-6">
      {/* Filters + Close Period button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Select
            value={String(selectedYear)}
            onValueChange={handleYearChange}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue>{selectedYear}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedMonth !== null ? String(selectedMonth) : "all"}
            onValueChange={handleMonthChange}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue>
                {selectedMonth !== null
                  ? months.find((m) => m.value === String(selectedMonth))?.label
                  : "All Months"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogTrigger
            render={
              <Button className="bg-sky-500 text-white hover:bg-sky-600">
                <FileText className="h-4 w-4 mr-1" />
                Close Period
              </Button>
            }
          />
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Close Billing Period</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground py-2">
              This will snapshot the current billing cycle for{" "}
              <strong>{propertyName}</strong> and save it as a historical record.
              The dashboard will automatically start a new cycle.
            </p>
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-md p-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-sky-500 hover:bg-sky-600 text-white"
                onClick={handleClosePeriod}
                disabled={isPending}
              >
                {isPending ? "Closing..." : "Confirm"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Closed records */}
      {records.length === 0 ? (
        <Card className="shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04] dark:ring-white/[0.06] border-transparent">
          <CardContent className="py-12 text-center text-muted-foreground">
            No billing records found for this period.
          </CardContent>
        </Card>
      ) : (
        records.map((record) => (
          <BillingRecordCard key={record.id} record={record} />
        ))
      )}
    </div>
  )
}

function BillingRecordCard({ record }: { record: BillingRecordData }) {
  const periodStart = new Date(record.billingPeriodStart).toLocaleDateString()
  const periodEnd = new Date(record.billingPeriodEnd).toLocaleDateString()
  const createdAt = new Date(record.createdAt).toLocaleDateString()

  return (
    <Card className="shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04] dark:ring-white/[0.06] border-transparent">
      <CardContent className="pt-4">
        {/* Summary header */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4 pb-4 border-b border-border/50">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Period
            </p>
            <p className="text-sm font-semibold">
              {periodStart} — {periodEnd}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total Consumption
            </p>
            <p className="text-sm font-semibold text-sky-600">
              {record.totalConsumptionKwh.toFixed(3)} kWh
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Invoice Amount
            </p>
            <p className="text-sm font-semibold text-amber-600">
              ${record.monthlyInvoiceAmount.toFixed(2)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Cost Distribution
            </p>
            <p className="text-sm font-semibold">
              {record.commonAreaSplit === "EQUAL"
                ? "Equal split"
                : "By consumption"}
            </p>
            <p className="text-xs text-muted-foreground">
              Created {createdAt}
            </p>
          </div>
        </div>

        {/* Items table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-sky-100/60 dark:bg-sky-500/10 border-b border-sky-200/80 dark:border-sky-800/30">
                <TableHead>Name</TableHead>
                <TableHead className="text-right">kWh</TableHead>
                <TableHead className="text-right">%</TableHead>
                <TableHead className="text-right hidden sm:table-cell">
                  To Pay
                </TableHead>
                <TableHead className="hidden md:table-cell">Tenant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {record.items.map((item) => {
                const isApartment = item.groupType === "APARTMENT"
                return (
                  <TableRow
                    key={item.id}
                    className="border-b border-border/40 hover:bg-sky-50/50 dark:hover:bg-sky-500/10"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                            isApartment ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                        />
                        <span className="font-medium truncate max-w-[120px] sm:max-w-none">
                          {item.groupName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs sm:text-sm">
                      {item.kwh.toFixed(3)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="outline"
                        className={
                          isApartment
                            ? item.percentage > 30
                              ? "border-emerald-500/50 text-emerald-700 bg-emerald-500/15"
                              : "border-emerald-400/40 text-emerald-600 bg-emerald-500/10"
                            : item.percentage > 30
                              ? "border-amber-500/50 text-amber-700 bg-amber-500/15"
                              : "border-amber-400/40 text-amber-600 bg-amber-500/10"
                        }
                      >
                        {item.percentage.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium hidden sm:table-cell">
                      {item.toPay !== null ? `$${item.toPay.toFixed(2)}` : "-"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {item.tenantName ? (
                        <span className="text-sm">{item.tenantName}</span>
                      ) : (
                        <span className="text-sm italic text-muted-foreground">
                          —
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

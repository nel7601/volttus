"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
import { updateBillingInvoice } from "@/actions/billing"

export interface BillingRecordData {
  id: string
  billingPeriodStart: string
  billingPeriodEnd: string
  billingClosingDay: number
  totalConsumptionKwh: number
  monthlyInvoiceAmount: number | null
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
  selectedYear: number
  selectedMonth: number | null
  availableYears: number[]
}

const cardClass =
  "shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04] dark:ring-white/[0.06] border-transparent"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function recalcToPay(
  items: BillingRecordItemData[],
  totalIncomeKwh: number,
  invoiceAmount: number,
  commonAreaSplit: "EQUAL" | "PROPORTIONAL"
): Map<string, number> {
  const result = new Map<string, number>()
  const commonItems = items.filter((i) => i.groupType === "COMMON")
  const apartmentItems = items.filter((i) => i.groupType === "APARTMENT")

  const totalCommonKwh = commonItems.reduce((s, i) => s + i.kwh, 0)
  const totalApartmentKwh = apartmentItems.reduce((s, i) => s + i.kwh, 0)

  const commonCost =
    totalIncomeKwh > 0
      ? (totalCommonKwh / totalIncomeKwh) * invoiceAmount
      : 0

  for (const item of apartmentItems) {
    const ownCost =
      totalIncomeKwh > 0
        ? (item.kwh / totalIncomeKwh) * invoiceAmount
        : 0
    let commonShare = 0
    if (commonCost > 0 && apartmentItems.length > 0) {
      if (commonAreaSplit === "EQUAL") {
        commonShare = commonCost / apartmentItems.length
      } else {
        commonShare =
          totalApartmentKwh > 0
            ? commonCost * (item.kwh / totalApartmentKwh)
            : 0
      }
    }
    result.set(item.id, ownCost + commonShare)
  }

  return result
}

export function BillingHistory({
  records,
  propertyId,
  selectedYear,
  selectedMonth,
  availableYears,
}: BillingHistoryProps) {
  const router = useRouter()

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
      {/* Filters */}
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

      {/* Table */}
      {records.length === 0 ? (
        <Card className={cardClass}>
          <CardContent className="py-12 text-center text-muted-foreground">
            No billing records found for this period.
          </CardContent>
        </Card>
      ) : (
        <Card className={cardClass}>
          <CardContent className="px-0 sm:px-6 pt-4">
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
                  {records.map((record) => (
                    <PeriodGroup key={record.id} record={record} />
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function PeriodGroup({ record }: { record: BillingRecordData }) {
  const [invoiceAmount, setInvoiceAmount] = useState(record.monthlyInvoiceAmount ?? 0)
  const [isPending, startTransition] = useTransition()

  const toPayMap = invoiceAmount > 0
    ? recalcToPay(
        record.items,
        record.totalConsumptionKwh,
        invoiceAmount,
        record.commonAreaSplit
      )
    : new Map<string, number>()

  function handleInvoiceBlur() {
    if (invoiceAmount === (record.monthlyInvoiceAmount ?? 0)) return
    if (invoiceAmount <= 0) return
    startTransition(async () => {
      await updateBillingInvoice(record.id, invoiceAmount)
    })
  }

  const closingDate = formatDate(record.billingPeriodEnd)

  return (
    <>
      {/* Income row */}
      <TableRow className="border-t-2 border-sky-200/80 dark:border-sky-800/30 bg-sky-50/40 dark:bg-sky-500/5">
        <TableCell>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full shrink-0 bg-sky-500" />
            <span className="font-semibold">Income</span>
            <span className="text-xs text-muted-foreground">({closingDate})</span>
          </div>
        </TableCell>
        <TableCell className="text-right font-mono text-sm font-semibold text-sky-600">
          {record.totalConsumptionKwh.toFixed(3)}
        </TableCell>
        <TableCell />
        <TableCell className="text-right hidden sm:table-cell">
          <div className="flex items-center justify-end gap-1">
            <span className="text-muted-foreground text-xs">$</span>
            <Input
              type="number"
              step="0.01"
              min={0}
              value={invoiceAmount || ""}
              placeholder="0.00"
              onChange={(e) => setInvoiceAmount(Number(e.target.value) || 0)}
              onBlur={handleInvoiceBlur}
              className={`w-[100px] h-7 text-right font-mono text-sm ${
                isPending ? "opacity-50" : ""
              }`}
            />
          </div>
        </TableCell>
        <TableCell className="hidden md:table-cell" />
      </TableRow>

      {/* Common + Apartment rows */}
      {record.items.map((item) => {
        const isApartment = item.groupType === "APARTMENT"
        const isCommon = item.groupType === "COMMON"
        const toPay = isApartment
          ? toPayMap.get(item.id) ?? null
          : item.toPay

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
              {toPay !== null ? `$${toPay.toFixed(2)}` : isCommon ? "—" : "-"}
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {item.tenantName ? (
                <span className="text-sm">{item.tenantName}</span>
              ) : isApartment ? (
                <span className="text-sm italic text-muted-foreground">—</span>
              ) : null}
            </TableCell>
          </TableRow>
        )
      })}
    </>
  )
}

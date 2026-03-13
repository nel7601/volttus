"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import { MapPin, Calendar, Zap, User } from "lucide-react"

export interface TenantPropertyInfo {
  propertyName: string
  address: string
  billingClosingDay: number | null
  landlordName: string
  landlordEmail: string
  landlordPhone: string | null
}

export interface TenantCurrentConsumption {
  kwh: number
  periodStart: string
  toPay: number | null
}

export interface TenantBillingRecord {
  id: string
  billingPeriodEnd: string
  kwh: number
  toPay: number | null
}

export interface TenantChartData {
  month: string
  kwh: number
}

interface TenantDashboardProps {
  propertyInfo: TenantPropertyInfo
  groupName: string
  currentConsumption: TenantCurrentConsumption
  billingRecords: TenantBillingRecord[]
  chartData: TenantChartData[]
  selectedYear: number
  selectedMonth: number | null
  availableYears: number[]
}

const cardClass =
  "shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04] dark:ring-white/[0.06] border-transparent"

export function TenantDashboard({
  propertyInfo,
  groupName,
  currentConsumption,
  billingRecords,
  chartData,
  selectedYear,
  selectedMonth,
  availableYears,
}: TenantDashboardProps) {
  const router = useRouter()

  function handleYearChange(value: string | null) {
    if (!value) return
    router.push(`/tenant?year=${value}`)
  }

  function handleMonthChange(value: string | null) {
    if (!value) return
    if (value === "all") {
      router.push(`/tenant?year=${selectedYear}`)
    } else {
      router.push(`/tenant?year=${selectedYear}&month=${value}`)
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

  const periodStart = new Date(
    currentConsumption.periodStart
  ).toLocaleDateString()

  return (
    <div className="space-y-6">
      {/* Property & Landlord Info */}
      <Card className={cardClass}>
        <CardContent className="py-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-sky-500" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Property
                </p>
              </div>
              <p className="text-sm font-semibold">
                {propertyInfo.propertyName}
              </p>
              <p className="text-xs text-muted-foreground">
                {propertyInfo.address}
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-sky-500" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Landlord
                </p>
              </div>
              <p className="text-sm font-semibold">
                {propertyInfo.landlordName}
              </p>
              <p className="text-xs text-muted-foreground">
                {propertyInfo.landlordEmail}
              </p>
              {propertyInfo.landlordPhone && (
                <p className="text-xs text-muted-foreground">
                  {propertyInfo.landlordPhone}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-sky-500" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Apartment
                </p>
              </div>
              <p className="text-sm font-semibold">{groupName}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-sky-500" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Billing Closing
                </p>
              </div>
              <p className="text-sm font-semibold">
                {propertyInfo.billingClosingDay
                  ? `Day ${propertyInfo.billingClosingDay} of each month`
                  : "Not set"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Consumption */}
      <Card className={cardClass}>
        <CardContent className="py-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Current Period — since {periodStart}
          </p>
          <div className="flex items-baseline gap-6">
            <div>
              <p className="text-3xl font-bold text-sky-600">
                {currentConsumption.kwh.toFixed(3)}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  kWh
                </span>
              </p>
            </div>
            {currentConsumption.toPay !== null && (
              <div>
                <p className="text-2xl font-bold text-amber-600">
                  ${currentConsumption.toPay.toFixed(2)}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    est.
                  </span>
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Billing History Table */}
      <Card className={cardClass}>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <p className="text-sm font-semibold">Billing History</p>
            <div className="flex items-center gap-3">
              <Select
                value={String(selectedYear)}
                onValueChange={handleYearChange}
              >
                <SelectTrigger className="w-[100px] h-8 text-xs">
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
                value={
                  selectedMonth !== null ? String(selectedMonth) : "all"
                }
                onValueChange={handleMonthChange}
              >
                <SelectTrigger className="w-[130px] h-8 text-xs">
                  <SelectValue>
                    {selectedMonth !== null
                      ? months.find(
                          (m) => m.value === String(selectedMonth)
                        )?.label
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
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-sky-100/60 dark:bg-sky-500/10 border-b border-sky-200/80 dark:border-sky-800/30">
                  <TableHead>Closing Date</TableHead>
                  <TableHead className="text-right">Consumption</TableHead>
                  <TableHead className="text-right">To Pay</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billingRecords.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground py-8"
                    >
                      No billing records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  billingRecords.map((record) => (
                    <TableRow
                      key={record.id}
                      className="border-b border-border/40 hover:bg-sky-50/50 dark:hover:bg-sky-500/10"
                    >
                      <TableCell className="font-medium">
                        {new Date(
                          record.billingPeriodEnd
                        ).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {record.kwh.toFixed(3)}
                        <span className="text-xs text-muted-foreground ml-1">
                          kWh
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {record.toPay !== null ? (
                          <Badge
                            variant="outline"
                            className="border-emerald-400/40 text-emerald-700 bg-emerald-500/10 font-mono"
                          >
                            ${record.toPay.toFixed(2)}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Consumption Chart (last 12 months) */}
      {chartData.length > 0 && (
        <Card className={cardClass}>
          <CardContent className="pt-4">
            <p className="text-sm font-semibold mb-4">
              Monthly Consumption — Last 12 Months
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} barCategoryGap="20%">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={{ stroke: "#e5e7eb" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  unit=" kWh"
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value) => [
                    `${Number(value).toFixed(3)} kWh`,
                    "Consumption",
                  ]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e0f2fe",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Bar
                  dataKey="kwh"
                  fill="#0ea5e9"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

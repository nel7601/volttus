"use client"

import { useState } from "react"
import Link from "next/link"
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
  MapPin,
  History,
} from "lucide-react"
import { ConsumptionBarChart } from "./consumption-bar-chart"

export interface PropertyData {
  id: string
  propertyName: string
  addressLine1: string
  addressLine2: string | null
  city: string
  country: string
  billingClosingDay: number | null
  commonAreaSplit: "EQUAL" | "PROPORTIONAL"
  invoiceMode: "MANUAL" | "AUTO"
  monthlyInvoiceAmount: number | null
}

export interface GroupData {
  id: string
  groupName: string
  groupType: "INCOME" | "COMMON" | "APARTMENT"
  apartmentNumber: string | null
  consumptionKwh: number
  isVirtual: boolean
  tenant: { id: string; fullName: string } | null
}

export interface TenantOption {
  id: string
  fullName: string
  email: string
  apartmentGroupId: string | null
}

export interface DashboardProps {
  properties: PropertyData[]
  selectedPropertyId: string
  groups: GroupData[]
  totalIncomeKwh: number
  chartData: Array<{ name: string; kwh: number; type: string; isVirtual?: boolean }>
  tenants: TenantOption[]
}

const cardClass =
  "shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04] dark:ring-white/[0.06] border-transparent"

export function LandlordDashboard({
  properties,
  selectedPropertyId,
  groups,
  totalIncomeKwh,
  chartData,
}: DashboardProps) {
  const router = useRouter()
  const property = properties.find((p) => p.id === selectedPropertyId)!

  const incomeGroup = groups.find((g) => g.groupType === "INCOME")
  const displayGroups = groups.filter(
    (g) => g.groupType === "APARTMENT" || g.groupType === "COMMON"
  )

  const apartmentGroups = displayGroups.filter((g) => g.groupType === "APARTMENT")
  const commonGroups = displayGroups.filter((g) => g.groupType === "COMMON")

  const totalCommonKwh = commonGroups.reduce((sum, g) => sum + g.consumptionKwh, 0)
  const totalApartmentKwh = apartmentGroups.reduce((sum, g) => sum + g.consumptionKwh, 0)

  const commonCost =
    property.monthlyInvoiceAmount && totalIncomeKwh > 0
      ? (totalCommonKwh / totalIncomeKwh) * property.monthlyInvoiceAmount
      : 0

  function getGroupToPay(group: GroupData): number | null {
    if (!property.monthlyInvoiceAmount || totalIncomeKwh <= 0) return null
    if (group.groupType === "COMMON") return null

    const ownCost =
      (group.consumptionKwh / totalIncomeKwh) * property.monthlyInvoiceAmount

    let commonShare = 0
    if (commonCost > 0 && apartmentGroups.length > 0) {
      if (property.commonAreaSplit === "EQUAL") {
        commonShare = commonCost / apartmentGroups.length
      } else {
        commonShare =
          totalApartmentKwh > 0
            ? commonCost * (group.consumptionKwh / totalApartmentKwh)
            : 0
      }
    }

    return ownCost + commonShare
  }

  const address = [property.addressLine1, property.addressLine2, property.city]
    .filter(Boolean)
    .join(", ")

  function handlePropertyChange(value: string | null) {
    if (value) router.push(`/landlord?propertyId=${value}`)
  }

  return (
    <div className="space-y-6">
      {/* Top bar: property selector + history button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <MapPin className="h-4 w-4 text-sky-500 shrink-0" />
          <Select
            value={selectedPropertyId}
            onValueChange={handlePropertyChange}
          >
            <SelectTrigger className="w-full sm:max-w-[400px]">
              <SelectValue placeholder={address}>
                {address}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {properties.map((p) => {
                const addr = [p.addressLine1, p.addressLine2, p.city]
                  .filter(Boolean)
                  .join(", ")
                return (
                  <SelectItem key={p.id} value={p.id}>
                    {addr}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
        <Link href={`/landlord/history?propertyId=${selectedPropertyId}`} className="shrink-0">
          <Button className="bg-sky-500 text-white hover:bg-sky-600 w-full sm:w-auto">
            <History className="h-4 w-4 mr-1" />
            View History
          </Button>
        </Link>
      </div>

      {/* Groups table with Income row */}
      <Card className={cardClass}>
        <CardContent className="px-0 sm:px-6 pt-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-sky-100/60 dark:bg-sky-500/10 border-b border-sky-200/80 dark:border-sky-800/30">
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">kWh</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">To Pay</TableHead>
                  <TableHead className="hidden md:table-cell">Tenant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Income row */}
                {incomeGroup && (
                  <TableRow className="border-b-2 border-sky-200/80 dark:border-sky-800/30 bg-sky-50/40 dark:bg-sky-500/5">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0 bg-sky-500" />
                        <span className="font-semibold">{incomeGroup.groupName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold text-sky-600">
                      {totalIncomeKwh.toFixed(3)}
                    </TableCell>
                    <TableCell />
                    <TableCell className="hidden sm:table-cell" />
                    <TableCell className="hidden md:table-cell" />
                  </TableRow>
                )}

                {/* Common + Apartment rows */}
                {displayGroups.map((group) => {
                  const pct =
                    totalIncomeKwh > 0
                      ? (group.consumptionKwh * 100) / totalIncomeKwh
                      : 0
                  const toPay = getGroupToPay(group)
                  const isApartment = group.groupType === "APARTMENT"

                  return (
                    <TableRow key={group.id} className="border-b border-border/40 hover:bg-sky-50/50 dark:hover:bg-sky-500/10">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                              isApartment ? "bg-emerald-500" : "bg-amber-500"
                            }`}
                          />
                          <span className="font-medium truncate max-w-[120px] sm:max-w-none">{group.groupName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs sm:text-sm">
                        {group.consumptionKwh.toFixed(3)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={
                            isApartment
                              ? pct > 30
                                ? "border-emerald-500/50 text-emerald-700 bg-emerald-500/15"
                                : "border-emerald-400/40 text-emerald-600 bg-emerald-500/10"
                              : pct > 30
                                ? "border-amber-500/50 text-amber-700 bg-amber-500/15"
                                : "border-amber-400/40 text-amber-600 bg-amber-500/10"
                          }
                        >
                          {pct.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium hidden sm:table-cell">
                        {toPay !== null ? `$${toPay.toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {group.tenant ? (
                          <span className="text-sm">{group.tenant.fullName}</span>
                        ) : isApartment ? (
                          <span className="text-sm italic text-muted-foreground">No tenant</span>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Bar chart */}
      <Card className={cardClass}>
        <CardContent className="pt-4">
          {chartData.length > 0 ? (
            <>
              <ConsumptionBarChart data={chartData} />
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-4">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-sm bg-sky-500" />
                  <span className="text-xs text-muted-foreground">Income</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-sm bg-amber-500" />
                  <span className="text-xs text-muted-foreground">Common</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-sm bg-emerald-500" />
                  <span className="text-xs text-muted-foreground">Apartment</span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No consumption data available.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

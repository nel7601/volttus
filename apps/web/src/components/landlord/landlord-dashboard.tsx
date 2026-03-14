"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import {
  Building2,
  MapPin,
  CalendarDays,
  Pencil,
  Zap,
  UserPlus,
  History,
  Receipt,
  BarChart3,
} from "lucide-react"
import { ConsumptionBarChart } from "./consumption-bar-chart"
import {
  updatePropertyDetails,
  updateMonthlyInvoice,
  updateCommonAreaSplit,
} from "@/actions/property-settings"

export interface PropertyData {
  id: string
  propertyName: string
  addressLine1: string
  addressLine2: string | null
  city: string
  country: string
  billingClosingDay: number | null
  commonAreaSplit: "EQUAL" | "PROPORTIONAL"
  monthlyInvoiceAmount: number | null
  lastBillFetchedAt: string | null
  hasAlectraAccount: boolean
}

export interface GroupData {
  id: string
  groupName: string
  groupType: "INCOME" | "COMMON" | "APARTMENT"
  apartmentNumber: string | null
  consumptionKwh: number
  tenant: { id: string; fullName: string } | null
}

export interface DashboardProps {
  properties: PropertyData[]
  selectedPropertyId: string
  groups: GroupData[]
  totalIncomeKwh: number
  chartData: Array<{ name: string; kwh: number; type: string }>
}

export function LandlordDashboard({
  properties,
  selectedPropertyId,
  groups,
  totalIncomeKwh,
  chartData,
}: DashboardProps) {
  const router = useRouter()
  const property = properties.find((p) => p.id === selectedPropertyId)!
  const [editOpen, setEditOpen] = useState(false)
  const [invoiceEditOpen, setInvoiceEditOpen] = useState(false)

  const displayGroups = groups.filter(
    (g) => g.groupType === "APARTMENT" || g.groupType === "COMMON"
  )

  const address = [property.addressLine1, property.addressLine2, property.city]
    .filter(Boolean)
    .join(", ")

  const closingDate = property.billingClosingDay
    ? `Day ${property.billingClosingDay} of each month`
    : "Not set"

  function handlePropertyChange(value: string | null) {
    if (value) router.push(`/landlord?propertyId=${value}`)
  }

  async function handleSplitChange(value: string | null) {
    if (!value) return
    await updateCommonAreaSplit(
      property.id,
      value as "EQUAL" | "PROPORTIONAL"
    )
  }

  return (
    <div className="space-y-6">
      {/* Top bar: property selector + history button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Label className="text-sm font-medium text-muted-foreground">
            Property
          </Label>
          <Select
            value={selectedPropertyId}
            onValueChange={handlePropertyChange}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder={property.propertyName}>
                {property.propertyName}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {properties.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.propertyName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Link href={`/landlord/history?propertyId=${selectedPropertyId}`}>
          <Button className="bg-sky-500 text-white hover:bg-sky-600">
            <History className="h-4 w-4 mr-1" />
            View History
          </Button>
        </Link>
      </div>

      {/* Property info + Consumption cards */}
      <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-4">
        {/* Left card: property details (60%) */}
        <Card className="border-l-4 border-l-sky-600">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10">
                <Building2 className="h-4 w-4 text-sky-600" />
              </div>
              {property.propertyName}
            </CardTitle>
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger
                render={
                  <Button variant="ghost" size="icon-sm">
                    <Pencil className="h-4 w-4" />
                  </Button>
                }
              />
              <EditPropertyDialog
                property={property}
                onClose={() => setEditOpen(false)}
              />
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Address */}
              <div className="flex items-start gap-3 rounded-lg bg-sky-50/50 dark:bg-sky-500/5 p-3">
                <MapPin className="h-4 w-4 mt-0.5 text-sky-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="text-sm font-medium">{address}</p>
                </div>
              </div>
              {/* Billing closing day */}
              <div className="flex items-start gap-3 rounded-lg bg-sky-50/50 dark:bg-sky-500/5 p-3">
                <CalendarDays className="h-4 w-4 mt-0.5 text-sky-500" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    Billing Closing Date
                  </p>
                  <p className="text-sm font-medium">{closingDate}</p>
                </div>
              </div>
            </div>

            {/* Common area split selector */}
            <div className="mt-5 rounded-lg border border-sky-500/20 bg-sky-500/5 p-4">
              <p className="text-sm font-medium mb-2">
                Common Area Cost Distribution
              </p>
              <Select
                value={property.commonAreaSplit}
                onValueChange={handleSplitChange}
              >
                <SelectTrigger className="w-[350px]">
                  <SelectValue>
                    {property.commonAreaSplit === "EQUAL"
                      ? "Split equally among all apartments"
                      : "Split by consumption percentage"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EQUAL">
                    Split equally among all apartments
                  </SelectItem>
                  <SelectItem value="PROPORTIONAL">
                    Split by consumption percentage
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Right card: consumption + invoice (40%) */}
        <Card className="border-l-4 border-l-sky-400">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10">
                <Zap className="h-4 w-4 text-sky-500" />
              </div>
              Consumption
            </CardTitle>
            <Dialog open={invoiceEditOpen} onOpenChange={setInvoiceEditOpen}>
              <DialogTrigger
                render={
                  <Button variant="ghost" size="icon-sm">
                    <Pencil className="h-4 w-4" />
                  </Button>
                }
              />
              <EditInvoiceDialog
                property={property}
                onClose={() => setInvoiceEditOpen(false)}
              />
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Total consumption */}
            <div className="rounded-lg bg-sky-500/5 border border-sky-500/20 p-4">
              <p className="text-xs text-muted-foreground">
                Total Consumption (Income)
              </p>
              <p className="text-3xl font-bold text-sky-600">
                {totalIncomeKwh.toFixed(3)}{" "}
                <span className="text-base font-medium text-muted-foreground">
                  kWh
                </span>
              </p>
            </div>
            {/* Monthly invoice */}
            <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Receipt className="h-3.5 w-3.5 text-amber-500" />
                <p className="text-xs text-muted-foreground">
                  Monthly Invoice Amount
                </p>
                {property.hasAlectraAccount && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-emerald-500/30 text-emerald-600">
                    Auto-sync
                  </Badge>
                )}
              </div>
              <p className="text-3xl font-bold text-amber-600">
                {property.monthlyInvoiceAmount !== null
                  ? `$${property.monthlyInvoiceAmount.toFixed(2)}`
                  : "Not set"}
              </p>
              {property.lastBillFetchedAt && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  Last synced: {new Date(property.lastBillFetchedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Groups table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10">
              <BarChart3 className="h-4 w-4 text-sky-600" />
            </div>
            Groups
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-sky-50/50 dark:bg-sky-500/5">
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Consumption (kWh)</TableHead>
                <TableHead className="text-right">%</TableHead>
                <TableHead className="text-right">Total to Pay</TableHead>
                <TableHead>Tenant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayGroups.map((group) => {
                const pct =
                  totalIncomeKwh > 0
                    ? (group.consumptionKwh * 100) / totalIncomeKwh
                    : 0
                const toPay = property.monthlyInvoiceAmount
                  ? (pct / 100) * property.monthlyInvoiceAmount
                  : null

                const isApartment = group.groupType === "APARTMENT"

                return (
                  <TableRow key={group.id} className="hover:bg-sky-50/30 dark:hover:bg-sky-500/5">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            isApartment ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                        />
                        <span className="font-medium">{group.groupName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {group.consumptionKwh.toFixed(3)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="outline"
                        className={
                          isApartment
                            ? pct > 30
                              ? "border-emerald-600/30 text-emerald-700 bg-emerald-500/10"
                              : "border-emerald-500/30 text-emerald-600 bg-emerald-500/5"
                            : pct > 30
                              ? "border-amber-600/30 text-amber-700 bg-amber-500/10"
                              : "border-amber-500/30 text-amber-600 bg-amber-500/5"
                        }
                      >
                        {pct.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {toPay !== null ? `$${toPay.toFixed(2)}` : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {group.tenant ? (
                          <span className="text-sm">
                            {group.tenant.fullName}
                          </span>
                        ) : (
                          <span className="text-sm italic text-muted-foreground">
                            No tenant
                          </span>
                        )}
                        <Link
                          href={`/admin/users?propertyId=${selectedPropertyId}&groupId=${group.id}`}
                        >
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className={
                              group.tenant
                                ? "text-muted-foreground hover:text-foreground"
                                : "text-sky-500 hover:text-sky-600 hover:bg-sky-500/10"
                            }
                          >
                            {group.tenant ? (
                              <Pencil className="h-3 w-3" />
                            ) : (
                              <UserPlus className="h-3 w-3" />
                            )}
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Bar chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10">
              <Zap className="h-4 w-4 text-sky-500" />
            </div>
            Consumption by Group
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <>
              <ConsumptionBarChart data={chartData} />
              {/* Legend */}
              <div className="flex items-center justify-center gap-6 mt-4">
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
                  <span className="text-xs text-muted-foreground">
                    Apartment
                  </span>
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

function EditPropertyDialog({
  property,
  onClose,
}: {
  property: PropertyData
  onClose: () => void
}) {
  async function handleSubmit(formData: FormData) {
    await updatePropertyDetails(formData)
    onClose()
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Edit Property</DialogTitle>
      </DialogHeader>
      <form action={handleSubmit}>
        <input type="hidden" name="propertyId" value={property.id} />
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="propertyName">Property Name</Label>
            <Input
              id="propertyName"
              name="propertyName"
              defaultValue={property.propertyName}
              placeholder="Property name"
            />
          </div>
          <div>
            <Label htmlFor="addressLine1">Address</Label>
            <Input
              id="addressLine1"
              name="addressLine1"
              defaultValue={property.addressLine1}
              placeholder="Address line 1"
            />
          </div>
          <div>
            <Label htmlFor="addressLine2">Address Line 2</Label>
            <Input
              id="addressLine2"
              name="addressLine2"
              defaultValue={property.addressLine2 ?? ""}
              placeholder="Apt, suite, etc. (optional)"
            />
          </div>
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              name="city"
              defaultValue={property.city}
              placeholder="City"
            />
          </div>
          <div>
            <Label htmlFor="billingClosingDay">
              Billing Closing Day (1-31)
            </Label>
            <Input
              id="billingClosingDay"
              name="billingClosingDay"
              type="number"
              min={1}
              max={31}
              defaultValue={property.billingClosingDay ?? ""}
              placeholder="e.g. 15"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            className="bg-sky-500 hover:bg-sky-600 text-white"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

function EditInvoiceDialog({
  property,
  onClose,
}: {
  property: PropertyData
  onClose: () => void
}) {
  async function handleSubmit(formData: FormData) {
    await updateMonthlyInvoice(formData)
    onClose()
  }

  return (
    <DialogContent className="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle>Edit Monthly Invoice</DialogTitle>
      </DialogHeader>
      <form action={handleSubmit}>
        <input type="hidden" name="propertyId" value={property.id} />
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="monthlyInvoiceAmount">
              Monthly Invoice Amount ($)
            </Label>
            <Input
              id="monthlyInvoiceAmount"
              name="monthlyInvoiceAmount"
              type="number"
              step="0.01"
              min={0}
              defaultValue={property.monthlyInvoiceAmount ?? ""}
              placeholder="e.g. 500.00"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            className="bg-sky-500 hover:bg-sky-600 text-white"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

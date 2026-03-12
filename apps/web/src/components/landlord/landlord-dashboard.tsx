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
  MapPin,
  Pencil,
  Zap,
  UserPlus,
  History,
  BarChart3,
} from "lucide-react"
import { ConsumptionBarChart } from "./consumption-bar-chart"
import {
  updatePropertyDetails,
  updateMonthlyInvoice,
  updateCommonAreaSplit,
  assignTenantToGroup,
  removeTenantFromGroup,
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

export function LandlordDashboard({
  properties,
  selectedPropertyId,
  groups,
  totalIncomeKwh,
  chartData,
  tenants,
}: DashboardProps) {
  const router = useRouter()
  const property = properties.find((p) => p.id === selectedPropertyId)!
  const [editOpen, setEditOpen] = useState(false)
  const [invoiceEditOpen, setInvoiceEditOpen] = useState(false)
  const [tenantDialogGroup, setTenantDialogGroup] = useState<GroupData | null>(
    null
  )

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
      {/* Top bar: property selector by address + history button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MapPin className="h-4 w-4 text-sky-500" />
          <Select
            value={selectedPropertyId}
            onValueChange={handlePropertyChange}
          >
            <SelectTrigger className="w-[400px]">
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
        <Link href={`/landlord/history?propertyId=${selectedPropertyId}`}>
          <Button className="bg-sky-500 text-white hover:bg-sky-600">
            <History className="h-4 w-4 mr-1" />
            View History
          </Button>
        </Link>
      </div>

      {/* Summary strip */}
      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total consumption */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Total Consumption</p>
              <p className="text-2xl font-bold text-sky-600">
                {totalIncomeKwh.toFixed(3)}
                <span className="text-xs font-normal text-muted-foreground ml-1">kWh</span>
              </p>
            </div>
            {/* Monthly invoice */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <p className="text-xs text-muted-foreground">Monthly Invoice</p>
                <Dialog open={invoiceEditOpen} onOpenChange={setInvoiceEditOpen}>
                  <DialogTrigger
                    render={
                      <button className="text-muted-foreground/50 hover:text-muted-foreground">
                        <Pencil className="h-3 w-3" />
                      </button>
                    }
                  />
                  <EditInvoiceDialog
                    property={property}
                    onClose={() => setInvoiceEditOpen(false)}
                  />
                </Dialog>
              </div>
              <p className="text-2xl font-bold text-amber-600">
                {property.monthlyInvoiceAmount !== null
                  ? `$${property.monthlyInvoiceAmount.toFixed(2)}`
                  : "—"}
              </p>
            </div>
            {/* Billing closing day */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <p className="text-xs text-muted-foreground">Billing Closing</p>
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                  <DialogTrigger
                    render={
                      <button className="text-muted-foreground/50 hover:text-muted-foreground">
                        <Pencil className="h-3 w-3" />
                      </button>
                    }
                  />
                  <EditBillingDialog
                    property={property}
                    onClose={() => setEditOpen(false)}
                  />
                </Dialog>
              </div>
              <p className="text-sm font-medium mt-1">{closingDate}</p>
            </div>
            {/* Common area split */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Cost Distribution</p>
              <Select
                value={property.commonAreaSplit}
                onValueChange={handleSplitChange}
              >
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue>
                    {property.commonAreaSplit === "EQUAL"
                      ? "Equal split"
                      : "By consumption"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EQUAL">Equal split</SelectItem>
                  <SelectItem value="PROPORTIONAL">By consumption</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

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
                        {isApartment && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className={
                              group.tenant
                                ? "text-muted-foreground hover:text-foreground"
                                : "text-sky-500 hover:text-sky-600 hover:bg-sky-500/10"
                            }
                            onClick={() => setTenantDialogGroup(group)}
                          >
                            {group.tenant ? (
                              <Pencil className="h-3 w-3" />
                            ) : (
                              <UserPlus className="h-3 w-3" />
                            )}
                          </Button>
                        )}
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

      {/* Tenant assignment dialog */}
      <Dialog
        open={tenantDialogGroup !== null}
        onOpenChange={(open) => {
          if (!open) setTenantDialogGroup(null)
        }}
      >
        {tenantDialogGroup && (
          <TenantAssignDialog
            group={tenantDialogGroup}
            tenants={tenants}
            onClose={() => setTenantDialogGroup(null)}
          />
        )}
      </Dialog>
    </div>
  )
}

function TenantAssignDialog({
  group,
  tenants,
  onClose,
}: {
  group: GroupData
  tenants: TenantOption[]
  onClose: () => void
}) {
  const [selectedTenantId, setSelectedTenantId] = useState("")
  const [loading, setLoading] = useState(false)

  // Available tenants: those not assigned to any group, or already assigned to this group
  const availableTenants = tenants.filter(
    (t) => !t.apartmentGroupId || t.apartmentGroupId === group.id
  )

  const selectedTenant = availableTenants.find(
    (t) => t.id === selectedTenantId
  )

  async function handleAssign() {
    if (!selectedTenantId) return
    setLoading(true)
    await assignTenantToGroup(group.id, selectedTenantId)
    setLoading(false)
    onClose()
  }

  async function handleRemove() {
    setLoading(true)
    await removeTenantFromGroup(group.id)
    setLoading(false)
    onClose()
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-sky-500" />
          {group.tenant ? "Change Tenant" : "Assign Tenant"} — {group.groupName}
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-2">
        {/* Current tenant info */}
        {group.tenant && (
          <div className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
            <div>
              <p className="text-xs text-muted-foreground">Current Tenant</p>
              <p className="text-sm font-medium">{group.tenant.fullName}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={handleRemove}
              disabled={loading}
            >
              Remove
            </Button>
          </div>
        )}

        {/* Tenant selector */}
        <div className="space-y-2">
          <Label className="text-sm">
            {group.tenant ? "Replace with" : "Select Tenant"}
          </Label>
          {availableTenants.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-2">
              No available tenants. Create a tenant first in the admin panel.
            </p>
          ) : (
            <Select
              value={selectedTenantId}
              onValueChange={(v: string | null) =>
                setSelectedTenantId(v || "")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a tenant...">
                  {selectedTenant ? selectedTenant.fullName : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {availableTenants.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.fullName}{" "}
                    <span className="text-muted-foreground">({t.email})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          className="bg-sky-500 hover:bg-sky-600 text-white"
          onClick={handleAssign}
          disabled={!selectedTenantId || loading}
        >
          {loading ? "Saving..." : "Assign Tenant"}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

function EditBillingDialog({
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
    <DialogContent className="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle>Edit Billing Settings</DialogTitle>
      </DialogHeader>
      <form action={handleSubmit}>
        <input type="hidden" name="propertyId" value={property.id} />
        {/* Send current values so the action doesn't clear them */}
        <input type="hidden" name="propertyName" value={property.propertyName} />
        <input type="hidden" name="addressLine1" value={property.addressLine1} />
        <input type="hidden" name="addressLine2" value={property.addressLine2 ?? ""} />
        <input type="hidden" name="city" value={property.city} />
        <div className="space-y-4 py-2">
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

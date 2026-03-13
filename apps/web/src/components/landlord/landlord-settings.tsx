"use client"

import { useState, useTransition } from "react"
import { Card, CardContent } from "@/components/ui/card"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Pencil, UserPlus, Archive, RotateCcw } from "lucide-react"
import {
  updatePropertyDetails,
  updateMonthlyInvoice,
  updateCommonAreaSplit,
} from "@/actions/property-settings"
import {
  createTenant,
  updateTenant,
  toggleTenantArchive,
} from "@/actions/tenant-management"

export interface SettingsPropertyData {
  id: string
  propertyName: string
  addressLine1: string
  addressLine2: string | null
  city: string
  billingClosingDay: number | null
  commonAreaSplit: "EQUAL" | "PROPORTIONAL"
  monthlyInvoiceAmount: number | null
}

export interface SettingsTenantData {
  id: string
  fullName: string
  email: string
  isActive: boolean
  apartmentGroupId: string | null
  apartmentGroupName: string | null
}

export interface SettingsGroupOption {
  id: string
  groupName: string
}

interface LandlordSettingsProps {
  property: SettingsPropertyData
  tenants: SettingsTenantData[]
  apartmentGroups: SettingsGroupOption[]
}

const cardClass =
  "shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04] dark:ring-white/[0.06] border-transparent"

export function LandlordSettings({
  property,
  tenants,
  apartmentGroups,
}: LandlordSettingsProps) {
  const [billingOpen, setBillingOpen] = useState(false)
  const [invoiceOpen, setInvoiceOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editTenant, setEditTenant] = useState<SettingsTenantData | null>(null)

  async function handleSplitChange(value: string | null) {
    if (!value) return
    await updateCommonAreaSplit(
      property.id,
      value as "EQUAL" | "PROPORTIONAL"
    )
  }

  const activeTenants = tenants.filter((t) => t.isActive)
  const archivedTenants = tenants.filter((t) => !t.isActive)

  return (
    <div className="space-y-6">
      {/* Billing Settings */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Billing
        </h3>
        <Card className={cardClass}>
          <CardContent className="py-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Billing Closing Day */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Billing Closing Day
                  </Label>
                  <Dialog open={billingOpen} onOpenChange={setBillingOpen}>
                    <DialogTrigger
                      render={
                        <button className="text-muted-foreground/60 hover:text-foreground">
                          <Pencil className="h-3 w-3" />
                        </button>
                      }
                    />
                    <EditBillingDialog
                      property={property}
                      onClose={() => setBillingOpen(false)}
                    />
                  </Dialog>
                </div>
                <p className="text-lg font-semibold">
                  {property.billingClosingDay
                    ? `Day ${property.billingClosingDay}`
                    : "Not set"}
                </p>
              </div>

              {/* Monthly Invoice */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Monthly Invoice
                  </Label>
                  <Dialog open={invoiceOpen} onOpenChange={setInvoiceOpen}>
                    <DialogTrigger
                      render={
                        <button className="text-muted-foreground/60 hover:text-foreground">
                          <Pencil className="h-3 w-3" />
                        </button>
                      }
                    />
                    <EditInvoiceDialog
                      property={property}
                      onClose={() => setInvoiceOpen(false)}
                    />
                  </Dialog>
                </div>
                <p className="text-lg font-semibold text-amber-600">
                  {property.monthlyInvoiceAmount !== null
                    ? `$${property.monthlyInvoiceAmount.toFixed(2)}`
                    : "—"}
                </p>
              </div>

              {/* Cost Distribution */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Cost Distribution
                </Label>
                <Select
                  value={property.commonAreaSplit}
                  onValueChange={handleSplitChange}
                >
                  <SelectTrigger className="h-9">
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
      </div>

      {/* Tenants */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Tenants
          </h3>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger
              render={
                <Button size="sm" className="bg-sky-500 text-white hover:bg-sky-600">
                  <UserPlus className="h-3.5 w-3.5 mr-1" />
                  Add Tenant
                </Button>
              }
            />
            <CreateTenantDialog
              propertyId={property.id}
              apartmentGroups={apartmentGroups}
              onClose={() => setCreateOpen(false)}
            />
          </Dialog>
        </div>

        {activeTenants.length === 0 && archivedTenants.length === 0 ? (
          <Card className={cardClass}>
            <CardContent className="py-12 text-center text-muted-foreground">
              No tenants yet. Add your first tenant.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeTenants.map((t) => (
              <TenantCard
                key={t.id}
                tenant={t}
                apartmentGroups={apartmentGroups}
                onEdit={() => setEditTenant(t)}
              />
            ))}
            {archivedTenants.map((t) => (
              <TenantCard
                key={t.id}
                tenant={t}
                apartmentGroups={apartmentGroups}
                onEdit={() => setEditTenant(t)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit tenant dialog */}
      <Dialog
        open={editTenant !== null}
        onOpenChange={(open) => {
          if (!open) setEditTenant(null)
        }}
      >
        {editTenant && (
          <EditTenantDialog
            tenant={editTenant}
            apartmentGroups={apartmentGroups}
            onClose={() => setEditTenant(null)}
          />
        )}
      </Dialog>
    </div>
  )
}

function TenantCard({
  tenant,
  apartmentGroups,
  onEdit,
}: {
  tenant: SettingsTenantData
  apartmentGroups: SettingsGroupOption[]
  onEdit: () => void
}) {
  const [isPending, startTransition] = useTransition()

  function handleToggleArchive() {
    startTransition(async () => {
      await toggleTenantArchive(tenant.id)
    })
  }

  return (
    <Card
      className={`${cardClass} ${!tenant.isActive ? "opacity-60" : ""}`}
    >
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold truncate">{tenant.fullName}</p>
              {!tenant.isActive && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-red-300 text-red-600 bg-red-50">
                  Archived
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{tenant.email}</p>
            {tenant.apartmentGroupName && (
              <p className="text-xs text-sky-600 mt-1">
                {tenant.apartmentGroupName}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground hover:text-foreground"
              onClick={onEdit}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              className={
                tenant.isActive
                  ? "text-muted-foreground hover:text-red-600"
                  : "text-muted-foreground hover:text-emerald-600"
              }
              onClick={handleToggleArchive}
              disabled={isPending}
            >
              {tenant.isActive ? (
                <Archive className="h-3.5 w-3.5" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function CreateTenantDialog({
  propertyId,
  apartmentGroups,
  onClose,
}: {
  propertyId: string
  apartmentGroups: SettingsGroupOption[]
  onClose: () => void
}) {
  async function handleSubmit(formData: FormData) {
    await createTenant(formData)
    onClose()
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-sky-500" />
          Add Tenant
        </DialogTitle>
      </DialogHeader>
      <form action={handleSubmit}>
        <input type="hidden" name="propertyId" value={propertyId} />
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="ct-fullName">Full Name</Label>
            <Input id="ct-fullName" name="fullName" required />
          </div>
          <div>
            <Label htmlFor="ct-email">Email</Label>
            <Input id="ct-email" name="email" type="email" required />
          </div>
          <div>
            <Label htmlFor="ct-password">Password</Label>
            <Input id="ct-password" name="password" type="password" minLength={6} required />
          </div>
          <div>
            <Label htmlFor="ct-group">Apartment (optional)</Label>
            <select
              id="ct-group"
              name="apartmentGroupId"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              <option value="">— None —</option>
              {apartmentGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.groupName}
                </option>
              ))}
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="bg-sky-500 hover:bg-sky-600 text-white">
            Create
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

function EditTenantDialog({
  tenant,
  apartmentGroups,
  onClose,
}: {
  tenant: SettingsTenantData
  apartmentGroups: SettingsGroupOption[]
  onClose: () => void
}) {
  async function handleSubmit(formData: FormData) {
    await updateTenant(formData)
    onClose()
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Edit Tenant</DialogTitle>
      </DialogHeader>
      <form action={handleSubmit}>
        <input type="hidden" name="id" value={tenant.id} />
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="et-fullName">Full Name</Label>
            <Input id="et-fullName" name="fullName" defaultValue={tenant.fullName} required />
          </div>
          <div>
            <Label htmlFor="et-email">Email</Label>
            <Input id="et-email" name="email" type="email" defaultValue={tenant.email} required />
          </div>
          <div>
            <Label htmlFor="et-password">New Password (leave blank to keep)</Label>
            <Input id="et-password" name="newPassword" type="password" minLength={6} />
          </div>
          <div>
            <Label htmlFor="et-group">Apartment</Label>
            <select
              id="et-group"
              name="apartmentGroupId"
              defaultValue={tenant.apartmentGroupId ?? ""}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              <option value="">— None —</option>
              {apartmentGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.groupName}
                </option>
              ))}
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="bg-sky-500 hover:bg-sky-600 text-white">
            Save Changes
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

function EditBillingDialog({
  property,
  onClose,
}: {
  property: SettingsPropertyData
  onClose: () => void
}) {
  async function handleSubmit(formData: FormData) {
    await updatePropertyDetails(formData)
    onClose()
  }

  return (
    <DialogContent className="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle>Edit Billing Closing Day</DialogTitle>
      </DialogHeader>
      <form action={handleSubmit}>
        <input type="hidden" name="propertyId" value={property.id} />
        <input type="hidden" name="propertyName" value={property.propertyName} />
        <input type="hidden" name="addressLine1" value={property.addressLine1} />
        <input type="hidden" name="addressLine2" value={property.addressLine2 ?? ""} />
        <input type="hidden" name="city" value={property.city} />
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="billingClosingDay">Day of month (1-31)</Label>
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
          <Button type="submit" className="bg-sky-500 hover:bg-sky-600 text-white">
            Save
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
  property: SettingsPropertyData
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
            <Label htmlFor="monthlyInvoiceAmount">Amount ($)</Label>
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
          <Button type="submit" className="bg-sky-500 hover:bg-sky-600 text-white">
            Save
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

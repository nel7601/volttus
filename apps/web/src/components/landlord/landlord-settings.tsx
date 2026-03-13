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
import { Pencil, UserPlus, Archive, RotateCcw, MapPin, User, Home, Users } from "lucide-react"
import {
  updatePropertyDetails,
  updateCommonAreaSplit,
  updateLandlordProfile,
} from "@/actions/property-settings"
import {
  createTenant,
  updateTenant,
  toggleTenantArchive,
} from "@/actions/tenant-management"

export interface SettingsLandlordData {
  id: string
  fullName: string
  email: string
  companyName: string | null
  phone: string | null
}

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
  landlord: SettingsLandlordData
  properties: SettingsPropertyData[]
  tenants: SettingsTenantData[]
  apartmentGroups: SettingsGroupOption[]
}

const cardClass =
  "shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04] dark:ring-white/[0.06] border-transparent"

export function LandlordSettings({
  landlord,
  properties,
  tenants,
  apartmentGroups,
}: LandlordSettingsProps) {
  const [profileOpen, setProfileOpen] = useState(false)
  const [editPropertyId, setEditPropertyId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editTenant, setEditTenant] = useState<SettingsTenantData | null>(null)

  const editProperty = editPropertyId
    ? properties.find((p) => p.id === editPropertyId) ?? null
    : null

  const activeTenants = tenants.filter((t) => t.isActive)
  const archivedTenants = tenants.filter((t) => !t.isActive)

  return (
    <div className="space-y-8">
      {/* Landlord Profile */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <User className="h-4 w-4 text-sky-500" />
          <h3 className="text-sm font-semibold text-sky-700 dark:text-sky-400 uppercase tracking-wide">
            My Profile
          </h3>
        </div>
        <Card className={`${cardClass} border-l-4 border-l-sky-500`}>
          <CardContent className="py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-sky-600/70 dark:text-sky-400/70 uppercase tracking-wide">
                    Name
                  </p>
                  <p className="text-sm font-semibold">{landlord.fullName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-sky-600/70 dark:text-sky-400/70 uppercase tracking-wide">
                    Email
                  </p>
                  <p className="text-sm">{landlord.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-sky-600/70 dark:text-sky-400/70 uppercase tracking-wide">
                    Company
                  </p>
                  <p className="text-sm">{landlord.companyName || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-sky-600/70 dark:text-sky-400/70 uppercase tracking-wide">
                    Phone
                  </p>
                  <p className="text-sm">{landlord.phone || "—"}</p>
                </div>
              </div>
              <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
                <DialogTrigger
                  render={
                    <Button variant="ghost" size="icon-xs" className="text-sky-500 hover:text-sky-700 shrink-0">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  }
                />
                <EditProfileDialog
                  landlord={landlord}
                  onClose={() => setProfileOpen(false)}
                />
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Properties */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Home className="h-4 w-4 text-emerald-500" />
          <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
            Properties
          </h3>
        </div>
        <div className="space-y-4">
          {properties.map((prop) => (
            <PropertyCard
              key={prop.id}
              property={prop}
              onEdit={() => setEditPropertyId(prop.id)}
            />
          ))}
        </div>
      </div>

      {/* Tenants */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-wide">
              Tenants
            </h3>
          </div>
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
              properties={properties}
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
                onEdit={() => setEditTenant(t)}
              />
            ))}
            {archivedTenants.map((t) => (
              <TenantCard
                key={t.id}
                tenant={t}
                onEdit={() => setEditTenant(t)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit property dialog */}
      <Dialog
        open={editProperty !== null}
        onOpenChange={(open) => {
          if (!open) setEditPropertyId(null)
        }}
      >
        {editProperty && (
          <EditPropertyDialog
            property={editProperty}
            onClose={() => setEditPropertyId(null)}
          />
        )}
      </Dialog>

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

// --- Property Card ---

function PropertyCard({
  property,
  onEdit,
}: {
  property: SettingsPropertyData
  onEdit: () => void
}) {
  async function handleSplitChange(value: string | null) {
    if (!value) return
    await updateCommonAreaSplit(
      property.id,
      value as "EQUAL" | "PROPORTIONAL"
    )
  }

  const address = [property.addressLine1, property.addressLine2, property.city]
    .filter(Boolean)
    .join(", ")

  return (
    <Card className={`${cardClass} border-l-4 border-l-emerald-500`}>
      <CardContent className="py-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="h-4 w-4 text-emerald-500 shrink-0" />
            <p className="font-semibold truncate">{address}</p>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-emerald-500 hover:text-emerald-700 shrink-0"
            onClick={onEdit}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-wide">
              Billing Closing
            </p>
            <p className="text-sm font-semibold">
              {property.billingClosingDay
                ? `Day ${property.billingClosingDay}`
                : "Not set"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-wide">
              Cost Distribution
            </p>
            <Select
              value={property.commonAreaSplit}
              onValueChange={handleSplitChange}
            >
              <SelectTrigger className="h-8 text-xs">
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
  )
}

// --- Tenant Card ---

function TenantCard({
  tenant,
  onEdit,
}: {
  tenant: SettingsTenantData
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
      className={`${cardClass} ${
        tenant.isActive
          ? "border-l-4 border-l-slate-400"
          : "border-l-4 border-l-gray-300 opacity-60"
      }`}
    >
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold truncate">{tenant.fullName}</p>
              {tenant.isActive ? (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-300 text-emerald-600 bg-emerald-50">
                  Active
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-red-300 text-red-600 bg-red-50">
                  Archived
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{tenant.email}</p>
            {tenant.apartmentGroupName && (
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
                {tenant.apartmentGroupName}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-slate-400 hover:text-slate-600"
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

// --- Dialogs ---

function EditProfileDialog({
  landlord,
  onClose,
}: {
  landlord: SettingsLandlordData
  onClose: () => void
}) {
  async function handleSubmit(formData: FormData) {
    await updateLandlordProfile(formData)
    onClose()
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Edit Profile</DialogTitle>
      </DialogHeader>
      <form action={handleSubmit}>
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="lp-fullName">Full Name</Label>
            <Input id="lp-fullName" name="fullName" defaultValue={landlord.fullName} required />
          </div>
          <div>
            <Label htmlFor="lp-email">Email</Label>
            <Input id="lp-email" name="email" type="email" defaultValue={landlord.email} required />
          </div>
          <div>
            <Label htmlFor="lp-company">Company Name</Label>
            <Input id="lp-company" name="companyName" defaultValue={landlord.companyName ?? ""} />
          </div>
          <div>
            <Label htmlFor="lp-phone">Phone</Label>
            <Input id="lp-phone" name="phone" defaultValue={landlord.phone ?? ""} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="bg-sky-500 hover:bg-sky-600 text-white">
            Save
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

function EditPropertyDialog({
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
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Edit Property</DialogTitle>
      </DialogHeader>
      <form action={handleSubmit}>
        <input type="hidden" name="propertyId" value={property.id} />
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="ep-name">Property Name</Label>
            <Input id="ep-name" name="propertyName" defaultValue={property.propertyName} required />
          </div>
          <div>
            <Label htmlFor="ep-addr1">Address Line 1</Label>
            <Input id="ep-addr1" name="addressLine1" defaultValue={property.addressLine1} required />
          </div>
          <div>
            <Label htmlFor="ep-addr2">Address Line 2</Label>
            <Input id="ep-addr2" name="addressLine2" defaultValue={property.addressLine2 ?? ""} />
          </div>
          <div>
            <Label htmlFor="ep-city">City</Label>
            <Input id="ep-city" name="city" defaultValue={property.city} required />
          </div>
          <div>
            <Label htmlFor="ep-closing">Billing Closing Day</Label>
            <Input
              id="ep-closing"
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

function CreateTenantDialog({
  properties,
  apartmentGroups,
  onClose,
}: {
  properties: SettingsPropertyData[]
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
            <Label htmlFor="ct-property">Property</Label>
            <select
              id="ct-property"
              name="propertyId"
              required
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.propertyName}
                </option>
              ))}
            </select>
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

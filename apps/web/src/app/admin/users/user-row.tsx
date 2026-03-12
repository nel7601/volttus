"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TableCell, TableRow } from "@/components/ui/table"
import { updateUser } from "@/actions/users"
import { Pencil, Check, X, Power, PowerOff, KeyRound } from "lucide-react"

interface UserData {
  id: string
  fullName: string
  email: string
  role: string
  isActive: boolean
  companyName: string | null
  phone: string | null
  propertyName: string | null
  apartmentGroupName: string | null
  propertyCount: number
}

interface Property {
  id: string
  propertyName: string
  landlordId: string
  channelGroups: { id: string; groupName: string }[]
}

interface Landlord {
  id: string
  fullName: string
}

const roleBadgeColors: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-800",
  LANDLORD: "bg-blue-100 text-blue-800",
  TENANT: "bg-green-100 text-green-800",
}

export function UserRow({
  user,
  properties,
  landlords,
}: {
  user: UserData
  properties: Property[]
  landlords: Landlord[]
}) {
  const [editing, setEditing] = useState(false)
  const [landlordId, setLandlordId] = useState("")
  const [propertyId, setPropertyId] = useState("")
  const [apartmentGroupId, setApartmentGroupId] = useState("")
  const [showPasswordField, setShowPasswordField] = useState(false)
  const [isActive, setIsActive] = useState(user.isActive)

  const filteredProperties = landlordId
    ? properties.filter((p) => p.landlordId === landlordId)
    : properties

  const selectedLandlord = landlords.find((l) => l.id === landlordId)
  const selectedProperty = filteredProperties.find((p) => p.id === propertyId)
  const groups = selectedProperty
    ? selectedProperty.channelGroups.map((g) => ({
        id: g.id,
        label: g.groupName,
      }))
    : []
  const selectedGroup = groups.find((g) => g.id === apartmentGroupId)

  function handleLandlordChange(value: string | null) {
    setLandlordId(value || "")
    setPropertyId("")
    setApartmentGroupId("")
  }

  function handlePropertyChange(value: string | null) {
    setPropertyId(value || "")
    setApartmentGroupId("")
  }

  function startEditing() {
    setIsActive(user.isActive)
    setShowPasswordField(false)
    setLandlordId("")
    setPropertyId("")
    setApartmentGroupId("")
    setEditing(true)
  }

  function details() {
    if (user.role === "LANDLORD") {
      const parts = []
      if (user.companyName) parts.push(user.companyName)
      if (user.propertyCount > 0)
        parts.push(`${user.propertyCount} properties`)
      return parts.join(" · ") || "—"
    }
    if (user.role === "TENANT") {
      const parts = []
      if (user.propertyName) parts.push(user.propertyName)
      if (user.apartmentGroupName) parts.push(user.apartmentGroupName)
      return parts.join(" · ") || "—"
    }
    return "—"
  }

  if (editing) {
    return (
      <TableRow>
        <TableCell colSpan={6}>
          <form
            action={async (formData) => {
              await updateUser(formData)
              setEditing(false)
            }}
            className="space-y-3"
          >
            <input type="hidden" name="id" value={user.id} />
            <input type="hidden" name="isActive" value={isActive ? "true" : "false"} />

            {/* Row 1: basic fields */}
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">Name</label>
                <Input name="fullName" defaultValue={user.fullName} required />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">Email</label>
                <Input
                  name="email"
                  type="email"
                  defaultValue={user.email}
                  required
                />
              </div>

              {user.role === "LANDLORD" && (
                <>
                  <div className="w-40">
                    <label className="text-xs text-muted-foreground">
                      Company
                    </label>
                    <Input
                      name="companyName"
                      defaultValue={user.companyName || ""}
                    />
                  </div>
                  <div className="w-32">
                    <label className="text-xs text-muted-foreground">
                      Phone
                    </label>
                    <Input name="phone" defaultValue={user.phone || ""} />
                  </div>
                </>
              )}

              {user.role === "TENANT" && (
                <>
                  <div className="w-40">
                    <label className="text-xs text-muted-foreground">
                      Landlord
                    </label>
                    <Select
                      value={landlordId}
                      onValueChange={handleLandlordChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by landlord">
                          {selectedLandlord
                            ? selectedLandlord.fullName
                            : undefined}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {landlords.map((l) => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-44">
                    <label className="text-xs text-muted-foreground">
                      Property
                    </label>
                    <input
                      type="hidden"
                      name="propertyId"
                      value={propertyId}
                    />
                    <Select
                      value={propertyId}
                      onValueChange={handlePropertyChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Property">
                          {selectedProperty
                            ? selectedProperty.propertyName
                            : undefined}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {filteredProperties.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.propertyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-44">
                    <label className="text-xs text-muted-foreground">
                      Apartment
                    </label>
                    <input
                      type="hidden"
                      name="apartmentGroupId"
                      value={apartmentGroupId}
                    />
                    <Select
                      value={apartmentGroupId}
                      onValueChange={(v: string | null) => setApartmentGroupId(v || "")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Apartment">
                          {selectedGroup ? selectedGroup.label : undefined}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {groups.map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>

            {/* Row 2: password + isActive + actions */}
            <div className="flex items-end gap-3">
              {/* Password change */}
              {showPasswordField ? (
                <div className="w-52">
                  <label className="text-xs text-muted-foreground">
                    New Password
                  </label>
                  <Input
                    name="newPassword"
                    type="password"
                    placeholder="Min 6 characters"
                    minLength={6}
                  />
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={() => setShowPasswordField(true)}
                >
                  <KeyRound className="h-3.5 w-3.5 mr-1" />
                  Change Password
                </Button>
              )}

              {/* Active / Inactive toggle */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={`h-9 ${
                  isActive
                    ? "border-green-300 text-green-700 hover:bg-green-50"
                    : "border-red-300 text-red-700 hover:bg-red-50"
                }`}
                onClick={() => setIsActive(!isActive)}
              >
                {isActive ? (
                  <>
                    <Power className="h-3.5 w-3.5 mr-1" />
                    Active
                  </>
                ) : (
                  <>
                    <PowerOff className="h-3.5 w-3.5 mr-1" />
                    Inactive
                  </>
                )}
              </Button>

              <div className="flex-1" />

              {/* Save / Cancel */}
              <Button
                type="submit"
                size="icon"
                variant="ghost"
                className="text-green-600 hover:text-green-700"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => setEditing(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <TableRow className={!user.isActive ? "opacity-50" : ""}>
      <TableCell className="font-medium">{user.fullName}</TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell>
        <Badge className={roleBadgeColors[user.role] || ""}>
          {user.role}
        </Badge>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {details()}
      </TableCell>
      <TableCell>
        <Badge variant={user.isActive ? "default" : "secondary"}>
          {user.isActive ? "Active" : "Inactive"}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={startEditing}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </TableCell>
    </TableRow>
  )
}

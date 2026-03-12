"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { createUser } from "@/actions/users"
import { Plus } from "lucide-react"

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

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  LANDLORD: "Landlord",
  TENANT: "Tenant",
}

export function CreateUserForm({
  properties,
  landlords,
}: {
  properties: Property[]
  landlords: Landlord[]
}) {
  const [role, setRole] = useState("")
  const [landlordId, setLandlordId] = useState("")
  const [propertyId, setPropertyId] = useState("")
  const [apartmentGroupId, setApartmentGroupId] = useState("")

  // Filter properties by selected landlord
  const filteredProperties = landlordId
    ? properties.filter((p) => p.landlordId === landlordId)
    : properties

  const selectedProperty = filteredProperties.find((p) => p.id === propertyId)
  const selectedLandlord = landlords.find((l) => l.id === landlordId)

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          <Plus className="h-4 w-4 inline mr-1" />
          Create User
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={createUser} className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs">Full Name</Label>
            <Input name="fullName" required />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Email</Label>
            <Input name="email" type="email" required />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Password</Label>
            <Input name="password" type="password" required minLength={6} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Role</Label>
            <input type="hidden" name="role" value={role} />
            <Select
              value={role}
              onValueChange={(v: string | null) => {
                setRole(v || "")
                setLandlordId("")
                setPropertyId("")
                setApartmentGroupId("")
              }}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role">
                  {role ? roleLabels[role] : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="LANDLORD">Landlord</SelectItem>
                <SelectItem value="TENANT">Tenant</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {role === "LANDLORD" && (
            <>
              <div className="space-y-1">
                <Label className="text-xs">Company Name</Label>
                <Input name="companyName" placeholder="Optional" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Phone</Label>
                <Input name="phone" placeholder="Optional" />
              </div>
            </>
          )}

          {role === "TENANT" && (
            <>
              {/* Landlord selector */}
              <div className="space-y-1">
                <Label className="text-xs">Landlord</Label>
                <Select
                  value={landlordId}
                  onValueChange={handleLandlordChange}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select landlord">
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

              {/* Property selector (filtered by landlord) */}
              <div className="space-y-1">
                <Label className="text-xs">Property</Label>
                <input type="hidden" name="propertyId" value={propertyId} />
                <Select
                  value={propertyId}
                  onValueChange={handlePropertyChange}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select property">
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

              {/* Apartment group selector (filtered by property) */}
              <div className="space-y-1">
                <Label className="text-xs">Apartment Group</Label>
                <input
                  type="hidden"
                  name="apartmentGroupId"
                  value={apartmentGroupId}
                />
                <Select
                  value={apartmentGroupId}
                  onValueChange={(v: string | null) => setApartmentGroupId(v || "")}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select apartment">
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

          <div className="flex items-end">
            <Button type="submit">Create User</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

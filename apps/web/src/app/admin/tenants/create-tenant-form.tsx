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
import { createTenant } from "@/actions/tenants"
import { Plus } from "lucide-react"

interface Property {
  id: string
  propertyName: string
  channelGroups: { id: string; groupName: string }[]
}

export function CreateTenantForm({
  properties,
}: {
  properties: Property[]
}) {
  const [propertyId, setPropertyId] = useState("")
  const [apartmentGroupId, setApartmentGroupId] = useState("")

  const selectedProperty = properties.find((p) => p.id === propertyId)

  // Build flat list of all apartment groups with property name
  const allGroups = properties.flatMap((p) =>
    p.channelGroups.map((g) => ({
      id: g.id,
      label: `${p.propertyName} - ${g.groupName}`,
    }))
  )
  const selectedGroup = allGroups.find((g) => g.id === apartmentGroupId)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          <Plus className="h-4 w-4 inline mr-1" />
          Create Tenant
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={createTenant} className="grid grid-cols-2 gap-4">
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
            <Label className="text-xs">Property</Label>
            <input type="hidden" name="propertyId" value={propertyId} />
            <Select value={propertyId} onValueChange={setPropertyId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select property">
                  {selectedProperty ? selectedProperty.propertyName : undefined}
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
          <div className="space-y-1">
            <Label className="text-xs">Apartment Group</Label>
            <input type="hidden" name="apartmentGroupId" value={apartmentGroupId} />
            <Select
              value={apartmentGroupId}
              onValueChange={setApartmentGroupId}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select apartment">
                  {selectedGroup ? selectedGroup.label : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {allGroups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button type="submit">Create Tenant</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

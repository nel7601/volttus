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
import { createGroup } from "@/actions/groups"
import { Plus } from "lucide-react"

const typeLabels: Record<string, string> = {
  INCOME: "Income",
  COMMON: "Common",
  APARTMENT: "Apartment",
}

export function CreateGroupForm({ propertyId }: { propertyId: string }) {
  const [groupType, setGroupType] = useState("")
  const [isVirtual, setIsVirtual] = useState(false)

  function handleTypeChange(value: string | null) {
    setGroupType(value || "")
    if (value === "INCOME") setIsVirtual(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Create Group</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={createGroup} className="flex items-end gap-3">
          <input type="hidden" name="propertyId" value={propertyId} />
          <div className="space-y-1 flex-1">
            <Label className="text-xs">Name</Label>
            <Input name="groupName" placeholder="e.g. Apartment 1" required />
          </div>
          <div className="space-y-1 w-40">
            <Label className="text-xs">Type</Label>
            <input type="hidden" name="groupType" value={groupType} />
            <Select value={groupType} onValueChange={handleTypeChange} required>
              <SelectTrigger>
                <SelectValue placeholder="Type">
                  {groupType ? typeLabels[groupType] : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INCOME">Income</SelectItem>
                <SelectItem value="COMMON">Common</SelectItem>
                <SelectItem value="APARTMENT">Apartment</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 w-32">
            <Label className="text-xs">Apt Number</Label>
            <Input name="apartmentNumber" placeholder="e.g. 1" />
          </div>
          <div className="space-y-1 w-20">
            <Label className="text-xs">Order</Label>
            <Input name="displayOrder" type="number" defaultValue="0" />
          </div>
          {(groupType === "COMMON" || groupType === "APARTMENT") && (
            <div className="flex items-center gap-2 pb-1">
              <input type="hidden" name="isVirtual" value={String(isVirtual)} />
              <input
                type="checkbox"
                id="isVirtual"
                checked={isVirtual}
                onChange={(e) => setIsVirtual(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isVirtual" className="text-xs">Virtual</Label>
            </div>
          )}
          <Button type="submit" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

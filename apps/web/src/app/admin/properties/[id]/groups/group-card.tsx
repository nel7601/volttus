"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateGroup, deleteGroup } from "@/actions/groups"
import { Pencil, Trash2, Check, X, AlertTriangle } from "lucide-react"

interface GroupCardProps {
  group: {
    id: string
    groupName: string
    groupType: string
    apartmentNumber: string | null
    displayOrder: number
    channels: { id: string }[]
    tenants: { user: { fullName: string } }[]
    _count: { groupMeasurements: number }
  }
  propertyId: string
  typeColors: Record<string, string>
}

const typeLabels: Record<string, string> = {
  INCOME: "Income",
  COMMON: "Common",
  APARTMENT: "Apartment",
}

export function GroupCard({ group, propertyId, typeColors }: GroupCardProps) {
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [groupType, setGroupType] = useState(group.groupType)

  if (editing) {
    return (
      <Card>
        <CardContent className="py-4">
          <form
            action={async (formData) => {
              await updateGroup(formData)
              setEditing(false)
            }}
            className="flex items-end gap-3"
          >
            <input type="hidden" name="id" value={group.id} />
            <input type="hidden" name="propertyId" value={propertyId} />
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Name</label>
              <Input name="groupName" defaultValue={group.groupName} required />
            </div>
            <div className="w-40">
              <label className="text-xs text-muted-foreground">Type</label>
              <input type="hidden" name="groupType" value={groupType} />
              <Select value={groupType} onValueChange={setGroupType}>
                <SelectTrigger>
                  <SelectValue>
                    {typeLabels[groupType] || groupType}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INCOME">Income</SelectItem>
                  <SelectItem value="COMMON">Common</SelectItem>
                  <SelectItem value="APARTMENT">Apartment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-28">
              <label className="text-xs text-muted-foreground">Apt #</label>
              <Input
                name="apartmentNumber"
                defaultValue={group.apartmentNumber || ""}
                placeholder="e.g. 1"
              />
            </div>
            <div className="w-20">
              <label className="text-xs text-muted-foreground">Order</label>
              <Input
                name="displayOrder"
                type="number"
                defaultValue={group.displayOrder}
              />
            </div>
            <Button type="submit" size="icon" variant="ghost" className="text-green-600 hover:text-green-700">
              <Check className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => setEditing(false)}
              className="text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <Badge className={typeColors[group.groupType] || ""}>
            {group.groupType}
          </Badge>
          <span className="font-medium">{group.groupName}</span>
          {group.apartmentNumber && (
            <span className="text-sm text-muted-foreground">
              (Apt #{group.apartmentNumber})
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{group.channels.length} channels</span>
          {group.tenants.length > 0 && (
            <span>
              Tenant: {group.tenants.map((t) => t.user.fullName).join(", ")}
            </span>
          )}
          <span>Order: {group.displayOrder}</span>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => setEditing(true)}
            className="h-8 w-8"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>

          {deleting ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-md bg-destructive/10 px-2 py-1">
                <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                <span className="text-xs text-destructive font-medium">
                  Delete?
                  {group._count.groupMeasurements > 0 && (
                    <> {group._count.groupMeasurements} measurements will be lost</>
                  )}
                </span>
              </div>
              <form action={deleteGroup}>
                <input type="hidden" name="id" value={group.id} />
                <input type="hidden" name="propertyId" value={propertyId} />
                <Button
                  type="submit"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
              </form>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => setDeleting(false)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setDeleting(true)}
              className="h-8 w-8 text-destructive/60 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

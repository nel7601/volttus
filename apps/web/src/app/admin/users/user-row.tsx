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
import { updateUser, archiveUser } from "@/actions/users"
import { Pencil, Check, X, Archive, RotateCcw } from "lucide-react"

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
  channelGroups: { id: string; groupName: string }[]
}

const roleBadgeColors: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-800",
  LANDLORD: "bg-blue-100 text-blue-800",
  TENANT: "bg-green-100 text-green-800",
}

export function UserRow({
  user,
  properties,
}: {
  user: UserData
  properties: Property[]
}) {
  const [editing, setEditing] = useState(false)
  const [propertyId, setPropertyId] = useState("")
  const [apartmentGroupId, setApartmentGroupId] = useState("")

  const allGroups = properties.flatMap((p) =>
    p.channelGroups.map((g) => ({
      id: g.id,
      label: `${p.propertyName} - ${g.groupName}`,
    }))
  )
  const selectedProperty = properties.find((p) => p.id === propertyId)
  const selectedGroup = allGroups.find((g) => g.id === apartmentGroupId)

  function details() {
    if (user.role === "LANDLORD") {
      const parts = []
      if (user.companyName) parts.push(user.companyName)
      if (user.propertyCount > 0) parts.push(`${user.propertyCount} properties`)
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
            className="flex items-end gap-3"
          >
            <input type="hidden" name="id" value={user.id} />
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
                  <label className="text-xs text-muted-foreground">Phone</label>
                  <Input name="phone" defaultValue={user.phone || ""} />
                </div>
              </>
            )}
            {user.role === "TENANT" && (
              <>
                <div className="w-44">
                  <label className="text-xs text-muted-foreground">
                    Property
                  </label>
                  <input type="hidden" name="propertyId" value={propertyId} />
                  <Select value={propertyId} onValueChange={setPropertyId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Property">
                        {selectedProperty
                          ? selectedProperty.propertyName
                          : undefined}
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
                <div className="w-52">
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
                    onValueChange={setApartmentGroupId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Apartment">
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
              </>
            )}
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
          {user.isActive ? "Active" : "Archived"}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => setEditing(true)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <form action={archiveUser}>
            <input type="hidden" name="id" value={user.id} />
            <Button
              type="submit"
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              title={user.isActive ? "Archive" : "Reactivate"}
            >
              {user.isActive ? (
                <Archive className="h-3.5 w-3.5" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5" />
              )}
            </Button>
          </form>
        </div>
      </TableCell>
    </TableRow>
  )
}

"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { UserRow } from "./user-row"
import { Search, Group } from "lucide-react"

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

const roles = ["ALL", "ADMIN", "LANDLORD", "TENANT"] as const
const statuses = ["ALL", "ACTIVE", "ARCHIVED"] as const

const roleBadgeColors: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-800",
  LANDLORD: "bg-blue-100 text-blue-800",
  TENANT: "bg-green-100 text-green-800",
}

export function UserTable({
  users,
  properties,
  landlords,
}: {
  users: UserData[]
  properties: Property[]
  landlords: Landlord[]
}) {
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("ALL")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [grouped, setGrouped] = useState(false)

  const filtered = users.filter((u) => {
    if (roleFilter !== "ALL" && u.role !== roleFilter) return false
    if (statusFilter === "ACTIVE" && !u.isActive) return false
    if (statusFilter === "ARCHIVED" && u.isActive) return false
    if (search) {
      const q = search.toLowerCase()
      if (
        !u.fullName.toLowerCase().includes(q) &&
        !u.email.toLowerCase().includes(q)
      )
        return false
    }
    return true
  })

  const tableHeader = (
    <TableHeader>
      <TableRow>
        <TableHead>Name</TableHead>
        <TableHead>Email</TableHead>
        <TableHead>Role</TableHead>
        <TableHead>Details</TableHead>
        <TableHead>Status</TableHead>
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>All Users</CardTitle>
          <Badge variant="outline">{filtered.length} users</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-1">
            {roles.map((r) => (
              <Button
                key={r}
                size="sm"
                variant={roleFilter === r ? "default" : "outline"}
                onClick={() => setRoleFilter(r)}
                className="text-xs h-8"
              >
                {r === "ALL" ? "All Roles" : r.charAt(0) + r.slice(1).toLowerCase()}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            {statuses.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={statusFilter === s ? "default" : "outline"}
                onClick={() => setStatusFilter(s)}
                className="text-xs h-8"
              >
                {s === "ALL" ? "All Status" : s.charAt(0) + s.slice(1).toLowerCase()}
              </Button>
            ))}
          </div>

          <Button
            size="sm"
            variant={grouped ? "default" : "outline"}
            onClick={() => setGrouped(!grouped)}
            className="text-xs h-8"
          >
            <Group className="h-3.5 w-3.5 mr-1" />
            Group by Role
          </Button>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No users match the current filters.
          </p>
        ) : grouped ? (
          <Table>
            {tableHeader}
            <TableBody>
              {(["ADMIN", "LANDLORD", "TENANT"] as const).map((role) => {
                const roleUsers = filtered.filter((u) => u.role === role)
                if (roleUsers.length === 0) return null
                return (
                  <>
                    <TableRow key={`header-${role}`} className="bg-muted/50 hover:bg-muted/50">
                      <TableCell colSpan={6} className="py-2">
                        <div className="flex items-center gap-2">
                          <Badge className={roleBadgeColors[role]}>{role}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {roleUsers.length} user{roleUsers.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                    {roleUsers.map((u) => (
                      <UserRow
                        key={u.id}
                        user={u}
                        properties={properties}
                        landlords={landlords}
                      />
                    ))}
                  </>
                )
              })}
            </TableBody>
          </Table>
        ) : (
          <Table>
            {tableHeader}
            <TableBody>
              {filtered.map((u) => (
                <UserRow key={u.id} user={u} properties={properties} landlords={landlords} />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

"use client"

import { useState } from "react"
import Link from "next/link"
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
import { Search, Plus, Pencil } from "lucide-react"

interface PropertyData {
  id: string
  propertyName: string
  addressLine1: string
  addressLine2: string | null
  city: string
  country: string
  isActive: boolean
  landlordName: string
  landlordId: string
}

const statuses = ["ALL", "ACTIVE", "INACTIVE"] as const

export function PropertiesTable({ properties }: { properties: PropertyData[] }) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")

  const filtered = properties.filter((p) => {
    if (statusFilter === "ACTIVE" && !p.isActive) return false
    if (statusFilter === "INACTIVE" && p.isActive) return false
    if (search) {
      const q = search.toLowerCase()
      const address = [p.addressLine1, p.addressLine2, p.city]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      if (
        !address.includes(q) &&
        !p.propertyName.toLowerCase().includes(q) &&
        !p.landlordName.toLowerCase().includes(q)
      )
        return false
    }
    return true
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Properties</h1>
        <Link href="/admin/properties/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Property
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Properties</CardTitle>
            <Badge variant="outline">{filtered.length} properties</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search address, name or landlord..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
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
                  {s === "ALL"
                    ? "All Status"
                    : s.charAt(0) + s.slice(1).toLowerCase()}
                </Button>
              ))}
            </div>

          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No properties match the current filters.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Address</TableHead>
                  <TableHead>Landlord</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => {
                  const address = [p.addressLine1, p.addressLine2, p.city]
                    .filter(Boolean)
                    .join(", ")

                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{p.propertyName}</p>
                          <p className="text-sm text-muted-foreground">
                            {address}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{p.landlordName}</TableCell>
                      <TableCell>
                        <Badge
                          variant={p.isActive ? "default" : "secondary"}
                          className={
                            p.isActive
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-100"
                          }
                        >
                          {p.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/properties/${p.id}`}>
                          <Button variant="ghost" size="sm">
                            <Pencil className="h-3.5 w-3.5 mr-1" />
                            Edit
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

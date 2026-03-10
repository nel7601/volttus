"use client"

import { useState } from "react"
import { bulkUpdateChannelMappings } from "@/actions/channels"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface Channel {
  id: string
  channelNumber: number
  rawName: string | null
  displayName: string
  assignedGroupId: string | null
  isMainChannel: boolean
  isEnabled: boolean
  deviceName: string
}

interface Group {
  id: string
  groupName: string
  groupType: string
}

export function ChannelMappingTable({
  propertyId,
  channels,
  groups,
}: {
  propertyId: string
  channels: Channel[]
  groups: Group[]
}) {
  const [mappings, setMappings] = useState(
    channels.map((ch) => ({
      channelId: ch.id,
      displayName: ch.displayName,
      assignedGroupId: ch.assignedGroupId,
      isEnabled: ch.isEnabled,
    }))
  )
  const [saving, setSaving] = useState(false)

  function updateMapping(index: number, field: string, value: string | boolean | null) {
    setMappings((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  async function handleSave() {
    setSaving(true)
    try {
      await bulkUpdateChannelMappings(propertyId, mappings)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Channels</CardTitle>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Mapping"}
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Raw Name</TableHead>
              <TableHead>Display Name</TableHead>
              <TableHead>Assigned Group</TableHead>
              <TableHead className="w-20">Enabled</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {channels.map((ch, i) => (
              <TableRow key={ch.id}>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {ch.channelNumber}
                    {ch.isMainChannel && (
                      <Badge variant="secondary" className="text-xs">
                        Main
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {ch.rawName || "-"}
                </TableCell>
                <TableCell>
                  <Input
                    value={mappings[i].displayName}
                    onChange={(e) =>
                      updateMapping(i, "displayName", e.target.value)
                    }
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={mappings[i].assignedGroupId || "none"}
                    onValueChange={(v) =>
                      updateMapping(
                        i,
                        "assignedGroupId",
                        v === "none" ? null : v
                      )
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {groups.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.groupName} ({g.groupType})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={mappings[i].isEnabled}
                    onChange={(e) =>
                      updateMapping(i, "isEnabled", e.target.checked)
                    }
                    className="h-4 w-4"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

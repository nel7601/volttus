"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createEmporiaAccount, deleteEmporiaAccount } from "@/actions/emporia-accounts"

const DEVICE_TYPES = [
  { value: "EMPORIA", label: "Emporia Vue" },
  { value: "REFOSS", label: "Refoss" },
  { value: "WALLFRONT", label: "Wallfront" },
] as const

interface EmporiaAccountData {
  id: string
  accountEmail: string
  status: string
}

interface DeviceData {
  id: string
  deviceName: string
  emporiaDeviceGid: number
  channelCount: number
  serialNumber: string | null
  lastSuccessfulSyncAt: string | null
}

export function DeviceCard({
  propertyId,
  emporiaAccount,
  devices,
}: {
  propertyId: string
  emporiaAccount: EmporiaAccountData | null
  devices: DeviceData[]
}) {
  const router = useRouter()
  const [deviceType, setDeviceType] = useState<string>(
    emporiaAccount ? "EMPORIA" : ""
  )
  const [isEditing, setIsEditing] = useState(false)

  const isConnected = !!emporiaAccount
  const showForm = deviceType && (!isConnected || isEditing)

  async function handleConnect(formData: FormData) {
    await createEmporiaAccount(formData)
    setIsEditing(false)
    router.refresh()
  }

  async function handleDisconnect() {
    if (!emporiaAccount) return
    await deleteEmporiaAccount(emporiaAccount.id)
    setDeviceType("")
    setIsEditing(false)
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Device</CardTitle>
          {isConnected && !isEditing && (
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                {DEVICE_TYPES.find((d) => d.value === deviceType)?.label ?? deviceType}
              </Badge>
              <Badge>{emporiaAccount.status}</Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Device type selector */}
        {(!isConnected || isEditing) && (
          <div className="space-y-1">
            <Label htmlFor="deviceType">Device Type</Label>
            <select
              id="deviceType"
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Select a device type...</option>
              {DEVICE_TYPES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Connected state: show account info + devices */}
        {isConnected && !isEditing && (
          <>
            <div className="flex items-center justify-between">
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Email:</span>{" "}
                  {emporiaAccount.accountEmail}
                </p>
                <span className="text-xs text-muted-foreground">
                  {devices.length} device{devices.length !== 1 ? "s" : ""} connected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDisconnect}
                >
                  Disconnect
                </Button>
              </div>
            </div>

            {/* Device list */}
            {devices.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                {devices.map((device) => (
                  <div
                    key={device.id}
                    className="flex items-center justify-between p-3 rounded border"
                  >
                    <div>
                      <p className="font-medium text-sm">{device.deviceName}</p>
                      <p className="text-xs text-muted-foreground">
                        GID: {device.emporiaDeviceGid} | {device.channelCount} channels |{" "}
                        Serial: {device.serialNumber ?? "N/A"}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground text-right">
                      {device.lastSuccessfulSyncAt
                        ? `Last sync: ${new Date(device.lastSuccessfulSyncAt).toLocaleString()}`
                        : "Never synced"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Connection form per device type */}
        {showForm && deviceType === "EMPORIA" && (
          <form action={handleConnect} className="space-y-4">
            <input type="hidden" name="propertyId" value={propertyId} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Emporia Email</Label>
                <Input
                  name="accountEmail"
                  type="email"
                  defaultValue={isEditing ? emporiaAccount?.accountEmail : ""}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Emporia Password</Label>
                <Input name="password" type="password" required />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit" size="sm">
                {isEditing ? "Update" : "Connect"}
              </Button>
              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        )}

        {showForm && deviceType === "REFOSS" && (
          <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            Refoss integration coming soon.
          </div>
        )}

        {showForm && deviceType === "WALLFRONT" && (
          <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            Wallfront integration coming soon.
          </div>
        )}

        {/* Empty state */}
        {!isConnected && !deviceType && (
          <p className="text-sm text-muted-foreground">
            Select a device type to connect a measurement device to this property.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

"use client"

import { createProperty } from "@/actions/properties"
import { createEmporiaAccount } from "@/actions/emporia-accounts"
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
import { useRouter } from "next/navigation"
import { useState } from "react"

interface Landlord {
  id: string
  user: { fullName: string; email: string }
}

export function PropertyForm({ landlords }: { landlords: Landlord[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    try {
      await createProperty(formData)
      router.push("/admin/properties")
    } catch (e) {
      console.error(e)
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Property Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="landlordId">Landlord</Label>
            <Select name="landlordId" required>
              <SelectTrigger>
                <SelectValue placeholder="Select a landlord" />
              </SelectTrigger>
              <SelectContent>
                {landlords.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.user.fullName} ({l.user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="propertyName">Property Name</Label>
            <Input id="propertyName" name="propertyName" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="addressLine1">Address</Label>
              <Input id="addressLine1" name="addressLine1" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" required />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" name="country" defaultValue="HR" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="provinceState">Province/State</Label>
              <Input id="provinceState" name="provinceState" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input id="postalCode" name="postalCode" />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Property"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

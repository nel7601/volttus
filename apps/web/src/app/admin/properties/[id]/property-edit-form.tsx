"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateProperty } from "@/actions/properties"

interface Landlord {
  id: string
  fullName: string
  email: string
}

interface PropertyFormData {
  id: string
  propertyName: string
  addressLine1: string
  addressLine2: string | null
  city: string
  provinceState: string | null
  postalCode: string | null
  country: string
  timezone: string
  billingClosingDay: number | null
  isActive: boolean
  landlordId: string
}

export function PropertyEditForm({
  property,
  landlords,
}: {
  property: PropertyFormData
  landlords: Landlord[]
}) {
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    await updateProperty(formData)
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Property Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="propertyId" value={property.id} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="propertyName">Property Name</Label>
              <Input
                id="propertyName"
                name="propertyName"
                defaultValue={property.propertyName}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="landlordId">Landlord</Label>
              <select
                id="landlordId"
                name="landlordId"
                defaultValue={property.landlordId}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {landlords.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.fullName} ({l.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="addressLine1">Address Line 1</Label>
              <Input
                id="addressLine1"
                name="addressLine1"
                defaultValue={property.addressLine1}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="addressLine2">Address Line 2</Label>
              <Input
                id="addressLine2"
                name="addressLine2"
                defaultValue={property.addressLine2 ?? ""}
                placeholder="Apt, suite, etc. (optional)"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                name="city"
                defaultValue={property.city}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="provinceState">Province / State</Label>
              <Input
                id="provinceState"
                name="provinceState"
                defaultValue={property.provinceState ?? ""}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input
                id="postalCode"
                name="postalCode"
                defaultValue={property.postalCode ?? ""}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                name="country"
                defaultValue={property.country}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                name="timezone"
                defaultValue={property.timezone}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="billingClosingDay">
                Billing Closing Day (1-31)
              </Label>
              <Input
                id="billingClosingDay"
                name="billingClosingDay"
                type="number"
                min={1}
                max={31}
                defaultValue={property.billingClosingDay ?? ""}
                placeholder="e.g. 15"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="isActive">Status</Label>
              <select
                id="isActive"
                name="isActive"
                defaultValue={String(property.isActive)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

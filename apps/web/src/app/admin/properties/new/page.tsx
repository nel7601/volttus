import { prisma } from "@/lib/prisma"
import { createProperty } from "@/actions/properties"
import { createLandlord } from "@/actions/landlords"
import { createEmporiaAccount } from "@/actions/emporia-accounts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { PropertyForm } from "./property-form"

export const dynamic = "force-dynamic"
export default async function NewPropertyPage() {
  const landlords = await prisma.landlord.findMany({
    include: { user: true },
  })

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/properties" className="text-muted-foreground hover:text-foreground">
          &larr; Properties
        </Link>
        <h1 className="text-2xl font-bold">New Property</h1>
      </div>

      {landlords.length === 0 ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create a Landlord First</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                You need at least one landlord before creating a property.
              </p>
              <form action={createLandlord} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" name="fullName" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input id="companyName" name="companyName" />
                  </div>
                </div>
                <Button type="submit">Create Landlord</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : (
        <PropertyForm landlords={landlords} />
      )}
    </div>
  )
}

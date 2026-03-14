import { prisma } from "@/lib/prisma"
import { PropertiesTable } from "./properties-table"

export const dynamic = "force-dynamic"
export default async function PropertiesPage() {
  const properties = await prisma.property.findMany({
    include: {
      landlord: { select: { id: true, fullName: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const data = properties.map((p) => ({
    id: p.id,
    propertyName: p.propertyName,
    addressLine1: p.addressLine1,
    addressLine2: p.addressLine2,
    city: p.city,
    country: p.country,
    isActive: p.isActive,
    invoiceMode: p.invoiceMode,
    landlordName: p.landlord.fullName,
    landlordId: p.landlord.id,
  }))

  return <PropertiesTable properties={data} />
}

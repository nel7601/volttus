import { PortalHeader } from "@/components/layout/portal-header"

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-muted/30">
      <PortalHeader title="Volttus" subtitle="My Apartment" />
      <main className="p-6 max-w-4xl mx-auto">{children}</main>
    </div>
  )
}

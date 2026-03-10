import { PortalHeader } from "@/components/layout/portal-header"

export default function LandlordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-muted/30">
      <PortalHeader title="Volttus" subtitle="Landlord Portal" />
      <main className="p-6 max-w-6xl mx-auto">{children}</main>
    </div>
  )
}

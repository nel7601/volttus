"use client"

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Zap, LogOut } from "lucide-react"

export function PortalHeader({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
  return (
    <header className="flex items-center justify-between border-b px-6 py-3">
      <div className="flex items-center gap-3">
        <Zap className="h-5 w-5 text-orange-500" />
        <div>
          <h1 className="font-semibold">{title}</h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        <LogOut className="h-4 w-4 mr-1" />
        Sign Out
      </Button>
    </header>
  )
}

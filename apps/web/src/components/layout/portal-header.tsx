"use client"

import { logoutAction } from "@/actions/auth"
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
    <header className="flex items-center justify-between border-b bg-gradient-to-r from-orange-500/5 via-transparent to-amber-500/5 px-6 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
          <Zap className="h-4 w-4 text-orange-500" />
        </div>
        <div>
          <h1 className="font-semibold">{title}</h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      <form action={logoutAction}>
        <Button variant="ghost" size="sm" type="submit">
          <LogOut className="h-4 w-4 mr-1" />
          Sign Out
        </Button>
      </form>
    </header>
  )
}

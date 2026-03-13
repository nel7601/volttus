"use client"

import Link from "next/link"
import { logoutAction } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { Zap, LogOut, Settings } from "lucide-react"

export function PortalHeader({
  title,
  subtitle,
  settingsHref,
}: {
  title: string
  subtitle?: string
  settingsHref?: string
}) {
  return (
    <header className="flex items-center justify-between border-b bg-gradient-to-r from-sky-500/8 via-transparent to-cyan-500/8 px-6 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10">
          <Zap className="h-4 w-4 text-sky-500" />
        </div>
        <div>
          <h1 className="font-semibold">{title}</h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {settingsHref && (
          <Link href={settingsHref}>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4 mr-1" />
              Settings
            </Button>
          </Link>
        )}
        <form action={logoutAction}>
          <Button variant="ghost" size="sm" type="submit">
            <LogOut className="h-4 w-4 mr-1" />
            Sign Out
          </Button>
        </form>
      </div>
    </header>
  )
}

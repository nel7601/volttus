import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

const roleRoutes: Record<string, string[]> = {
  "/admin": ["ADMIN"],
  "/landlord": ["ADMIN", "LANDLORD"],
  "/tenant": ["ADMIN", "TENANT"],
}

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET })
  const path = req.nextUrl.pathname
  const isLoggedIn = !!token

  // Public routes
  if (path === "/login" || path.startsWith("/api/auth") || path === "/api/debug-auth") {
    if (isLoggedIn && path === "/login") {
      const role = token.role as string
      if (role === "ADMIN") return NextResponse.redirect(new URL("/admin", req.url))
      if (role === "LANDLORD") return NextResponse.redirect(new URL("/landlord", req.url))
      if (role === "TENANT") return NextResponse.redirect(new URL("/tenant", req.url))
    }
    return NextResponse.next()
  }

  // Protected routes - require login
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  const role = token.role as string

  // Role-based access
  for (const [prefix, allowedRoles] of Object.entries(roleRoutes)) {
    if (path.startsWith(prefix) && !allowedRoles.includes(role)) {
      if (role === "ADMIN") return NextResponse.redirect(new URL("/admin", req.url))
      if (role === "LANDLORD") return NextResponse.redirect(new URL("/landlord", req.url))
      if (role === "TENANT") return NextResponse.redirect(new URL("/tenant", req.url))
      return NextResponse.redirect(new URL("/login", req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}

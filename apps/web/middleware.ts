import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

const SESSION_COOKIE = "volttus-session"
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "fallback-secret-change-me"
)

const roleRoutes: Record<string, string[]> = {
  "/admin": ["ADMIN"],
  "/landlord": ["ADMIN", "LANDLORD"],
  "/tenant": ["ADMIN", "TENANT"],
}

async function getSessionFromRequest(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret)
    return { role: payload.role as string, id: payload.id as string }
  } catch {
    return null
  }
}

export async function middleware(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  const path = req.nextUrl.pathname
  const isLoggedIn = !!session

  // Public routes
  if (path === "/login" || path.startsWith("/api/auth") || path === "/api/debug-auth") {
    if (isLoggedIn && path === "/login") {
      const role = session.role
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

  const role = session.role

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

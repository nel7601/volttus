import { NextResponse } from "next/server"

// TODO: Re-enable auth middleware once login is fixed
export function middleware() {
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}

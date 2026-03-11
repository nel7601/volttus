import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function Home() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  if (session.role === "ADMIN") redirect("/admin")
  if (session.role === "LANDLORD") redirect("/landlord")
  if (session.role === "TENANT") redirect("/tenant")

  redirect("/login")
}

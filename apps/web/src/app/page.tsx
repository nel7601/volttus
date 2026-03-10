import { auth } from "@/auth"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"
export default async function Home() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const role = session.user.role
  if (role === "ADMIN") redirect("/admin")
  if (role === "LANDLORD") redirect("/landlord")
  if (role === "TENANT") redirect("/tenant")

  redirect("/login")
}

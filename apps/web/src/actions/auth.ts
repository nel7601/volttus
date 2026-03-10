"use server"

import { signIn } from "@/auth"
import { AuthError } from "next-auth"
import { isRedirectError } from "next/dist/client/components/redirect-error"

export async function loginAction(formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirectTo: "/",
    })
  } catch (error) {
    if (isRedirectError(error)) {
      throw error
    }
    if (error instanceof AuthError) {
      return { error: "Invalid email or password" }
    }
    throw error
  }
}

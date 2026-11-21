import type { Metadata } from "next"
import { AuthForm } from "@/components/auth/AuthForm"

export const metadata: Metadata = { title: "Iniciar sesión · Nexxus" }

export default function LoginPage() {
  return <AuthForm mode="login" />
}

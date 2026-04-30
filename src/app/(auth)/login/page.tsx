import Link from "next/link"
import { LogIn } from "lucide-react"
import { login } from "@/actions/auth"
import { NexxusLogo } from "@/components/shared/NexxusLogo"

export default function LoginPage() {
  return (
    <section className="surface" style={{ width: "min(430px, 100%)", padding: 28 }}>
      <div style={{ display: "grid", justifyItems: "center", gap: 16, marginBottom: 24 }}>
        <NexxusLogo />
        <p style={{ margin: 0, color: "var(--text-secondary)", textAlign: "center" }}>Accede a tu inventario y finanzas.</p>
      </div>
      <form action={login} style={{ display: "grid", gap: 14 }}>
        <label style={{ display: "grid", gap: 7, color: "var(--text-secondary)", fontSize: 13 }}>
          Email
          <input className="input" type="email" name="email" autoComplete="email" required />
        </label>
        <label style={{ display: "grid", gap: 7, color: "var(--text-secondary)", fontSize: 13 }}>
          Contrasena
          <input className="input" type="password" name="password" autoComplete="current-password" required />
        </label>
        <button className="button button-primary" type="submit">
          <LogIn size={17} aria-hidden="true" />
          Entrar
        </button>
      </form>
      <p style={{ margin: "18px 0 0", color: "var(--text-secondary)", textAlign: "center", fontSize: 14 }}>
        No tienes cuenta? <Link href="/register" style={{ color: "var(--accent-gold)" }}>Registrate</Link>
      </p>
    </section>
  )
}

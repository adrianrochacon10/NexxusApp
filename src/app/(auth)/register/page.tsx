import Link from "next/link"
import { UserPlus } from "lucide-react"
import { register } from "@/actions/auth"
import { NexxusLogo } from "@/components/shared/NexxusLogo"

export default function RegisterPage() {
  return (
    <section className="surface" style={{ width: "min(460px, 100%)", padding: 28 }}>
      <div style={{ display: "grid", justifyItems: "center", gap: 16, marginBottom: 24 }}>
        <NexxusLogo />
        <p style={{ margin: 0, color: "var(--text-secondary)", textAlign: "center" }}>Crea tu cuenta para empezar a operar.</p>
      </div>
      <form action={register} style={{ display: "grid", gap: 14 }}>
        <label style={{ display: "grid", gap: 7, color: "var(--text-secondary)", fontSize: 13 }}>
          Nombre
          <input className="input" name="nombre" autoComplete="name" required />
        </label>
        <label style={{ display: "grid", gap: 7, color: "var(--text-secondary)", fontSize: 13 }}>
          Email
          <input className="input" type="email" name="email" autoComplete="email" required />
        </label>
        <label style={{ display: "grid", gap: 7, color: "var(--text-secondary)", fontSize: 13 }}>
          Contrasena
          <input className="input" type="password" name="password" autoComplete="new-password" required />
        </label>
        <button className="button button-primary" type="submit">
          <UserPlus size={17} aria-hidden="true" />
          Crear cuenta
        </button>
      </form>
      <p style={{ margin: "18px 0 0", color: "var(--text-secondary)", textAlign: "center", fontSize: 14 }}>
        Ya tienes cuenta? <Link href="/login" style={{ color: "var(--accent-gold)" }}>Inicia sesion</Link>
      </p>
    </section>
  )
}

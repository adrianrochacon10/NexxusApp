"use client"

import { useState } from "react"
import { Eye, EyeOff, LogIn } from "lucide-react"
import { NexxusLogo } from "@/components/shared/NexxusLogo"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState("")

  async function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault()
    setError("")
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    setLoading(false)
    window.location.href = "/dashboard"
  }

  return (
    <section className="surface" style={{ width: "min(460px, 100%)", padding: "36px 32px" }}>

      <div style={{ display: "grid", justifyItems: "center", gap: 12, marginBottom: 32 }}>
        <NexxusLogo />
        <p style={{ margin: 0, color: "var(--text-secondary)", textAlign: "center", fontSize: 14 }}>
          Accede a tu cuenta para continuar.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            marginBottom: 20,
            padding: "12px 14px",
            borderRadius: 6,
            border: "1px solid rgba(155,74,74,0.4)",
            background: "rgba(155,74,74,0.1)",
            color: "var(--error)",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>

        <label style={{ display: "grid", gap: 7, color: "var(--text-secondary)", fontSize: 13, fontWeight: 500 }}>
          Correo electrónico
          <input
            className="input"
            type="email"
            name="email"
            placeholder="tu@empresa.com"
            autoComplete="email"
            autoFocus
            required
          />
        </label>

        <label style={{ display: "grid", gap: 7 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>Contraseña</span>
            <button
              type="button"
              style={{ background: "none", border: "none", fontSize: 12, color: "var(--accent-gold)", cursor: "pointer", padding: 0 }}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          <div style={{ position: "relative" }}>
            <input
              className="input"
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              style={{ paddingRight: 44 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer",
                display: "flex", alignItems: "center",
              }}
            >
              {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
            </button>
          </div>
        </label>

        <button
          className="button button-primary"
          type="submit"
          disabled={loading}
          style={{ marginTop: 4, minHeight: 48, fontSize: 15 }}
        >
          {loading ? "Verificando…" : (
            <>
              <LogIn size={17} aria-hidden="true" />
              Iniciar sesión
            </>
          )}
        </button>

      </form>
    </section>
  )
}

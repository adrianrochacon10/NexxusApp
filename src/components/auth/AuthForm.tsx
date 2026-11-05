"use client"

import Link from "next/link"
import { useActionState, useRef, useState, type FormEvent } from "react"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { login, register } from "@/actions/auth"
import { FieldError } from "@/components/auth/FieldError"

type Mode = "login" | "register"
type FormState = { error: string | null; confirmarCorreo: boolean }
type Campo = "nombre" | "negocio" | "email" | "password"
type Errors = Partial<Record<Campo, string>>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
// UX: el diseño pide 8; el servidor (zod) sigue siendo la validación autoritativa.
const MIN_PASSWORD = 8

const COPY = {
  login: {
    heading: "Bienvenido de vuelta",
    sub: "Entra para ver las ventas de hoy.",
    cta: "Iniciar sesión",
    pending: "Entrando…",
    errorTitle: "No pudimos iniciar sesión",
  },
  register: {
    heading: "Crea tu cuenta",
    sub: "Empieza a usar Nexxus con tu equipo.",
    cta: "Crear cuenta",
    pending: "Creando cuenta…",
    errorTitle: "No pudimos crear tu cuenta",
  },
} as const

// Si la acción no responde (red caída), mensaje genérico. Los demás mensajes
// vienen del servidor y ya son seguros (no revelan si el correo existe).
const GENERIC_ERROR: Record<Mode, string> = {
  login: "No pudimos conectar. Revisa tu conexión e inténtalo de nuevo.",
  register: "No pudimos conectar. Revisa tu conexión e inténtalo de nuevo.",
}

function validate(mode: Mode, values: Record<Campo, string>): Errors {
  const errors: Errors = {}
  if (mode === "register" && values.nombre.trim().length < 2) errors.nombre = "Escribe tu nombre."
  if (mode === "register" && values.negocio.trim().length < 2) errors.negocio = "Escribe el nombre de tu negocio."
  const email = values.email.trim()
  if (!email) errors.email = "Escribe tu correo."
  else if (!EMAIL_RE.test(email)) errors.email = "Escribe un correo válido, por ejemplo tu@correo.com."
  if (!values.password) errors.password = "Escribe tu contraseña."
  else if (mode === "register" && values.password.length < MIN_PASSWORD)
    errors.password = `La contraseña necesita al menos ${MIN_PASSWORD} caracteres.`
  return errors
}

export function AuthForm({ mode }: { mode: Mode }) {
  const copy = COPY[mode]
  const isRegister = mode === "register"

  const [nombre, setNombre] = useState("")
  const [negocio, setNegocio] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [tried, setTried] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  // En éxito la acción redirige; si regresa, trae el error o el aviso de confirmación.
  const [state, formAction, pending] = useActionState<FormState, FormData>(async (_prev, formData) => {
    const result = await (isRegister ? register(formData) : login(formData)).catch(() => null)
    if (!result) return { error: GENERIC_ERROR[mode], confirmarCorreo: false }
    if (!result.ok) return { error: result.error, confirmarCorreo: false }
    const confirmar = typeof result.data === "object" && result.data !== null && "confirmarCorreo" in result.data && result.data.confirmarCorreo
    return { error: null, confirmarCorreo: Boolean(confirmar) }
  }, { error: null, confirmarCorreo: false })

  const valores = { nombre, negocio, email, password }
  const errors = tried ? validate(mode, valores) : {}
  const showServerError = Boolean(state.error) && !dismissed && !pending

  function edit(setter: (v: string) => void) {
    return (e: { target: { value: string } }) => {
      setter(e.target.value)
      setDismissed(true)
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    setTried(true)
    const found = validate(mode, valores)
    const first = (["nombre", "negocio", "email", "password"] as const).find((k) => found[k])
    if (first) {
      e.preventDefault()
      formRef.current?.querySelector<HTMLInputElement>(`[name="${first}"]`)?.focus()
      return
    }
    setDismissed(false)
  }

  const passwordRuleOk = password.length >= MIN_PASSWORD

  return (
    <>
      <div>
        <h1 className="t-h1">{copy.heading}</h1>
        <p className="auth-sub">{copy.sub}</p>
      </div>

      <nav className="nx-seg auth-seg" aria-label="Acceso">
        <Link href="/login" aria-current={mode === "login" ? "page" : undefined} replace>
          Iniciar sesión
        </Link>
        <Link href="/register" aria-current={mode === "register" ? "page" : undefined} replace>
          Crear cuenta
        </Link>
      </nav>

      {state.confirmarCorreo && !pending && (
        <div className="nx-alert is-info auth-alert" role="status">
          <div>
            <div className="ttl">Revisa tu correo</div>
            <div className="txt">Te enviamos un enlace para confirmar tu cuenta. Al entrar por primera vez terminarás de crear tu negocio.</div>
          </div>
        </div>
      )}

      {showServerError && (
        <div className="nx-alert is-bad auth-alert" role="alert">
          <div className="ttl">{copy.errorTitle}</div>
          <div className="txt">{state.error}</div>
        </div>
      )}

      <form ref={formRef} action={formAction} onSubmit={handleSubmit} noValidate className="auth-form">
        <div className="auth-fields">
          {isRegister && (
            <div className="nx-field">
              <label className="nx-label" htmlFor="auth-nombre">
                Tu nombre<i aria-hidden="true">*</i>
              </label>
              <input
                id="auth-nombre"
                name="nombre"
                className={`nx-input${errors.nombre ? " is-error" : ""}`}
                autoComplete="name"
                placeholder="Nombre y apellido"
                required
                value={nombre}
                onChange={edit(setNombre)}
                aria-invalid={errors.nombre ? true : undefined}
                aria-describedby={errors.nombre ? "auth-nombre-error" : undefined}
              />
              <FieldError id="auth-nombre-error" message={errors.nombre} />
            </div>
          )}

          {isRegister && (
            <div className="nx-field">
              <label className="nx-label" htmlFor="auth-negocio">
                Nombre de tu negocio<i aria-hidden="true">*</i>
              </label>
              <input
                id="auth-negocio"
                name="negocio"
                className={`nx-input${errors.negocio ? " is-error" : ""}`}
                autoComplete="organization"
                placeholder="Ej. Boutique Aurora"
                required
                value={negocio}
                onChange={edit(setNegocio)}
                aria-invalid={errors.negocio ? true : undefined}
                aria-describedby={errors.negocio ? "auth-negocio-error" : undefined}
              />
              <FieldError id="auth-negocio-error" message={errors.negocio} />
            </div>
          )}

          <div className="nx-field">
            <label className="nx-label" htmlFor="auth-email">
              Correo electrónico<i aria-hidden="true">*</i>
            </label>
            <input
              id="auth-email"
              name="email"
              type="email"
              inputMode="email"
              className={`nx-input${errors.email ? " is-error" : ""}`}
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="tu@correo.com"
              required
              value={email}
              onChange={edit(setEmail)}
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? "auth-email-error" : undefined}
            />
            <FieldError id="auth-email-error" message={errors.email} />
          </div>

          <div className="nx-field">
            <div className="auth-label-row">
              <label className="nx-label" htmlFor="auth-password">
                Contraseña<i aria-hidden="true">*</i>
              </label>
              <button
                type="button"
                className="nx-link"
                aria-label="Mostrar contraseña"
                aria-pressed={showPassword}
                aria-controls="auth-password"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                <span aria-hidden="true">{showPassword ? "Ocultar" : "Mostrar"}</span>
              </button>
            </div>
            <input
              id="auth-password"
              name="password"
              type={showPassword ? "text" : "password"}
              className={`nx-input${errors.password ? " is-error" : ""}`}
              autoComplete={isRegister ? "new-password" : "current-password"}
              placeholder="••••••••"
              required
              minLength={isRegister ? MIN_PASSWORD : undefined}
              value={password}
              onChange={edit(setPassword)}
              aria-invalid={errors.password ? true : undefined}
              aria-describedby={
                [errors.password && "auth-password-error", isRegister && "auth-password-rule"]
                  .filter(Boolean)
                  .join(" ") || undefined
              }
            />
            <FieldError id="auth-password-error" message={errors.password} />
            {isRegister && (
              <span
                id="auth-password-rule"
                className="nx-hint"
                style={passwordRuleOk ? { color: "var(--nx-ok-fg)" } : undefined}
              >
                {passwordRuleOk ? `Cumple el mínimo de ${MIN_PASSWORD} caracteres.` : `Mínimo ${MIN_PASSWORD} caracteres.`}
              </span>
            )}
          </div>
        </div>

        <button type="submit" className="nx-btn nx-btn-primary nx-btn-lg nx-btn-block" disabled={pending} aria-busy={pending}>
          {pending && <Loader2 size={18} className="auth-spin" aria-hidden="true" />}
          {pending ? copy.pending : copy.cta}
        </button>
      </form>
    </>
  )
}

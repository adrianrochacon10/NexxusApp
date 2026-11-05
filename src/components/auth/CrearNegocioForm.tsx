"use client"

import { useActionState, useState } from "react"
import { Loader2 } from "lucide-react"
import { crearNegocio, logout } from "@/actions/auth"
import { FieldError } from "@/components/auth/FieldError"

export function CrearNegocioForm({ sugerido }: { sugerido: string }) {
  const [negocio, setNegocio] = useState(sugerido)
  const [tried, setTried] = useState(false)

  const [state, formAction, pending] = useActionState<{ error: string | null }, FormData>(async (_prev, formData) => {
    const result = await crearNegocio(formData).catch(() => null)
    if (!result) return { error: "No pudimos conectar. Revisa tu conexión e inténtalo de nuevo." }
    return { error: result.ok ? null : result.error }
  }, { error: null })

  const error = tried && negocio.trim().length < 2 ? "Escribe el nombre de tu negocio." : undefined

  return (
    <>
      <div>
        <h1 className="t-h1">Crea tu negocio</h1>
        <p className="auth-sub">Tu inventario, ventas y finanzas vivirán aquí. Podrás invitar a tu equipo después.</p>
      </div>

      {state.error && !pending && (
        <div className="nx-alert is-bad auth-alert" role="alert">
          <div className="ttl">No pudimos crear tu negocio</div>
          <div className="txt">{state.error}</div>
        </div>
      )}

      <form
        action={formAction}
        noValidate
        className="auth-form"
        onSubmit={(e) => {
          setTried(true)
          if (negocio.trim().length < 2) e.preventDefault()
        }}
      >
        <div className="auth-fields">
          <div className="nx-field">
            <label className="nx-label" htmlFor="bv-negocio">
              Nombre del negocio<i aria-hidden="true">*</i>
            </label>
            <input
              id="bv-negocio"
              name="negocio"
              className={`nx-input${error ? " is-error" : ""}`}
              autoComplete="organization"
              placeholder="Ej. Boutique Aurora"
              value={negocio}
              onChange={(e) => setNegocio(e.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "bv-negocio-error" : undefined}
              autoFocus
            />
            <FieldError id="bv-negocio-error" message={error} />
          </div>
        </div>

        <button type="submit" className="nx-btn nx-btn-primary nx-btn-lg nx-btn-block" disabled={pending} aria-busy={pending}>
          {pending && <Loader2 size={18} className="auth-spin" aria-hidden="true" />}
          {pending ? "Creando…" : "Crear negocio"}
        </button>
      </form>

      <form action={logout}>
        <button type="submit" className="nx-link">Usar otra cuenta</button>
      </form>
    </>
  )
}

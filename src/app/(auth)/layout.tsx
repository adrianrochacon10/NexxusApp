import type { ReactNode } from "react"
import { Check } from "lucide-react"
import { NexxusLogo } from "@/components/shared/NexxusLogo"
import "@/styles/auth.css"

const PERKS = [
  "Todo el equipo con el mismo acceso",
  "Pensado para teléfono y tableta",
  "Variantes por talla y color",
]

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth">
      <aside className="auth-aside" aria-label="Nexxus">
        <span className="auth-orb a" aria-hidden="true" />
        <span className="auth-orb b" aria-hidden="true" />
        <div className="auth-brand">
          <NexxusLogo />
          <span className="auth-brand-name" aria-hidden="true">Nexxus</span>
        </div>
        <div className="auth-pitch">
          <h2>Vende, controla tu inventario y cobra desde el celular.</h2>
          <p>Un solo lugar para tu tienda y tu equipo: ventas, stock, abonos y finanzas, siempre al día.</p>
        </div>
        <ul className="auth-perks">
          {PERKS.map((perk) => (
            <li key={perk}>
              <Check size={20} strokeWidth={2.4} aria-hidden="true" />
              {perk}
            </li>
          ))}
        </ul>
      </aside>

      <header className="auth-bar">
        <NexxusLogo small />
        <span className="auth-bar-name" aria-hidden="true">Nexxus</span>
      </header>

      <main className="auth-main">
        <div className="auth-body">{children}</div>
      </main>
    </div>
  )
}

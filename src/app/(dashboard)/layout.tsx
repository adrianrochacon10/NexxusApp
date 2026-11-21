import { AppShell } from "@/components/shared/Sidebar"
import { requireBusinessContext } from "@/server/business/business-context"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { supabase, business, user } = await requireBusinessContext()

  const [{ data: productos }, { count: porCobrar }] = await Promise.all([
    supabase
      .from("productos")
      .select("stock, stock_minimo")
      .eq("business_id", business.id),
    supabase
      .from("ventas")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .eq("estatus", "activa")
      .neq("estado_pago", "pagada"),
  ])

  // PostgREST no compara dos columnas entre sí: se cuenta aquí.
  // Misma regla que el dashboard: agotados (stock <= 0) + stock bajo (stock <= mínimo)
  const stockBajo = (productos ?? []).filter((p) => p.stock <= 0 || p.stock <= p.stock_minimo).length

  return (
    <AppShell
      negocio={business.name}
      usuario={{ nombre: user.nombre ?? user.email ?? "Usuario", email: user.email ?? "" }}
      conteos={{ inventario: stockBajo, cobrar: porCobrar ?? 0 }}
    >
      {children}
    </AppShell>
  )
}

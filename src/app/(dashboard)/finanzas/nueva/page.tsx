import { TransaccionForm } from "@/components/finanzas/TransaccionForm"
import { Navbar } from "@/components/shared/Navbar"

export default function NuevaTransaccionPage() {
  return (
    <>
      <Navbar title="Nueva transaccion" subtitle="Registra ingresos, gastos o transferencias." />
      <div className="page">
        <TransaccionForm />
      </div>
    </>
  )
}

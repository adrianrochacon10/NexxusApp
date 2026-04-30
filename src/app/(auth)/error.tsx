"use client"

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="surface" style={{ padding: 20 }}>
      <h2>No se pudo procesar la autenticacion</h2>
      <button className="button button-primary" onClick={reset}>Reintentar</button>
    </div>
  )
}

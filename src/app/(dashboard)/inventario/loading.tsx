export default function Loading() {
  return (
    <div className="page" aria-busy="true" aria-label="Cargando inventario">
      <div className="inv-stack">
        <div className="nx-skel" style={{ width: 220, height: 30 }} />
        <div className="inv-kpis">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="nx-card nx-kpi">
              <div className="nx-skel" style={{ width: "50%", height: 14 }} />
              <div className="nx-skel" style={{ width: "70%", height: 26 }} />
            </div>
          ))}
        </div>
        <div className="nx-skel" style={{ height: 48, borderRadius: 10 }} />
        <div className="nx-card" style={{ overflow: "hidden" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="nx-li">
              <div className="nx-skel" style={{ width: 44, height: 44, borderRadius: 10 }} />
              <div className="grow nx-col gap-8">
                <div className="nx-skel" style={{ width: "40%", height: 14 }} />
                <div className="nx-skel" style={{ width: "25%", height: 12 }} />
              </div>
              <div className="nx-skel" style={{ width: 80, height: 24, borderRadius: 999 }} />
            </div>
          ))}
        </div>
        <span className="sr-only">Cargando inventario…</span>
      </div>
    </div>
  )
}

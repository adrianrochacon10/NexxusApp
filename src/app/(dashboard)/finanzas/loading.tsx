import "@/styles/finanzas.css"

export default function Loading() {
  return (
    <div className="page fz-page" aria-busy="true">
      <span className="fz-sr" role="status">Cargando finanzas…</span>
      <div className="nx-skel" style={{ height: 30, width: 200, marginTop: 8 }} />
      <div className="fz-kpis" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="nx-card nx-kpi">
            <div className="nx-skel" style={{ height: 16, width: "50%" }} />
            <div className="nx-skel" style={{ height: 30, width: "70%" }} />
            <div className="nx-skel" style={{ height: 14, width: "60%" }} />
          </div>
        ))}
      </div>
      <div className="nx-list" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="nx-li">
            <div className="nx-skel" style={{ width: 10, height: 10, borderRadius: "50%" }} />
            <div className="grow nx-col gap-8">
              <div className="nx-skel" style={{ height: 16, width: "55%" }} />
              <div className="nx-skel" style={{ height: 12, width: "35%" }} />
            </div>
            <div className="nx-skel" style={{ height: 18, width: 96 }} />
          </div>
        ))}
      </div>
    </div>
  )
}

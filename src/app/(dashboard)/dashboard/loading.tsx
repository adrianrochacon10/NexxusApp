import "@/styles/dashboard.css"

const FILAS = [
  { a: 62, b: 38 },
  { a: 48, b: 30 },
  { a: 70, b: 42 },
]

function PanelSkeleton({ className }: { className: string }) {
  return (
    <div className={`nx-list ${className}`}>
      <div className="nx-panel-head">
        <div className="nx-skel" style={{ height: 16, width: 140 }} />
      </div>
      {FILAS.map((r, i) => (
        <div key={i} className="nx-li">
          <div className="nx-skel" style={{ width: 40, height: 40, borderRadius: 12, flex: "none" }} />
          <div className="grow nx-col gap-8">
            <div className="nx-skel" style={{ height: 12, width: `${r.a}%` }} />
            <div className="nx-skel" style={{ height: 10, width: `${r.b}%` }} />
          </div>
          <div className="nx-skel" style={{ width: 60, height: 16, flex: "none" }} />
        </div>
      ))}
    </div>
  )
}

export default function Loading() {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Cargando dashboard…</span>
      <header className="nx-pagehead" aria-hidden="true">
        <div style={{ minWidth: 0 }}>
          <div className="nx-skel" style={{ height: 12, width: 180 }} />
          <div className="nx-skel" style={{ height: 26, width: 220, marginTop: 8 }} />
        </div>
      </header>
      <div className="page dash" aria-hidden="true">
        <div className="nx-skel" style={{ height: 64, borderRadius: 12 }} />
        <div className="dash-kpis">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="nx-card nx-kpi">
              <div className="nx-skel" style={{ height: 12, width: "60%" }} />
              <div className="nx-skel" style={{ height: 28, width: "75%" }} />
              <div className="nx-skel" style={{ height: 10, width: "45%" }} />
            </div>
          ))}
        </div>
        <div className="dash-cols">
          <div className="dash-col">
            <PanelSkeleton className="dash-p-ventas" />
            <PanelSkeleton className="dash-p-txs" />
          </div>
          <div className="dash-col">
            <PanelSkeleton className="dash-p-stock" />
            <PanelSkeleton className="dash-p-top" />
          </div>
        </div>
      </div>
    </div>
  )
}

interface NexxusLogoProps {
  compact?: boolean
}

export function NexxusLogo({ compact = false }: NexxusLogoProps) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 12 }} aria-label="Nexxus">
      <div
        aria-hidden="true"
        className="font-display"
        style={{
          display: "grid",
          width: compact ? 38 : 48,
          height: compact ? 38 : 48,
          placeItems: "center",
          border: "1px solid rgba(201,168,76,0.45)",
          borderRadius: 8,
          color: "var(--accent-gold)",
          fontSize: compact ? 22 : 28,
          lineHeight: 1,
          background: "linear-gradient(145deg, rgba(201,168,76,0.12), rgba(255,255,255,0.02))",
        }}
      >
        NX
      </div>
      {!compact && (
        <div>
          <div className="font-display" style={{ fontSize: 28, lineHeight: 1, letterSpacing: 0 }}>
            Nexxus
          </div>
          <div style={{ color: "var(--text-tertiary)", fontSize: 12 }}>Inventory & Finance</div>
        </div>
      )}
    </div>
  )
}

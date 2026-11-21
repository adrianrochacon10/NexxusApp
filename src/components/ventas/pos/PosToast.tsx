"use client"

import Link from "next/link"
import { AlertTriangle, Check, X } from "lucide-react"

export interface ToastData {
  tone:   "ok" | "warn"
  title:  string
  text:   string
  href?:  string
  hrefLabel?: string
}

export function PosToast({ toast, onClose }: { toast: ToastData | null; onClose: () => void }) {
  return (
    <div className="pos-toast-region" role="status" aria-live="polite">
      {toast && (
        <div className="nx-toast pos-toast">
          <div className={`nx-toast-ic is-${toast.tone}`}>
            {toast.tone === "ok"
              ? <Check size={18} strokeWidth={2.2} aria-hidden="true" />
              : <AlertTriangle size={18} strokeWidth={2.2} aria-hidden="true" />}
          </div>
          <div className="grow">
            <div className="ttl">{toast.title}</div>
            <div className="txt nx-num">{toast.text}</div>
            {toast.href && (
              <Link href={toast.href} className="act" style={{ display: "inline-flex", alignItems: "center", minHeight: 32 }}>
                {toast.hrefLabel ?? "Ver"}
              </Link>
            )}
          </div>
          <button type="button" className="nx-close" aria-label="Cerrar aviso" onClick={onClose} style={{ margin: "-6px -8px 0 0" }}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  )
}

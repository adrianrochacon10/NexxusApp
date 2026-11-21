import { AlertCircle } from "lucide-react"

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <span id={id} className="nx-error">
      <AlertCircle size={16} aria-hidden="true" />
      {message}
    </span>
  )
}

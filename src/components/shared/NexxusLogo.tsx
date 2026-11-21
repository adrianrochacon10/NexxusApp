import type { CSSProperties } from "react"
import { cn } from "@/lib/utils"

interface NexxusLogoProps {
  small?: boolean
  className?: string
  style?: CSSProperties
}

export function NexxusLogo({ small = false, className, style }: NexxusLogoProps) {
  return (
    <div className={cn("nx-logo", small && "sm", className)} style={style} role="img" aria-label="Nexxus">
      N
    </div>
  )
}

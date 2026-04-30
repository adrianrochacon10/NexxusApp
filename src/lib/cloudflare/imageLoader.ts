import type { ImageLoaderProps } from "next/image"

export default function imageLoader({ src, width, quality }: ImageLoaderProps): string {
  const publicUrl = process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL
  const separator = src.includes("?") ? "&" : "?"
  const optimized = `${src}${separator}width=${width}&quality=${quality ?? 75}&format=auto`

  if (!publicUrl || src.startsWith("http")) {
    return optimized
  }

  return `${publicUrl.replace(/\/$/, "")}/${optimized.replace(/^\//, "")}`
}

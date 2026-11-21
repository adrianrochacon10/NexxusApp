import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-jetbrains",
})

export const metadata: Metadata = {
  title: "Nexxus",
  description: "Punto de venta, inventario y finanzas para pequeños negocios.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // suppressHydrationWarning: algunas extensiones del navegador inyectan atributos
    // (p. ej. style="cursor:auto") en <html>/<body> antes de hidratar. Solo afecta a estos dos nodos.
    <html lang="es-MX" className={`${inter.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}

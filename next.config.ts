import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Solo en `next dev`: permite abrir la app desde la IP de red local además de
  // localhost (Next bloquea /_next/* de otros orígenes y la página sale sin CSS/JS).
  allowedDevOrigins: ["172.31.176.1"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.r2.dev",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
}

export default nextConfig

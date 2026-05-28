# Nexxus

Aplicacion web de inventario y finanzas para pequenos negocios, construida con Next.js 15, TypeScript estricto, Supabase SSR y Cloudflare R2.

## Ejecutar localmente

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

Sin variables de entorno la app corre en modo demo con datos locales. Al configurar Supabase, el middleware protege rutas privadas y las Server Actions escriben en PostgreSQL con RLS.

## Configuracion

Copia `.env.example` a `.env.local` y completa:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_R2_ACCESS_KEY_ID`
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- `CLOUDFLARE_R2_BUCKET_NAME`
- `NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL`

## Modulos

- Auth: login y registro con Supabase SSR.
- Dashboard: KPIs, evolucion mensual, transacciones recientes y alertas de stock.
- Inventario: tabla, formulario crear/editar, detalle e historial de movimientos.
- Finanzas: transacciones, formulario de registro y reportes por categoria.

## Backend y arquitectura

- Modelo compartido por negocio/equipo: `docs/backend-negocio-compartido.md`.
- Migracion inicial Supabase: `supabase/migrations/202605270001_team_business_model.sql`.
- Prompts para el agente frontend: `docs/prompts-frontend.md`.
- Mejoras futuras priorizadas: `docs/mejoras-futuras.md`.


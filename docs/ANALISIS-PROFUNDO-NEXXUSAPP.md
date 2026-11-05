# Análisis Profundo de NexxuzApp

> Documento técnico generado a partir del análisis directo del código fuente del repositorio.
> Cada subsistema fue documentado por un agente lector y luego **verificado de forma adversarial** contra el código para garantizar fidelidad (sin invenciones).
> Fecha de generación: **18 de junio de 2026**. Versión del paquete analizada: `nexxus@0.1.0`.

---

## 1. Resumen ejecutivo

**NexxuzApp** (nombre interno del paquete: `nexxus`, versión `0.1.0`, privado) es una **aplicación web de gestión de inventario y finanzas para pequeños negocios**, según se declara en [README.md](../README.md). Está construida sobre el App Router de Next.js 15 con TypeScript en modo estricto, persistencia en Supabase (PostgreSQL) con Row Level Security y almacenamiento de imágenes en Cloudflare R2.

### 1.1 Stack tecnológico (verificado en [package.json](../package.json))

| Capa | Tecnología | Versión declarada |
|------|------------|-------------------|
| Framework | Next.js (App Router) | `^15.3.1` |
| UI | React / React DOM | `^19.1.0` |
| Lenguaje | TypeScript (`strict: true`) | `^5.8.3` |
| Estilos | Tailwind CSS v4 (`@tailwindcss/postcss`) | `^4.1.4` |
| Base de datos / Auth | Supabase (`@supabase/ssr`, `@supabase/supabase-js`) | `^0.6.1` / `^2.49.4` |
| Almacenamiento de imágenes | Cloudflare R2 vía AWS S3 SDK (`@aws-sdk/client-s3`, `s3-request-presigner`) | `^3.787.0` |
| Formularios | React Hook Form + `@hookform/resolvers` + Zod | `^7.56.1` / `^5.0.1` / `^3.24.3` |
| Gráficas | Recharts | `^2.15.3` |
| Iconos | lucide-react | `^0.488.0` |
| Utilidades de clases | clsx + tailwind-merge | `^2.1.1` / `^3.2.0` |
| Estado global | Zustand | `^5.0.3` |

> **Nota de honestidad técnica:** aunque `zustand` figura como dependencia, el archivo [src/lib/store.ts](../src/lib/store.ts) está vacío de lógica (solo contiene un comentario y `export {}`). El comentario indica que el store local fue eliminado y que toda la lógica de datos pasa por Supabase mediante Server Actions. No se localizó ningún store de Zustand activo en el código analizado.

### 1.2 Arquitectura en una frase

El navegador renderiza **Server/Client Components** del App Router; toda escritura y lógica de negocio crítica vive en **Server Actions** (`'use server'`) que usan el cliente de Supabase del lado servidor con **contexto de negocio** (`business_id`); PostgreSQL aplica **RLS** como defensa adicional; las imágenes se suben a **Cloudflare R2** con URLs prefirmadas; un **middleware** protege las rutas privadas; y, sin variables de entorno, la app corre en un **modo demo con datos locales** (según [README.md](../README.md)).

### 1.3 Módulos funcionales

1. **Autenticación** — login/registro/logout con Supabase SSR y resolución del negocio del usuario.
2. **Dashboard** — KPIs, evolución mensual, transacciones recientes y alertas de stock.
3. **Inventario** — productos, categorías, variantes con stock propio, movimientos de stock e imágenes en R2.
4. **Ventas / POS** — punto de venta, ventas con pago completo/parcial/pendiente, abonos y cancelaciones.
5. **Finanzas** — transacciones de ingreso/gasto y reportes por categoría con gráficas.

### 1.4 Modelo de datos compartido por negocio

La base de datos sigue un **modelo multi-negocio (multi-tenant) por equipo**: las tablas operativas (`categorias`, `productos`, `movimientos_stock`, `transacciones`, ventas, etc.) se asocian a un `business_id`, y la pertenencia se gestiona en `business_memberships`. Esto permite que varios usuarios `admin` compartan el mismo inventario, ventas y finanzas. El detalle completo está en la sección de Base de Datos y en [docs/backend-negocio-compartido.md](backend-negocio-compartido.md).

## Tabla de contenidos

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Estructura del proyecto](#2-estructura-del-proyecto)
3. [Arquitectura, Stack y Configuración](#3-arquitectura-stack-y-configuración)
4. [Base de Datos (Supabase / PostgreSQL)](#4-base-de-datos-supabase--postgresql)
5. [Autenticación y Contexto de Negocio](#5-autenticación-y-contexto-de-negocio)
6. [Módulo de Inventario (Productos, Categorías, Variantes, Imágenes)](#6-módulo-de-inventario-productos-categorías-variantes-imágenes)
7. [Módulo de Ventas / Punto de Venta (POS)](#7-módulo-de-ventas--punto-de-venta-pos)
8. [Módulo de Finanzas y Dashboard](#8-módulo-de-finanzas-y-dashboard)
9. [UI Compartida, Estado Global e Infraestructura de Cliente](#9-ui-compartida-estado-global-e-infraestructura-de-cliente)
- [Apéndice A — Incertidumbres y puntos a verificar](#apéndice-a--incertidumbres-y-puntos-a-verificar)
- [Apéndice B — Documentación interna existente](#apéndice-b--documentación-interna-existente)

---

## 2. Estructura del proyecto

El código fuente vive bajo `src/` y la base de datos bajo `supabase/`. El proyecto tiene aproximadamente **7.057 líneas** entre archivos `.ts`, `.tsx`, `.sql` y `.css` (sin contar dependencias ni artefactos de build).

```text
NexxuzApp/
├── src/
│   ├── actions/                 # Server Actions ('use server') — lógica de negocio
│   │   ├── auth.ts              # login / register / logout
│   │   ├── categorias.ts        # CRUD de categorías
│   │   ├── finanzas.ts          # transacciones de ingreso/gasto
│   │   ├── imagenes.ts          # subida/borrado en Cloudflare R2
│   │   ├── inventario.ts        # CRUD de productos, variantes, stock
│   │   └── ventas.ts            # ventas, abonos, cancelaciones
│   ├── app/                     # App Router
│   │   ├── (auth)/              # route group de autenticación
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   ├── error.tsx · loading.tsx
│   │   ├── (dashboard)/         # route group privado
│   │   │   ├── layout.tsx       # Sidebar + main
│   │   │   ├── dashboard/       # KPIs y resumen
│   │   │   ├── inventario/      # listado, nuevo, [id], [id]/editar, categorias/...
│   │   │   ├── ventas/          # listado, nueva, [id], pendientes
│   │   │   └── finanzas/        # listado, nueva, reportes
│   │   ├── layout.tsx           # layout raíz (fuentes + ThemeProvider)
│   │   ├── page.tsx             # landing → redirect('/dashboard')
│   │   └── globals.css          # sistema de diseño (tokens, Tailwind v4)
│   ├── components/
│   │   ├── finanzas/            # GraficaCategoria, GraficaGastos, TransaccionForm
│   │   ├── inventario/          # ProductoForm, VariantesEditor, StockActualizador, ...
│   │   ├── ventas/              # PosCliente, AbonoRapidoBtn, VentaAcciones, ...
│   │   └── shared/              # DataTable, KPICard, Navbar, Sidebar, Theme*, ...
│   ├── lib/
│   │   ├── cloudflare/          # r2.ts, imageLoader.ts
│   │   ├── supabase/            # client.ts, server.ts, middleware.ts
│   │   ├── validations/         # producto.schema.ts, transaccion.schema.ts (Zod)
│   │   ├── store.ts             # (vacío — ver nota en Resumen ejecutivo)
│   │   └── utils.ts             # cn, formatCurrency, formatDate, getInitials
│   ├── server/
│   │   ├── auth/require-user.ts          # exige usuario autenticado
│   │   ├── business/business-context.ts  # resuelve el negocio activo
│   │   └── errors/app-error.ts           # clase de error de aplicación
│   ├── types/                   # tipos TS por dominio + supabase.types.ts
│   └── middleware.ts            # protección de rutas (Supabase SSR)
├── supabase/
│   ├── migrations/
│   │   ├── 202605270001_team_business_model.sql      # modelo negocio/equipo
│   │   └── 202605280001_production_app_schema.sql    # esquema de producción
│   ├── seed.sql · config.toml
├── docs/                        # documentación interna (ver Apéndice B)
├── next.config.ts · tsconfig.json · eslint.config.mjs · postcss.config.mjs
└── package.json
```

A continuación, cada subsistema se documenta en detalle. Cada función, página, componente y tabla incluye su ruta y número de línea como enlace clicable, y se basa exclusivamente en el código fuente leído y verificado.

---

## 3. Arquitectura, Stack y Configuración

Esta sección documenta, basándose exclusivamente en el código fuente leído, el subsistema de arquitectura, stack tecnológico y configuración de **NexxuzApp** (nombre interno del paquete: `nexxus`, versión `0.1.0`, privado).

---

### 1. Stack tecnológico y versiones exactas

Definido en [package.json](package.json#L12-L40). Todas las versiones usan rango caret (`^`), es decir, son versiones mínimas con actualizaciones menores/parche permitidas.

#### Dependencias de producción ([package.json:12-29](package.json#L12))

| Paquete | Versión declarada | Rol (inferido por el nombre del paquete) |
|---|---|---|
| `@aws-sdk/client-s3` | `^3.787.0` | Cliente S3 (usado para Cloudflare R2, compatible S3) |
| `@aws-sdk/s3-request-presigner` | `^3.787.0` | Generación de URLs prefirmadas S3/R2 |
| `@hookform/resolvers` | `^5.0.1` | Puente entre React Hook Form y Zod |
| `@supabase/ssr` | `^0.6.1` | Clientes Supabase para SSR (browser/server/middleware) |
| `@supabase/supabase-js` | `^2.49.4` | SDK base de Supabase |
| `clsx` | `^2.1.1` | Composición de clases CSS |
| `lucide-react` | `^0.488.0` | Iconos |
| `next` | `^15.3.1` | Framework Next.js 15 |
| `react` | `^19.1.0` | React 19 |
| `react-dom` | `^19.1.0` | Render DOM de React 19 |
| `react-hook-form` | `^7.56.1` | Manejo de formularios |
| `recharts` | `^2.15.3` | Gráficas |
| `tailwind-merge` | `^3.2.0` | Fusión de clases Tailwind |
| `uuid` | `^11.1.0` | Generación de UUID |
| `zod` | `^3.24.3` | Validación de esquemas |
| `zustand` | `^5.0.3` | Estado global cliente |

(Las dependencias en package.json aparecen ordenadas alfabéticamente; arriba se respeta ese orden.)

#### Dependencias de desarrollo ([package.json:30-40](package.json#L30))

| Paquete | Versión declarada |
|---|---|
| `@tailwindcss/postcss` | `^4.1.4` |
| `@types/node` | `^22.14.1` |
| `@types/react` | `^19.1.2` |
| `@types/react-dom` | `^19.1.2` |
| `@types/uuid` | `^10.0.0` |
| `eslint` | `^9.25.1` |
| `eslint-config-next` | `^15.3.1` |
| `tailwindcss` | `^4.1.4` |
| `typescript` | `^5.8.3` |

#### Scripts npm ([package.json:5-11](package.json#L5))

| Script | Comando |
|---|---|
| `dev` | `next dev` |
| `build` | `next build` |
| `start` | `next start` |
| `lint` | `next lint` |
| `typecheck` | `tsc --noEmit` |

---

### 2. Configuración de Next.js — [next.config.ts](next.config.ts)

Tipado con `NextConfig` importado de `next` ([next.config.ts:1](next.config.ts#L1)). La única configuración presente es `images.remotePatterns` ([next.config.ts:4-15](next.config.ts#L4)), que autoriza la carga de imágenes remotas vía `next/image` desde dos orígenes HTTPS:

| protocol | hostname |
|---|---|
| `https` | `**.r2.dev` (wildcard de subdominios de Cloudflare R2) |
| `https` | `images.unsplash.com` |

No hay otra configuración (sin `experimental`, sin `headers`, sin `redirects`, etc.). Exporta `nextConfig` como default ([next.config.ts:18](next.config.ts#L18)).

---

### 3. Configuración de TypeScript — [tsconfig.json](tsconfig.json)

`compilerOptions` ([tsconfig.json:2-20](tsconfig.json#L2)):

| Opción | Valor | Nota |
|---|---|---|
| `target` | `ES2017` | |
| `lib` | `["dom", "dom.iterable", "esnext"]` | |
| `allowJs` | `false` | No compila JS |
| `skipLibCheck` | `true` | |
| `strict` | `true` | **Modo estricto activado** |
| `noEmit` | `true` | No emite archivos (build vía Next) |
| `esModuleInterop` | `true` | |
| `module` | `esnext` | |
| `moduleResolution` | `bundler` | |
| `resolveJsonModule` | `true` | |
| `isolatedModules` | `true` | |
| `jsx` | `preserve` | |
| `incremental` | `true` | |
| `plugins` | `[{ "name": "next" }]` | Plugin de Next.js |
| `paths` | `{ "@/*": ["./src/*"] }` | **Alias `@/` apunta a `src/`** |

`include` ([tsconfig.json:21](tsconfig.json#L21)): `["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"]`.
`exclude` ([tsconfig.json:22](tsconfig.json#L22)): `["node_modules"]`.

El alias `@/*` explica los imports como `@/lib/supabase/middleware` o `@/components/shared/Sidebar` que aparecen en el resto del código.

#### [next-env.d.ts](next-env.d.ts)

Archivo de tipos generado por Next que **no debe editarse** (nota en [next-env.d.ts:5-6](next-env.d.ts#L5)). Contiene tres directivas de referencia ([next-env.d.ts:1-3](next-env.d.ts#L1)):
- `/// <reference types="next" />`
- `/// <reference types="next/image-types/global" />`
- `/// <reference path="./.next/types/routes.d.ts" />`

---

### 4. ESLint — [eslint.config.mjs](eslint.config.mjs)

Configuración en formato **flat config** (ESLint 9). Usa `FlatCompat` de `@eslint/eslintrc` para extender configuraciones legacy ([eslint.config.mjs:3-10](eslint.config.mjs#L3)). El `baseDirectory` se resuelve con `__dirname`, derivado a su vez de `import.meta.url` mediante `fileURLToPath` y `dirname` (`node:url` / `node:path`) ([eslint.config.mjs:1-9](eslint.config.mjs#L1)).

La config exportada ([eslint.config.mjs:12-16](eslint.config.mjs#L12)) es un array que esparce `compat.extends("next/core-web-vitals", "next/typescript")`:
- `next/core-web-vitals`
- `next/typescript`

No hay reglas personalizadas adicionales ni objetos de configuración extra en el array.

> Nota: `@eslint/eslintrc` se importa pero **no aparece listado explícitamente** en `devDependencies` de package.json (no figura en la lista leída; presumiblemente viene como dependencia transitiva de `eslint`/`eslint-config-next`, lo cual no se pudo verificar contra el lockfile). Ver "uncertainties".

---

### 5. PostCSS y Tailwind v4 — [postcss.config.mjs](postcss.config.mjs)

Configuración mínima ([postcss.config.mjs:1-7](postcss.config.mjs#L1)): un objeto `config` con un único plugin `@tailwindcss/postcss` (objeto vacío de opciones), exportado como default. Esto corresponde al modelo de Tailwind CSS v4, donde el plugin de PostCSS reemplaza al de v3. No hay `autoprefixer` declarado.

No existe archivo `tailwind.config.*` entre los archivos leídos; en Tailwind v4 la configuración se hace vía CSS. En [src/app/globals.css:1](src/app/globals.css#L1) se confirma el uso de la directiva v4 `@import "tailwindcss";`, seguida de variables CSS de tema personalizadas en el bloque `:root` ([globals.css:3-24](src/app/globals.css#L3)). La paleta es oscura e incluye, entre otras: `--background: #0a0a0a` (L4), `--accent-gold: #c9a84c` (L13), `--success: #4a9b6f`, `--error: #9b4a4a`, además de radios y curvas de easing.

---

### 6. Grupos de rutas (route groups) y layouts

La app usa el App Router de Next.js con dos **route groups** (carpetas entre paréntesis que no afectan la URL) bajo `src/app/`:

#### `(auth)` — Rutas de autenticación
- Layout: [(auth)/layout.tsx](src/app/(auth)/layout.tsx) — `AuthLayout({ children }: { children: ReactNode })` (tipo `ReactNode` importado de `react`), **server component**, envuelve el contenido en `<main className="auth-shell">` ([layout.tsx:3-9](src/app/(auth)/layout.tsx#L3)).
- Archivos del grupo: `login/page.tsx`, más `error.tsx` y `loading.tsx` a nivel del grupo `(auth)`.
- **No existe carpeta `register/`** dentro de `(auth)` pese a que el middleware declara `/register` como ruta pública (ver sección 8). Sí existe una Server Action `register` en `src/actions/auth.ts` (declarada en [auth.ts:30](src/actions/auth.ts#L30), que llama `supabase.auth.signUp`), pero ninguna página la sirve. Ver "uncertainties".

#### `(dashboard)` — Rutas privadas de la aplicación
- Layout: [(dashboard)/layout.tsx](src/app/(dashboard)/layout.tsx) — `DashboardLayout({ children }: { children: React.ReactNode })`, **server component**, renderiza `<Sidebar />` (importado de `@/components/shared/Sidebar`) junto al `<main style={{ minWidth: 0 }}>` dentro de `<div className="app-shell">` ([layout.tsx:1-10](src/app/(dashboard)/layout.tsx#L1)).
- Subrutas detectadas (archivos `page.tsx`):
  - `dashboard/` → `/dashboard`
  - `finanzas/` → `/finanzas`, `finanzas/nueva` → `/finanzas/nueva`, `finanzas/reportes` → `/finanzas/reportes`
  - `inventario/` → `/inventario`, `inventario/nuevo`, `inventario/[id]`, `inventario/[id]/editar`, `inventario/categorias/nueva`, `inventario/categorias/[id]`
  - `ventas/` → `/ventas`, `ventas/nueva`, `ventas/pendientes`, `ventas/[id]`
  - Existen archivos `error.tsx` y `loading.tsx` a nivel de las secciones `dashboard/`, `finanzas/` e `inventario/` (no se detectaron `error.tsx`/`loading.tsx` propios para `ventas/`).

#### Layout raíz — [src/app/layout.tsx](src/app/layout.tsx)
`RootLayout({ children }: Readonly<{ children: React.ReactNode }>)`, **server component** ([layout.tsx:26-38](src/app/layout.tsx#L26)). Características:
- Carga tres fuentes de Google vía `next/font/google` ([layout.tsx:2-19](src/app/layout.tsx#L2)): `Inter` (variable `--font-inter`), `Cormorant_Garamond` (`--font-cormorant`), `JetBrains_Mono` (`--font-jetbrains`), todas con `subsets: ["latin"]`.
- `metadata`: `{ title: "Nexxus", description: "Inventario y finanzas empresariales para pequenos negocios." }` ([layout.tsx:21-24](src/app/layout.tsx#L21)).
- `<html lang="es" className={...} data-theme="dark" suppressHydrationWarning>` con las tres variables de fuente aplicadas a `className`, y `<body>` envuelto en `<ThemeProvider>` (de `@/components/shared/ThemeProvider`) ([layout.tsx:32-36](src/app/layout.tsx#L32)).

#### Página raíz — [src/app/page.tsx](src/app/page.tsx)
`HomePage()`, **server component**, ejecuta `redirect("/dashboard")` usando `redirect` de `next/navigation` ([page.tsx:1-5](src/app/page.tsx#L1)). Es decir, `/` siempre redirige a `/dashboard`.

---

### 7. Los tres clientes de Supabase SSR

Hay tres factorías distintas, una por contexto de ejecución. Las tres comparten un patrón común: **leen `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` de `process.env` y, si falta cualquiera de los dos, degradan a `null` (o `user: null`)** — base del "modo demo" (sección 9).

#### 7.1 Cliente de navegador — [src/lib/supabase/client.ts](src/lib/supabase/client.ts)

```ts
export function createSupabaseBrowserClient()
```
- Definición: [client.ts:3-12](src/lib/supabase/client.ts#L3). Síncrona, **no** es async.
- Lee `url` y `anonKey` de `process.env` ([client.ts:4-5](src/lib/supabase/client.ts#L4)).
- Si falta alguno, retorna `null` ([client.ts:7-9](src/lib/supabase/client.ts#L7)).
- Si están presentes, retorna `createBrowserClient(url, anonKey)` de `@supabase/ssr` ([client.ts:11](src/lib/supabase/client.ts#L11)).
- **Diferencia clave**: no gestiona cookies explícitamente (el cliente de navegador maneja la sesión vía storage del navegador). El tipo de retorno es inferido (no hay anotación explícita), efectivamente `ReturnType<typeof createBrowserClient> | null`.

#### 7.2 Cliente de servidor — [src/lib/supabase/server.ts](src/lib/supabase/server.ts)

```ts
export async function createSupabaseServerClient()
```
- Definición: [server.ts:4-23](src/lib/supabase/server.ts#L4). **Async** (usa `await cookies()`).
- Obtiene el `cookieStore` con `await cookies()` de `next/headers` ([server.ts:5](src/lib/supabase/server.ts#L5)).
- Lee `url`/`anonKey`; si falta alguno retorna `null` ([server.ts:9-11](src/lib/supabase/server.ts#L9)).
- Retorna `createServerClient(url, anonKey, { cookies: { getAll, setAll } })` ([server.ts:13-22](src/lib/supabase/server.ts#L13)):
  - `getAll()` → `cookieStore.getAll()` ([server.ts:15-17](src/lib/supabase/server.ts#L15)).
  - `setAll(cookiesToSet)` → itera con `forEach` y hace `cookieStore.set(name, value, options)` para cada cookie. El parámetro está tipado como `{ name: string; value: string; options: CookieOptions }[]` (tipo `CookieOptions` importado de `@supabase/ssr`) ([server.ts:18-20](src/lib/supabase/server.ts#L18)).
- **Diferencia clave**: escribe cookies directamente en el `cookieStore` de Next (Server Components / Server Actions / Route Handlers). Tipo de retorno inferido: `ReturnType<typeof createServerClient> | null`.

#### 7.3 Cliente de middleware — [src/lib/supabase/middleware.ts](src/lib/supabase/middleware.ts)

```ts
export async function updateSession(request: NextRequest)
```
- Definición: [middleware.ts:4-27](src/lib/supabase/middleware.ts#L4). **Async**.
- Crea `response = NextResponse.next({ request })` ([middleware.ts:5](src/lib/supabase/middleware.ts#L5)).
- Lee `url`/`anonKey`; si falta alguno retorna `{ response, user: null }` ([middleware.ts:9-11](src/lib/supabase/middleware.ts#L9)).
- Crea `createServerClient(url, anonKey, { cookies: { getAll, setAll } })` ([middleware.ts:13-20](src/lib/supabase/middleware.ts#L13)):
  - `getAll: () => request.cookies.getAll()` — lee cookies del **request entrante** ([middleware.ts:15](src/lib/supabase/middleware.ts#L15)).
  - `setAll: (cookiesToSet) => ...` — escribe cada cookie en el **response** (`response.cookies.set(name, value, options)`), no en el request. Mismo tipo `{ name: string; value: string; options: CookieOptions }[]` ([middleware.ts:16-18](src/lib/supabase/middleware.ts#L16)).
- Llama `await supabase.auth.getUser()` y desestructura `data.user` ([middleware.ts:22-24](src/lib/supabase/middleware.ts#L22)).
- Retorna `{ response, user }` ([middleware.ts:26](src/lib/supabase/middleware.ts#L26)).
- **Diferencia clave**: lee cookies del `request` y las refresca en el `response`, devolviendo además el `user` resuelto para que el middleware decida redirecciones.

#### Comparativa de los tres clientes

| Aspecto | Browser ([client.ts](src/lib/supabase/client.ts)) | Server ([server.ts](src/lib/supabase/server.ts)) | Middleware ([middleware.ts](src/lib/supabase/middleware.ts)) |
|---|---|---|---|
| Función factory | `createSupabaseBrowserClient` | `createSupabaseServerClient` | `updateSession` |
| API `@supabase/ssr` | `createBrowserClient` | `createServerClient` | `createServerClient` |
| Async | No | Sí (`await cookies()`) | Sí |
| Origen de cookies | Storage del navegador | `cookies()` de `next/headers` | `request.cookies` |
| Escritura de cookies | (no explícita) | `cookieStore.set` | `response.cookies.set` |
| Retorno sin env | `null` | `null` | `{ response, user: null }` |
| Resuelve `user` | No | No | Sí (`auth.getUser()`) |

---

### 8. Middleware de autenticación — [src/middleware.ts](src/middleware.ts)

**Función exportada**: `export async function middleware(request: NextRequest)` ([middleware.ts:6](src/middleware.ts#L6)). Importa `NextResponse` y el tipo `NextRequest` de `next/server`, y `updateSession` de `@/lib/supabase/middleware` ([middleware.ts:1-2](src/middleware.ts#L1)).

**Constante** `PUBLIC_ROUTES = ["/login", "/register"]` ([middleware.ts:4](src/middleware.ts#L4)).

**Comportamiento paso a paso** ([middleware.ts:7-20](src/middleware.ts#L7)):
1. Extrae `pathname` de `request.nextUrl` ([middleware.ts:7](src/middleware.ts#L7)).
2. `isPublic` = ¿`pathname` empieza con alguna de las `PUBLIC_ROUTES`? (vía `Array.some` + `startsWith`) ([middleware.ts:8](src/middleware.ts#L8)).
3. `authConfigured` = `Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)` ([middleware.ts:9](src/middleware.ts#L9)) — **gate del modo demo**.
4. Llama `const { response, user } = await updateSession(request)` ([middleware.ts:10](src/middleware.ts#L10)) — esto refresca la sesión/cookies.
5. **Regla A** ([middleware.ts:12-14](src/middleware.ts#L12)): si `authConfigured && !user && !isPublic` → `NextResponse.redirect(new URL("/login", request.url))`. (Usuario no autenticado intentando entrar a ruta privada → a login.)
6. **Regla B** ([middleware.ts:16-18](src/middleware.ts#L16)): si `authConfigured && user && isPublic` → `NextResponse.redirect(new URL("/dashboard", request.url))`. (Usuario autenticado en una ruta pública como login → a dashboard.)
7. En cualquier otro caso, retorna `response` (el de `updateSession`, con cookies actualizadas) ([middleware.ts:20](src/middleware.ts#L20)).

**Efectos secundarios**: refresco de cookies de sesión (vía `updateSession`); posibles redirecciones a `/login` o `/dashboard`. No escribe en BD.

**Matcher** ([middleware.ts:23-25](src/middleware.ts#L23)):
```
matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
```
Es decir, el middleware se ejecuta en **todas las rutas excepto**: archivos estáticos de Next (`_next/static`, `_next/image`), `favicon.ico`, y archivos con extensiones de imagen (`.svg`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`).

**Rutas que protege**: todo lo que coincida con el matcher y **no** empiece por `/login` o `/register` queda protegido cuando Supabase está configurado (requiere `user`). Como el grupo `(dashboard)` (todas las rutas `/dashboard`, `/finanzas`, `/inventario`, `/ventas`) no es público, queda protegido. La ruta raíz `/` también pasa por el middleware, pero `HomePage` redirige a `/dashboard` de todas formas.

---

### 9. Modo demo sin Supabase

El "modo demo" **sí existe** y está documentado en [README.md:14](README.md#L14): *"Sin variables de entorno la app corre en modo demo con datos locales. Al configurar Supabase, el middleware protege rutas privadas y las Server Actions escriben en PostgreSQL con RLS."* Su implementación se reparte en:

- **Clientes Supabase**: las tres factorías retornan `null`/`user: null` si faltan `NEXT_PUBLIC_SUPABASE_URL` o `NEXT_PUBLIC_SUPABASE_ANON_KEY` ([client.ts:7](src/lib/supabase/client.ts#L7), [server.ts:9](src/lib/supabase/server.ts#L9), [middleware.ts:9](src/lib/supabase/middleware.ts#L9)).
- **Middleware**: la bandera `authConfigured` ([src/middleware.ts:9](src/middleware.ts#L9)) controla las redirecciones. Si las env no están, `authConfigured = false` y **ninguna** de las reglas A/B se aplica → todas las rutas quedan accesibles sin autenticación (modo demo). El README confirma que la protección de rutas y las escrituras a PostgreSQL/RLS solo ocurren "Al configurar Supabase" ([README.md:14](README.md#L14)).
- **Server Actions**: el patrón se replica en las acciones; p. ej. `login`/`register` solo invocan Supabase si `supabase` no es `null` (`if (supabase) { ... }` en [src/actions/auth.ts:20](src/actions/auth.ts#L20) y [auth.ts:38](src/actions/auth.ts#L38)), redirigiendo igualmente a `/dashboard`.

> El detalle de los "datos locales" que alimentan el modo demo no está en los archivos de este subsistema (residirían en `src/actions/*` o un store/datasource). Ver "uncertainties".

---

### 10. Variables de entorno requeridas — [.env.example](.env.example) y [README.md](README.md)

El README ([README.md:18](README.md#L18)) instruye a copiar `.env.example` a `.env.local`. El archivo [.env.example](.env.example) está presente en el árbol de trabajo (y rastreado por git) y contiene:

| Variable | Valor de ejemplo en `.env.example` | Pública (`NEXT_PUBLIC_`) | Uso (inferido) |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://rmmfrnkveuieqcpgiipv.supabase.co` | Sí | URL del proyecto Supabase (clientes browser/server/middleware) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | JWT anon (valor presente, largo) | Sí | Clave anónima Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | (vacío) | No | Clave service role (operaciones privilegiadas) |
| `CLOUDFLARE_ACCOUNT_ID` | (vacío) | No | Cuenta Cloudflare R2 |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | (vacío) | No | Credencial R2 |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | (vacío) | No | Credencial R2 |
| `CLOUDFLARE_R2_BUCKET_NAME` | `inventario-fotos` | No | Bucket R2 |
| `NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL` | `https://pub-85de4b96b3d74b96ab54a59161e71759.r2.dev` | Sí | URL pública de imágenes R2 |
| `NEXTAUTH_SECRET` | (vacío) | No | (presente en `.env.example`, **no** listada en README) |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Sí | (presente en `.env.example`, **no** listada en README) |

Notas:
- Las **únicas** dos variables que activan el "modo no-demo" (autenticación y persistencia) son `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`, según la lógica de los clientes y el middleware.
- El README lista 8 variables ([README.md:20-27](README.md#L20)); `.env.example` añade dos más no documentadas en el README: `NEXTAUTH_SECRET` y `NEXT_PUBLIC_APP_URL`.
- El dominio público de R2 (`*.r2.dev`) coincide con el `remotePatterns` de `next.config.ts`, habilitando `next/image` sobre las imágenes del bucket.
- El histórico de git (commit `510dddc`) menciona "delete .env.example", pero el archivo **está presente y rastreado** en el working tree actual con los valores anteriores.

---

### 11. Documentación de arquitectura referida (no leída, solo citada por README)

[README.md:36-42](README.md#L36) referencia documentos y artefactos de backend que describen el modelo y setup, aunque su contenido no forma parte de este subsistema de configuración:
- `docs/backend-negocio-compartido.md` (modelo compartido por negocio/equipo).
- `docs/supabase-produccion.md` (setup Supabase producción).
- `supabase/migrations/202605270001_team_business_model.sql` (migración inicial).
- `docs/prompts-frontend.md`, `docs/mejoras-futuras.md`.

El README también resume los módulos funcionales ([README.md:29-34](README.md#L29)): Auth (login y registro con Supabase SSR), Dashboard (KPIs, evolución mensual, transacciones recientes y alertas de stock), Inventario (tabla, formulario crear/editar, detalle e historial de movimientos) y Finanzas (transacciones, formulario de registro y reportes por categoría). Nótese que el README menciona "registro" en Auth, pero no existe una página `/register` (sección 6), aunque sí la Server Action `register`. El README no menciona el módulo de Ventas, pese a que existen rutas `ventas/*` en `(dashboard)` (sección 6).

---

## 4. Base de Datos (Supabase / PostgreSQL)

Este subsistema define el esquema de persistencia de NexxuzApp sobre PostgreSQL (versión mayor 17, según [config.toml:36](supabase/config.toml#L36)) gestionado por Supabase. El esquema se construye con dos migraciones secuenciales y un archivo semilla vacío. Toda la lógica de negocio reside en Next.js; PostgreSQL aporta integridad referencial, políticas RLS multi-tenant por negocio (`business`), triggers de validación cruzada de pertenencia al negocio y funciones de utilidad. Las migraciones son idempotentes (uso intensivo de `if not exists`, bloques `do $$ ... $$` y `create or replace`).

### Orden de migraciones y extensiones

| Archivo | Propósito |
|---|---|
| [202605270001_team_business_model.sql](supabase/migrations/202605270001_team_business_model.sql) | Modelo de propiedad compartida por equipo/negocio: tablas `businesses` y `business_memberships`, funciones `is_business_member` / `is_business_admin`, añade `business_id` a tablas existentes y crea sus RLS. |
| [202605280001_production_app_schema.sql](supabase/migrations/202605280001_production_app_schema.sql) | Esquema base de producción: `perfiles`, `categorias`, `productos`, `producto_variantes`, `movimientos_stock`, `ventas`, `venta_lineas`, `venta_pagos`, `transacciones`; triggers, funciones y RLS. |

La segunda migración asume explícitamente que la primera ya creó `businesses`, `business_memberships`, `is_business_member()` e `is_business_admin()` ([202605280001:2-3](supabase/migrations/202605280001_production_app_schema.sql#L2)).

Ambas migraciones ejecutan `create extension if not exists pgcrypto;` ([L4](supabase/migrations/202605270001_team_business_model.sql#L4) y [L5](supabase/migrations/202605280001_production_app_schema.sql#L5)), necesaria para `gen_random_uuid()`.

> Nota sobre orden lógico vs. orden de archivo: la primera migración (270001) hace `alter table if exists` sobre `categorias`, `productos`, `movimientos_stock`, `transacciones` para añadir `business_id` ([L33-43](supabase/migrations/202605270001_team_business_model.sql#L33)), y dentro de bloques `do $$` que comprueban `to_regclass(...) is not null` antes de crear índices/políticas. Como esas tablas se crean en la segunda migración (280001), en una base limpia esos `alter`/índices/políticas condicionados de la primera migración no se aplican (las tablas aún no existen). La segunda migración vuelve a crear `business_id` directamente en cada `create table` y vuelve a definir las RLS de negocio. Véase "uncertainties".

---

### ENUMs

No se define ningún tipo `ENUM` nativo de PostgreSQL (`create type ... as enum`). Todos los conjuntos cerrados de valores se implementan mediante restricciones `check (col in (...))` sobre columnas `text`. Inventario de "enumeraciones por CHECK":

| Tabla.columna | Valores permitidos | Default |
|---|---|---|
| `business_memberships.role` | `'admin'` (único valor permitido: `check (role = 'admin')`) | `'admin'` |
| `business_memberships.status` | `'active'`, `'invited'`, `'disabled'` | `'active'` |
| `perfiles.plan` | `'free'`, `'pro'`, `'enterprise'` | `'free'` |
| `categorias.tipo` | `'producto'`, `'gasto'`, `'ingreso'` | (sin default) |
| `productos.estatus` | `'disponible'`, `'pausado'`, `'agotado'` | `'disponible'` |
| `producto_variantes.estatus` | `'disponible'`, `'pausado'`, `'agotado'` | `'disponible'` |
| `movimientos_stock.tipo` | `'entrada'`, `'salida'`, `'ajuste'`, `'venta'`, `'cancelacion'` | (sin default) |
| `ventas.forma_pago_inicial` | `'efectivo'`, `'transferencia'`, `'adeudo'`, `'tarjeta'` (nullable) | (sin default) |
| `ventas.estado_pago` | `'pagada'`, `'parcial'`, `'pendiente'` | `'pendiente'` |
| `ventas.estatus` | `'activa'`, `'cancelada'` | `'activa'` |
| `venta_pagos.forma_pago` | `'efectivo'`, `'transferencia'`, `'tarjeta'` (sin `'adeudo'`) | (sin default) |
| `transacciones.forma_pago` | `'efectivo'`, `'transferencia'`, `'adeudo'`, `'tarjeta'` (nullable) | (sin default) |
| `transacciones.tipo` | `'ingreso'`, `'gasto'`, `'transferencia'` | (sin default) |

En `supabase.types.ts` el bloque `Enums: Record<string, never>` ([supabase.types.ts:419](src/types/supabase.types.ts#L419)) confirma que no hay enums nativos; los valores se expresan como uniones de literales string en las filas.

---

### Tablas

#### `public.businesses` — [L6-13](supabase/migrations/202605270001_team_business_model.sql#L6)

Workspace de negocio compartido. Comentario: "Shared business workspace. All app data should belong to one business, not a single user." ([L240](supabase/migrations/202605270001_team_business_model.sql#L240)).

| Columna | Tipo | Nullable | Default | Constraints / FK |
|---|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` | PRIMARY KEY |
| `name` | text | NO | — | `check (char_length(trim(name)) >= 2)` |
| `slug` | text | SÍ | — | `unique` |
| `created_by` | uuid | SÍ | — | FK → `auth.users(id)` `on delete set null` |
| `created_at` | timestamptz | NO | `now()` | — |
| `updated_at` | timestamptz | NO | `now()` | — |

#### `public.business_memberships` — [L15-25](supabase/migrations/202605270001_team_business_model.sql#L15)

Usuarios autorizados a operar un negocio. Comentario: "Users allowed to operate a business. Current app scope supports only admin members." ([L241](supabase/migrations/202605270001_team_business_model.sql#L241)).

| Columna | Tipo | Nullable | Default | Constraints / FK |
|---|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` | PRIMARY KEY |
| `business_id` | uuid | NO | — | FK → `businesses(id)` `on delete cascade` |
| `user_id` | uuid | NO | — | FK → `auth.users(id)` `on delete cascade` |
| `role` | text | NO | `'admin'` | `check (role = 'admin')` |
| `status` | text | NO | `'active'` | `check (status in ('active','invited','disabled'))` |
| `invited_by` | uuid | SÍ | — | FK → `auth.users(id)` `on delete set null` |
| `joined_at` | timestamptz | SÍ | — | — |
| `created_at` | timestamptz | NO | `now()` | — |
| — | — | — | — | `unique (business_id, user_id)` |

Índices: `idx_business_memberships_user_id` sobre `(user_id)` ([L27-28](supabase/migrations/202605270001_team_business_model.sql#L27)); `idx_business_memberships_business_id` sobre `(business_id)` ([L30-31](supabase/migrations/202605270001_team_business_model.sql#L30)).

#### `public.perfiles` — [L35-43](supabase/migrations/202605280001_production_app_schema.sql#L35)

Perfil 1:1 con `auth.users`.

| Columna | Tipo | Nullable | Default | Constraints / FK |
|---|---|---|---|---|
| `id` | uuid | NO | — | PRIMARY KEY; FK → `auth.users(id)` `on delete cascade` |
| `nombre` | text | SÍ | — | — |
| `empresa` | text | SÍ | — | — |
| `logo_url` | text | SÍ | — | — |
| `plan` | text | NO | `'free'` | `check (plan in ('free','pro','enterprise'))` |
| `created_at` | timestamptz | NO | `now()` | — |
| `updated_at` | timestamptz | NO | `now()` | — |

#### `public.categorias` — [L68-80](supabase/migrations/202605280001_production_app_schema.sql#L68)

| Columna | Tipo | Nullable | Default | Constraints / FK |
|---|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` | PRIMARY KEY |
| `business_id` | uuid | NO | `public.current_business_id()` | FK → `businesses(id)` `on delete cascade` |
| `user_id` | uuid | NO | `auth.uid()` | FK → `auth.users(id)` `on delete restrict` |
| `nombre` | text | NO | — | `check (char_length(trim(nombre)) >= 2)` |
| `tipo` | text | NO | — | `check (tipo in ('producto','gasto','ingreso'))` |
| `icono` | text | SÍ | — | — |
| `color` | text | SÍ | — | — |
| `atributos_base` | text[] | NO | `'{}'` | — |
| `created_at` | timestamptz | NO | `now()` | — |
| `updated_at` | timestamptz | NO | `now()` | — |
| — | — | — | — | `unique (business_id, tipo, nombre)` |

Índice: `idx_categorias_business_tipo` sobre `(business_id, tipo)` ([L214](supabase/migrations/202605280001_production_app_schema.sql#L214)). La primera migración también declara `idx_categorias_business_id` sobre `(business_id)` condicionalmente ([L48-49](supabase/migrations/202605270001_team_business_model.sql#L48)). Comentario de columna `business_id`: "Business owner. New code should use this instead of user_id for shared team data." ([L246](supabase/migrations/202605270001_team_business_model.sql#L246)).

#### `public.productos` — [L82-99](supabase/migrations/202605280001_production_app_schema.sql#L82)

| Columna | Tipo | Nullable | Default | Constraints / FK |
|---|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` | PRIMARY KEY |
| `business_id` | uuid | NO | `public.current_business_id()` | FK → `businesses(id)` `on delete cascade` |
| `user_id` | uuid | NO | `auth.uid()` | FK → `auth.users(id)` `on delete restrict` |
| `nombre` | text | NO | — | `check (char_length(trim(nombre)) >= 2)` |
| `descripcion` | text | SÍ | — | — |
| `categoria_id` | uuid | SÍ | — | FK → `categorias(id)` `on delete set null` |
| `precio_venta` | numeric(12,2) | NO | — | `check (precio_venta > 0)` |
| `precio_costo` | numeric(12,2) | NO | `0` | `check (precio_costo >= 0)` |
| `stock` | integer | NO | `0` | `check (stock >= 0)` |
| `stock_minimo` | integer | NO | `0` | `check (stock_minimo >= 0)` |
| `imagen_url` | text | SÍ | — | — |
| `estatus` | text | NO | `'disponible'` | `check (estatus in ('disponible','pausado','agotado'))` |
| `sku` | text | SÍ | — | — |
| `atributos` | jsonb | NO | `'{}'::jsonb` | — |
| `created_at` | timestamptz | NO | `now()` | — |
| `updated_at` | timestamptz | NO | `now()` | — |

Índices: `idx_productos_business_sku_unique` UNIQUE sobre `(business_id, sku)` con predicado parcial `where sku is not null and sku <> ''` ([L206-208](supabase/migrations/202605280001_production_app_schema.sql#L206)); `idx_productos_business_categoria` sobre `(business_id, categoria_id)` ([L215](supabase/migrations/202605280001_production_app_schema.sql#L215)). La primera migración crea condicionalmente `idx_productos_business_id` y un `idx_productos_business_sku_unique` con predicado `where sku is not null` ([L53-58](supabase/migrations/202605270001_team_business_model.sql#L53)).

#### `public.producto_variantes` — [L101-114](supabase/migrations/202605280001_production_app_schema.sql#L101)

| Columna | Tipo | Nullable | Default | Constraints / FK |
|---|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` | PRIMARY KEY |
| `business_id` | uuid | NO | `public.current_business_id()` | FK → `businesses(id)` `on delete cascade` |
| `producto_id` | uuid | NO | — | FK → `productos(id)` `on delete cascade` |
| `nombre` | text | NO | — | `check (char_length(trim(nombre)) >= 1)` |
| `sku` | text | SÍ | — | — |
| `atributos` | jsonb | NO | `'{}'::jsonb` | — |
| `stock` | integer | NO | `0` | `check (stock >= 0)` |
| `stock_minimo` | integer | NO | `0` | `check (stock_minimo >= 0)` |
| `estatus` | text | NO | `'disponible'` | `check (estatus in ('disponible','pausado','agotado'))` |
| `created_at` | timestamptz | NO | `now()` | — |
| `updated_at` | timestamptz | NO | `now()` | — |
| — | — | — | — | `unique (producto_id, nombre)` |

Índices: `idx_producto_variantes_business_sku_unique` UNIQUE sobre `(business_id, sku)` parcial `where sku is not null and sku <> ''` ([L210-212](supabase/migrations/202605280001_production_app_schema.sql#L210)); `idx_producto_variantes_producto` sobre `(producto_id)` ([L216](supabase/migrations/202605280001_production_app_schema.sql#L216)).

#### `public.movimientos_stock` — [L116-130](supabase/migrations/202605280001_production_app_schema.sql#L116)

Bitácora de movimientos de inventario (sin `updated_at`).

| Columna | Tipo | Nullable | Default | Constraints / FK |
|---|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` | PRIMARY KEY |
| `business_id` | uuid | NO | `public.current_business_id()` | FK → `businesses(id)` `on delete cascade` |
| `producto_id` | uuid | NO | — | FK → `productos(id)` `on delete cascade` |
| `variante_id` | uuid | SÍ | — | FK → `producto_variantes(id)` `on delete set null` |
| `user_id` | uuid | NO | `auth.uid()` | FK → `auth.users(id)` `on delete restrict` |
| `tipo` | text | NO | — | `check (tipo in ('entrada','salida','ajuste','venta','cancelacion'))` |
| `cantidad` | integer | NO | — | `check (cantidad > 0)` |
| `stock_antes` | integer | NO | — | `check (stock_antes >= 0)` |
| `stock_despues` | integer | NO | — | `check (stock_despues >= 0)` |
| `notas` | text | SÍ | — | — |
| `referencia_tipo` | text | SÍ | — | — |
| `referencia_id` | uuid | SÍ | — | (sin FK formal) |
| `created_at` | timestamptz | NO | `now()` | — |

Índices: `idx_movimientos_stock_business_producto` sobre `(business_id, producto_id, created_at desc)` ([L217](supabase/migrations/202605280001_production_app_schema.sql#L217)); `idx_movimientos_stock_business_variante` sobre `(business_id, variante_id, created_at desc)` ([L218](supabase/migrations/202605280001_production_app_schema.sql#L218)).

#### `public.ventas` — [L132-161](supabase/migrations/202605280001_production_app_schema.sql#L132)

| Columna | Tipo | Nullable | Default | Constraints / FK |
|---|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` | PRIMARY KEY |
| `business_id` | uuid | NO | `public.current_business_id()` | FK → `businesses(id)` `on delete cascade` |
| `user_id` | uuid | NO | `auth.uid()` | FK → `auth.users(id)` `on delete restrict` |
| `folio` | text | NO | — | parte de `unique (business_id, folio)` |
| `fecha` | date | NO | `current_date` | — |
| `hora` | time | NO | `localtime(0)` | — |
| `subtotal` | numeric(12,2) | NO | `0` | `check (subtotal >= 0)` |
| `descuento` | numeric(12,2) | NO | `0` | `check (descuento >= 0)` |
| `total` | numeric(12,2) | NO | — | `check (total >= 0)` |
| `monto_pagado` | numeric(12,2) | NO | `0` | `check (monto_pagado >= 0)` |
| `saldo_pendiente` | numeric(12,2) | NO | `0` | `check (saldo_pendiente >= 0)` |
| `forma_pago_inicial` | text | SÍ | — | `check (... in ('efectivo','transferencia','adeudo','tarjeta'))` |
| `estado_pago` | text | NO | `'pendiente'` | `check (... in ('pagada','parcial','pendiente'))` |
| `estatus` | text | NO | `'activa'` | `check (... in ('activa','cancelada'))` |
| `cliente_nombre` | text | SÍ | — | — |
| `cliente_telefono` | text | SÍ | — | — |
| `notas` | text | SÍ | — | — |
| `cancelada_at` | timestamptz | SÍ | — | — |
| `cancelada_por` | uuid | SÍ | — | FK → `auth.users(id)` `on delete set null` |
| `motivo_cancelacion` | text | SÍ | — | — |
| `created_at` | timestamptz | NO | `now()` | — |
| `updated_at` | timestamptz | NO | `now()` | — |

Constraints de tabla:
- `unique (business_id, folio)` ([L155](supabase/migrations/202605280001_production_app_schema.sql#L155)).
- `ventas_saldo_consistente`: `check (round((total - monto_pagado)::numeric, 2) = round(saldo_pendiente::numeric, 2))` ([L156](supabase/migrations/202605280001_production_app_schema.sql#L156)) — fuerza que el saldo pendiente sea exactamente `total - monto_pagado` a 2 decimales.
- `ventas_cancelacion_consistente`: `(estatus='activa' and cancelada_at is null and cancelada_por is null) or (estatus='cancelada' and cancelada_at is not null and motivo_cancelacion is not null)` ([L157-160](supabase/migrations/202605280001_production_app_schema.sql#L157)).

Índices: `idx_ventas_business_fecha` sobre `(business_id, fecha desc, created_at desc)` ([L219](supabase/migrations/202605280001_production_app_schema.sql#L219)); `idx_ventas_business_estado_pago` sobre `(business_id, estado_pago)` ([L220](supabase/migrations/202605280001_production_app_schema.sql#L220)).

#### `public.venta_lineas` — [L163-175](supabase/migrations/202605280001_production_app_schema.sql#L163)

Líneas de detalle de venta (sin `updated_at`). Guarda nombres desnormalizados (`producto_nombre`, `variante_nombre`).

| Columna | Tipo | Nullable | Default | Constraints / FK |
|---|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` | PRIMARY KEY |
| `business_id` | uuid | NO | `public.current_business_id()` | FK → `businesses(id)` `on delete cascade` |
| `venta_id` | uuid | NO | — | FK → `ventas(id)` `on delete cascade` |
| `producto_id` | uuid | NO | — | FK → `productos(id)` `on delete restrict` |
| `variante_id` | uuid | SÍ | — | FK → `producto_variantes(id)` `on delete restrict` |
| `producto_nombre` | text | NO | — | — |
| `variante_nombre` | text | SÍ | — | — |
| `cantidad` | integer | NO | — | `check (cantidad > 0)` |
| `precio_unitario` | numeric(12,2) | NO | — | `check (precio_unitario >= 0)` |
| `subtotal` | numeric(12,2) | NO | — | `check (subtotal >= 0)` |
| `created_at` | timestamptz | NO | `now()` | — |

Índice: `idx_venta_lineas_venta` sobre `(venta_id)` ([L221](supabase/migrations/202605280001_production_app_schema.sql#L221)).

#### `public.venta_pagos` — [L177-186](supabase/migrations/202605280001_production_app_schema.sql#L177)

Pagos asociados a una venta (sin `updated_at`).

| Columna | Tipo | Nullable | Default | Constraints / FK |
|---|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` | PRIMARY KEY |
| `business_id` | uuid | NO | `public.current_business_id()` | FK → `businesses(id)` `on delete cascade` |
| `venta_id` | uuid | NO | — | FK → `ventas(id)` `on delete cascade` |
| `user_id` | uuid | NO | `auth.uid()` | FK → `auth.users(id)` `on delete restrict` |
| `monto` | numeric(12,2) | NO | — | `check (monto > 0)` |
| `forma_pago` | text | NO | — | `check (forma_pago in ('efectivo','transferencia','tarjeta'))` |
| `notas` | text | SÍ | — | — |
| `created_at` | timestamptz | NO | `now()` | — |

Índice: `idx_venta_pagos_venta` sobre `(venta_id)` ([L222](supabase/migrations/202605280001_production_app_schema.sql#L222)).

#### `public.transacciones` — [L188-204](supabase/migrations/202605280001_production_app_schema.sql#L188)

Movimientos financieros (ingresos/gastos/transferencias), sin `updated_at`.

| Columna | Tipo | Nullable | Default | Constraints / FK |
|---|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` | PRIMARY KEY |
| `business_id` | uuid | NO | `public.current_business_id()` | FK → `businesses(id)` `on delete cascade` |
| `user_id` | uuid | NO | `auth.uid()` | FK → `auth.users(id)` `on delete restrict` |
| `fecha` | date | NO | `current_date` | — |
| `concepto` | text | NO | — | `check (char_length(trim(concepto)) >= 2)` |
| `categoria_id` | uuid | SÍ | — | FK → `categorias(id)` `on delete set null` |
| `cantidad` | integer | NO | `1` | `check (cantidad > 0)` |
| `forma_pago` | text | SÍ | — | `check (... in ('efectivo','transferencia','adeudo','tarjeta'))` |
| `monto` | numeric(12,2) | NO | — | `check (monto > 0)` |
| `tipo` | text | NO | — | `check (tipo in ('ingreso','gasto','transferencia'))` |
| `producto_id` | uuid | SÍ | — | FK → `productos(id)` `on delete set null` |
| `venta_id` | uuid | SÍ | — | FK → `ventas(id)` `on delete set null` |
| `venta_pago_id` | uuid | SÍ | — | FK → `venta_pagos(id)` `on delete set null` |
| `notas` | text | SÍ | — | — |
| `created_at` | timestamptz | NO | `now()` | — |

Índice: `idx_transacciones_business_fecha` sobre `(business_id, fecha desc, created_at desc)` ([L223](supabase/migrations/202605280001_production_app_schema.sql#L223)).

---

### Diagrama de relaciones (texto)

```
auth.users (Supabase)
  +--< businesses.created_by            (set null)
  +--< business_memberships.user_id     (cascade)
  +--< business_memberships.invited_by  (set null)
  +--1:1 perfiles.id                    (cascade)
  +--< categorias.user_id               (restrict)
  +--< productos.user_id                (restrict)
  +--< movimientos_stock.user_id        (restrict)
  +--< ventas.user_id                   (restrict)
  +--< ventas.cancelada_por             (set null)
  +--< venta_pagos.user_id              (restrict)
  +--< transacciones.user_id            (restrict)

businesses (1) --< (N) [cascade en todas]
  business_memberships.business_id
  categorias.business_id
  productos.business_id
  producto_variantes.business_id
  movimientos_stock.business_id
  ventas.business_id
  venta_lineas.business_id
  venta_pagos.business_id
  transacciones.business_id

categorias (1) --< productos.categoria_id        (set null)
categorias (1) --< transacciones.categoria_id    (set null)

productos (1) --< producto_variantes.producto_id (cascade)
productos (1) --< movimientos_stock.producto_id  (cascade)
productos (1) --< venta_lineas.producto_id       (restrict)
productos (1) --< transacciones.producto_id      (set null)

producto_variantes (1) --< movimientos_stock.variante_id (set null)
producto_variantes (1) --< venta_lineas.variante_id      (restrict)

ventas (1) --< venta_lineas.venta_id   (cascade)
ventas (1) --< venta_pagos.venta_id    (cascade)
ventas (1) --< transacciones.venta_id  (set null)

venta_pagos (1) --< transacciones.venta_pago_id (set null)
```

La columna `movimientos_stock.referencia_id` (uuid) y `referencia_tipo` (text) forman una referencia polimórfica débil sin FK formal.

---

### Funciones SQL / PLpgSQL

#### `is_business_member(target_business_id uuid) -> boolean` — [L72-86](supabase/migrations/202605270001_team_business_model.sql#L72)

`language sql`, `stable`, `security definer`, `set search_path = public`. Devuelve `true` si existe una fila en `business_memberships` con `business_id = target_business_id`, `user_id = auth.uid()` y `status = 'active'`. Base del filtro RLS de SELECT en las tablas de negocio.

#### `is_business_admin(target_business_id uuid) -> boolean` — [L88-103](supabase/migrations/202605270001_team_business_model.sql#L88)

`language sql`, `stable`, `security definer`, `set search_path = public`. Igual que la anterior pero exige además `role = 'admin'`. Base del filtro RLS de INSERT/UPDATE/DELETE. Permisos para ambas: `revoke all ... from public` y `grant execute ... to authenticated` ([L105-108](supabase/migrations/202605270001_team_business_model.sql#L105)).

#### `set_updated_at() -> trigger` — [L7-15](supabase/migrations/202605280001_production_app_schema.sql#L7)

`language plpgsql`. Asigna `new.updated_at = now()` y retorna `new`. Función genérica de trigger BEFORE UPDATE.

#### `current_business_id() -> uuid` — [L17-30](supabase/migrations/202605280001_production_app_schema.sql#L17)

`language sql`, `stable`, `security definer`, `set search_path = public`. Devuelve el `business_id` de la membresía activa más antigua del usuario autenticado (`status='active'`, `order by created_at asc limit 1`). Es el `default` de la columna `business_id` en todas las tablas de datos. Permisos: revoke from public, grant execute to authenticated ([L32-33](supabase/migrations/202605280001_production_app_schema.sql#L32)).

#### `handle_new_auth_user() -> trigger` — [L45-61](supabase/migrations/202605280001_production_app_schema.sql#L45)

`language plpgsql`, `security definer`, `set search_path = public`. Tras crear un usuario en `auth.users`, inserta en `perfiles (id, nombre)` con `id = new.id` y `nombre = coalesce(new.raw_user_meta_data ->> 'nombre', new.raw_user_meta_data ->> 'name')`, con `on conflict (id) do nothing`. Retorna `new`.

#### `assert_product_category_business() -> trigger` — [L225-244](supabase/migrations/202605280001_production_app_schema.sql#L225)

`language plpgsql`, `security definer`, `set search_path = public`. Si `new.categoria_id is not null` y no existe una categoría con ese id, mismo `business_id` y `tipo = 'producto'`, lanza excepción "La categoria del producto no pertenece al negocio o no es de producto" con `errcode = '23514'` (check_violation).

#### `assert_variant_product_business() -> trigger` — [L246-264](supabase/migrations/202605280001_production_app_schema.sql#L246)

`language plpgsql`, `security definer`, `set search_path = public`. Exige que `new.producto_id` exista en `productos` con el mismo `business_id` que la variante; si no, excepción "La variante no pertenece al mismo negocio que el producto" (`23514`).

#### `assert_stock_movement_business() -> trigger` — [L266-294](supabase/migrations/202605280001_production_app_schema.sql#L266)

`language plpgsql`, `security definer`, `set search_path = public`. (1) Exige que el `producto_id` exista en el mismo negocio; si no, "El movimiento de stock no pertenece al negocio del producto". (2) Si `variante_id is not null`, exige que la variante exista con ese `producto_id` y `business_id`; si no, "El movimiento de stock no pertenece a una variante valida del producto". Ambas con `23514`.

#### `assert_sale_line_business() -> trigger` — [L296-333](supabase/migrations/202605280001_production_app_schema.sql#L296)

`language plpgsql`, `security definer`, `set search_path = public`. Tres validaciones (`23514`): (1) la venta (`venta_id`) pertenece al mismo negocio ("La linea no pertenece al negocio de la venta"); (2) el producto (`producto_id`) pertenece al mismo negocio ("La linea no pertenece al negocio del producto"); (3) si hay `variante_id`, la variante corresponde al `producto_id` y `business_id` ("La linea no pertenece a una variante valida del producto").

#### `assert_sale_payment_business() -> trigger` — [L335-353](supabase/migrations/202605280001_production_app_schema.sql#L335)

`language plpgsql`, `security definer`, `set search_path = public`. Exige que la venta (`venta_id`) del pago pertenezca al mismo negocio; si no, "El pago no pertenece al negocio de la venta" (`23514`).

#### `assert_transaction_business() -> trigger` — [L355-401](supabase/migrations/202605280001_production_app_schema.sql#L355)

`language plpgsql`, `security definer`, `set search_path = public`. Cuatro validaciones condicionales (todas `23514`), cada una sólo si la columna no es nula: (1) `categoria_id` debe existir en el negocio y con `tipo in ('gasto','ingreso')` ("La categoria de la transaccion no pertenece al negocio o no es financiera"); (2) `producto_id` debe existir en el negocio; (3) `venta_id` debe existir en el negocio; (4) `venta_pago_id` debe existir en el negocio.

#### `next_venta_folio(target_business_id uuid) -> text` — [L571-592](supabase/migrations/202605280001_production_app_schema.sql#L571)

`language plpgsql`, `security definer`, `set search_path = public`. Pasos: (1) si `not is_business_admin(target_business_id)` lanza "Not authorized for business %" con `errcode = '42501'` (insufficient_privilege); (2) calcula `next_number = coalesce(max(substring(folio from 'VNT-([0-9]+)')::integer), 0) + 1` sobre `ventas` del negocio cuyo `folio ~ '^VNT-[0-9]+$'`; (3) retorna `'VNT-' || lpad(next_number::text, 6, '0')` (p.ej. `VNT-000001`). Permisos: revoke from public, grant execute to authenticated ([L594-595](supabase/migrations/202605280001_production_app_schema.sql#L594)).

#### `bootstrap_business_defaults(target_business_id uuid) -> void` — [L597-620](supabase/migrations/202605280001_production_app_schema.sql#L597)

`language plpgsql`, `security definer`, `set search_path = public`. Declara `actor uuid := auth.uid()`. Pasos: (1) si `not is_business_admin(target_business_id)` lanza "Not authorized for business %" (`42501`); (2) inserta 6 categorías por defecto en `categorias` (cada una con `user_id = actor`) con `on conflict (business_id, tipo, nombre) do nothing`:

| nombre | tipo | color | atributos_base |
|---|---|---|---|
| Playeras | producto | `#4a6b9b` | `['Talla','Color','Marca','Tipo de tela']` |
| Perfumes | producto | `#c9a84c` | `['Mililitros','Aroma','Genero','Marca']` |
| Ventas | ingreso | `#4a9b6f` | `[]` |
| Transporte | gasto | `#9b7a4a` | `[]` |
| Publicidad | gasto | `#9b4a4a` | `[]` |
| Inventario | gasto | `#4a6b9b` | `[]` |

Permisos: revoke from public, grant execute to authenticated ([L622-623](supabase/migrations/202605280001_production_app_schema.sql#L622)).

---

### Triggers

| Trigger | Tabla | Momento / evento | Función |
|---|---|---|---|
| `on_auth_user_created_create_profile` | `auth.users` | AFTER INSERT, FOR EACH ROW | `handle_new_auth_user()` ([L63-66](supabase/migrations/202605280001_production_app_schema.sql#L63)) |
| `productos_assert_business` | `productos` | BEFORE INSERT OR UPDATE, FOR EACH ROW | `assert_product_category_business()` ([L403-406](supabase/migrations/202605280001_production_app_schema.sql#L403)) |
| `producto_variantes_assert_business` | `producto_variantes` | BEFORE INSERT OR UPDATE | `assert_variant_product_business()` ([L408-411](supabase/migrations/202605280001_production_app_schema.sql#L408)) |
| `movimientos_stock_assert_business` | `movimientos_stock` | BEFORE INSERT OR UPDATE | `assert_stock_movement_business()` ([L413-416](supabase/migrations/202605280001_production_app_schema.sql#L413)) |
| `venta_lineas_assert_business` | `venta_lineas` | BEFORE INSERT OR UPDATE | `assert_sale_line_business()` ([L418-421](supabase/migrations/202605280001_production_app_schema.sql#L418)) |
| `venta_pagos_assert_business` | `venta_pagos` | BEFORE INSERT OR UPDATE | `assert_sale_payment_business()` ([L423-426](supabase/migrations/202605280001_production_app_schema.sql#L423)) |
| `transacciones_assert_business` | `transacciones` | BEFORE INSERT OR UPDATE | `assert_transaction_business()` ([L428-431](supabase/migrations/202605280001_production_app_schema.sql#L428)) |
| `perfiles_set_updated_at` | `perfiles` | BEFORE UPDATE | `set_updated_at()` ([L433-436](supabase/migrations/202605280001_production_app_schema.sql#L433)) |
| `businesses_set_updated_at` | `businesses` | BEFORE UPDATE | `set_updated_at()` ([L438-441](supabase/migrations/202605280001_production_app_schema.sql#L438)) |
| `categorias_set_updated_at` | `categorias` | BEFORE UPDATE | `set_updated_at()` ([L443-446](supabase/migrations/202605280001_production_app_schema.sql#L443)) |
| `productos_set_updated_at` | `productos` | BEFORE UPDATE | `set_updated_at()` ([L448-451](supabase/migrations/202605280001_production_app_schema.sql#L448)) |
| `producto_variantes_set_updated_at` | `producto_variantes` | BEFORE UPDATE | `set_updated_at()` ([L453-456](supabase/migrations/202605280001_production_app_schema.sql#L453)) |
| `ventas_set_updated_at` | `ventas` | BEFORE UPDATE | `set_updated_at()` ([L458-461](supabase/migrations/202605280001_production_app_schema.sql#L458)) |

Cada `create trigger` va precedido de su `drop trigger if exists` (idempotencia). `set_updated_at` NO se aplica a `movimientos_stock`, `venta_lineas`, `venta_pagos` ni `transacciones` (esas tablas no tienen columna `updated_at`).

---

### Políticas RLS

RLS habilitado con `enable row level security` en: `businesses`, `business_memberships` ([L110-111](supabase/migrations/202605270001_team_business_model.sql#L110)); `perfiles`, `categorias`, `productos`, `producto_variantes`, `movimientos_stock`, `ventas`, `venta_lineas`, `venta_pagos`, `transacciones` ([L463-471](supabase/migrations/202605280001_production_app_schema.sql#L463)). Todas las políticas aplican al rol `authenticated`.

#### Políticas sobre `businesses` ([L119-147](supabase/migrations/202605270001_team_business_model.sql#L119))

| Política | Operación | USING | WITH CHECK |
|---|---|---|---|
| `businesses_select_member` | SELECT | `public.is_business_member(id)` | — |
| `businesses_insert_creator` | INSERT | — | `created_by = auth.uid()` |
| `businesses_update_admin` | UPDATE | `public.is_business_admin(id)` | `public.is_business_admin(id)` |

No hay política de DELETE para `businesses`.

#### Políticas sobre `business_memberships` ([L153-181](supabase/migrations/202605270001_team_business_model.sql#L153))

| Política | Operación | USING | WITH CHECK |
|---|---|---|---|
| `business_memberships_select_member` | SELECT | `public.is_business_member(business_id)` | — |
| `business_memberships_insert_admin` | INSERT | — | `public.is_business_admin(business_id)` |
| `business_memberships_update_admin` | UPDATE | `public.is_business_admin(business_id)` | `public.is_business_admin(business_id)` |

Sin política DELETE.

#### Políticas sobre `perfiles` ([L479-507](supabase/migrations/202605280001_production_app_schema.sql#L479))

| Política | Operación | USING | WITH CHECK |
|---|---|---|---|
| `perfiles_select_own` | SELECT | `id = auth.uid()` | — |
| `perfiles_insert_own` | INSERT | — | `id = auth.uid()` |
| `perfiles_update_own` | UPDATE | `id = auth.uid()` | `id = auth.uid()` |

Sin política DELETE (el borrado real depende del `cascade` desde `auth.users`).

#### Políticas de negocio para tablas de datos

Generadas en bucle `do $$` para el array `['categorias','productos','producto_variantes','movimientos_stock','ventas','venta_lineas','venta_pagos','transacciones']` ([L510-569](supabase/migrations/202605280001_production_app_schema.sql#L510)). Para CADA tabla `<t>` se crean cuatro políticas con el patrón:

| Política | Operación | USING | WITH CHECK |
|---|---|---|---|
| `<t>_business_select` | SELECT | `public.is_business_member(business_id)` | — |
| `<t>_business_insert` | INSERT | — | `public.is_business_admin(business_id)` |
| `<t>_business_update` | UPDATE | `public.is_business_admin(business_id)` | `public.is_business_admin(business_id)` |
| `<t>_business_delete` | DELETE | `public.is_business_admin(business_id)` | — |

Cualquier miembro activo puede leer; sólo administradores activos pueden insertar/actualizar/borrar. La primera migración ([L184-238](supabase/migrations/202605270001_team_business_model.sql#L184)) genera exactamente el mismo conjunto de 4 políticas para `['categorias','productos','movimientos_stock','transacciones']`, condicionado a que la tabla exista (`to_regclass(...) is not null`) y haciendo además `enable row level security` sobre cada tabla. La segunda migración cubre además `producto_variantes`, `ventas`, `venta_lineas`, `venta_pagos`. Las cláusulas `if not exists` por `policyname` evitan duplicados entre migraciones. Resumen: lectura = `is_business_member`; escritura = `is_business_admin`. Como `role` sólo admite `'admin'`, en la práctica todo miembro activo es administrador, pero la separación de funciones queda preparada.

---

### Datos semilla (`seed.sql`)

El archivo [supabase/seed.sql](supabase/seed.sql) NO contiene datos. Sólo dos comentarios ([L1-2](supabase/seed.sql#L1)): "Local development seed file." y "Production bootstrap should be done with docs/supabase-produccion.md after auth users exist." No inserta ninguna fila. El bootstrap de producción se delega a `docs/supabase-produccion.md` y a `bootstrap_business_defaults()`, que debe ejecutarse tras existir usuarios en `auth.users`. En `config.toml`, la sección `[db.seed]` ([L60](supabase/config.toml#L60)) está `enabled = true` ([L62](supabase/config.toml#L62)) con `sql_paths = ["./seed.sql"]` ([L65](supabase/config.toml#L65)); en `supabase db reset` se cargaría este archivo vacío tras las migraciones.

---

### Configuración relevante (`config.toml`)

| Sección | Clave | Valor | Línea |
|---|---|---|---|
| general | `project_id` | `"NexxuzApp"` | [L5](supabase/config.toml#L5) |
| `[api]` | `port` | `54321` | [L10](supabase/config.toml#L10) |
| `[api]` | `schemas` | `["public","graphql_public"]` | [L13](supabase/config.toml#L13) |
| `[api]` | `extra_search_path` | `["public","extensions"]` | [L15](supabase/config.toml#L15) |
| `[api]` | `max_rows` | `1000` | [L18](supabase/config.toml#L18) |
| `[db]` | `port` | `54322` | [L29](supabase/config.toml#L29) |
| `[db]` | `major_version` | `17` | [L36](supabase/config.toml#L36) |
| `[db.migrations]` | `enabled` | `true` | [L55](supabase/config.toml#L55) |
| `[db.seed]` | `enabled` / `sql_paths` | `true` / `["./seed.sql"]` | [L62-65](supabase/config.toml#L62) |
| `[storage]` | `enabled` / `file_size_limit` | `true` / `"50MiB"` | [L110-112](supabase/config.toml#L110) |
| `[storage.s3_protocol]` | `enabled` | `true` | [L123](supabase/config.toml#L123) |
| `[auth]` | `site_url` | `"http://127.0.0.1:3000"` | [L154](supabase/config.toml#L154) |
| `[auth]` | `additional_redirect_urls` | `["https://127.0.0.1:3000"]` | [L158](supabase/config.toml#L158) |
| `[auth]` | `jwt_expiry` | `3600` | [L160](supabase/config.toml#L160) |
| `[auth]` | `enable_signup` | `true` | [L171](supabase/config.toml#L171) |
| `[auth]` | `minimum_password_length` | `6` | [L177](supabase/config.toml#L177) |
| `[auth.email]` | `enable_confirmations` | `false` | [L221](supabase/config.toml#L221) |
| `[experimental]` | `s3_host/region/access_key/secret_key` | `env(S3_*)` | [L394-400](supabase/config.toml#L394) |

No hay buckets de Storage configurados explícitamente (las secciones `[storage.buckets.*]` están comentadas). Este archivo sólo habilita el protocolo S3 local y deja las credenciales S3 experimentales por variables de entorno.

---

### Mapeo de tipos TypeScript (`supabase.types.ts`)

El archivo [src/types/supabase.types.ts](src/types/supabase.types.ts) define manualmente la interfaz `Database` (no es la salida estándar del generador de Supabase; es una versión simplificada con helpers propios). Elementos clave:

- `type Json` ([L1](src/types/supabase.types.ts#L1)): unión recursiva `string | number | boolean | null | { [key: string]: Json | undefined } | Json[]`. Mapea las columnas `jsonb` (`productos.atributos`, `producto_variantes.atributos`).
- Helper `Table<Row, Insert = Row, Update = Partial<Row>>` ([L3-8](src/types/supabase.types.ts#L3)): cada tabla expone `Row`, `Insert`, `Update` y `Relationships: []`. Todos los registros se intersectan con `Record<string, unknown>`, lo que afloja el tipado (permite propiedades extra).
- `GenericSupabaseTable` ([L10-15](src/types/supabase.types.ts#L10)) y el index signature `[key: string]: GenericSupabaseTable` ([L30](src/types/supabase.types.ts#L30)) hacen que cualquier nombre de tabla sea válido en el cliente (tipado permisivo).
- `Views`, `Functions`, `Enums` y `CompositeTypes` son genéricos/vacíos ([L413-420](src/types/supabase.types.ts#L413)); `Enums: Record<string, never>` y `CompositeTypes: Record<string, never>`. Las funciones SQL (`next_venta_folio`, `bootstrap_business_defaults`, etc.) NO están tipadas individualmente: el index signature `[key: string]: GenericSupabaseFunction` ([L417](src/types/supabase.types.ts#L417)) las acepta con `Args` y `Returns` genéricos.

Correspondencia tipo TS vs tipo SQL (puntos donde difieren):

| Tabla TS | Diferencia relevante respecto al SQL |
|---|---|
| `businesses` | `Update` sólo permite `name`, `slug`, `updated_at`. Coincide con el esquema. |
| `business_memberships` | `role: "admin"` (literal único), coincide con `check (role='admin')`. `status` unión de 3 valores. |
| `perfiles` | `plan` unión `"free"\|"pro"\|"enterprise"`. `Insert.id` obligatorio, coherente con que `perfiles.id` no tiene default. |
| `categorias` | `business_id: string \| null` en `Row` ([L112](src/types/supabase.types.ts#L112)), pero el SQL es `not null`. DISCREPANCIA de nullabilidad. `atributos_base: string[]` (no nullable). |
| `productos` | `business_id: string \| null` (Row) vs SQL `not null`. `precio_costo: number \| null` en TS vs SQL `not null default 0`. DISCREPANCIAS. `atributos: Json`. El `Update` incluye `business_id?` pero NO `user_id`. |
| `producto_variantes` | `business_id: string \| null` (Row) vs SQL `not null`. DISCREPANCIA. |
| `movimientos_stock` | Sólo `Row` e `Insert` (sin tercer arg, `Update = Partial<Row>`). `business_id: string \| null` vs SQL `not null`. `referencia_id: string \| null` mapea `uuid`. |
| `ventas` | `business_id: string \| null` vs SQL `not null`. Uniones de literales en `forma_pago_inicial` (incl. `null`), `estado_pago`, `estatus`. `Update` restringido a campos de pago/cancelación. |
| `venta_lineas` | Sólo `Row` e `Insert`. `business_id: string \| null` vs SQL `not null`. |
| `venta_pagos` | Sólo `Row` e `Insert`. `forma_pago: "efectivo"\|"transferencia"\|"tarjeta"` (sin `adeudo`), coincide con el `check`. `business_id: string \| null` vs SQL `not null`. |
| `transacciones` | Sólo `Row` e `Insert`. `forma_pago` unión con `null`. `tipo: "ingreso"\|"gasto"\|"transferencia"`. `business_id: string \| null` vs SQL `not null`. |

Patrón general: en TS todas las columnas `business_id` se tipan `string | null`, mientras el SQL las declara `not null` (con default `current_business_id()`). Refleja que la inserción puede omitir `business_id` (lo rellena el default). Asimismo `productos.precio_costo` está como `number | null` en TS pese a ser `not null default 0` en SQL. Las columnas `timestamptz`, `date` y `time` se mapean a `string`; `numeric(12,2)` e `integer` a `number`; `uuid` a `string`.

---

## 5. Autenticación y Contexto de Negocio

Este subsistema cubre el inicio de sesión (login), el registro (register), el "logout" tal como está implementado, la obtención/exigencia del usuario autenticado del lado del servidor (`requireUser` / `getAuthenticatedSession`), la resolución del negocio/equipo activo del usuario (`requireBusinessContext`) y la clase de errores tipados `AppError`. Toda la documentación se basa exclusivamente en el código leído.

### Visión general del flujo

NexxuzApp tiene **dos caminos de autenticación coexistentes** para el login, ambos contra Supabase Auth con `signInWithPassword`:

1. **Server Actions** en [src/actions/auth.ts](src/actions/auth.ts) (`login`, `register`), que usan el cliente Supabase de **servidor** (`createSupabaseServerClient`, basado en cookies SSR) y terminan con `redirect("/dashboard")`.
2. **Cliente de navegador** en la página de login [src/app/(auth)/login/page.tsx](src/app/(auth)/login/page.tsx#L8), que usa el cliente Supabase de **navegador** (`createSupabaseBrowserClient`) y redirige con `window.location.href = "/dashboard"`.

La página de login renderizada (`LoginPage`) **NO invoca las Server Actions `login`/`register`**; usa su propio `handleSubmit` con el cliente de navegador. Las Server Actions de [auth.ts](src/actions/auth.ts) están definidas pero **no se importan ni referencian en ningún lugar del código** (verificado con búsqueda global de imports desde `@/actions/auth`); en particular, **no existe ninguna página `/register`** en `src/app` que use `register`.

Del lado protegido, las funciones de servidor `requireUser` y `requireBusinessContext` validan la sesión vía cookies y resuelven la pertenencia del usuario a un negocio.

---

### Server Actions de autenticación — [src/actions/auth.ts](src/actions/auth.ts)

El archivo declara `"use server"` en su primera línea ([auth.ts:1](src/actions/auth.ts#L1)), por lo que todas las funciones exportadas son **Server Actions**.

Imports: `redirect` de `next/navigation`, `z` de `zod`, y `createSupabaseServerClient` de `@/lib/supabase/server`.

#### Esquema de validación `authSchema` — [auth.ts:7](src/actions/auth.ts#L7)

```ts
const authSchema = z.object({
  email: z.string().email("Email invalido"),
  password: z.string().min(6, "La contrasena debe tener al menos 6 caracteres"),
  nombre: z.string().min(2).optional(),
})
```

| Campo | Tipo | Reglas Zod | Mensaje de error |
|-------|------|-----------|------------------|
| `email` | `string` | `.email()` (formato email válido) | `"Email invalido"` |
| `password` | `string` | `.min(6)` (mínimo 6 caracteres) | `"La contrasena debe tener al menos 6 caracteres"` |
| `nombre` | `string` opcional | `.min(2)` (mínimo 2 caracteres) — sin mensaje personalizado | mensaje por defecto de Zod |

#### `login(formData: FormData)` — [auth.ts:13](src/actions/auth.ts#L13)

- **Tipo:** Server Action (`'use server'`).
- **Firma:** `export async function login(formData: FormData)`.
- **Parámetro:** `formData: FormData`.
- **Retorno:** `Promise<void>` implícito; nunca retorna normalmente porque termina en `redirect`.
- **Pasos:**
  1. Construye `values` con `authSchema.omit({ nombre: true }).parse(...)` leyendo `formData.get("email")` y `formData.get("password")` ([auth.ts:14-17](src/actions/auth.ts#L14)). Es decir, valida solo `email` y `password` (omite `nombre`). Si la validación falla, `.parse` lanza un `ZodError`.
  2. `const supabase = await createSupabaseServerClient()` ([auth.ts:18](src/actions/auth.ts#L18)).
  3. Si `supabase` es truthy ([auth.ts:20](src/actions/auth.ts#L20)): llama `await supabase.auth.signInWithPassword(values)`. Si `error`, lanza `new Error(error.message)` ([auth.ts:21-24](src/actions/auth.ts#L21)).
  4. `redirect("/dashboard")` ([auth.ts:27](src/actions/auth.ts#L27)) — se ejecuta **siempre que no se haya lanzado error**, incluso si `supabase` fue `null` (configuración ausente). En ese caso redirige a `/dashboard` sin haber autenticado.
- **Efectos secundarios:** crea sesión en Supabase Auth (escribe cookies de sesión vía el cliente de servidor, cuyo handler `setAll` hace `cookieStore.set(name, value, options)` en [server.ts:18-20](src/lib/supabase/server.ts#L18)); `redirect("/dashboard")`. No hay `revalidatePath`/`revalidateTag` ni llamadas a R2.

#### `register(formData: FormData)` — [auth.ts:30](src/actions/auth.ts#L30)

- **Tipo:** Server Action (`'use server'`).
- **Firma:** `export async function register(formData: FormData)`.
- **Parámetro:** `formData: FormData`.
- **Retorno:** `Promise<void>` implícito; termina en `redirect`.
- **Pasos:**
  1. `values = authSchema.parse({ email, password, nombre })` leyendo los tres campos de `formData` ([auth.ts:31-35](src/actions/auth.ts#L31)). Aquí valida los tres (incluido `nombre` opcional con `.min(2)`).
  2. `const supabase = await createSupabaseServerClient()` ([auth.ts:36](src/actions/auth.ts#L36)).
  3. Si `supabase` es truthy: llama `await supabase.auth.signUp({ email: values.email, password: values.password, options: { data: { nombre: values.nombre } } })` ([auth.ts:39-47](src/actions/auth.ts#L39)). El `nombre` se guarda en los metadatos del usuario (`user_metadata.nombre`). Si `error`, lanza `new Error(error.message)` ([auth.ts:49-51](src/actions/auth.ts#L49)).
  4. `redirect("/dashboard")` ([auth.ts:54](src/actions/auth.ts#L54)).
- **Efectos secundarios:** crea usuario en Supabase Auth con metadato `nombre`; potencialmente escribe cookies de sesión; `redirect("/dashboard")`.
- **Nota:** No existe ninguna Server Action de `logout`/`signOut` en este archivo (ver sección "Logout").

---

### Clientes Supabase utilizados (dependencias directas del subsistema)

#### `createSupabaseServerClient()` — [src/lib/supabase/server.ts:4](src/lib/supabase/server.ts#L4)

- **Tipo:** función de servidor (usa `next/headers`).
- **Firma:** `export async function createSupabaseServerClient()`.
- **Retorno:** un cliente `createServerClient` de `@supabase/ssr`, **o `null`** si faltan `NEXT_PUBLIC_SUPABASE_URL` o `NEXT_PUBLIC_SUPABASE_ANON_KEY` ([server.ts:9-11](src/lib/supabase/server.ts#L9)).
- **Pasos:** obtiene `cookieStore = await cookies()`; lee las dos variables de entorno; si falta alguna retorna `null`; si no, crea el cliente con handlers de cookies `getAll()` (devuelve `cookieStore.getAll()`) y `setAll(...)` (itera y hace `cookieStore.set(name, value, options)`).
- **Efecto secundario relevante:** puede leer/escribir cookies de sesión Supabase.

#### `createSupabaseBrowserClient()` — [src/lib/supabase/client.ts:3](src/lib/supabase/client.ts#L3)

- **Tipo:** función de navegador (importable en componentes cliente).
- **Firma:** `export function createSupabaseBrowserClient()`.
- **Retorno:** cliente `createBrowserClient` de `@supabase/ssr` (creado con solo `url` y `anonKey`), **o `null`** si faltan las variables de entorno públicas ([client.ts:7-9](src/lib/supabase/client.ts#L7)).

---

### Layout del grupo (auth) — [src/app/(auth)/layout.tsx](src/app/(auth)/layout.tsx)

- **Tipo:** Server Component (no tiene `"use client"`).
- **Firma:** `export default function AuthLayout({ children }: { children: ReactNode })`.
- **Props:**

| Prop | Tipo | Por defecto |
|------|------|-------------|
| `children` | `ReactNode` (importado como `type` de `react`) | — (requerido) |

- **Comportamiento:** envuelve `{children}` en `<main className="auth-shell">`. Sin lógica, sin efectos secundarios.

---

### Página de login — [src/app/(auth)/login/page.tsx](src/app/(auth)/login/page.tsx)

- **Tipo:** **Componente cliente** (`"use client"` en [línea 1](src/app/(auth)/login/page.tsx#L1)).
- **Firma:** `export default function LoginPage()`.
- **Imports relevantes:** `useState` de React; iconos `Eye, EyeOff, LogIn, CheckCircle` de `lucide-react`; `NexxusLogo` de `@/components/shared/NexxusLogo`; `createSupabaseBrowserClient` de `@/lib/supabase/client`.

#### Estado local (`useState`) — [page.tsx:9-12](src/app/(auth)/login/page.tsx#L9)

| Estado | Tipo | Valor inicial |
|--------|------|---------------|
| `showPassword` | `boolean` | `false` |
| `loading` | `boolean` | `false` |
| `error` | `string` | `""` |
| `success` | `boolean` | `false` |

#### `handleSubmit(e)` — [page.tsx:14](src/app/(auth)/login/page.tsx#L14)

- **Firma:** `async function handleSubmit(e: { preventDefault: () => void; currentTarget: HTMLFormElement })`.
- **Pasos:**
  1. `e.preventDefault()`; `setError("")`; `setLoading(true)` ([page.tsx:15-17](src/app/(auth)/login/page.tsx#L15)).
  2. Lee `email` y `password` desde `form.elements.namedItem(...)` casteado a `HTMLInputElement` ([page.tsx:19-21](src/app/(auth)/login/page.tsx#L19)).
  3. `const supabase = createSupabaseBrowserClient()`; si es `null`, set `error = "Error de configuración: no se pudo conectar con el servidor."`, `setLoading(false)` y `return` ([page.tsx:23-28](src/app/(auth)/login/page.tsx#L23)).
  4. `await supabase.auth.signInWithPassword({ email, password })` ([page.tsx:30](src/app/(auth)/login/page.tsx#L30)).
  5. Si `authError`, mapea el mensaje ([page.tsx:32-42](src/app/(auth)/login/page.tsx#L32)):

| `authError.message` | Mensaje mostrado al usuario |
|---------------------|-----------------------------|
| `"Invalid login credentials"` | `"Correo o contraseña incorrectos."` |
| `"Email not confirmed"` | `"Debes confirmar tu correo antes de iniciar sesión."` |
| cualquier otro | `"Ocurrió un error al iniciar sesión. Intenta de nuevo."` |

     Tras setear el error: `setLoading(false)` y `return`.
  6. Si no hubo error: `setSuccess(true)` y `setTimeout(() => { window.location.href = "/dashboard" }, 800)` — redirige a `/dashboard` tras **800 ms** ([page.tsx:44-45](src/app/(auth)/login/page.tsx#L44)).

- **Efectos secundarios:** autenticación contra Supabase (cliente de navegador, gestiona cookies/almacenamiento del lado cliente); navegación dura del navegador a `/dashboard`.

#### UI / render — [page.tsx:48-167](src/app/(auth)/login/page.tsx#L48)

- Contenedor `<section className="surface">` con ancho `min(460px, 100%)` y padding `"36px 32px"` ([page.tsx:49](src/app/(auth)/login/page.tsx#L49)).
- Encabezado con `<NexxusLogo />` y subtítulo "Accede a tu cuenta para continuar." ([page.tsx:51-56](src/app/(auth)/login/page.tsx#L51)).
- Banner de éxito (`role="status"`) condicionado por `success`, con icono `CheckCircle` y texto "Sesión iniciada correctamente. Redirigiendo…" ([page.tsx:58-77](src/app/(auth)/login/page.tsx#L58)).
- Banner de error (`role="alert"`) condicionado por `error`, mostrando el mensaje ([page.tsx:79-94](src/app/(auth)/login/page.tsx#L79)).
- `<form onSubmit={handleSubmit}>` ([page.tsx:96](src/app/(auth)/login/page.tsx#L96)):
  - Input `email`: `type="email"`, `name="email"`, `placeholder="tu@empresa.com"`, `autoComplete="email"`, `autoFocus`, `required` ([page.tsx:100-108](src/app/(auth)/login/page.tsx#L100)).
  - Botón "¿Olvidaste tu contraseña?" de `type="button"` **sin handler `onClick`** (no hace nada) ([page.tsx:114-119](src/app/(auth)/login/page.tsx#L114)).
  - Input `password`: `type={showPassword ? "text" : "password"}`, `name="password"`, `placeholder="••••••••"`, `autoComplete="current-password"`, `required` ([page.tsx:122-130](src/app/(auth)/login/page.tsx#L122)).
  - Botón toggle de visibilidad con `onClick={() => setShowPassword((v) => !v)}`, `aria-label` dinámico ("Ocultar contraseña"/"Mostrar contraseña"), alterna iconos `EyeOff`/`Eye` ([page.tsx:131-142](src/app/(auth)/login/page.tsx#L131)).
  - Botón submit `className="button button-primary"`, `type="submit"`, `disabled={loading || success}`; etiqueta según estado: si `success` → "Sesión iniciada" con `CheckCircle`; si `loading` → "Verificando…"; si no → "Iniciar sesión" con icono `LogIn` ([page.tsx:146-163](src/app/(auth)/login/page.tsx#L146)).
- **No hay enlace ni formulario de registro** en esta página (no se llama `register`).

---

### Página de error del grupo (auth) — [src/app/(auth)/error.tsx](src/app/(auth)/error.tsx)

- **Tipo:** **Componente cliente** (`"use client"`); es el error boundary del segmento `(auth)` de Next.js.
- **Firma:** `export default function ErrorPage({ reset }: { error: Error; reset: () => void })`.
- **Props:**

| Prop | Tipo | Uso |
|------|------|-----|
| `error` | `Error` | declarada en el tipo del parámetro pero **no se desestructura ni se usa** dentro del componente |
| `reset` | `() => void` | se invoca en el `onClick` del botón "Reintentar" |

- **Comportamiento:** renderiza `<div className="surface" style={{ padding: 20 }}>` con `<h2>No se pudo procesar la autenticacion</h2>` y un botón `className="button button-primary"` "Reintentar" cuyo `onClick={reset}` llama a `reset` ([error.tsx:4-9](src/app/(auth)/error.tsx#L4)).

---

### Página de carga del grupo (auth) — [src/app/(auth)/loading.tsx](src/app/(auth)/loading.tsx)

- **Tipo:** Server Component (sin `"use client"`); es el `loading.tsx` del segmento.
- **Firma:** `export default function Loading()`.
- **Comportamiento:** retorna `<div>Cargando...</div>` ([loading.tsx:2](src/app/(auth)/loading.tsx#L2)).

---

### Exigir usuario autenticado — [src/server/auth/require-user.ts](src/server/auth/require-user.ts)

Archivo marcado con `import "server-only"` ([require-user.ts:1](src/server/auth/require-user.ts#L1)), por lo que solo puede importarse en el servidor. Importa `type User` de `@supabase/supabase-js`, `redirect` de `next/navigation`, `createSupabaseServerClient` y `AppError`.

#### Tipo `AuthenticatedSession` — [require-user.ts:8](src/server/auth/require-user.ts#L8)

```ts
export type AuthenticatedSession = {
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>
  user: User
}
```

- `supabase`: el cliente de servidor garantizado no-`null` (`NonNullable<...>`).
- `user`: el `User` de Supabase.

#### `getAuthenticatedSession()` — [require-user.ts:13](src/server/auth/require-user.ts#L13)

- **Firma:** `export async function getAuthenticatedSession(): Promise<AuthenticatedSession | null>`.
- **Pasos:**
  1. `const supabase = await createSupabaseServerClient()`.
  2. Si `!supabase` → lanza `new AppError("CONFIGURATION_ERROR", "Supabase no esta configurado para ejecutar acciones de servidor.", 500, false)` ([require-user.ts:16-23](src/server/auth/require-user.ts#L16)). Nótese `expose = false`.
  3. `const { data: { user }, error } = await supabase.auth.getUser()` ([require-user.ts:25-28](src/server/auth/require-user.ts#L25)).
  4. Si `error` → lanza `new AppError("UNAUTHORIZED", "No se pudo validar la sesion.", 401)` ([require-user.ts:30-32](src/server/auth/require-user.ts#L30)).
  5. Si `!user` → retorna `null` ([require-user.ts:34-36](src/server/auth/require-user.ts#L34)).
  6. Si hay usuario → retorna `{ supabase, user }`.
- **Retorno:** `AuthenticatedSession | null`.
- **Efectos secundarios:** lectura de sesión vía `supabase.auth.getUser()` (valida cookies). No escribe BD, no redirige.

#### `requireUser()` — [require-user.ts:41](src/server/auth/require-user.ts#L41)

- **Firma:** `export async function requireUser(): Promise<AuthenticatedSession>`.
- **Pasos:**
  1. `const session = await getAuthenticatedSession()`.
  2. Si `!session` → `redirect("/login")` ([require-user.ts:44-46](src/server/auth/require-user.ts#L44)).
  3. Si hay sesión → la retorna.
- **Retorno:** `AuthenticatedSession` (garantizado no-null).
- **Efecto secundario:** `redirect("/login")` cuando no hay usuario. Propaga los `AppError` lanzados por `getAuthenticatedSession`.

---

### Contexto de negocio — [src/server/business/business-context.ts](src/server/business/business-context.ts)

Archivo `import "server-only"` ([business-context.ts:1](src/server/business/business-context.ts#L1)). Importa `createSupabaseServerClient`, `requireUser` y `AppError`.

#### Tipos — [business-context.ts:7-24](src/server/business/business-context.ts#L7)

- `export type BusinessRole = "admin"` — único rol soportado (literal `"admin"`).
- `type SupabaseClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>` (alias local).
- `export type BusinessContext`:

```ts
export type BusinessContext = {
  supabase: SupabaseClient
  business: { id: string; name: string; slug: string | null }
  membership: { role: BusinessRole }
  user: { id: string; email?: string }
}
```

#### `requireBusinessContext()` — [business-context.ts:26](src/server/business/business-context.ts#L26)

- **Firma:** `export async function requireBusinessContext(): Promise<BusinessContext>`.
- **Pasos:**
  1. `const { supabase, user } = await requireUser()` ([business-context.ts:27](src/server/business/business-context.ts#L27)) — exige sesión (redirige a `/login` si no hay).
  2. **Consulta de membresía** sobre la tabla `business_memberships` ([business-context.ts:29-36](src/server/business/business-context.ts#L29)):
     - `.select("business_id, role")`
     - `.eq("user_id", user.id)`
     - `.eq("status", "active")`
     - `.order("created_at", { ascending: true })`
     - `.limit(1)`
     - `.maybeSingle()`
     - Es decir, toma la **membresía activa más antigua** del usuario.
  3. Si `membershipError` → lanza `new AppError("INTERNAL_ERROR", "No se pudo cargar el negocio activo.", 500, false)` ([business-context.ts:38-40](src/server/business/business-context.ts#L38)).
  4. Si `!membership` → lanza `new AppError("FORBIDDEN", "Tu usuario no pertenece a ningun negocio activo.", 403)` ([business-context.ts:42-48](src/server/business/business-context.ts#L42)).
  5. **Consulta del negocio** sobre la tabla `businesses` ([business-context.ts:50-54](src/server/business/business-context.ts#L50)):
     - `.select("id, name, slug")`
     - `.eq("id", membership.business_id)`
     - `.single()`
  6. Si `businessError || !business` → lanza `new AppError("NOT_FOUND", "No se encontro el negocio activo.", 404)` ([business-context.ts:56-58](src/server/business/business-context.ts#L56)).
  7. Retorna el objeto `BusinessContext` ([business-context.ts:60-74](src/server/business/business-context.ts#L60)) con:
     - `supabase`
     - `business`: `{ id: business.id, name: business.name, slug: business.slug }`
     - `membership`: `{ role: membership.role as BusinessRole }` (cast explícito a `BusinessRole`)
     - `user`: `{ id: user.id, email: user.email }`
- **Tablas leídas (BD):** `business_memberships` (columnas `business_id`, `role`, filtros sobre `user_id`, `status`, orden por `created_at`) y `businesses` (columnas `id`, `name`, `slug`). Solo lecturas; sin escrituras, sin revalidate, sin redirect propio (el redirect proviene de `requireUser`).

> Nota sobre políticas RLS: los archivos leídos no contienen ni definen políticas RLS; el acceso a `business_memberships`/`businesses` se hace con el cliente Supabase (clave anónima + sesión del usuario), por lo que cualquier control de acceso a nivel de fila dependería de políticas definidas en Supabase, fuera del alcance de estos archivos.

---

### Manejo de errores — [src/server/errors/app-error.ts](src/server/errors/app-error.ts)

#### Tipo `AppErrorCode` — [app-error.ts:1](src/server/errors/app-error.ts#L1)

Union de literales:

```ts
"CONFIGURATION_ERROR" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "VALIDATION_ERROR" | "CONFLICT" | "INTERNAL_ERROR"
```

#### Clase `AppError extends Error` — [app-error.ts:10](src/server/errors/app-error.ts#L10)

- **Propiedades readonly:** `code: AppErrorCode`, `status: number`, `expose: boolean`.
- **Constructor:** `constructor(code: AppErrorCode, message: string, status = 500, expose = true)` ([app-error.ts:15](src/server/errors/app-error.ts#L15)).
  - Llama `super(message)`, fija `this.name = "AppError"`, y asigna `code`, `status`, `expose`.
  - **Valores por defecto:** `status = 500`, `expose = true`.
- **Uso en el subsistema:**

| Lugar | code | status | expose |
|-------|------|--------|--------|
| [require-user.ts:17](src/server/auth/require-user.ts#L17) | `CONFIGURATION_ERROR` | 500 | `false` |
| [require-user.ts:31](src/server/auth/require-user.ts#L31) | `UNAUTHORIZED` | 401 | `true` (default) |
| [business-context.ts:39](src/server/business/business-context.ts#L39) | `INTERNAL_ERROR` | 500 | `false` |
| [business-context.ts:43](src/server/business/business-context.ts#L43) | `FORBIDDEN` | 403 | `true` (default) |
| [business-context.ts:57](src/server/business/business-context.ts#L57) | `NOT_FOUND` | 404 | `true` (default) |

Los códigos `VALIDATION_ERROR` y `CONFLICT` están definidos en el tipo pero **no se usan** en los archivos de este subsistema.

---

### Logout

No existe ninguna Server Action ni función `signOut`/`logout` en los archivos del subsistema ni en el resto del código (búsqueda global de `signOut`/`logout`/`signout` solo arroja el icono `LogOut` de lucide-react, no una implementación de cierre de sesión). El único elemento de "salir" es un enlace en la barra lateral [src/components/shared/Sidebar.tsx:64-71](src/components/shared/Sidebar.tsx#L64):

```tsx
<Link href="/login" className="button" ...>
  <LogOut size={17} aria-hidden="true" />
  Salir
</Link>
```

Este enlace **solo navega a `/login`**; no invoca `supabase.auth.signOut()` ni borra cookies de sesión. Por tanto, en el código actual el "logout" no destruye la sesión de Supabase, únicamente cambia de ruta. Además, dado que el middleware redirige a los usuarios **autenticados** que visitan rutas públicas (`/login`, `/register`) de vuelta a `/dashboard` (ver sección de middleware), pulsar "Salir" con una sesión Supabase aún válida resultaría en una redirección de vuelta a `/dashboard` en lugar de mostrar la pantalla de login.

---

### Contexto adicional relevante (middleware)

- **Middleware:** [src/middleware.ts](src/middleware.ts) importa `updateSession` de [src/lib/supabase/middleware.ts](src/lib/supabase/middleware.ts) y define `PUBLIC_ROUTES = ["/login", "/register"]` ([middleware.ts:4](src/middleware.ts#L4)). En cada request:
  1. Calcula `isPublic` con `PUBLIC_ROUTES.some((route) => pathname.startsWith(route))` ([middleware.ts:8](src/middleware.ts#L8)). (Nota: `/register` aparece como ruta pública aunque no existe una página de registro en `src/app`.)
  2. Calcula `authConfigured = Boolean(NEXT_PUBLIC_SUPABASE_URL && NEXT_PUBLIC_SUPABASE_ANON_KEY)` ([middleware.ts:9](src/middleware.ts#L9)).
  3. `const { response, user } = await updateSession(request)` ([middleware.ts:10](src/middleware.ts#L10)).
  4. Si `authConfigured && !user && !isPublic` → `NextResponse.redirect(new URL("/login", request.url))` ([middleware.ts:12-14](src/middleware.ts#L12)). Es decir, **protege todas las rutas no públicas** redirigiendo a `/login` cuando no hay usuario.
  5. Si `authConfigured && user && isPublic` → `NextResponse.redirect(new URL("/dashboard", request.url))` ([middleware.ts:16-18](src/middleware.ts#L16)). Es decir, **expulsa a usuarios autenticados** de `/login`/`/register` hacia `/dashboard`.
  6. En otro caso devuelve `response` (con las cookies posiblemente refrescadas).
  - **`config.matcher`** ([middleware.ts:23-25](src/middleware.ts#L23)) excluye `_next/static`, `_next/image`, `favicon.ico` y archivos de imagen (`svg|png|jpg|jpeg|gif|webp`).

- **`updateSession(request)`** — [src/lib/supabase/middleware.ts:4](src/lib/supabase/middleware.ts#L4):
  - Crea `response = NextResponse.next({ request })`.
  - Si faltan `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` → retorna `{ response, user: null }` ([middleware.ts:9-11](src/lib/supabase/middleware.ts#L9)).
  - Crea un `createServerClient` con handlers de cookies: `getAll` lee `request.cookies.getAll()`, `setAll` escribe en `response.cookies.set(...)` (refresca cookies en la respuesta).
  - Llama `await supabase.auth.getUser()` y retorna `{ response, user }`.

---

## 6. Módulo de Inventario (Productos, Categorías, Variantes, Imágenes)

Este módulo cubre el CRUD de productos, la gestión de categorías, el sistema de variantes, la actualización de stock con historial de movimientos, y la subida/borrado de imágenes a Cloudflare R2. Todas las Server Actions dependen de `requireBusinessContext()` ([business-context.ts:26](src/server/business/business-context.ts#L26)), que devuelve `{ supabase, business, membership, user }` resolviendo el negocio activo del usuario autenticado: primero consulta `business_memberships` (`select("business_id, role")`, `user_id = user.id`, `status = "active"`, `order("created_at", ascending)`, `limit(1)`, `.maybeSingle()`) y luego `businesses` (`select("id, name, slug")` por `id = membership.business_id`, `.single()`). Lanza `AppError` (`INTERNAL_ERROR` 500 si hay error en la consulta de membresía, `FORBIDDEN` 403 si no hay membresía activa, `NOT_FOUND` 404 si no se encuentra el negocio). El `user` proviene de `requireUser()`. Casi todas las consultas filtran por `business_id = business.id` (multi-tenant).

---

### 1. Validaciones Zod — [producto.schema.ts](src/lib/validations/producto.schema.ts)

#### `varianteSchema` — [producto.schema.ts:3](src/lib/validations/producto.schema.ts#L3)
Objeto Zod para una variante. Reglas exactas:

| Campo | Tipo Zod | Regla / mensaje |
|---|---|---|
| `id` | `z.string().optional()` | opcional |
| `nombre` | `z.string().min(1, ...)` | "El nombre de la variante es requerido" |
| `sku` | `z.string().optional().or(z.literal(""))` | opcional o cadena vacía |
| `atributos` | `z.record(z.string(), z.string()).optional()` | mapa string→string opcional |
| `stock` | `z.coerce.number().int().min(0, ...)` | "El stock no puede ser negativo" |
| `stockMinimo` | `z.coerce.number().int().min(0, ...)` | "El stock mínimo no puede ser negativo" |

#### `productoSchema` — [producto.schema.ts:13](src/lib/validations/producto.schema.ts#L13)
El comentario de la línea 12 indica que las variantes se manejan fuera del form con `useState` y no van en este schema. Reglas:

| Campo | Tipo Zod | Regla / mensaje |
|---|---|---|
| `nombre` | `z.string().min(2, ...).max(120)` | "El nombre es requerido", máx. 120 |
| `sku` | `z.string().min(2, ...).max(60)` | "El SKU es requerido", máx. 60 |
| `descripcion` | `z.string().max(600).optional().or(z.literal(""))` | máx. 600, opcional/vacía |
| `categoriaId` | `z.string().min(1, ...)` | "Selecciona una categoría" |
| `precioVenta` | `z.coerce.number().positive(...)` | "El precio de venta debe ser positivo" |
| `precioCosto` | `z.coerce.number().min(0, ...)` | "El costo no puede ser negativo" |
| `stock` | `z.coerce.number().int().min(0, ...)` | "El stock no puede ser negativo" |
| `stockMinimo` | `z.coerce.number().int().min(0, ...)` | "El stock mínimo no puede ser negativo" |
| `imagenUrl` | `z.string().url("URL inválida").optional().or(z.literal(""))` | URL válida, opcional/vacía |
| `estatus` | `z.enum(["disponible", "pausado", "agotado"])` | enum |
| `atributos` | `z.record(z.string(), z.string()).optional()` | mapa string→string opcional |

#### `stockSchema` — [producto.schema.ts:27](src/lib/validations/producto.schema.ts#L27)

| Campo | Tipo Zod | Regla |
|---|---|---|
| `productoId` | `z.string().min(1)` | requerido |
| `tipo` | `z.enum(["entrada", "salida", "ajuste"])` | enum |
| `cantidad` | `z.coerce.number().int().positive(...)` | "La cantidad debe ser mayor a cero" |
| `notas` | `z.string().max(300).optional().or(z.literal(""))` | máx. 300, opcional/vacía |

Tipos exportados ([producto.schema.ts:34-36](src/lib/validations/producto.schema.ts#L34)): `ProductoInput`, `VarianteInput`, `StockInput` (todos `z.infer<...>`).

---

### 2. Tipos del dominio — [inventario.types.ts](src/types/inventario.types.ts)

- `EstatusProducto = "disponible" | "pausado" | "agotado"` — [línea 1](src/types/inventario.types.ts#L1)
- `TipoMovimientoStock = "entrada" | "salida" | "ajuste"` — [línea 2](src/types/inventario.types.ts#L2)
- `Categoria` — [línea 4](src/types/inventario.types.ts#L4): `{ id: string; nombre: string; tipo: "producto" | "gasto" | "ingreso"; color?: string; atributosBase?: string[] }`
- `ProductoVariante` — [línea 12](src/types/inventario.types.ts#L12): `{ id; productoId; nombre; sku?; atributos: Record<string,string>; stock; stockMinimo; estatus: EstatusProducto }`
- `Producto` — [línea 23](src/types/inventario.types.ts#L23): incluye `categoria: Categoria`, `precioVenta`, `precioCosto`, `stock`, `stockMinimo`, `imagenUrl?`, `estatus`, `sku`, `atributos?: Record<string, string | number>`, `variantes?: ProductoVariante[]`, `createdAt: string`.
- `MovimientoStock` — [línea 40](src/types/inventario.types.ts#L40): `{ id; productoId; varianteId?; tipo; cantidad; stockAntes; stockDespues; notas?; createdAt }`.

Nota: estos tipos del dominio (camelCase) NO se usan en las Server Actions ni en las páginas para tipar los datos de Supabase; las consultas devuelven los nombres de columna crudos (snake_case) que se manipulan directamente, y los componentes definen sus propias interfaces locales (p. ej. `Variante` en `VariantesStockInline`, `VarianteFormData` en `VariantesEditor`). `EstatusProducto` y `TipoMovimientoStock` sí se importan (en `EstatusBadge` y `StockActualizador` respectivamente).

---

### 3. Server Actions de productos y stock — [inventario.ts](src/actions/inventario.ts) (`'use server'`)

#### `crearProducto(input, variantes = [])` — [inventario.ts:8](src/actions/inventario.ts#L8)
Firma: `async (input: ProductoInput, variantes: VarianteInput[] = [])`. Pasos:
1. `productoSchema.parse(input)` y mapea cada variante con `varianteSchema.parse(v)` (líneas 9-10).
2. `requireBusinessContext()` (línea 11), desestructurando `{ supabase, business, user }`.
3. Calcula `stockProducto`: si hay variantes, suma de `v.stock`; si no, `values.stock` (líneas 14-16).
4. `INSERT` en tabla **`productos`** (línea 18) con columnas: `business_id`, `user_id`, `nombre`, `descripcion` (`|| null`), `categoria_id`, `precio_venta`, `precio_costo`, `stock` (= `stockProducto`), `stock_minimo`, `imagen_url` (`|| null`), `estatus` (= `"agotado"` si `stockProducto === 0`, si no `values.estatus`), `sku` (`|| null`), `atributos` (`|| {}`). `.select("id").single()`.
5. Si error o sin producto: lanza `Error` con mensaje "Ya existe un producto con ese SKU en tu inventario." cuando `error?.code === "23505"`, si no `error?.message ?? "Error al crear el producto"` (líneas 34-36).
6. Si hay variantes: `INSERT` en **`producto_variantes`** (línea 40) con `business_id`, `producto_id`, `nombre`, `sku` (`|| null`), `atributos` (`|| {}`), `stock`, `stock_minimo`, `estatus` (= `"agotado"` si `v.stock === 0`, si no `"disponible"`). Si error, lanza `Error(varError.message)`.
7. Efectos finales: `revalidatePath("/inventario")` y `redirect("/inventario")` (líneas 55-56).

#### `actualizarProducto(id, input, variantes = [])` — [inventario.ts:59](src/actions/inventario.ts#L59)
Firma: `async (id: string, input: ProductoInput, variantes: VarianteInput[] = [])`. Pasos:
1. Parse igual que crear; recalcula `stockProducto` (líneas 60-66). Desestructura `{ supabase, business }` (sin `user`).
2. `UPDATE` en **`productos`** (línea 68) con las mismas columnas que el insert (excepto `business_id`/`user_id`), filtrando `.eq("id", id).eq("business_id", business.id)`.
3. Manejo de error: lanza el mensaje del SKU si `error.code === "23505"`, si no `error.message` (línea 87).
4. Estrategia de variantes "reemplazo total": si hay variantes, primero `DELETE FROM producto_variantes WHERE producto_id = id` (sin filtrar `business_id`) y luego re-inserta todas (líneas 91-105). Si NO hay variantes, igualmente `DELETE` de todas las variantes del producto (líneas 106-109).
5. Efectos: `revalidatePath("/inventario")`, `revalidatePath("/inventario/${id}")`, `redirect("/inventario/${id}")` (líneas 111-113).

#### `actualizarStockVariante(varianteId, productoId, tipo, cantidad, notas?)` — [inventario.ts:116](src/actions/inventario.ts#L116)
Firma: `async (varianteId: string, productoId: string, tipo: "entrada" | "salida" | "ajuste", cantidad: number, notas?: string)`. NO usa Zod. Pasos:
1. `requireBusinessContext()` (`{ supabase, business, user }`).
2. `SELECT stock, stock_minimo` de **`producto_variantes`** por `id` + `business_id` (`.single()`); si error/no existe lanza `Error("Variante no encontrada")`.
3. Calcula `stockDespues`: `entrada` → `stockAntes + cantidad`; `salida` → `stockAntes - cantidad`; otro (`ajuste`) → `cantidad` (líneas 129-132).
4. Si `stockDespues < 0` lanza `Error("El stock no puede quedar negativo")`.
5. Calcula `estatus`: `"agotado"` si `stockDespues === 0`, también `"agotado"` si `stockDespues <= variante.stock_minimo`, si no `"disponible"` (línea 136). Las dos primeras ramas son lógicamente redundantes (ambas devuelven `"agotado"`).
6. `UPDATE producto_variantes SET stock, estatus WHERE id = varianteId` (línea 138, sin filtro `business_id`).
7. Recalcula el stock total del producto: `SELECT stock` de todas las variantes con `producto_id` + `business_id`, suma, y `UPDATE productos SET stock = stockTotal, estatus = (stockTotal === 0 ? "agotado" : "disponible") WHERE id = productoId` (líneas 141-151).
8. `INSERT` en **`movimientos_stock`** (línea 153): `business_id`, `producto_id`, `variante_id`, `user_id`, `tipo`, `cantidad`, `stock_antes`, `stock_despues`, `notas` (`|| null`).
9. Efecto: `revalidatePath("/inventario/${productoId}")` (sin redirect).

#### `eliminarProducto(id)` — [inventario.ts:168](src/actions/inventario.ts#L168)
Firma: `async (id: string)`. Pasos:
1. `requireBusinessContext()` (`{ supabase, business }`).
2. `SELECT imagen_url` de **`productos`** por `id` + `business_id` (`.single()`) antes de borrar.
3. `DELETE FROM productos WHERE id AND business_id`; si error, `Error(error.message)`.
4. Si había `imagen_url`: import dinámico de `@/lib/cloudflare/r2` y `deleteR2Object(producto.imagen_url).catch(() => {})` (silencia errores de R2) — líneas 188-191. El comentario indica que el import dinámico evita afectar el bundle del cliente.
5. Efectos: `revalidatePath("/inventario")`, `redirect("/inventario")`.

Nota: el código no borra explícitamente `producto_variantes` ni `movimientos_stock`; el componente `ProductoAcciones` informa al usuario que se borrarán "el producto, sus variantes, movimientos de stock e imagen de Cloudflare", lo que implica una dependencia de `ON DELETE CASCADE` en la BD (no verificable desde el código leído).

#### `cambiarEstatusProducto(id, estatus)` — [inventario.ts:197](src/actions/inventario.ts#L197)
Firma: `async (id: string, estatus: "disponible" | "pausado" | "agotado")`. `UPDATE productos SET estatus WHERE id AND business_id`; si error lanza. Efectos: `revalidatePath("/inventario/${id}")` y `revalidatePath("/inventario")`. No redirect.

#### `actualizarStock(input)` — [inventario.ts:212](src/actions/inventario.ts#L212)
Firma: `async (input: StockInput)`. Pasos:
1. `stockSchema.parse(input)`; `requireBusinessContext()` (`{ supabase, business, user }`).
2. `SELECT stock, stock_minimo` de **`productos`** por `values.productoId` + `business_id` (`.single()`); si error/no existe lanza (`productError?.message ?? "Producto no encontrado"`).
3. Calcula `stockDespues` con misma lógica entrada/salida/ajuste (líneas 226-229); si `< 0` lanza error.
4. `estatus` con misma lógica (y misma redundancia) que `actualizarStockVariante` (línea 233).
5. `UPDATE productos SET stock, estatus WHERE id = productoId` (sin filtro `business_id` en esta llamada).
6. `INSERT` en **`movimientos_stock`** (sin `variante_id`): `business_id`, `producto_id`, `user_id`, `tipo`, `cantidad`, `stock_antes`, `stock_despues`, `notas` (`|| null`).
7. Efectos: `revalidatePath("/inventario")`, `revalidatePath("/inventario/${values.productoId}")`. No redirect.

---

### 4. Server Actions de categorías — [categorias.ts](src/actions/categorias.ts) (`'use server'`)

#### Interfaz `NuevaCategoriaInput` — [categorias.ts:7](src/actions/categorias.ts#L7)
`{ nombre: string; tipo: "producto" | "gasto" | "ingreso"; color?: string; icono?: string; atributosBase: string[] }`.

#### `crearCategoria(input: NuevaCategoriaInput)` — [categorias.ts:15](src/actions/categorias.ts#L15)
1. `requireBusinessContext()` (`{ supabase, business, user }`).
2. `INSERT` en **`categorias`** (línea 18): `business_id`, `user_id`, `nombre` (`.trim()`), `tipo`, `color` (`|| null`), `icono` (`|| null`), `atributos_base` (`input.atributosBase.filter(Boolean)`).
3. Si `error.code === "23505"`: "Ya existe una categoría con ese nombre y tipo."; si no `error.message`.
4. Efectos: `revalidatePath("/inventario")`, `revalidatePath("/inventario/categorias")`, `redirect("/inventario")`.

No aplica validación Zod (la validación de `nombre` se hace en el cliente).

#### `eliminarCategoria(id: string)` — [categorias.ts:41](src/actions/categorias.ts#L41)
`DELETE FROM categorias WHERE id AND business_id`; si error lanza. Efectos: `revalidatePath("/inventario")`, `redirect("/inventario")`.

Nota: esta acción está definida y exportada pero no se observa invocada en ninguno de los archivos del módulo leídos.

---

### 5. Server Action de imágenes — [imagenes.ts](src/actions/imagenes.ts) (`'use server'`)

#### `signedUploadSchema` — [imagenes.ts:7](src/actions/imagenes.ts#L7)
`z.object({ fileName: z.string().min(1), contentType: z.string().startsWith("image/") })`. Es una constante de módulo (no exportada).

#### `generarURLFirmaSubida(input)` — [imagenes.ts:12](src/actions/imagenes.ts#L12)
Firma: `async (input: z.infer<typeof signedUploadSchema>)`. Pasos:
1. `signedUploadSchema.parse(input)`.
2. `extension` = `values.fileName.split(".").pop() ?? "webp"`.
3. `key = \`productos/${uuid()}.${extension}\`` (UUID v4 de la librería `uuid`, importado como `v4 as uuid`).
4. Retorna `createSignedUploadUrl(key, values.contentType)`.

---

### 6. Cloudflare R2 — [r2.ts](src/lib/cloudflare/r2.ts)

#### `createR2Client()` — [r2.ts:4](src/lib/cloudflare/r2.ts#L4)
Lee `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`. Si falta alguna, retorna `null`. Si no, retorna `S3Client` con `region: "auto"`, `endpoint: https://${accountId}.r2.cloudflarestorage.com`, credenciales, y `requestChecksumCalculation`/`responseChecksumValidation: "WHEN_REQUIRED"`.

#### `createSignedUploadUrl(key, contentType)` — [r2.ts:22](src/lib/cloudflare/r2.ts#L22)
Firma: `async (key: string, contentType: string)`. Lee `CLOUDFLARE_R2_BUCKET_NAME` y `NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL`. Si falta client/bucket/publicUrl, retorna `{ signedUrl: "", publicUrl: "", configured: false }`. Si no, crea `PutObjectCommand({ Bucket, Key, ContentType })` y genera URL firmada con `getSignedUrl(client, command, { expiresIn: 300 })` (300 s). Retorna `{ signedUrl, publicUrl: \`${publicUrl.replace(/\/$/, "")}/${key}\`, configured: true }`.

#### `deleteR2Object(publicUrlOrKey)` — [r2.ts:50](src/lib/cloudflare/r2.ts#L50)
Firma: `async (publicUrlOrKey: string)`. Si no hay client o bucket, retorna sin hacer nada. Extrae el `key` quitando el prefijo de la URL pública base (`publicBase.replace(/\/$/, "") + "/"`); si no hay `publicBase`, usa el string tal cual. Envía `DeleteObjectCommand({ Bucket, Key: key })`.

#### `imageLoader({ src, width, quality })` — [imageLoader.ts:3](src/lib/cloudflare/imageLoader.ts#L3)
Loader de `next/image` (export default). Calcula `optimized = \`${src}${separator}width=${width}&quality=${quality ?? 75}&format=auto\``, con `separator` `"&"` si `src` ya incluye `"?"`, si no `"?"`. Si NO hay `NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL` o `src` empieza con `"http"`, retorna `optimized` directamente; si no, retorna `\`${publicUrl.replace(/\/$/, "")}/${optimized.replace(/^\//, "")}\`` (prefija con la URL pública R2, quitando la barra inicial de `optimized`).

---

### 7. Páginas del módulo

#### `InventarioPage` — [page.tsx:11](src/app/(dashboard)/inventario/page.tsx#L11) (Server Component, `dynamic = "force-dynamic"`)
Carga en paralelo (`Promise.all`): `categorias` (`id, nombre, tipo, color, atributos_base`, filtradas por `business_id` + `tipo = "producto"`, orden `nombre`) y `productos` (`id, nombre, sku, precio_venta, precio_costo, stock, stock_minimo, imagen_url, estatus, atributos, categoria_id`, por `business_id`, orden `nombre`). Construye `categoriasConProductos` mapeando cada categoría a sus productos filtrados por `categoria_id`. Por categoría calcula `stockTotal` (suma de `stock`), `inventarioTotal` (suma `precio_venta * stock`) y `alertas` (productos con `stock <= stock_minimo`). Muestra estado vacío "Sin categorías" si `categoriasConProductos.length === 0`. Por cada categoría muestra hasta 2 productos (`.slice(0, 2)`) y, si hay más de 2, un enlace "Ver los N productos restantes de {nombre}" (N = `catProds.length - 2`) hacia `/inventario/categorias/${categoria.id}`. Si la categoría no tiene productos muestra "Esta categoría aún no tiene productos." Cada tarjeta de producto enlaza a detalle, editar (`/editar`) y stock (ambos botones de stock/detalle apuntan a `/inventario/${id}`); usa `EstatusBadge` y `formatCurrency`. Marca `stockBajo` (`stock <= stock_minimo && stock > 0`) y `agotado` (`stock === 0`) para colorear.

#### `NuevoProductoPage` — [nuevo/page.tsx:8](src/app/(dashboard)/inventario/nuevo/page.tsx#L8) (Server Component, `force-dynamic`)
Props: `searchParams: Promise<{ cat?: string }>`. Carga categorías tipo `producto` (`id, nombre, color, atributos_base`). Si no hay categorías, `notFound()`. Determina `categoriaIdFija = cat` si existe y coincide con alguna categoría (si no, `undefined`). Renderiza `ProductoForm` con `categorias`, `categoriaFija={categoriaIdFija}`, y `defaultValues={{ categoriaId: categoriaIdFija }}` si hay fija (si no, `undefined`). El subtítulo del `Navbar` cambia según haya categoría fija.

#### `ProductoDetallePage` — [[id]/page.tsx:16](src/app/(dashboard)/inventario/[id]/page.tsx#L16) (Server Component, `force-dynamic`)
Props: `params: Promise<{ id: string }>`. Carga en paralelo: `producto` (`id, nombre, descripcion, precio_venta, precio_costo, stock, stock_minimo, imagen_url, estatus, sku, atributos, categoria_id`, `.maybeSingle()`, por `id` + `business_id`), `variantes` (`id, nombre, sku, atributos, stock, stock_minimo, estatus` de `producto_variantes` por `producto_id` + `business_id`, orden `nombre`) y `movimientos` (`id, tipo, cantidad, stock_antes, stock_despues, notas, created_at` de `movimientos_stock` por `producto_id` + `business_id`, orden `created_at` desc, `limit(50)`). Si no hay producto, `notFound()`. `tieneVariantes = (variantes?.length ?? 0) > 0`. Muestra imagen (o placeholder), `EstatusBadge`, nombre, descripción, métricas (`Stock total` con `warn` si `stock <= stock_minimo`, `Stock mínimo`, `Precio venta`), y atributos. Si NO hay variantes, renderiza `StockActualizador`; siempre renderiza `ProductoAcciones`. Si hay variantes, renderiza sección "Variantes" con `VariantesStockInline` (mapeando cada variante a `{ id, nombre, sku, stock, stock_minimo, estatus }`). Al final, `DataTable` de movimientos con columnas: Fecha (`new Date(created_at).toLocaleDateString("es-MX")`), Tipo (badge), Cantidad, Antes (`stock_antes`), Después (`stock_despues`), Notas (`notas ?? "—"`). Incluye subcomponente local `Metric({ label, value, warn = false })` — [línea 150](src/app/(dashboard)/inventario/[id]/page.tsx#L150).

#### `EditarProductoPage` — [[id]/editar/page.tsx:8](src/app/(dashboard)/inventario/[id]/editar/page.tsx#L8) (Server Component, `force-dynamic`)
Props: `params: Promise<{ id: string }>`. Carga `producto` (`id, nombre, sku, descripcion, categoria_id, precio_venta, precio_costo, stock, stock_minimo, estatus, imagen_url, atributos, business_id`, `.maybeSingle()`, por `id` + `business_id`), `categorias` tipo producto (`id, nombre, color, atributos_base`), y `variantesDB` (`id, nombre, sku, atributos, stock, stock_minimo` de `producto_variantes` por `producto_id`, orden `nombre` — nota: esta consulta NO filtra por `business_id`). Si no hay producto o no hay categorías, `notFound()`. Mapea `variantesIniciales` a `VarianteFormData` (`sku ?? ""`, `atributos ?? {}`, `stockMinimo` desde `stock_minimo`). Renderiza `ProductoForm` con `productoId={id}`, `variantesIniciales` y `defaultValues` poblados desde el producto (mapeando snake_case→camelCase, con fallbacks `?? ""` / `?? {}`).

#### `NuevaCategoria` — [categorias/nueva/page.tsx:15](src/app/(dashboard)/inventario/categorias/nueva/page.tsx#L15) (`'use client'`)
Estado: `nombre`, `color` (default `COLORES_PRESET[0]` = `"#c9a84c"`), `atributos: string[]` (inicia `[""]`), `guardando`, `error`. `COLORES_PRESET` ([línea 10](src/app/(dashboard)/inventario/categorias/nueva/page.tsx#L10)) = 8 colores hex. Funciones: `agregarAtributo`, `editarAtributo(i, v)`, `eliminarAtributo(i)`. `handleSubmit`: valida `nombre.trim()` (error "El nombre de la categoría es requerido."), llama `crearCategoria({ nombre: nombre.trim(), tipo: "producto", color, atributosBase: atributos.filter(Boolean) })`, luego `router.push("/inventario")` + `router.refresh()`; en catch muestra el mensaje del error y resetea `guardando`. Incluye selector de color (presets + `<input type="color">`), lista editable de atributos, y panel de "Vista previa" (usa `atributosValidos = atributos.filter((a) => a.trim())`). El botón submit se deshabilita si `guardando || !nombre.trim()`.

#### `CategoriaDetallePage` — [categorias/[id]/page.tsx:12](src/app/(dashboard)/inventario/categorias/[id]/page.tsx#L12) (Server Component, `force-dynamic`)
Props: `params: Promise<{ id: string }>`. Carga `categoria` (`id, nombre, color, tipo, atributos_base`, `.maybeSingle()`, por `id` + `business_id`) y `productos` (`id, nombre, sku, precio_venta, stock, stock_minimo, imagen_url, estatus, atributos`, por `categoria_id` + `business_id`, orden `nombre`). Si no hay categoría, `notFound()`. Calcula `stockTotal`, `valorTotal` (suma `precio_venta * stock`) y `alertas`. Muestra todos los productos en `product-card-grid` (sin límite), o estado vacío con enlace a `/inventario/nuevo?cat=${id}`. Tarjetas idénticas en estructura a la página de inventario.

#### `ErrorPage` — [error.tsx:3](src/app/(dashboard)/inventario/error.tsx#L3) (`'use client'`)
Props: `{ error: Error; reset: () => void }` (sólo desestructura `reset`). Muestra "No se pudo cargar inventario" y botón "Reintentar" que llama `reset()`. (No usa `error`.)

#### `Loading` — [loading.tsx:1](src/app/(dashboard)/inventario/loading.tsx#L1)
Devuelve `<div className="page">Cargando inventario...</div>`.

---

### 8. Componentes

#### `EstatusBadge` — [EstatusBadge.tsx:19](src/components/inventario/EstatusBadge.tsx#L19) (Server Component, sin `'use client'`)
Props: `{ estatus: EstatusProducto }`. Mapas locales `label` ("Disponible"/"Pausado"/"Agotado") y `color` (`var(--success)`/`var(--warning)`/`var(--error)`). Renderiza un `<span className="badge">` con borde/color/fondo derivados del color (`...55` para el borde, `...18` para el fondo).

#### `ProductoAcciones` — [ProductoAcciones.tsx:16](src/components/inventario/ProductoAcciones.tsx#L16) (`'use client'`)
Props: `{ productoId: string; estatusActual: Estatus }` (`Estatus = "disponible" | "pausado" | "agotado"`). Estado: `guardandoEstatus`, `eliminando`, `confirmar`, `error`. `OPCIONES_ESTATUS` con label y color por estatus.
- `handleEstatus(nuevoEstatus)`: si igual al actual, no hace nada; si no, llama `cambiarEstatusProducto(productoId, nuevoEstatus)` y `router.refresh()`; captura error; en `finally` resetea `guardandoEstatus`.
- `handleEliminar`: llama `eliminarProducto(productoId)` (que redirige); en catch muestra error y resetea `eliminando`/`confirmar`.
Renderiza botones de estatus (deshabilitando el actual con etiqueta "✓ Actual") y un flujo de confirmación de borrado en dos pasos. El texto de confirmación advierte que se borrarán "el producto, sus variantes, movimientos de stock e imagen de Cloudflare".

#### `ProductoForm` — [ProductoForm.tsx:37](src/components/inventario/ProductoForm.tsx#L37) (`'use client'`)
Props (`ProductoFormProps`, [línea 22](src/components/inventario/ProductoForm.tsx#L22)):

| Prop | Tipo | Default |
|---|---|---|
| `defaultValues` | `ProductoFormDefaults` (`Omit<Partial<ProductoInput>, "variantes">`) | `undefined` |
| `categorias` | `CategoriaOption[]` | requerido |
| `categoriaFija` | `string` | `undefined` |
| `productoId` | `string` | `undefined` |
| `variantesIniciales` | `VarianteFormData[]` | `undefined` |

`CategoriaOption` ([línea 15](src/components/inventario/ProductoForm.tsx#L15)): `{ id; nombre; color?: string | null; atributos_base: string[] }`.

Usa `react-hook-form` con `zodResolver(productoSchema) as never`. `defaultValues` del form: `nombre:""`, `sku:""`, `descripcion:""`, `categoriaId: categorias[0]?.id ?? ""`, `precioVenta:0`, `precioCosto:0`, `stock:0`, `stockMinimo:5`, `estatus:"disponible"`, `imagenUrl:""`, `atributos:{}`, sobreescritos por `...defaultValues`. Estado adicional: `guardado`, `variantes` (`useState(variantesIniciales ?? [])`), `prevCategoriaId` (`useRef`, inicializado con `defaultValues?.categoriaId`), `subiendo`, `errorImagen`, `preview`.

Comportamiento:
- `generarSku(categoriaId, categorias)` — [línea 30](src/components/inventario/ProductoForm.tsx#L30): prefijo = 3 primeras letras del nombre de la categoría en mayúsculas (o `"PRD"` si no se encuentra) + `-` + número aleatorio de 6 dígitos (`Math.floor(Math.random() * 900000) + 100000`, rango 100000–999999). `autoSku()` lo aplica al campo `sku`.
- `useEffect` (línea 80): si `defaultValues?.imagenUrl`, fija `preview` (solo al montar, deps `[]`).
- `useEffect` (línea 86): cuando cambia realmente `categoriaId` (comparado contra `prevCategoriaId.current`), resetea `atributos` a `{}` y vacía variantes.
- `margen` (`useMemo`, línea 93): `0` si `!precioVenta || precioVenta <= 0`; si no `Math.round(((precioVenta - (precioCosto ?? 0)) / precioVenta) * 100)`. Coloreado: rojo `<0`, amarillo `<20`, dorado en otro caso.
- `onSubmit(values)` (línea 102): mapea variantes a `{ nombre, sku: sku||"", atributos, stock, stockMinimo }`; si `productoId` llama `actualizarProducto(productoId, values, vars)`, si no `crearProducto(values, vars)`; luego `setGuardado(true)`.
- Atributos dinámicos: por cada `atributo` en `categoriaActual.atributos_base` registra `atributos.${atributo}` (línea 210); la sección de atributos solo se muestra si `atributosBase.length > 0`. `placeholderAtributo(nombre)` ([línea 417](src/components/inventario/ProductoForm.tsx#L417)) mapea nombres conocidos (Talla, Color, Marca, "Tipo de tela", Mililitros, Aroma, Género) a placeholders.
- Sección de stock/estatus solo se muestra si `!tieneVariantes` (línea 253).
- Renderiza siempre `VariantesEditor` (sección "Variantes", línea 230).
- Subida de imagen (`<input type="file">`, líneas 325-363): acepta `image/jpeg,image/png,image/webp`; valida `file.size > 4 * 1024 * 1024` (4MB → error "La imagen no puede superar 4MB."); llama `generarURLFirmaSubida({ fileName, contentType })`; si `!configured || !signedUrl` muestra "R2 no está configurado."; hace `fetch(signedUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } })`; al éxito fija `imagenUrl = publicUrl` y `preview`; en error "Error al subir la imagen. Intenta de nuevo."; en `finally` resetea `subiendo` y `e.target.value`. Botón X borra preview y limpia `imagenUrl`.
- Subcomponente local `Field({ label, error, children })` — [línea 407](src/components/inventario/ProductoForm.tsx#L407).
- Botón submit deshabilitado si `isSubmitting || guardado`.

#### `StockActualizador` — [StockActualizador.tsx:12](src/components/inventario/StockActualizador.tsx#L12) (`'use client'`)
Props: `{ productoId: string }`. Estado: `tipo` (`TipoMovimientoStock`, default `"entrada"`), `cantidad` (default `1`), `notas` (default `""`). Es un `<form>` con `action` (form action de React) que llama `actualizarStock({ productoId, tipo, cantidad, notas })`. Selector de tipo (entrada/salida/ajuste), input numérico `min={1}`, input de notas, y botón "Registrar movimiento".

#### `VariantesEditor` — [VariantesEditor.tsx:25](src/components/inventario/VariantesEditor.tsx#L25) (`'use client'`)
Tipo `VarianteFormData` ([línea 5](src/components/inventario/VariantesEditor.tsx#L5)): `{ id?: string; nombre: string; sku: string; stock: number; stockMinimo: number; atributos: Record<string,string> }`. Props: `{ variantes: VarianteFormData[]; onChange: (variantes) => void }`. `TALLAS_PRESET = ["Chica", "Mediana", "Grande", "Extra Grande"]`. `varianteVacia()` retorna `{ nombre:"", sku:"", stock:0, stockMinimo:2, atributos:{} }`.
- `agregar()`: añade variante vacía.
- `agregarPreset(talla)`: si no existe ya por `nombre`, añade `{ nombre: talla, sku:"", stock:0, stockMinimo:2, atributos: { Talla: talla } }`.
- `actualizar(i, campo, valor)`: si `campo === "nombre"` también sincroniza `atributos.Talla = valor`; si no, asigna `[campo]: valor`.
- `eliminar(i)`: filtra por índice.
- `stockTotal`: suma de `Number(v.stock) || 0`, mostrado en el pie cuando hay variantes.
Renderiza botones de presets (deshabilitando los ya presentes con "✓"), lista editable (nombre, SKU, stock, mínimo) y botón "Agregar variante personalizada".

#### `VariantesStockInline` — [VariantesStockInline.tsx:24](src/components/inventario/VariantesStockInline.tsx#L24) (`'use client'`)
Interfaz local `Variante` ([línea 9](src/components/inventario/VariantesStockInline.tsx#L9)): `{ id; nombre; sku: string | null; stock; stock_minimo; estatus: string }`. Props: `{ variantes: Variante[]; productoId: string }`. `TIPOS` = entrada/salida/ajuste.
- Estado: objeto `estados` indexado por `variante.id` con `{ tipo, cantidad: string, notas, cargando, error, ok }`, inicializado con `Object.fromEntries` (cantidad y notas inician en cadena vacía).
- `set(varId, cambios)`: merge parcial del estado de una variante.
- `guardar(variante)`: `parseInt(cantidad)`; si `!cantidad || cantidad <= 0` muestra "Ingresa una cantidad válida."; llama `actualizarStockVariante(variante.id, productoId, tipo, cantidad, notas || undefined)`; al éxito limpia inputs, marca `ok` durante 2 s (`setTimeout`), y `router.refresh()`; en error muestra el mensaje.
- UI: cabecera (Talla/Variante, Stock, Mínimo, Estatus), fila por variante con stock coloreado (rojo si 0, amarillo si `<= stock_minimo`), `EstatusBadge`, y controles inline (tipo, cantidad cuyo label cambia a "Stock final" si `tipo === "ajuste"`, notas, botón con icono `PackagePlus`/`…`/`✓`). Botón deshabilitado si `cargando || !cantidad`.

---

### 9. Tablas de base de datos referenciadas (por columnas escritas/leídas en el código)

- **`productos`**: `id`, `business_id`, `user_id`, `nombre`, `descripcion`, `categoria_id`, `precio_venta`, `precio_costo`, `stock`, `stock_minimo`, `imagen_url`, `estatus`, `sku`, `atributos`.
- **`producto_variantes`**: `id`, `business_id`, `producto_id`, `nombre`, `sku`, `atributos`, `stock`, `stock_minimo`, `estatus`.
- **`movimientos_stock`**: `id`, `business_id`, `producto_id`, `variante_id`, `user_id`, `tipo`, `cantidad`, `stock_antes`, `stock_despues`, `notas`, `created_at`.
- **`categorias`**: `id`, `business_id`, `user_id`, `nombre`, `tipo`, `color`, `icono`, `atributos_base`.
- **`business_memberships`** (`business_id`, `role`, `user_id`, `status`, `created_at`) y **`businesses`** (`id`, `name`, `slug`): usadas por `requireBusinessContext`.

Restricción única detectada por código `23505` de PostgreSQL: el código maneja errores `23505` en `productos` (mensaje "Ya existe un producto con ese SKU") y en `categorias` (mensaje "Ya existe una categoría con ese nombre y tipo"), lo que implica constraints UNIQUE en esas tablas (no verificables directamente desde el código de la aplicación).

---

## 7. Módulo de Ventas / Punto de Venta (POS)

Este subsistema cubre el punto de venta (PosCliente), la creación de ventas, las líneas/items de venta, el manejo de abonos y pagos parciales, el estatus de pago, las ventas pendientes (cuentas por cobrar), el detalle de venta y las Server Actions con su lógica de negocio (cálculo de totales, descuento de stock, movimientos de stock y transacciones financieras).

Archivos que componen el subsistema:
- Server Actions: [src/actions/ventas.ts](src/actions/ventas.ts)
- Páginas (Server Components): [page.tsx](src/app/(dashboard)/ventas/page.tsx), [nueva/page.tsx](src/app/(dashboard)/ventas/nueva/page.tsx), [[id]/page.tsx](src/app/(dashboard)/ventas/[id]/page.tsx), [pendientes/page.tsx](src/app/(dashboard)/ventas/pendientes/page.tsx)
- Componentes cliente: [PosCliente.tsx](src/components/ventas/PosCliente.tsx), [AbonoRapidoBtn.tsx](src/components/ventas/AbonoRapidoBtn.tsx), [VentaAcciones.tsx](src/components/ventas/VentaAcciones.tsx)
- Componente servidor (badges): [EstatusPagoBadge.tsx](src/components/ventas/EstatusPagoBadge.tsx)
- Tipos: [ventas.types.ts](src/types/ventas.types.ts)

Todas las páginas exportan `export const dynamic = "force-dynamic"` y obtienen su contexto vía `requireBusinessContext()` ([business-context.ts:26](src/server/business/business-context.ts#L26)), que devuelve `{ supabase, business, membership, user }`. El contexto resuelve la membresía activa más antigua del usuario (consulta `business_memberships` seleccionando `business_id, role`, filtrando `status = "active"`, ordenado por `created_at` ascendente, `.limit(1).maybeSingle()`), carga el negocio (`businesses`, selecciona `id, name, slug`) y lanza `AppError` (`INTERNAL_ERROR` si falla la consulta de membresía, `FORBIDDEN` si no hay membresía, `NOT_FOUND` si no se encuentra el negocio). Todas las consultas de ventas se filtran por `business_id = business.id` (multi-tenant). Nota: las cuatro páginas de este subsistema solo desestructuran `{ supabase, business }` del contexto (no usan `user` ni `membership`).

---

### Tipos — [src/types/ventas.types.ts](src/types/ventas.types.ts)

Importa `FormaPago` desde [finanzas.types.ts](src/types/finanzas.types.ts), donde `FormaPago = "efectivo" | "transferencia" | "adeudo" | "tarjeta"`.

| Tipo / Interfaz | Línea | Definición |
|---|---|---|
| `EstatusPagoVenta` | [3](src/types/ventas.types.ts#L3) | `"pagada" \| "parcial" \| "pendiente"` |
| `EstatusOperativoVenta` | [4](src/types/ventas.types.ts#L4) | `"activa" \| "cancelada"` |
| `ClienteVenta` | [6](src/types/ventas.types.ts#L6) | `{ nombre: string; telefono?: string }` |
| `Abono` | [11](src/types/ventas.types.ts#L11) | `{ id, ventaId, monto: number, formaPago: "efectivo"\|"tarjeta"\|"transferencia", fecha, hora, notas? }` |
| `LineaVenta` | [21](src/types/ventas.types.ts#L21) | `{ productoId, varianteId?, productoNombre, varianteNombre?, cantidad: number, precioUnitario: number, subtotal: number }` |
| `Venta` | [31](src/types/ventas.types.ts#L31) | `{ id, folio, fecha, hora, lineas: LineaVenta[], total, montoPagado, saldoPendiente, estatusPago: EstatusPagoVenta, estatusOperativo: EstatusOperativoVenta, abonos: Abono[], formaPago: FormaPago, cliente?: ClienteVenta, notas?, motivoCancelacion? }` |

Nota: `Abono.formaPago` usa el orden `"efectivo" | "tarjeta" | "transferencia"` y NO incluye `"adeudo"`. Estos tipos de dominio NO se usan directamente en las Server Actions (que tienen sus propias interfaces locales `LineaInput`/`NuevaVentaInput`); en este subsistema solo se importan `EstatusPagoVenta`/`EstatusOperativoVenta` en `EstatusPagoBadge.tsx`. Las interfaces `Abono`, `LineaVenta`, `Venta`, `ClienteVenta` no se importan en ninguno de los archivos de este subsistema.

---

### Server Actions — [src/actions/ventas.ts](src/actions/ventas.ts)

Archivo marcado `"use server"` ([línea 1](src/actions/ventas.ts#L1)). Importa `revalidatePath` de `next/cache`, `redirect` de `next/navigation` y `requireBusinessContext`. **No usa Zod** en este archivo: la validación es manual con condiciones `if` y `throw new Error`.

Interfaces locales de entrada:

```ts
// ventas.ts:7
export interface LineaInput {
  productoId:      string
  varianteId?:     string
  productoNombre:  string
  varianteNombre?: string
  cantidad:        number
  precioUnitario:  number
}

// ventas.ts:16
export interface NuevaVentaInput {
  lineas: LineaInput[]
  pagoInicial?: { monto: number; formaPago: "efectivo" | "transferencia" | "tarjeta" | "adeudo" }
  cliente?: { nombre: string; telefono?: string }
  notas?:   string
}
```

#### `registrarVenta(input: NuevaVentaInput): Promise<string>` — [ventas.ts:26](src/actions/ventas.ts#L26)

Server Action. Devuelve el `id` (string) de la venta creada. Comportamiento paso a paso:

1. **Contexto** ([27](src/actions/ventas.ts#L27)): obtiene `{ supabase, business, user }`.
2. **Cálculo de totales** ([29-35](src/actions/ventas.ts#L29)):
   - `subtotal = Σ (l.cantidad * l.precioUnitario)` sobre `input.lineas`.
   - `montoPagado = input.pagoInicial?.monto ?? 0`.
   - `saldoPendiente = Math.max(0, subtotal - montoPagado)`.
   - `estadoPago`: `"pagada"` si `saldoPendiente === 0`; si no, `"parcial"` si `montoPagado > 0`; si no, `"pendiente"`.
   - `formaPago = input.pagoInicial?.formaPago ?? "adeudo"`.
   - Nota: NO existe campo `descuento` en la entrada; el `descuento` se inserta fijo en `0` y `total = subtotal`.
3. **Folio** ([38-40](src/actions/ventas.ts#L38)): llama RPC `supabase.rpc("next_venta_folio", { target_business_id: business.id })` y castea el resultado a `string` (`folio`). No comprueba error de la RPC.
4. **Insert en `ventas`** ([43-61](src/actions/ventas.ts#L43)): inserta una fila con columnas: `business_id`, `user_id`, `folio`, `subtotal`, `descuento: 0`, `total: subtotal`, `monto_pagado: montoPagado`, `saldo_pendiente: saldoPendiente`, `forma_pago_inicial` (=`null` si `formaPago === "adeudo"`, si no la forma), `estado_pago: estadoPago`, `cliente_nombre` (`input.cliente?.nombre || null`), `cliente_telefono` (`|| null`), `notas` (`|| null`). Hace `.select("id").single()`. Si `ventaError || !venta` lanza `Error(ventaError?.message ?? "Error al crear la venta")`.
5. **Insert de líneas en `venta_lineas`** ([66-79](src/actions/ventas.ts#L66)): mapea cada línea a columnas: `business_id`, `venta_id`, `producto_id`, `variante_id` (`|| null`), `producto_nombre`, `variante_nombre` (`|| null`), `cantidad`, `precio_unitario`, `subtotal: cantidad * precioUnitario`. Insert en bloque. Si `lineasError` lanza `Error(lineasError.message)`.
6. **Registro del pago inicial** ([82-112](src/actions/ventas.ts#L82)) — solo si `montoPagado > 0 && formaPago !== "adeudo"`:
   - Insert en `venta_pagos`: `business_id`, `venta_id`, `user_id`, `monto: montoPagado`, `forma_pago: formaPago`.
   - Busca categoría de ingreso: `categorias` filtrando `business_id` y `tipo = "ingreso"`, `.limit(1).maybeSingle()`.
   - Insert en `transacciones`: `business_id`, `user_id`, `fecha` (=`new Date().toISOString().split("T")[0]`, fecha ISO sin hora), `concepto: "Venta {folio}"`, `categoria_id` (`catVentas?.id || null`), `cantidad` (=Σ cantidades de líneas, total de unidades), `forma_pago: formaPago`, `monto: montoPagado`, `tipo: "ingreso"`, `venta_id`.
7. **Descuento de stock** ([115-158](src/actions/ventas.ts#L115)) — itera cada línea:
   - **Si hay `varianteId`** ([116-128](src/actions/ventas.ts#L116)): lee `producto_variantes.stock` por `id`; `nuevoStock = Math.max(0, variante.stock - cantidad)`; actualiza `producto_variantes` con `stock: nuevoStock` y `estatus: nuevoStock === 0 ? "agotado" : "disponible"`.
   - **Si NO hay variante** ([129-142](src/actions/ventas.ts#L129)): lee `productos.stock, stock_minimo`; `nuevoStock = Math.max(0, producto.stock - cantidad)`; actualiza `productos` con `stock: nuevoStock` y `estatus: nuevoStock === 0 ? "agotado" : nuevoStock <= producto.stock_minimo ? "agotado" : "disponible"`. (Nota: la rama por bajo stock mínimo asigna también `"agotado"`, no un estatus de bajo stock distinto.)
   - **Movimiento de stock** ([145-157](src/actions/ventas.ts#L145)): vuelve a leer `productos.stock` por `id = linea.productoId` (variable `prod`) e inserta en `movimientos_stock`: `business_id`, `producto_id`, `variante_id` (`|| null`), `user_id`, `tipo: "venta"`, `cantidad`, `stock_antes: (prod?.stock ?? 0) + cantidad`, `stock_despues: prod?.stock ?? 0`, `referencia_tipo: "venta"`, `referencia_id: venta.id`. (Nota: `stock_antes/despues` se calculan releyendo `productos.stock`, lo que para líneas con variante refleja el stock del producto padre, no el de la variante.)
8. **Revalidación** ([160-162](src/actions/ventas.ts#L160)): `revalidatePath("/ventas")`, `revalidatePath("/inventario")`, `revalidatePath("/dashboard")`.
9. **Retorna** `venta.id` ([164](src/actions/ventas.ts#L164)).

Efectos secundarios de BD: escribe en `ventas`, `venta_lineas`, condicionalmente en `venta_pagos` y `transacciones`, y en `producto_variantes`/`productos` + `movimientos_stock` por cada línea. Llama RPC `next_venta_folio`. No usa cookies/R2/redirect. Las operaciones de pago/stock (insert en `venta_pagos`, `transacciones`, `movimientos_stock` y los updates de stock) no comprueban su valor de retorno de error.

#### `registrarAbono(ventaId: string, monto: number, formaPago: "efectivo" | "transferencia" | "tarjeta")` — [ventas.ts:167](src/actions/ventas.ts#L167)

Server Action. Sin tipo de retorno explícito (efectivamente `Promise<void>`). Pasos:

1. Contexto `{ supabase, business, user }` ([168](src/actions/ventas.ts#L168)).
2. Lee la venta ([170-175](src/actions/ventas.ts#L170)): `ventas.select("total, monto_pagado, saldo_pendiente, folio, estatus")` por `id = ventaId` y `business_id`, `.single()`.
3. **Validaciones** ([177-179](src/actions/ventas.ts#L177)):
   - Si `ventaError || !venta` → `Error("Venta no encontrada")`.
   - Si `venta.estatus === "cancelada"` → `Error("No se puede abonar a una venta cancelada")`.
   - Si `monto > venta.saldo_pendiente` → `Error("El monto supera el saldo pendiente")`.
4. **Cálculo** ([181-183](src/actions/ventas.ts#L181)): `nuevoMontoPagado = venta.monto_pagado + monto`; `nuevoSaldo = Math.max(0, venta.total - nuevoMontoPagado)`; `nuevoEstadoPago = nuevoSaldo === 0 ? "pagada" : "parcial"`.
5. Insert en `venta_pagos` ([185-191](src/actions/ventas.ts#L185)): `business_id`, `venta_id: ventaId`, `user_id`, `monto`, `forma_pago: formaPago`.
6. Update en `ventas` ([193-197](src/actions/ventas.ts#L193)): `monto_pagado: nuevoMontoPagado`, `saldo_pendiente: nuevoSaldo`, `estado_pago: nuevoEstadoPago` (filtrado solo por `id = ventaId`, sin filtrar por `business_id` en este update).
7. Transacción financiera ([200-219](src/actions/ventas.ts#L200)): busca categoría `tipo = "ingreso"`; insert en `transacciones` con `concepto: "Abono {venta.folio} — {formaPago}"`, `categoria_id` (`|| null`), `cantidad: 1`, `forma_pago: formaPago`, `monto`, `tipo: "ingreso"`, `venta_id: ventaId`, `fecha` ISO sin hora.
8. Revalidación ([221-224](src/actions/ventas.ts#L221)): `revalidatePath("/ventas/{ventaId}")`, `"/ventas"`, `"/ventas/pendientes"`, `"/dashboard"`.

Nota: las operaciones de insert/update no comprueban error (no se inspecciona el valor de retorno de `venta_pagos`, `ventas`, `transacciones`).

#### `cancelarVenta(ventaId: string, motivo: string)` — [ventas.ts:227](src/actions/ventas.ts#L227)

Server Action. Pasos:

1. Contexto `{ supabase, business }` ([228](src/actions/ventas.ts#L228)) (no usa `user`).
2. Update en `ventas` ([230-234](src/actions/ventas.ts#L230)): `estatus: "cancelada"`, `cancelada_at: new Date().toISOString()` (timestamp completo), `motivo_cancelacion: motivo`, filtrado por `id = ventaId` y `business_id`.
3. Si `error` → `Error(error.message)` ([236](src/actions/ventas.ts#L236)).
4. Revalidación ([238-240](src/actions/ventas.ts#L238)): `"/ventas/{ventaId}"`, `"/ventas"`, `"/dashboard"`.
5. `redirect("/ventas")` ([241](src/actions/ventas.ts#L241)).

Nota de negocio: cancelar NO revierte el stock descontado, NO crea movimiento inverso ni transacción de reverso; solo marca la venta como cancelada.

---

### Páginas (Server Components)

#### `VentasPage` (listado/historial) — [page.tsx:22](src/app/(dashboard)/ventas/page.tsx#L22)

Server Component asíncrono. Constante de módulo `FORMA_PAGO_LABEL` ([10](src/app/(dashboard)/ventas/page.tsx#L10)): `{ efectivo:"Efectivo", tarjeta:"Tarjeta", transferencia:"Transferencia", adeudo:"Adeudo" }`. Helper `formatFechaRelativa(fecha)` ([14](src/app/(dashboard)/ventas/page.tsx#L14)): devuelve `"Hoy"`, `"Ayer"` o la fecha cruda comparando contra hoy y `Date.now() - 86400000`.

Comportamiento:
1. Consulta `ventas` ([25-34](src/app/(dashboard)/ventas/page.tsx#L25)): selecciona `id, folio, fecha, hora, total, monto_pagado, saldo_pendiente, forma_pago_inicial, estado_pago, estatus, cliente_nombre, cliente_telefono, notas` + join embebido `venta_lineas (producto_nombre, variante_nombre, cantidad)`; filtrado por `business_id`; ordenado por `fecha desc` y `created_at desc`.
2. KPIs ([39-42](src/app/(dashboard)/ventas/page.tsx#L39)): `ventasHoy` = ventas con `fecha === hoy`; `totalHoy` = Σ `monto_pagado` de las de hoy con `estatus === "activa"`; `unidadesHoy` = Σ cantidades de líneas de las de hoy activas; `cuentasPendientes` = nº de ventas `activa` con `estado_pago !== "pagada"`.
3. Agrupa por fecha en `porFecha` y ordena fechas descendente ([44-49](src/app/(dashboard)/ventas/page.tsx#L44)).
4. Render: KPIs "Cobrado hoy" / "Unidades hoy"; botón "Cuentas por cobrar" (a `/ventas/pendientes`, con badge contador) que solo aparece si `cuentasPendientes > 0`; botón "Nueva venta" → `/ventas/nueva`. Si `todas.length === 0` muestra empty state. Por cada fecha muestra un encabezado con la fecha relativa y un total de la fecha (`totalFecha` = Σ `monto_pagado` de las ventas activas de esa fecha, mostrado como `+{moneda}`), y lista las ventas como `Link` a `/ventas/{id}`, mostrando hora, folio, `EstatusPagoBadge`, `EstatusOperativoBadge` (solo si cancelada), resumen de líneas (`"{nombre} ({variante}) ×{cantidad}"` unidos con `" · "`), cliente, etiqueta de forma de pago (`FORMA_PAGO_LABEL[forma_pago_inicial ?? "adeudo"]`), monto (canceladas muestran `total` en gris/`text-tertiary`; activas `+{monto_pagado}` en verde), y saldo si `saldo_pendiente > 0 && estatus === "activa"`. Las filas canceladas se renderizan con `opacity: 0.55`.

#### `NuevaVentaPage` (POS) — [nueva/page.tsx:6](src/app/(dashboard)/ventas/nueva/page.tsx#L6)

Server Component. Pasos:
1. Consulta `productos` ([9-18](src/app/(dashboard)/ventas/nueva/page.tsx#L9)): `id, nombre, sku, precio_venta, stock, estatus`, join `categorias:categoria_id (nombre, color)` y `producto_variantes (id, nombre, sku, stock, estatus)`; filtrado por `business_id`; `.neq("estatus", "pausado")` (excluye productos pausados); ordenado por `nombre`.
2. Mapea a `productosMapeados` ([20-37](src/app/(dashboard)/ventas/nueva/page.tsx#L20)): normaliza `categorias` (maneja tanto array como objeto, default `{ nombre: "", color: null }`) y mapea variantes.
3. Renderiza `<PosCliente productos={productosMapeados} />`.

#### `VentaDetallePage` — [[id]/page.tsx:12](src/app/(dashboard)/ventas/[id]/page.tsx#L12)

Server Component. Firma: `VentaDetallePage({ params }: { params: Promise<{ id: string }> })`. Pasos:
1. `await params` para obtener `id` ([13](src/app/(dashboard)/ventas/[id]/page.tsx#L13)).
2. `Promise.all` de dos consultas ([16-34](src/app/(dashboard)/ventas/[id]/page.tsx#L16)):
   - `ventas`: selecciona `id, folio, fecha, hora, total, monto_pagado, saldo_pendiente, forma_pago_inicial, estado_pago, estatus, cliente_nombre, cliente_telefono, notas, cancelada_at, motivo_cancelacion` + `venta_lineas (id, producto_nombre, variante_nombre, cantidad, precio_unitario, subtotal)`; por `id` y `business_id`, `.maybeSingle()`.
   - `venta_pagos`: `id, monto, forma_pago, notas, created_at` por `venta_id = id` y `business_id`, ordenado por `created_at`.
3. Si `!venta` → `notFound()` ([36](src/app/(dashboard)/ventas/[id]/page.tsx#L36)).
4. Variables: `cancelada = estatus === "cancelada"`, `pagada = estado_pago === "pagada"`, `formaPago = forma_pago_inicial ?? "adeudo"`.
5. Render: botón "Volver" a `/ventas`; badges `EstatusPagoBadge` y `EstatusOperativoBadge` (siempre se renderiza el operativo, mostrando "Activa" o "Cancelada") + fecha y hora; banner de cancelación si `cancelada` (con `motivo_cancelacion`); sección "Productos" con cada línea (`producto_nombre`, `variante_nombre`, `cantidad × precio_unitario`, `subtotal`) y el `total`; sección "Pagos" (solo si hay pagos) con fecha (`created_at` formateada con `toLocaleDateString("es-MX")`), forma de pago capitalizada, notas y `+monto`; `<AbonoForm>` solo si `!cancelada && !pagada`; panel de "Resumen" (Total, Cobrado, Saldo si `> 0`, Forma de pago capitalizada); panel de Cliente (si hay `cliente_nombre`); Notas (si hay); `<CancelarVentaForm>` solo si `!cancelada`. Helper interno `Row({ label, value, color? })` ([152](src/app/(dashboard)/ventas/[id]/page.tsx#L152)).

#### `PendientesPage` (cuentas por cobrar) — [pendientes/page.tsx:11](src/app/(dashboard)/ventas/pendientes/page.tsx#L11)

Server Component. Pasos:
1. Consulta `ventas` ([14-25](src/app/(dashboard)/ventas/pendientes/page.tsx#L14)): `id, folio, fecha, total, monto_pagado, saldo_pendiente, estado_pago, cliente_nombre, cliente_telefono` + `venta_lineas (producto_nombre, variante_nombre, cantidad)` + `venta_pagos (id)`; filtrado por `business_id`, `.eq("estatus", "activa")`, `.neq("estado_pago", "pagada")`; ordenado por `fecha desc`.
2. Cálculos ([27-29](src/app/(dashboard)/ventas/pendientes/page.tsx#L27)): `totalPendiente = Σ saldo_pendiente`, `totalCobrado = Σ monto_pagado`; el número de cuentas se obtiene en render de `pendientes.length`.
3. Render: botón "Volver" a `/ventas`; tres `KpiCard` ("Cuentas abiertas" = `pendientes.length`, "Ya cobrado" = `totalCobrado`, "Por cobrar" = `totalPendiente` con `highlight`); empty state "Todo al día" si no hay pendientes; por cada venta una `article` con folio, `EstatusPagoBadge`, fecha, cliente, resumen de líneas, **barra de progreso** (`porcentaje = total > 0 ? (monto_pagado/total)*100 : 0`), montos cobrado/pendiente, nº de abonos (`venta_pagos.length`, con texto "abono(s) registrado(s)" que pluraliza si `> 1`), total, `<AbonoRapidoBtn>` y link "Ver detalle". Helper interno `KpiCard({ label, value, color?, mono=true, highlight=false })` ([114](src/app/(dashboard)/ventas/pendientes/page.tsx#L114)).

---

### Componentes

#### `PosCliente` — [PosCliente.tsx:38](src/components/ventas/PosCliente.tsx#L38)

Componente cliente (`"use client"`). Es el corazón del punto de venta. Props: `{ productos: ProductoPos[] }`.

Tipos locales:
- `ProductoPos` ([12](src/components/ventas/PosCliente.tsx#L12)): `{ id, nombre, sku: string|null, precio_venta: number, stock: number, estatus: string, categoria: { nombre; color: string|null }, variantes: { id; nombre; sku: string|null; stock: number; estatus: string }[] }`.
- `ModoPago` ([23](src/components/ventas/PosCliente.tsx#L23)): `"completo" | "parcial" | "adeudo"`.
- `FormaPago` (local, [24](src/components/ventas/PosCliente.tsx#L24)): `"efectivo" | "tarjeta" | "transferencia"` (sin "adeudo").
- `LineaTicket` ([26](src/components/ventas/PosCliente.tsx#L26)): `{ producto: ProductoPos; variante?: ...; cantidad: number }`.
- Constante `FORMAS_PAGO` ([32](src/components/ventas/PosCliente.tsx#L32)): array de `{ value, label }` para efectivo/tarjeta/transferencia.

Estado (`useState`): `query` (`""`), `expandidoId` (`null`), `lineas` (`[]`), `modoPago` (`"completo"`), `formaPago` (`"efectivo"`), `montoRecibido` (`""`), `clienteNombre` (`""`), `clienteTelefono` (`""`), `notas` (`""`), `registrando` (`false`), `exito` (`false`), `errorMsg` (`""`).

Cálculos derivados:
- `resultados` (`useMemo`, [54](src/components/ventas/PosCliente.tsx#L54)): filtra productos por `query` (minúsculas, trim) contra `nombre`, `sku` y `categoria.nombre`; sin query devuelve todos.
- `total = Σ precio_venta * cantidad` ([65](src/components/ventas/PosCliente.tsx#L65)); `totalLineas = Σ cantidad` ([66](src/components/ventas/PosCliente.tsx#L66)); `montoNum = parseFloat(montoRecibido) || 0`; `saldoPreview = modoPago === "parcial" ? Math.max(0, total - montoNum) : 0`; `requiereCliente = modoPago === "parcial" || modoPago === "adeudo"`.

Funciones internas:
- `stockDisponible(producto, variante?)` ([71](src/components/ventas/PosCliente.tsx#L71)): si hay variante devuelve `variante.stock`; si el producto tiene variantes (y no se pasó una) devuelve `0`; si no, `producto.stock`.
- `cantidadEnTicket(productoId, varianteId?)` ([77](src/components/ventas/PosCliente.tsx#L77)): cantidad actual de esa combinación en `lineas` (o 0).
- `agregar(producto, variante?)` ([81](src/components/ventas/PosCliente.tsx#L81)): no hace nada si `stockMax === 0`; si la línea existe incrementa en 1 (sin pasar de `stockMax`); si no, agrega `{ producto, variante, cantidad: 1 }`; si hubo variante cierra el expandido.
- `cambiarCantidad(productoId, varianteId|undefined, delta)` ([96](src/components/ventas/PosCliente.tsx#L96)): ajusta la cantidad respetando `>= 1` y `<= stockMax`.
- `quitar(productoId, varianteId?)` ([108](src/components/ventas/PosCliente.tsx#L108)): elimina la línea.
- `confirmarVenta()` ([112](src/components/ventas/PosCliente.tsx#L112)): **validaciones de guarda**: retorna si `lineas.length === 0 || registrando`; si `modoPago === "parcial" && montoNum <= 0`; si `requiereCliente && !clienteNombre.trim()`. Marca `registrando = true`, limpia error. Construye `pagoInicial`: `completo` → `{ monto: total, formaPago }`; `parcial` → `{ monto: montoNum, formaPago }`; `adeudo` → `{ monto: 0, formaPago: "adeudo" }`. Llama `await registrarVenta({ lineas: [...map a LineaInput con productoId/varianteId/productoNombre/varianteNombre/cantidad/precioUnitario=precio_venta], pagoInicial, cliente: requiereCliente && nombre ? {nombre, telefono|undefined} : undefined, notas: notas.trim() || undefined })`. En éxito: `exito = true`, espera 800ms, `router.push("/ventas")` + `router.refresh()`. En error: `setErrorMsg(message)` y `registrando = false` (no resetea `exito`).

UI: layout `.pos-grid` con buscador (input `type="search"`, `autoFocus`) + listado de productos a la izquierda, y un panel "Ticket" a la derecha. Productos con variantes muestran un badge "{n} tallas" y un botón "Elegir talla"/"Cerrar" que despliega las variantes (cada variante muestra su stock o "Agotada", un badge "×{enTicket}" si está en el ticket, y un botón `+` deshabilitado si `agotada` o `enTicket >= variante.stock`); productos sin variantes muestran botón `+` (deshabilitado si `sinStock` o `cantidadEnTicket >= stock`). El ticket permite ajustar cantidades (botones `Minus`/`Plus` con límites), quitar líneas (`Trash2`) y limpiar todo (`X`). Selector de "Modo de pago" (completo/parcial/adeudo), selector de "Forma de pago" (oculto si `adeudo`), input "Monto recibido" (solo `parcial`, con preview de saldo cuando `montoNum > 0 && saldoPreview > 0`), bloque "Datos del deudor" (`requiereCliente`, nombre obligatorio marcado con `*`, teléfono opcional), input de notas, y botón "Registrar venta" deshabilitado si `lineas.length === 0 || registrando || exito || (modoPago === "parcial" && montoNum <= 0) || (requiereCliente && !clienteNombre.trim())`; el texto cambia a "Registrando…" / "¡Venta registrada ✓". Importa y usa `EstatusBadge` (de inventario) para mostrar el estado "agotado" de productos sin stock.

#### `AbonoRapidoBtn` — [AbonoRapidoBtn.tsx:6](src/components/ventas/AbonoRapidoBtn.tsx#L6)

Componente cliente (`"use client"`). Props: `{ ventaId: string; saldoPendiente: number }`. Renderiza un botón "Abonar" (icono `DollarSign`) que en `onClick` hace `router.push(`/ventas/${ventaId}`)`. Nota: `saldoPendiente` se recibe como prop pero **no se usa**; el botón solo navega al detalle (no registra el abono directamente).

#### `AbonoForm` — [VentaAcciones.tsx:15](src/components/ventas/VentaAcciones.tsx#L15)

Componente cliente (archivo `"use client"`, [línea 1](src/components/ventas/VentaAcciones.tsx#L1)). Props: `{ ventaId: string; saldoPendiente: number }`. Constante `FORMAS_PAGO_ABONO` ([9](src/components/ventas/VentaAcciones.tsx#L9)) con efectivo/tarjeta/transferencia. Estado: `mostrar` (false), `monto` (""), `forma` (`"efectivo"`), `guardando` (false), `error` (""). El formulario está oculto hasta pulsar el botón "Nuevo abono" (alterna a "Cancelar").

`handleAbono()` ([23](src/components/ventas/VentaAcciones.tsx#L23)): `montoNum = parseFloat(monto)`; retorna si `!montoNum || montoNum <= 0 || montoNum > saldoPendiente`; pone `guardando = true`; `await registrarAbono(ventaId, montoNum, forma)`; en éxito limpia `monto`, oculta el form y `router.refresh()`; en error `setError(message)`; `finally guardando = false`. El input de monto tiene `min="0.01"`, `step="0.01"`, `max={saldoPendiente}`, `autoFocus`; el botón "Confirmar abono" se deshabilita si `guardando || !parseFloat(monto) || parseFloat(monto) > saldoPendiente`.

#### `CancelarVentaForm` — [VentaAcciones.tsx:99](src/components/ventas/VentaAcciones.tsx#L99)

Componente cliente. Props: `{ ventaId: string }`. Estado: `mostrar` (false), `motivo` (""), `cancelando` (false), `error` (""). `handleCancelar()` ([106](src/components/ventas/VentaAcciones.tsx#L106)): retorna si `!motivo.trim()`; `cancelando = true`; `await cancelarVenta(ventaId, motivo.trim())`; `router.refresh()` (nota: `cancelarVenta` ya hace `redirect("/ventas")` en el servidor); en error `setError(message)` y `cancelando = false`. UI: botón "Cancelar venta" que despliega un `textarea` de motivo obligatorio (`*`) con advertencia "Esta acción no se puede deshacer. La venta quedará bloqueada.", y botones "Volver"/"Confirmar" (este último deshabilitado si `cancelando || !motivo.trim()`).

#### `EstatusPagoBadge` y `EstatusOperativoBadge` — [EstatusPagoBadge.tsx](src/components/ventas/EstatusPagoBadge.tsx)

Componentes **servidor** (el archivo no tiene `"use client"`). Importan los tipos `EstatusPagoVenta`/`EstatusOperativoVenta`.

- Constante `PAGO_CONFIG` ([3](src/components/ventas/EstatusPagoBadge.tsx#L3)): mapa por estatus de pago → `{ label, color, bg, border }`: `pagada` → "Pagada" (`var(--success)`/verde), `parcial` → "Parcial" (`var(--warning)`/dorado), `pendiente` → "Pendiente" (`var(--error)`/rojo).
- Constante `OPERATIVO_CONFIG` ([9](src/components/ventas/EstatusPagoBadge.tsx#L9)): `activa` → "Activa" (`var(--text-secondary)`/gris), `cancelada` → "Cancelada" (`var(--error)`/rojo).
- `EstatusPagoBadge({ estatus: EstatusPagoVenta })` ([14](src/components/ventas/EstatusPagoBadge.tsx#L14)): renderiza un `span` tipo pill con la config; fallback a `PAGO_CONFIG["pendiente"]` si el estatus no existe.
- `EstatusOperativoBadge({ estatus: EstatusOperativoVenta })` ([27](src/components/ventas/EstatusPagoBadge.tsx#L27)): igual, fallback a `OPERATIVO_CONFIG["activa"]`.

---

### Resumen del flujo de datos (esquema de BD inferido del código)

| Tabla | Columnas escritas/leídas en este subsistema |
|---|---|
| `ventas` | (escritura) `business_id, user_id, folio, subtotal, descuento, total, monto_pagado, saldo_pendiente, forma_pago_inicial, estado_pago, cliente_nombre, cliente_telefono, notas`; (update abono) `monto_pagado, saldo_pendiente, estado_pago`; (update cancelar) `estatus, cancelada_at, motivo_cancelacion`; (lectura) `id, folio, fecha, hora, total, monto_pagado, saldo_pendiente, forma_pago_inicial, estado_pago, estatus, cliente_nombre, cliente_telefono, notas, cancelada_at, motivo_cancelacion`; ordena por `created_at` |
| `venta_lineas` | (escritura) `business_id, venta_id, producto_id, variante_id, producto_nombre, variante_nombre, cantidad, precio_unitario, subtotal`; (lectura embebida) `id, producto_nombre, variante_nombre, cantidad, precio_unitario, subtotal` |
| `venta_pagos` | (escritura) `business_id, venta_id, user_id, monto, forma_pago`; (lectura: `id, monto, forma_pago, notas, created_at`; en pendientes solo `id`) |
| `transacciones` | (escritura) `business_id, user_id, fecha, concepto, categoria_id, cantidad, forma_pago, monto, tipo, venta_id` |
| `categorias` | lectura de `id` donde `business_id` y `tipo = "ingreso"` |
| `productos` | (lectura) `id, nombre, sku, precio_venta, stock, estatus`, `stock_minimo`; (update) `stock, estatus` |
| `producto_variantes` | (lectura) `id, nombre, sku, stock, estatus`; (update) `stock, estatus` |
| `movimientos_stock` | (escritura) `business_id, producto_id, variante_id, user_id, tipo, cantidad, stock_antes, stock_despues, referencia_tipo, referencia_id` |
| `business_memberships` | (lectura, vía `requireBusinessContext`) `business_id, role` donde `status = "active"` |
| `businesses` | (lectura, vía `requireBusinessContext`) `id, name, slug` |
| RPC | `next_venta_folio(target_business_id)` → string (folio) |

Nota: el código no contiene definiciones de políticas RLS; el aislamiento multi-tenant se aplica explícitamente con filtros `business_id` en cada consulta (cualquier RLS estaría definida en migraciones/BD fuera de estos archivos).

---

## 8. Módulo de Finanzas y Dashboard

Este subsistema cubre el registro de transacciones financieras (ingresos/gastos/transferencias), los reportes por categoría con gráficas Recharts, las validaciones Zod de transacción, los KPIs y widgets del dashboard principal, y el layout compartido del área autenticada. Todas las páginas de servidor obtienen el contexto de negocio mediante `requireBusinessContext()` (multi-tenant por `business_id`).

---

### 1. Server Action: `registrarTransaccion`

- Archivo: [finanzas.ts:8](src/actions/finanzas.ts#L8)
- Directiva de módulo: `"use server"` ([finanzas.ts:1](src/actions/finanzas.ts#L1)) — es un **Server Action**.
- Firma exacta (tal cual en el código, **sin** anotación de tipo de retorno):

```ts
export async function registrarTransaccion(input: TransaccionInput)
```

- Parámetro: `input: TransaccionInput` (tipo inferido del esquema Zod `transaccionSchema`, ver sección 10).
- Valor de retorno: implícitamente `Promise<void>` (no hay anotación explícita; no retorna nada y termina con `redirect`).

**Comportamiento paso a paso:**
1. [finanzas.ts:9](src/actions/finanzas.ts#L9) Valida y parsea `input` con `const values = transaccionSchema.parse(input)`. Si la validación falla, `parse` lanza una `ZodError` (no se captura; propaga al límite de error).
2. [finanzas.ts:10](src/actions/finanzas.ts#L10) Obtiene `{ supabase, business, user }` vía `await requireBusinessContext()` (ver sección 16). Esto exige usuario autenticado y membresía activa.
3. [finanzas.ts:12-24](src/actions/finanzas.ts#L12) Inserta una fila en la tabla `transacciones` con el cliente Supabase.
4. [finanzas.ts:26](src/actions/finanzas.ts#L26) Si `error` no es nulo, lanza `new Error(error.message)`.
5. [finanzas.ts:28-29](src/actions/finanzas.ts#L28) Revalida las rutas `/finanzas` y `/dashboard`.
6. [finanzas.ts:30](src/actions/finanzas.ts#L30) Redirige a `/finanzas` con `redirect("/finanzas")`.

**Efecto secundario — escritura a BD (`INSERT` en tabla `transacciones`):**

| Columna BD | Valor asignado | Origen |
|---|---|---|
| `business_id` | `business.id` | contexto de negocio |
| `user_id` | `user.id` | contexto de usuario |
| `fecha` | `values.fecha` | input |
| `concepto` | `values.concepto` | input |
| `categoria_id` | `values.categoriaId` | input |
| `cantidad` | `values.cantidad` | input |
| `forma_pago` | `values.formaPago` | input |
| `monto` | `values.monto` | input |
| `tipo` | `values.tipo` | input |
| `producto_id` | `values.productoId || null` | input (cadena vacía → `null`) |
| `notas` | `values.notas || null` | input (cadena vacía → `null`) |

**Otros efectos secundarios:**
- `revalidatePath("/finanzas")` y `revalidatePath("/dashboard")` ([finanzas.ts:28-29](src/actions/finanzas.ts#L28)).
- `redirect("/finanzas")` ([finanzas.ts:30](src/actions/finanzas.ts#L30)). (Nota: `redirect` lanza internamente, por lo que el código posterior no se ejecuta.)

**Manejo de errores:** ZodError no capturado (de `parse`), `Error(error.message)` si falla el insert. No hay `try/catch`.

---

### 2. Página: `/finanzas` (`FinanzasPage`)

- Archivo: [finanzas/page.tsx:9](src/app/(dashboard)/finanzas/page.tsx#L9)
- Tipo: **Server Component** asíncrono (no tiene `"use client"`).
- `export const dynamic = "force-dynamic"` ([finanzas/page.tsx:7](src/app/(dashboard)/finanzas/page.tsx#L7)) — renderizado dinámico forzado.
- Firma: `export default async function FinanzasPage()`.

**Comportamiento paso a paso:**
1. [finanzas/page.tsx:10](src/app/(dashboard)/finanzas/page.tsx#L10) Obtiene `{ supabase, business }` de `requireBusinessContext()`.
2. [finanzas/page.tsx:12](src/app/(dashboard)/finanzas/page.tsx#L12) Calcula `mesActual = new Date().toISOString().slice(0, 7)` (formato `"YYYY-MM"`). El comentario del código indica `"2026-05"`.
3. [finanzas/page.tsx:13](src/app/(dashboard)/finanzas/page.tsx#L13) `desde = `${mesActual}-01`` (primer día del mes).
4. [finanzas/page.tsx:15-24](src/app/(dashboard)/finanzas/page.tsx#L15) **Lectura BD** sobre tabla `transacciones`:
   - `.select("id, fecha, concepto, monto, tipo, forma_pago, categorias:categoria_id (nombre, color)")` — join embebido a `categorias` por la FK `categoria_id`, trayendo `nombre` y `color`.
   - Filtros: `.eq("business_id", business.id)`, `.gte("fecha", desde)`.
   - Orden: `.order("fecha", { ascending: false })` y luego `.order("created_at", { ascending: false })`.
5. [finanzas/page.tsx:26](src/app/(dashboard)/finanzas/page.tsx#L26) `todas = transacciones ?? []`.
6. [finanzas/page.tsx:27](src/app/(dashboard)/finanzas/page.tsx#L27) `ingresos` = suma de `monto` donde `tipo === "ingreso"`.
7. [finanzas/page.tsx:28](src/app/(dashboard)/finanzas/page.tsx#L28) `gastos` = suma de `monto` donde `tipo === "gasto"`.
8. [finanzas/page.tsx:29](src/app/(dashboard)/finanzas/page.tsx#L29) `balance = ingresos - gastos`.
9. [finanzas/page.tsx:31-35](src/app/(dashboard)/finanzas/page.tsx#L31) `porFecha` agrupa las transacciones por su campo `fecha` (`Record<string, typeof todas>`).
10. [finanzas/page.tsx:36](src/app/(dashboard)/finanzas/page.tsx#L36) `fechas` = claves de `porFecha` ordenadas descendentemente por comparación de cadena (`b.localeCompare(a)`).

**Render / KPIs (3 tarjetas `div.surface` en grid de 3 columnas; NO usa `KPICard`):**
- **Ingresos del mes** ([finanzas/page.tsx:44-52](src/app/(dashboard)/finanzas/page.tsx#L44)): icono `TrendingUp`, color `var(--success)`, valor `formatCurrency(ingresos)`.
- **Gastos del mes** ([finanzas/page.tsx:53-61](src/app/(dashboard)/finanzas/page.tsx#L53)): icono `TrendingDown`, color `var(--error)`, valor `formatCurrency(gastos)`.
- **Balance neto** ([finanzas/page.tsx:62-70](src/app/(dashboard)/finanzas/page.tsx#L62)): icono `Wallet`; color del valor `var(--accent-gold)` si `balance >= 0` o `var(--error)` en caso contrario; valor `formatCurrency(balance)`.

**Otros elementos de UI:**
- Barra de herramientas (`section.toolbar`) con un `<div />` vacío y un enlace `Link href="/finanzas/nueva"` con clase `button button-primary`, texto "Registrar gasto" e icono `Plus` ([finanzas/page.tsx:73-79](src/app/(dashboard)/finanzas/page.tsx#L73)).
- Estado vacío: si `todas.length === 0` muestra "No hay transacciones registradas este mes." ([finanzas/page.tsx:81-85](src/app/(dashboard)/finanzas/page.tsx#L81)).
- Lista agrupada por fecha ([finanzas/page.tsx:88-130](src/app/(dashboard)/finanzas/page.tsx#L88)): para cada `fecha` calcula `totalDia` ([finanzas/page.tsx:90](src/app/(dashboard)/finanzas/page.tsx#L90)) sumando `monto` si `tipo === "ingreso"` y restándolo si no. La fecha se formatea con `new Date(fecha + "T12:00:00").toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" })`. `totalDia` se muestra con prefijo `"+"` solo si `totalDia >= 0` (de lo contrario sin prefijo añadido, ya que el valor negativo ya incluye su signo vía `formatCurrency`) y color verde/rojo según el signo.
- Por cada transacción ([finanzas/page.tsx:102-126](src/app/(dashboard)/finanzas/page.tsx#L102)): normaliza la categoría con `Array.isArray(trx.categorias) ? trx.categorias[0] : (trx.categorias as ...)` ([finanzas/page.tsx:103-105](src/app/(dashboard)/finanzas/page.tsx#L103)) (maneja que el join venga como array o como objeto único). Muestra `concepto`; el bloque de categoría (punto de color con `cat.color ?? "var(--surface-3)"`, `cat.nombre` y un separador `·`) solo se renderiza si `cat` es truthy; siempre muestra `trx.forma_pago`; y el monto con signo `"−"` (gasto, color `var(--error)`) o `"+"` (otro, color `var(--success)`).

**Efectos secundarios:** solo lectura a BD; usa `<Navbar title="Finanzas" subtitle="Ingresos, gastos y balance general de tu negocio." />`. No escribe.

---

### 3. Página: `/finanzas/nueva` (`NuevaTransaccionPage`)

- Archivo: [finanzas/nueva/page.tsx:7](src/app/(dashboard)/finanzas/nueva/page.tsx#L7)
- Tipo: **Server Component** asíncrono.
- `export const dynamic = "force-dynamic"` ([finanzas/nueva/page.tsx:5](src/app/(dashboard)/finanzas/nueva/page.tsx#L5)).

**Comportamiento paso a paso:**
1. [finanzas/nueva/page.tsx:8](src/app/(dashboard)/finanzas/nueva/page.tsx#L8) Obtiene `{ supabase, business }`.
2. [finanzas/nueva/page.tsx:10-22](src/app/(dashboard)/finanzas/nueva/page.tsx#L10) En paralelo (`Promise.all`) hace dos lecturas:
   - **Tabla `categorias`**: `.select("id, nombre, tipo")`, `.eq("business_id", business.id)`, `.neq("tipo", "producto")` (excluye categorías de tipo "producto"), `.order("nombre")`.
   - **Tabla `productos`**: `.select("id, nombre")`, `.eq("business_id", business.id)`, `.order("nombre")`.
3. [finanzas/nueva/page.tsx:28-31](src/app/(dashboard)/finanzas/nueva/page.tsx#L28) Renderiza `<TransaccionForm categorias={categorias ?? []} productos={productos ?? []} />`.

**UI:** `<Navbar title="Nueva transacción" subtitle="Registra ingresos, gastos o transferencias." />`. Solo lectura a BD.

---

### 4. Página: `/finanzas/reportes` (`ReportesPage`)

- Archivo: [finanzas/reportes/page.tsx:11](src/app/(dashboard)/finanzas/reportes/page.tsx#L11)
- Tipo: **Server Component** asíncrono.
- `export const dynamic = "force-dynamic"` ([finanzas/reportes/page.tsx:9](src/app/(dashboard)/finanzas/reportes/page.tsx#L9)).

**Comportamiento paso a paso:**
1. [finanzas/reportes/page.tsx:12](src/app/(dashboard)/finanzas/reportes/page.tsx#L12) Obtiene `{ supabase, business }`.
2. [finanzas/reportes/page.tsx:14](src/app/(dashboard)/finanzas/reportes/page.tsx#L14) `mesDesde = new Date().toISOString().slice(0, 7) + "-01"` (primer día del mes actual).
3. [finanzas/reportes/page.tsx:16-20](src/app/(dashboard)/finanzas/reportes/page.tsx#L16) **Lectura BD** tabla `transacciones`: `.select("tipo, monto, categorias:categoria_id(nombre, color)")`, `.eq("business_id", business.id)`, `.gte("fecha", mesDesde)`.
4. [finanzas/reportes/page.tsx:22](src/app/(dashboard)/finanzas/reportes/page.tsx#L22) `todas = transacciones ?? []`.
5. [finanzas/reportes/page.tsx:23](src/app/(dashboard)/finanzas/reportes/page.tsx#L23) `gastos` = filtro `tipo === "gasto"`.
6. [finanzas/reportes/page.tsx:24](src/app/(dashboard)/finanzas/reportes/page.tsx#L24) `totalGastos` = suma de `monto` de gastos.
7. [finanzas/reportes/page.tsx:25](src/app/(dashboard)/finanzas/reportes/page.tsx#L25) `ingresos` = suma de `monto` donde `tipo === "ingreso"`.
8. [finanzas/reportes/page.tsx:28-35](src/app/(dashboard)/finanzas/reportes/page.tsx#L28) **Agrupa gastos por categoría** en `porCategoria` (`Record<string, { nombre; color; monto; count }>`): por cada gasto, normaliza categoría (array u objeto), usa `cat?.nombre ?? "Sin categoría"` como clave y `cat?.color ?? "#c9a84c"` como color; acumula `monto` y `count`.
9. [finanzas/reportes/page.tsx:37-43](src/app/(dashboard)/finanzas/reportes/page.tsx#L37) Construye `reporte: CategoriaReporte[]` mapeando cada entrada a `{ nombre, transacciones: c.count, monto: c.monto, porcentaje, color }`. El **porcentaje** = `totalGastos > 0 ? Math.round((c.monto / totalGastos) * 100) : 0`. Ordena descendente por `monto` (`b.monto - a.monto`).

**Render / KPIs (3 `KPICard` en grid de 3 columnas):**
- **Ganancia neta** ([finanzas/reportes/page.tsx:50](src/app/(dashboard)/finanzas/reportes/page.tsx#L50)): `value={ingresos - totalGastos}` (sin `tone`, usa por defecto `"gold"`).
- **Ingresos** ([finanzas/reportes/page.tsx:51](src/app/(dashboard)/finanzas/reportes/page.tsx#L51)): `value={ingresos}`, `tone="success"`.
- **Gastos** ([finanzas/reportes/page.tsx:52](src/app/(dashboard)/finanzas/reportes/page.tsx#L52)): `value={totalGastos}`, `tone="error"`.

**Estado vacío:** si `reporte.length === 0` muestra "No hay transacciones este mes para generar reportes." ([finanzas/reportes/page.tsx:55-58](src/app/(dashboard)/finanzas/reportes/page.tsx#L55)).

**Sección de reporte (cuando hay datos):**
- Tarjeta con título "Gastos por categoría" (`<h2 className="font-display">`) y el componente `<GraficaCategoria data={reporte} />` ([finanzas/reportes/page.tsx:61-66](src/app/(dashboard)/finanzas/reportes/page.tsx#L61)).
- `<DataTable<CategoriaReporte>>` ([finanzas/reportes/page.tsx:67-76](src/app/(dashboard)/finanzas/reportes/page.tsx#L67)) con `getRowKey={(row) => row.nombre}` y 4 columnas:

| key | header | cell |
|---|---|---|
| `categoria` | Categoría | `row.nombre` |
| `trx` | Transacciones | `row.transacciones` (font-mono) |
| `monto` | Monto total | `formatCurrency(row.monto)` (font-mono) |
| `pct` | % del total | `${row.porcentaje}%` (font-mono) |

**UI:** `<Navbar title="Reportes" subtitle="Ganancia neta, gastos por categoría y evolución del negocio." />`. Solo lectura a BD.

---

### 5. `error.tsx` de finanzas (`ErrorPage`)

- Archivo: [finanzas/error.tsx:3](src/app/(dashboard)/finanzas/error.tsx#L3)
- Tipo: **Client Component** (`"use client"` en [finanzas/error.tsx:1](src/app/(dashboard)/finanzas/error.tsx#L1)).
- Firma: `export default function ErrorPage({ reset }: { error: Error; reset: () => void })`.
- Props: `error: Error` (declarada en el tipo de la prop pero **no destructurada ni usada** en el cuerpo) y `reset: () => void`.
- Render: `<div className="page">` con tarjeta `surface` que contiene `<h2>No se pudo cargar finanzas</h2>` y botón "Reintentar" cuyo `onClick={reset}`.

---

### 6. `loading.tsx` de finanzas (`Loading`)

- Archivo: [finanzas/loading.tsx:1](src/app/(dashboard)/finanzas/loading.tsx#L1)
- Tipo: Server Component (sin `"use client"`).
- Render: `<div className="page">Cargando finanzas...</div>`. Sin props.

---

### 7. Componente: `GraficaCategoria`

- Archivo: [GraficaCategoria.tsx:11](src/components/finanzas/GraficaCategoria.tsx#L11)
- Tipo: **Client Component** (`"use client"` en [GraficaCategoria.tsx:1](src/components/finanzas/GraficaCategoria.tsx#L1)).
- Firma: `export function GraficaCategoria({ data }: GraficaCategoriaProps)`.

**Props:**

| Prop | Tipo | Valor por defecto |
|---|---|---|
| `data` | `CategoriaReporte[]` | (requerida, sin default) |

**Comportamiento / render (Recharts):**
- Contenedor `div` de `width: "100%"`, `height: 280` ([GraficaCategoria.tsx:13](src/components/finanzas/GraficaCategoria.tsx#L13)).
- `<ResponsiveContainer>` envolviendo un `<PieChart>`.
- `<Pie data={data} dataKey="monto" nameKey="nombre" innerRadius={70} outerRadius={105} paddingAngle={3}>` — gráfica de dona; el valor angular usa el campo `monto` y el nombre `nombre`.
- Por cada `entry` de `data` renderiza un `<Cell key={entry.nombre} fill={entry.color} />` ([GraficaCategoria.tsx:17-19](src/components/finanzas/GraficaCategoria.tsx#L17)).
- `<Tooltip>` con `contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8 }}` y `formatter={(value: number) => formatCurrency(value)}` ([GraficaCategoria.tsx:21-24](src/components/finanzas/GraficaCategoria.tsx#L21)).

Sin efectos secundarios (componente de presentación puro).

---

### 8. Componente: `GraficaGastos`

- Archivo: [GraficaGastos.tsx:11](src/components/finanzas/GraficaGastos.tsx#L11)
- Tipo: **Client Component** (`"use client"` en [GraficaGastos.tsx:1](src/components/finanzas/GraficaGastos.tsx#L1)).
- Firma: `export function GraficaGastos({ data }: GraficaGastosProps)`.

**Props:**

| Prop | Tipo | Valor por defecto |
|---|---|---|
| `data` | `PuntoGrafica[]` | (requerida, sin default) |

**Comportamiento / render (Recharts):**
- Contenedor `div` de `width: "100%"`, `height: 300` ([GraficaGastos.tsx:13](src/components/finanzas/GraficaGastos.tsx#L13)).
- `<ResponsiveContainer>` con `<BarChart data={data}>`.
- `<CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />`.
- `<XAxis dataKey="nombre" stroke="#888888" tickLine={false} axisLine={false} />`.
- `<YAxis stroke="#888888" tickLine={false} axisLine={false} tickFormatter={(value: number) => `$${value / 1000}k`} />` — formatea el eje Y dividiendo entre 1000 y agregando sufijo "k".
- `<Tooltip>` con `cursor={{ fill: "rgba(201,168,76,0.06)" }}`, mismo `contentStyle` que `GraficaCategoria`, y `formatter` → `formatCurrency(value)`.
- Dos barras: `<Bar dataKey="ingresos" fill="#4a9b6f" radius={[4, 4, 0, 0]} />` y `<Bar dataKey="gastos" fill="#c9a84c" radius={[4, 4, 0, 0]} />` ([GraficaGastos.tsx:24-25](src/components/finanzas/GraficaGastos.tsx#L24)).

**Nota:** Este componente no es importado por ninguna de las páginas/componentes revisados en este subsistema (las páginas de finanzas y el dashboard usan únicamente `GraficaCategoria`). No se localizó ningún importador dentro de los archivos analizados.

---

### 9. Componente: `TransaccionForm`

- Archivo: [TransaccionForm.tsx:17](src/components/finanzas/TransaccionForm.tsx#L17)
- Tipo: **Client Component** (`"use client"` en [TransaccionForm.tsx:1](src/components/finanzas/TransaccionForm.tsx#L1)).
- Firma: `export function TransaccionForm({ categorias, productos }: Props)`.

**Tipos exportados localmente (`export interface`):**
- `CategoriaOpt` ([TransaccionForm.tsx:9](src/components/finanzas/TransaccionForm.tsx#L9)): `{ id: string; nombre: string; tipo: string }`.
- `ProductoOpt` ([TransaccionForm.tsx:10](src/components/finanzas/TransaccionForm.tsx#L10)): `{ id: string; nombre: string }`.

**Props (`Props`, interfaz local no exportada, [TransaccionForm.tsx:12-15](src/components/finanzas/TransaccionForm.tsx#L12)):**

| Prop | Tipo | Default |
|---|---|---|
| `categorias` | `CategoriaOpt[]` | (requerida) |
| `productos` | `ProductoOpt[]` | (requerida) |

**Estado / hook:**
- Usa `useForm<TransaccionInput>` de `react-hook-form` ([TransaccionForm.tsx:18-35](src/components/finanzas/TransaccionForm.tsx#L18)) con `resolver: zodResolver(transaccionSchema)`. Extrae `register`, `handleSubmit` y `formState: { errors, isSubmitting }`.
- `defaultValues` ([TransaccionForm.tsx:24-34](src/components/finanzas/TransaccionForm.tsx#L24)):

| Campo | Valor por defecto |
|---|---|
| `fecha` | `new Date().toISOString().slice(0, 10)` (hoy, YYYY-MM-DD) |
| `concepto` | `""` |
| `categoriaId` | `categorias.find((c) => c.tipo !== "producto")?.id ?? ""` |
| `cantidad` | `1` |
| `formaPago` | `"transferencia"` |
| `monto` | `0` |
| `tipo` | `"gasto"` |
| `productoId` | `""` |
| `notas` | `""` |

**Comportamiento:**
- `onSubmit(values: TransaccionInput)` ([TransaccionForm.tsx:37-39](src/components/finanzas/TransaccionForm.tsx#L37)) llama `await registrarTransaccion(values)` (el Server Action de la sección 1).
- `catsFiltradas = categorias.filter((c) => c.tipo !== "producto")` ([TransaccionForm.tsx:41](src/components/finanzas/TransaccionForm.tsx#L41)) — usado para poblar el `<select>` de categoría.

**Campos del formulario (con `register`):**
- `tipo` (`<select>`: ingreso/gasto/transferencia) ([TransaccionForm.tsx:46-52](src/components/finanzas/TransaccionForm.tsx#L46)).
- `concepto` (`<input>` texto, placeholder "Ej. Compra de inventario") ([TransaccionForm.tsx:53-55](src/components/finanzas/TransaccionForm.tsx#L53)).
- `fecha` (`<input type="date">`) ([TransaccionForm.tsx:58-60](src/components/finanzas/TransaccionForm.tsx#L58)).
- `categoriaId` (`<select>` poblado con `catsFiltradas`) ([TransaccionForm.tsx:61-67](src/components/finanzas/TransaccionForm.tsx#L61)).
- `formaPago` (`<select>`: efectivo/transferencia/adeudo/tarjeta) ([TransaccionForm.tsx:68-75](src/components/finanzas/TransaccionForm.tsx#L68)).
- `cantidad` (`<input type="number">` con `register("cantidad", { valueAsNumber: true })`) ([TransaccionForm.tsx:78-80](src/components/finanzas/TransaccionForm.tsx#L78)).
- `monto` (`<input type="number" step="0.01">` con `valueAsNumber: true`) ([TransaccionForm.tsx:81-83](src/components/finanzas/TransaccionForm.tsx#L81)).
- `productoId` (`<select>` etiquetado "Producto asociado (opcional)": opción "Sin producto" con `value=""` más cada producto) ([TransaccionForm.tsx:84-91](src/components/finanzas/TransaccionForm.tsx#L84)).
- `notas` (`<textarea rows={3}>`) ([TransaccionForm.tsx:93-95](src/components/finanzas/TransaccionForm.tsx#L93)).
- Botón submit ([TransaccionForm.tsx:96-99](src/components/finanzas/TransaccionForm.tsx#L96)): `disabled={isSubmitting}`, icono `Landmark`, texto "Registrando…" mientras `isSubmitting` o "Registrar transacción".

**Subcomponente `Field`** ([TransaccionForm.tsx:104](src/components/finanzas/TransaccionForm.tsx#L104)):
- Firma: `function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode })`.
- Renderiza un `<label>` con el texto `label`, los `children` (el control), y si existe `error` un `<span>` con color `var(--error)`.

**Errores de validación:** se muestran por campo mediante `errors.<campo>?.message` provenientes de `react-hook-form`/Zod.

---

### 10. Esquema Zod: `transaccionSchema`

- Archivo: [transaccion.schema.ts:3](src/lib/validations/transaccion.schema.ts#L3)
- Es un `z.object({...})`. Reglas exactas:

| Campo | Definición Zod | Reglas / mensaje |
|---|---|---|
| `fecha` | `z.string().min(1, "La fecha es requerida")` | mínimo 1 carácter |
| `concepto` | `z.string().min(2, "El concepto es requerido").max(160)` | entre 2 y 160 caracteres |
| `categoriaId` | `z.string().min(1, "Selecciona una categoria")` | mínimo 1 carácter |
| `cantidad` | `z.coerce.number().int().positive("La cantidad debe ser mayor a cero")` | número entero, positivo (coerción) |
| `formaPago` | `z.enum(["efectivo", "transferencia", "adeudo", "tarjeta"])` | uno de esos 4 valores |
| `monto` | `z.coerce.number().positive("El monto debe ser positivo")` | número positivo (coerción) |
| `tipo` | `z.enum(["ingreso", "gasto", "transferencia"])` | uno de esos 3 valores |
| `productoId` | `z.string().optional().or(z.literal(""))` | opcional o cadena vacía |
| `notas` | `z.string().max(400).optional().or(z.literal(""))` | opcional, máx 400 caracteres, o cadena vacía |

- Tipo exportado: `export type TransaccionInput = z.infer<typeof transaccionSchema>` ([transaccion.schema.ts:15](src/lib/validations/transaccion.schema.ts#L15)).

Este esquema se usa tanto en el cliente (`zodResolver` en `TransaccionForm`) como en el servidor (`transaccionSchema.parse` en `registrarTransaccion`).

---

### 11. Tipos: `finanzas.types.ts`

- Archivo: [finanzas.types.ts](src/types/finanzas.types.ts)
- Importa `Categoria` desde `@/types/inventario.types` ([finanzas.types.ts:1](src/types/finanzas.types.ts#L1)).

**Tipos union:**
- `TipoTransaccion = "ingreso" | "gasto" | "transferencia"` ([finanzas.types.ts:3](src/types/finanzas.types.ts#L3)).
- `FormaPago = "efectivo" | "transferencia" | "adeudo" | "tarjeta"` ([finanzas.types.ts:4](src/types/finanzas.types.ts#L4)).

**`Transaccion`** ([finanzas.types.ts:6-17](src/types/finanzas.types.ts#L6)):

| Campo | Tipo |
|---|---|
| `id` | `string` |
| `fecha` | `string` |
| `concepto` | `string` |
| `categoria` | `Categoria` |
| `cantidad` | `number` |
| `formaPago` | `FormaPago` |
| `monto` | `number` |
| `tipo` | `TipoTransaccion` |
| `productoId?` | `string` (opcional) |
| `notas?` | `string` (opcional) |

Nota: este tipo `Transaccion` no es usado por las páginas/componentes de este subsistema (las queries definen sus propias formas inline); se incluye por completitud del archivo de tipos.

**`PuntoGrafica`** ([finanzas.types.ts:19-23](src/types/finanzas.types.ts#L19)): `{ nombre: string; ingresos: number; gastos: number }`. Es el tipo de datos de `GraficaGastos`.

**`CategoriaReporte`** ([finanzas.types.ts:25-31](src/types/finanzas.types.ts#L25)): `{ nombre: string; transacciones: number; monto: number; porcentaje: number; color: string }`. Es el tipo de datos de `GraficaCategoria` y de la tabla de reportes.

---

### 12. Página: `/dashboard` (`DashboardPage`)

- Archivo: [dashboard/page.tsx:10](src/app/(dashboard)/dashboard/page.tsx#L10)
- Tipo: **Server Component** asíncrono.
- `export const dynamic = "force-dynamic"` ([dashboard/page.tsx:8](src/app/(dashboard)/dashboard/page.tsx#L8)).

**Comportamiento paso a paso:**
1. [dashboard/page.tsx:11](src/app/(dashboard)/dashboard/page.tsx#L11) Obtiene `{ supabase, business }`.
2. [dashboard/page.tsx:13](src/app/(dashboard)/dashboard/page.tsx#L13) `hoy = new Date().toISOString().split("T")[0]` (YYYY-MM-DD).
3. [dashboard/page.tsx:14](src/app/(dashboard)/dashboard/page.tsx#L14) `mesDesde = hoy.slice(0, 7) + "-01"`.
4. [dashboard/page.tsx:16-50](src/app/(dashboard)/dashboard/page.tsx#L16) **5 lecturas en paralelo** (`Promise.all`):

   a. `ventasHoyData` — tabla `ventas`: `.select("total, monto_pagado, estatus")`, `.eq("business_id", business.id)`, `.eq("fecha", hoy)`.

   b. `transacciones` — tabla `transacciones`: `.select("id, tipo, monto, concepto, fecha, forma_pago, categorias:categoria_id(nombre)")`, `.eq("business_id", business.id)`, `.gte("fecha", mesDesde)`. (Nota: aquí el join a `categorias` solo trae `nombre`, no `color`.)

   c. `bajoStockData` — tabla `productos`: `.select("id, nombre, stock, stock_minimo")`, `.eq("business_id", business.id)`, `.filter("stock", "lte", "stock_minimo")` (productos cuyo `stock` es ≤ `stock_minimo`).

   d. `ventasRecientesData` — tabla `ventas`: `.select("id, folio, hora, total, venta_lineas(producto_nombre, cantidad)")`, `.eq("business_id", business.id)`, `.eq("estatus", "activa")`, ordenado por `fecha` desc y `created_at` desc, `.limit(3)`.

   e. `masVendidosData` — tabla `venta_lineas`: `.select("producto_id, producto_nombre, cantidad")`, `.eq("business_id", business.id)`.

**Cálculo de KPIs y widgets:**
- `totalHoy` ([dashboard/page.tsx:52](src/app/(dashboard)/dashboard/page.tsx#L52)): de `ventasHoyData`, filtra `v.estatus === "activa"` y suma `v.monto_pagado` (NO `total`).
- `ingresos` ([dashboard/page.tsx:53](src/app/(dashboard)/dashboard/page.tsx#L53)): de `transacciones`, suma `monto` donde `tipo === "ingreso"`.
- `gastos` ([dashboard/page.tsx:54](src/app/(dashboard)/dashboard/page.tsx#L54)): de `transacciones`, suma `monto` donde `tipo === "gasto"`.
- `bajoStock = bajoStockData ?? []` ([dashboard/page.tsx:55](src/app/(dashboard)/dashboard/page.tsx#L55)).
- **Top productos más vendidos** ([dashboard/page.tsx:58-63](src/app/(dashboard)/dashboard/page.tsx#L58)): construye `conteo` (`Record<string, { nombre; unidades }>`) recorriendo `masVendidosData`, agrupando por `producto_id` y sumando `cantidad` en `unidades`. Luego `masVendidos = Object.entries(conteo).sort(([, a], [, b]) => b.unidades - a.unidades).slice(0, 3)` (top 3 por unidades).
- `ultimasTrx = (transacciones ?? []).slice(0, 5)` ([dashboard/page.tsx:65](src/app/(dashboard)/dashboard/page.tsx#L65)) — primeras 5 transacciones del arreglo (orden dependiente del retorno de la query, sin `.order` explícito en la consulta de transacciones).

**Render:**
- **Alerta de stock bajo** ([dashboard/page.tsx:72-84](src/app/(dashboard)/dashboard/page.tsx#L72)): si `bajoStock.length > 0`, banner con `role="alert"`, ícono `AlertTriangle`, texto `<strong>{N} producto/productos</strong> con stock bajo o agotado` (singular si `length === 1`, plural en caso contrario) y enlace a `/inventario` con texto "Ver inventario".
- **`kpi-grid` con 4 `KPICard`** ([dashboard/page.tsx:86-91](src/app/(dashboard)/dashboard/page.tsx#L86)):

| Label | value | tone | highlighted |
|---|---|---|---|
| Ventas hoy | `totalHoy` | `gold` | — |
| Ingresos mes | `ingresos` | `success` | — |
| Gastos mes | `gastos` | `error` | — |
| Balance neto | `ingresos - gastos` | `info` | `highlighted` |

- **Widget "Stock bajo"** ([dashboard/page.tsx:95-119](src/app/(dashboard)/dashboard/page.tsx#L95)): si `bajoStock.length === 0` muestra "Todo el inventario está saludable." con `CheckCircle`; si no, lista cada producto como `Link` a `/inventario/${p.id}` mostrando `p.nombre` y `{p.stock} disponibles · mín. {p.stock_minimo}`.
- **Widget "Más vendidos"** ([dashboard/page.tsx:122-148](src/app/(dashboard)/dashboard/page.tsx#L122)): si `masVendidos.length === 0` muestra "Aún no hay ventas registradas."; si no, lista cada producto (índice `i+1`, `data.nombre`, `{data.unidades} unidades vendidas`) como `Link` a `/inventario/${id}`. Incluye enlace de cabecera "Ver inventario" → `/inventario`.
- **Widget "Ventas recientes"** ([dashboard/page.tsx:152-184](src/app/(dashboard)/dashboard/page.tsx#L152)): si `(ventasRecientesData ?? []).length === 0` muestra "Aún no hay ventas. ¡Registra la primera!"; si no, por cada `venta` muestra `venta.hora`, `venta.folio`, la concatenación de líneas `(venta.venta_lineas as ...).map((l) => `${l.producto_nombre} ×${l.cantidad}`).join(" · ")`, y `+{formatCurrency(venta.total)}`. Incluye enlace de cabecera "Ver todas" → `/ventas` y un botón "Nueva venta" → `/ventas/nueva`.
- **Widget "Últimas transacciones"** ([dashboard/page.tsx:187-215](src/app/(dashboard)/dashboard/page.tsx#L187)): solo si `ultimasTrx.length > 0`. Por cada `trx` (key por índice `i`): normaliza categoría (array/objeto, tipada como `{ nombre: string } | null`), muestra fecha formateada `new Date(trx.fecha + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" })`, `trx.concepto`, `{cat?.nombre} · {trx.forma_pago}`, y el monto con signo `"−"`/`"+"` y color rojo (gasto) o verde (otro). Enlace "Ver finanzas" → `/finanzas`.

**UI:** `<Navbar title="Dashboard" subtitle="Pulso operativo y financiero de tu negocio." />`. Solo lectura a BD; no escribe.

---

### 13. `error.tsx` de dashboard (`ErrorPage`)

- Archivo: [dashboard/error.tsx:3](src/app/(dashboard)/dashboard/error.tsx#L3)
- Tipo: **Client Component** (`"use client"`).
- Firma: `export default function ErrorPage({ reset }: { error: Error; reset: () => void })`.
- Props: `error: Error` (en el tipo, no destructurada ni usada) y `reset: () => void`.
- Render: `<div className="page">` con tarjeta `surface` que contiene `<h2>No se pudo cargar el dashboard</h2>` y botón "Reintentar" con `onClick={reset}`. Idéntico estructuralmente al de finanzas salvo el texto.

---

### 14. `loading.tsx` de dashboard (`Loading`)

- Archivo: [dashboard/loading.tsx:1](src/app/(dashboard)/dashboard/loading.tsx#L1)
- Tipo: Server Component.
- Render: `<div className="page">Cargando dashboard...</div>`. Sin props.

---

### 15. Layout del grupo `(dashboard)`: `DashboardLayout`

- Archivo: [layout.tsx:3](src/app/(dashboard)/layout.tsx#L3)
- Tipo: **Server Component** (sin `"use client"`), no asíncrono.
- Firma: `export default function DashboardLayout({ children }: { children: React.ReactNode })`.
- Render ([layout.tsx:4-9](src/app/(dashboard)/layout.tsx#L4)):

```tsx
<div className="app-shell">
  <Sidebar />
  <main style={{ minWidth: 0 }}>{children}</main>
</div>
```

- Importa y monta `<Sidebar />` desde `@/components/shared/Sidebar` ([layout.tsx:1](src/app/(dashboard)/layout.tsx#L1)). Envuelve todas las páginas del grupo `(dashboard)` (incluidas finanzas y dashboard). No tiene lógica de autenticación propia.

---

### 16. Dependencias compartidas relevantes

#### `requireBusinessContext()`
- Archivo: [business-context.ts:26](src/server/business/business-context.ts#L26)
- Módulo marcado `import "server-only"` ([business-context.ts:1](src/server/business/business-context.ts#L1)).
- Firma: `export async function requireBusinessContext(): Promise<BusinessContext>`.
- `BusinessContext` ([business-context.ts:10-24](src/server/business/business-context.ts#L10)): `{ supabase, business: { id; name; slug: string | null }, membership: { role: BusinessRole }, user: { id; email? } }`. `BusinessRole` es el tipo `"admin"` ([business-context.ts:7](src/server/business/business-context.ts#L7)).
- Pasos:
  1. `requireUser()` → `{ supabase, user }` ([business-context.ts:27](src/server/business/business-context.ts#L27)).
  2. Lee `business_memberships`: `.select("business_id, role")`, `.eq("user_id", user.id)`, `.eq("status", "active")`, `.order("created_at", { ascending: true })`, `.limit(1)`, `.maybeSingle()` ([business-context.ts:29-36](src/server/business/business-context.ts#L29)).
  3. Si `membershipError` → lanza `AppError("INTERNAL_ERROR", "No se pudo cargar el negocio activo.", 500, false)`.
  4. Si no hay `membership` → lanza `AppError("FORBIDDEN", "Tu usuario no pertenece a ningun negocio activo.", 403)`.
  5. Lee `businesses`: `.select("id, name, slug")`, `.eq("id", membership.business_id)`, `.single()` ([business-context.ts:50-54](src/server/business/business-context.ts#L50)).
  6. Si `businessError || !business` → lanza `AppError("NOT_FOUND", "No se encontro el negocio activo.", 404)`.
  7. Retorna el contexto. El `role` se castea a `BusinessRole` (`membership.role as BusinessRole`).

#### `formatCurrency(value: number): string`
- Archivo: [utils.ts:8](src/lib/utils.ts#L8)
- Usa `Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 })`. Formatea en pesos mexicanos sin decimales. Usado en todos los KPIs, tablas y listas del subsistema.

#### `KPICard`
- Archivo: [KPICard.tsx:19](src/components/shared/KPICard.tsx#L19)
- Tipo: Server Component (sin `"use client"`).
- Props (`KPICardProps`, interfaz local no exportada, [KPICard.tsx:4-10](src/components/shared/KPICard.tsx#L4)):

| Prop | Tipo | Default |
|---|---|---|
| `label` | `string` | (requerida) |
| `value` | `number` | (requerida) |
| `trend?` | `number` | `undefined` |
| `tone?` | `"gold" \| "success" \| "error" \| "info"` | `"gold"` |
| `highlighted?` | `boolean` | `false` |

- Render: muestra `label`, `formatCurrency(value)` en `font-mono`. Si `highlighted`, aplica `borderColor: "rgba(201,168,76,0.3)"`. Si `trend !== undefined`, muestra una fila de tendencia con `ArrowUpRight`/`ArrowDownRight` (según `trend >= 0`), color según `toneMap[tone]`, y texto `{Math.abs(trend)}% vs. periodo anterior`. (En las páginas de este subsistema nunca se pasa `trend`, por lo que esa fila no se renderiza.)

---

### 17. Resumen de tablas BD referenciadas en el subsistema

| Tabla | Operaciones en este subsistema | Columnas tocadas |
|---|---|---|
| `transacciones` | INSERT (action), SELECT (finanzas, reportes, dashboard) | `business_id, user_id, fecha, concepto, categoria_id, cantidad, forma_pago, monto, tipo, producto_id, notas, id, created_at` + join `categorias` (`nombre, color` en finanzas/reportes; solo `nombre` en dashboard) |
| `categorias` | SELECT (nueva) + join embebido por `categoria_id` | `id, nombre, tipo` (nueva); `nombre, color` (join finanzas/reportes); `nombre` (join dashboard) |
| `productos` | SELECT (nueva: `id, nombre`; dashboard stock bajo: `id, nombre, stock, stock_minimo`) | `id, nombre, stock, stock_minimo` (ninguna query selecciona `tipo`) |
| `ventas` | SELECT (dashboard) | `total, monto_pagado, estatus, fecha, id, folio, hora` |
| `venta_lineas` | SELECT (dashboard) | `producto_id, producto_nombre, cantidad` (+ join embebido en ventas) |
| `business_memberships` | SELECT (requireBusinessContext) | `business_id, role` (filtra por `user_id`, `status`; ordena por `created_at`) |
| `businesses` | SELECT (requireBusinessContext) | `id, name, slug` |

---

## 9. UI Compartida, Estado Global e Infraestructura de Cliente

Este subsistema agrupa los componentes reutilizables de presentación, el sistema de tema claro/oscuro, el (inexistente) store global, las utilidades transversales, el layout raíz, la landing page y el sistema de diseño en CSS. Todo lo aquí documentado proviene literalmente del código leído.

---

### 1. Componentes compartidos (`src/components/shared/`)

#### `DataTable<T>` — [DataTable.tsx:15](src/components/shared/DataTable.tsx#L15)

Componente genérico (server component; **no** lleva la directiva `"use client"`) para renderizar una tabla a partir de columnas y datos.

Firma exacta:

```tsx
export function DataTable<T>({ columns, data, getRowKey }: DataTableProps<T>)
```

Tipos relacionados:

- `Column<T>` — [DataTable.tsx:3](src/components/shared/DataTable.tsx#L3) (interfaz **exportada**):

```ts
export interface Column<T> {
  key: string
  header: string
  cell: (row: T) => ReactNode
}
```

- `DataTableProps<T>` — [DataTable.tsx:9](src/components/shared/DataTable.tsx#L9) (interfaz no exportada).

Props:

| Prop | Tipo | Por defecto | Descripción |
|------|------|-------------|-------------|
| `columns` | `Column<T>[]` | (requerido) | Definición de columnas. Cada una con `key` (clave React), `header` (texto del `<th>`) y `cell` (función render de la celda). |
| `data` | `T[]` | (requerido) | Filas a renderizar. |
| `getRowKey` | `(row: T) => string` | (requerido) | Función que devuelve la `key` React de cada fila. |

Comportamiento paso a paso:

1. Envuelve la tabla en `<div className="surface table-wrap">` (clases definidas en `globals.css`).
2. Renderiza `<thead>` con una fila `<tr>` y un `<th>` por cada `column`, usando `column.key` como `key` y `column.header` como contenido ([DataTable.tsx:21-23](src/components/shared/DataTable.tsx#L21)).
3. Renderiza `<tbody>` con un `<tr>` por cada `row` (clave = `getRowKey(row)`), y dentro un `<td>` por cada `column` (clave = `column.key`, contenido = `column.cell(row)`) ([DataTable.tsx:27-32](src/components/shared/DataTable.tsx#L27)).

Sin efectos secundarios (no escribe BD, no usa cookies, no revalida). `ReactNode` se importa como `import type` desde `react` ([DataTable.tsx:1](src/components/shared/DataTable.tsx#L1)).

> Nota: la `key` de cada `<td>` usa `column.key`, que es la misma para todas las filas, pero al estar anidada bajo `<tr>` con clave de fila, es única dentro de cada fila.

---

#### `EmptyState` — [EmptyState.tsx:11](src/components/shared/EmptyState.tsx#L11)

Componente de estado vacío (server component; sin `"use client"`). Muestra un título, descripción y un botón-enlace de acción con icono `Plus`.

Firma exacta:

```tsx
export function EmptyState({ title, description, actionHref, actionLabel }: EmptyStateProps)
```

`EmptyStateProps` — [EmptyState.tsx:4](src/components/shared/EmptyState.tsx#L4):

| Prop | Tipo | Por defecto | Descripción |
|------|------|-------------|-------------|
| `title` | `string` | (requerido) | Título grande (`font-display`, `fontSize: 32`). |
| `description` | `string` | (requerido) | Texto secundario (`color: var(--text-secondary)`, `maxWidth: 440`). |
| `actionHref` | `string` | (requerido) | Destino del `<Link>` (`next/link`). |
| `actionLabel` | `string` | (requerido) | Texto del botón de acción. |

Comportamiento:

1. Renderiza una `<section className="surface">` con estilos inline: `display: "grid"`, `minHeight: 260`, `placeItems: "center"`, `padding: 28`, `textAlign: "center"`.
2. Dentro hay un `<div>` contenedor que envuelve: el título (`<div className="font-display" style={{ fontSize: 32 }}>`), la descripción (`<p style={{ maxWidth: 440, color: "var(--text-secondary)" }}>`) y un `<Link href={actionHref}>` con clase `button button-primary`, que incluye el icono `Plus` de `lucide-react` (`size={17}`, `aria-hidden="true"`) seguido de `actionLabel` ([EmptyState.tsx:14-21](src/components/shared/EmptyState.tsx#L14)).

Dependencias: `Link` de `next/link` y `Plus` de `lucide-react`. Sin efectos secundarios.

---

#### `KPICard` — [KPICard.tsx:19](src/components/shared/KPICard.tsx#L19)

Tarjeta de indicador clave (server component; sin `"use client"`). Muestra una etiqueta, un valor monetario formateado y, opcionalmente, una tendencia con flecha.

Firma exacta:

```tsx
export function KPICard({ label, value, trend, tone = "gold", highlighted = false }: KPICardProps)
```

`KPICardProps` — [KPICard.tsx:4](src/components/shared/KPICard.tsx#L4):

| Prop | Tipo | Por defecto | Descripción |
|------|------|-------------|-------------|
| `label` | `string` | (requerido) | Etiqueta superior (`color: var(--text-secondary)`, `fontSize: 13`). |
| `value` | `number` | (requerido) | Valor numérico; se renderiza con `formatCurrency(value)` (MXN). |
| `trend` | `number` (opcional) | `undefined` | Porcentaje de tendencia. Si es `undefined` no se muestra el bloque de tendencia. |
| `tone` | `"gold" \| "success" \| "error" \| "info"` | `"gold"` | Color del bloque de tendencia (vía `toneMap`). |
| `highlighted` | `boolean` | `false` | Si `true`, aplica `borderColor: "rgba(201,168,76,0.3)"`; si no, `undefined`. |

Constante `toneMap` — [KPICard.tsx:12](src/components/shared/KPICard.tsx#L12) (objeto no exportado):

| Clave | Valor |
|-------|-------|
| `gold` | `var(--accent-gold)` |
| `success` | `var(--success)` |
| `error` | `var(--error)` |
| `info` | `var(--info)` |

Comportamiento paso a paso:

1. Renderiza un `<article className="surface">` con `padding: 18` y `borderColor` condicional según `highlighted`.
2. Muestra la etiqueta (`label`) en un `<div>` (`color: var(--text-secondary)`, `fontSize: 13`) y, debajo, el valor formateado con `formatCurrency(value)` en clase `font-mono`, `marginTop: 14`, `fontSize: 27` ([KPICard.tsx:28-31](src/components/shared/KPICard.tsx#L28)).
3. Si `trend !== undefined`, renderiza un `<div>` (`marginTop: 12`, `display: flex`, `alignItems: center`, `gap: 6`, `color: toneMap[tone]`, `fontSize: 13`) con: flecha `ArrowUpRight` si `trend >= 0`, o `ArrowDownRight` si `trend < 0` (ambas `lucide-react`, `size={15}`, `aria-hidden="true"`); el texto es `` `${Math.abs(trend)}% vs. periodo anterior` `` ([KPICard.tsx:32-37](src/components/shared/KPICard.tsx#L32)).

Dependencias: `ArrowDownRight`, `ArrowUpRight` de `lucide-react`; `formatCurrency` de `@/lib/utils`. Sin efectos secundarios.

---

#### `Navbar` — [Navbar.tsx:13](src/components/shared/Navbar.tsx#L13)

Cabecera de página. Marcado como **componente cliente** (`"use client"`, [Navbar.tsx:1](src/components/shared/Navbar.tsx#L1)) porque incluye `ThemeToggle` (que usa contexto/estado).

Firma exacta:

```tsx
export function Navbar({ title, subtitle, hideActions = false }: NavbarProps)
```

`NavbarProps` — [Navbar.tsx:7](src/components/shared/Navbar.tsx#L7):

| Prop | Tipo | Por defecto | Descripción |
|------|------|-------------|-------------|
| `title` | `string` | (requerido) | Título principal `<h1 className="font-display">` con `margin: 0`, `fontSize: clamp(1.75rem, 3vw, 2.5rem)`, `fontWeight: 500`. |
| `subtitle` | `string` (opcional) | `undefined` | Si está presente, renderiza un `<p>` (`margin: "6px 0 0"`, `color: var(--text-secondary)`, `fontSize: 14`). |
| `hideActions` | `boolean` | `false` | Si `true`, oculta el bloque derecho de acciones. |

Comportamiento:

1. Renderiza un `<header>` con `display: flex`, `alignItems: "center"`, `justifyContent: "space-between"`, `gap: 16`, `borderBottom: "1px solid var(--border-subtle)"`, `padding: "20px 28px"`.
2. A la izquierda, un `<div>` con el `title` y, condicionalmente, el `subtitle`.
3. Si `!hideActions`, a la derecha renderiza un `<div>` (`display: flex`, `alignItems: center`, `gap: 8`) que contiene ([Navbar.tsx:34-59](src/components/shared/Navbar.tsx#L34)):
   - `<ThemeToggle />`.
   - Un `<button className="button" aria-label="Ver notificaciones">` (con `style={{ padding: "0 12px" }}`) con icono `Bell` (`lucide-react`, `size={16}`, `aria-hidden="true"`).
   - Un avatar circular (`<div>` con `display: "grid"`, `width: 38`, `height: 38`, `placeItems: "center"`, `borderRadius: 999`, `color: "#ffffff"`, `background: "var(--accent-gold)"`, `fontWeight: 700`, `fontSize: 13`, `flexShrink: 0`, `border: "1px solid rgba(255,255,255,0.15)"`) que muestra `getInitials("Nexxuz Admin")` — es decir, el texto **"NA"** está fijado por código (no es dinámico) y tiene `aria-label="Usuario actual"`.

Dependencias: `Bell` de `lucide-react`; `getInitials` de `@/lib/utils`; `ThemeToggle` de `@/components/shared/ThemeToggle`. Sin efectos secundarios.

---

#### `NexxusLogo` — [NexxusLogo.tsx:5](src/components/shared/NexxusLogo.tsx#L5)

Logotipo de marca (server component; sin `"use client"`).

Firma exacta:

```tsx
export function NexxusLogo({ compact = false }: NexxusLogoProps)
```

`NexxusLogoProps` — [NexxusLogo.tsx:1](src/components/shared/NexxusLogo.tsx#L1):

| Prop | Tipo | Por defecto | Descripción |
|------|------|-------------|-------------|
| `compact` | `boolean` | `false` | Si `true`, sólo muestra el cuadro "NX" más pequeño (38×38, `fontSize: 22`) y omite el texto. Si `false`, el cuadro es 48×48 (`fontSize: 28`) y muestra texto. |

Comportamiento:

1. Contenedor `<div>` con `display: "inline-flex"`, `alignItems: "center"`, `gap: 12` y `aria-label="Nexxus"`.
2. Cuadro decorativo (`aria-hidden="true"`, clase `font-display`, `display: "grid"`, `placeItems: "center"`, `lineHeight: 1`) con la sigla **"NX"**, borde `1px solid rgba(201,168,76,0.45)`, `borderRadius: 8`, `color: var(--accent-gold)`, fondo en gradiente `linear-gradient(145deg, rgba(201,168,76,0.12), rgba(255,255,255,0.02))`. `width`/`height` y `fontSize` dependen de `compact`.
3. Si `!compact`, añade un `<div>` con un bloque de texto "Nexxus" (`font-display`, `fontSize: 28`, `lineHeight: 1`, `letterSpacing: 0`) y el subtítulo "Inventory & Finance" (`color: var(--text-tertiary)`, `fontSize: 12`) ([NexxusLogo.tsx:26-33](src/components/shared/NexxusLogo.tsx#L26)).

Sin dependencias externas ni efectos secundarios.

---

#### `Sidebar` — [Sidebar.tsx:17](src/components/shared/Sidebar.tsx#L17)

Barra lateral de navegación principal. **Componente cliente** (`"use client"`, [Sidebar.tsx:1](src/components/shared/Sidebar.tsx#L1)) porque usa `usePathname` y `useState`.

Firma: `export function Sidebar()` — sin props.

Constante `navigation` — [Sidebar.tsx:10](src/components/shared/Sidebar.tsx#L10) (array no exportado). Elementos con `{ href, label, icon }`:

| `href` | `label` | `icon` (lucide-react) |
|--------|---------|-----------------------|
| `/dashboard` | Dashboard | `LayoutDashboard` |
| `/ventas` | Ventas | `ShoppingCart` |
| `/inventario` | Inventario | `Boxes` |
| `/finanzas` | Finanzas | `ReceiptText` |

Estado interno:

- `pathname = usePathname()` ([Sidebar.tsx:18](src/components/shared/Sidebar.tsx#L18)) — ruta actual.
- `[open, setOpen] = useState(false)` ([Sidebar.tsx:19](src/components/shared/Sidebar.tsx#L19)) — controla el menú móvil.

Comportamiento paso a paso:

1. Devuelve un Fragment (`<>...</>`).
2. **Barra móvil** (`.mobile-nav-bar`, oculta por CSS en escritorio): un `<Link href="/dashboard" aria-label="Ir al dashboard">` con `onClick` que hace `setOpen(false)` envolviendo un `<NexxusLogo compact />`, y un botón hamburguesa (`className="button mobile-menu-button"`) que alterna `open` con `setOpen((v) => !v)`. El icono es `X` (`size={20}`) si `open`, o `Menu` (`size={20}`) si no. `aria-expanded={open}` y `aria-label` dinámico ("Cerrar menu" / "Abrir menu") ([Sidebar.tsx:23-36](src/components/shared/Sidebar.tsx#L23)).
3. **`<aside>`** con clase calculada `cn("sidebar", open && "sidebar-open")` ([Sidebar.tsx:38](src/components/shared/Sidebar.tsx#L38)).
4. Logo de escritorio: un `<Link href="/dashboard" aria-label="Ir al dashboard" className="desktop-logo">` que envuelve `<NexxusLogo />` (sin `compact`).
5. **Navegación** (`<nav className="sidebar-nav" aria-label="Navegación principal">`): por cada item de `navigation`, calcula `isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)` ([Sidebar.tsx:45](src/components/shared/Sidebar.tsx#L45)). Renderiza un `<Link>` (con `key={item.href}`) con clase `cn("button", isActive && "button-primary")`, estilo `justifyContent: "flex-start"` y color `#0a0a0a` si activo o `var(--text-secondary)` si no, su icono (`size={17}`, `aria-hidden="true"`) y la etiqueta. Cada click hace `setOpen(false)`.
6. **Sección inferior** (`<div className="sidebar-bottom">`): un separador `<div>` de `height: 1` (`background: var(--border-subtle)`, `margin: "4px 0"`, `aria-hidden="true"`), un `<Link href="/login" className="button">` con icono `LogOut` (`size={17}`) y texto "Salir", y un `<footer className="sidebar-footer">Nexxuz</footer>` ([Sidebar.tsx:62-73](src/components/shared/Sidebar.tsx#L62)).

Dependencias: `Link` (next/link), `usePathname` (next/navigation), iconos `Boxes, LayoutDashboard, LogOut, Menu, ReceiptText, ShoppingCart, X` (lucide-react), `useState` (react), `NexxusLogo`, `cn`. Sin escrituras a BD; la navegación es vía enlaces (no `redirect` programático). El enlace "Salir" simplemente apunta a `/login` (no ejecuta logout aquí).

---

### 2. Sistema de tema (claro/oscuro)

#### `ThemeProvider` y `useTheme` — [ThemeProvider.tsx](src/components/shared/ThemeProvider.tsx)

**Componente cliente** (`"use client"`, [ThemeProvider.tsx:1](src/components/shared/ThemeProvider.tsx#L1)).

Tipos y contexto:

- `type Theme = "dark" | "light"` — [ThemeProvider.tsx:5](src/components/shared/ThemeProvider.tsx#L5).
- `interface ThemeContextValue { theme: Theme; toggle: () => void }` — [ThemeProvider.tsx:7](src/components/shared/ThemeProvider.tsx#L7).
- `ThemeContext` — [ThemeProvider.tsx:12](src/components/shared/ThemeProvider.tsx#L12): creado con `createContext<ThemeContextValue>` y valor por defecto `{ theme: "dark", toggle: () => {} }`.

Hook `useTheme()` — [ThemeProvider.tsx:17](src/components/shared/ThemeProvider.tsx#L17): retorna `useContext(ThemeContext)` → `{ theme, toggle }`.

Componente `ThemeProvider({ children }: { children: React.ReactNode })` — [ThemeProvider.tsx:21](src/components/shared/ThemeProvider.tsx#L21):

1. Estado `[theme, setTheme] = useState<Theme>("dark")` (valor inicial **"dark"**).
2. `useEffect` (sin dependencias, corre una vez tras montar, [ThemeProvider.tsx:24-29](src/components/shared/ThemeProvider.tsx#L24)):
   - Lee `localStorage.getItem("nx-theme")` como `Theme | null`.
   - `initial = stored ?? "dark"`.
   - `setTheme(initial)`.
   - `document.documentElement.setAttribute("data-theme", initial)` — establece el atributo `data-theme` en `<html>`.
3. Función `toggle()` — [ThemeProvider.tsx:31-38](src/components/shared/ThemeProvider.tsx#L31): dentro de `setTheme`, calcula `next = current === "dark" ? "light" : "dark"`, persiste con `localStorage.setItem("nx-theme", next)`, aplica `document.documentElement.setAttribute("data-theme", next)` y devuelve `next`.
4. Provee `{ theme, toggle }` a los descendientes vía `<ThemeContext.Provider>`.

**Efectos secundarios:** lectura/escritura de `localStorage` bajo la clave `"nx-theme"`, y mutación del atributo `data-theme` del `<html>`. No usa cookies ni BD.

> Detalle de hidratación: el SSR/initial render usa siempre `"dark"`; el tema persistido sólo se aplica en cliente tras el `useEffect`. Por eso el layout usa `suppressHydrationWarning` y fija `data-theme="dark"` por defecto (ver layout).

#### `ThemeToggle` — [ThemeToggle.tsx:6](src/components/shared/ThemeToggle.tsx#L6)

**Componente cliente** (`"use client"`). Firma: `export function ThemeToggle()` — sin props.

1. Obtiene `{ theme, toggle } = useTheme()`.
2. Renderiza un `<button className="button" type="button" onClick={toggle}>` con `style={{ padding: "0 12px", gap: 6 }}`.
3. `aria-label` dinámico: "Cambiar a modo claro" si `theme === "dark"`, o "Cambiar a modo oscuro" en caso contrario.
4. Icono: `Sun` (lucide-react, `size={16}`, `aria-hidden="true"`) si `theme === "dark"`; `Moon` (`size={16}`, `aria-hidden="true"`) si no ([ThemeToggle.tsx:17-21](src/components/shared/ThemeToggle.tsx#L17)).

Efecto secundario: al hacer click invoca `toggle()` (que persiste en `localStorage` y muta `data-theme`).

---

### 3. Store global Zustand

#### `src/lib/store.ts` — [store.ts:1](src/lib/store.ts#L1)

El archivo está **vacío de lógica**. Su contenido completo es:

```ts
// Store local eliminado. Toda la lógica de datos usa Supabase via Server Actions.
export {}
```

No existe ningún store de Zustand activo en este archivo. El comentario indica explícitamente que el store local fue eliminado y que la gestión de datos se realiza mediante Supabase a través de Server Actions. `export {}` lo convierte en un módulo ES sin exportaciones.

> A pesar de que el enunciado del subsistema menciona Zustand, en este archivo no hay ningún `create()` ni estado global definido.

---

### 4. Utilidades (`src/lib/utils.ts`)

Importa `clsx` (`{ clsx, type ClassValue }`) y `twMerge` de `tailwind-merge`.

#### `cn(...inputs: ClassValue[]): string` — [utils.ts:4](src/lib/utils.ts#L4)

Combina clases de Tailwind resolviendo conflictos: `return twMerge(clsx(inputs))`. Primero `clsx` une/condiciona las clases y luego `twMerge` deduplica/resuelve utilidades Tailwind en conflicto. Usado por `Sidebar`.

#### `formatCurrency(value: number): string` — [utils.ts:8](src/lib/utils.ts#L8)

Formatea un número como moneda mexicana:

```ts
new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
}).format(value)
```

Locale `es-MX`, moneda `MXN`, **sin decimales** (`maximumFractionDigits: 0`). Usado por `KPICard`.

#### `formatDate(value: string | Date): string` — [utils.ts:16](src/lib/utils.ts#L16)

Formatea una fecha:

```ts
new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
  year: "numeric",
}).format(new Date(value))
```

Acepta `string` o `Date`; siempre construye `new Date(value)`. Salida con día de 2 dígitos, mes abreviado y año numérico, locale `es-MX`. (No se observa uso dentro de los archivos leídos.)

#### `getInitials(name: string): string` — [utils.ts:24](src/lib/utils.ts#L24)

Extrae iniciales:

1. `name.split(" ")` — divide por espacios.
2. `.map((part) => part.at(0))` — toma el primer carácter de cada palabra.
3. `.filter(Boolean)` — descarta valores falsy (palabras vacías).
4. `.join("")` — concatena.
5. `.slice(0, 2)` — toma máximo 2 caracteres.
6. `.toUpperCase()` — mayúsculas.

Ejemplo: `getInitials("Nexxuz Admin")` → `"NA"`. Usado por `Navbar`.

---

### 5. Layout raíz — `src/app/layout.tsx`

Server component (sin `"use client"`).

Fuentes (Google Fonts vía `next/font/google`, [layout.tsx:2-19](src/app/layout.tsx#L2)):

| Fuente | Variable CSS | Subset |
|--------|--------------|--------|
| `Inter` | `--font-inter` | `["latin"]` |
| `Cormorant_Garamond` | `--font-cormorant` | `["latin"]` |
| `JetBrains_Mono` | `--font-jetbrains` | `["latin"]` |

`metadata: Metadata` — [layout.tsx:21](src/app/layout.tsx#L21):
- `title: "Nexxus"`
- `description: "Inventario y finanzas empresariales para pequenos negocios."`

`RootLayout({ children }: Readonly<{ children: React.ReactNode }>)` — [layout.tsx:26](src/app/layout.tsx#L26):

1. Renderiza `<html lang="es">` con `className` que concatena las tres variables de fuente (`${inter.variable} ${cormorant.variable} ${jetbrains.variable}`), `data-theme="dark"` y `suppressHydrationWarning` ([layout.tsx:32](src/app/layout.tsx#L32)).
2. Dentro del `<body>`, envuelve `{children}` en `<ThemeProvider>`.
3. Importa `./globals.css` ([layout.tsx:4](src/app/layout.tsx#L4)).

El `data-theme="dark"` fijo en el HTML y `suppressHydrationWarning` son coherentes con el hecho de que `ThemeProvider` ajusta el tema real en cliente tras montar.

---

### 6. Landing page — `src/app/page.tsx`

Server component. Firma: `export default function HomePage()` — [page.tsx:3](src/app/page.tsx#L3).

Comportamiento: ejecuta `redirect("/dashboard")` (de `next/navigation`, [page.tsx:1](src/app/page.tsx#L1)). No renderiza ninguna UI; la ruta raíz `/` redirige siempre a `/dashboard`.

**Efecto secundario:** `redirect` de Next.js (lanza la excepción interna de redirección).

---

### 7. Sistema de diseño — `src/app/globals.css`

Importa Tailwind con `@import "tailwindcss";` ([globals.css:1](src/app/globals.css#L1)) — sintaxis de Tailwind v4.

#### 7.1 Tokens / variables CSS en `:root` (tema oscuro por defecto) — [globals.css:3-24](src/app/globals.css#L3)

| Variable | Valor |
|----------|-------|
| `--background` | `#0a0a0a` |
| `--surface-1` | `#111111` |
| `--surface-2` | `#1a1a1a` |
| `--surface-3` | `#222222` |
| `--border-subtle` | `rgba(255, 255, 255, 0.06)` |
| `--border-active` | `rgba(255, 255, 255, 0.15)` |
| `--text-primary` | `#f0f0f0` |
| `--text-secondary` | `#888888` |
| `--text-tertiary` | `#555555` |
| `--accent-gold` | `#c9a84c` |
| `--accent-gold-hover` | `#e2c06a` |
| `--accent-gold-subtle` | `rgba(201, 168, 76, 0.1)` |
| `--success` | `#4a9b6f` |
| `--error` | `#9b4a4a` |
| `--warning` | `#9b7a4a` |
| `--info` | `#4a6b9b` |
| `--premium-shadow` | `0 0 0 1px rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.6)` |
| `--radius-card` | `8px` |
| `--radius-input` | `6px` |
| `--ease-premium` | `cubic-bezier(0.16, 1, 0.3, 1)` |

#### 7.2 Tema claro — `[data-theme="light"]` — [globals.css:28-65](src/app/globals.css#L28)

Sobrescribe variables cuando `<html data-theme="light">`:

| Variable | Valor (light) |
|----------|---------------|
| `--background` | `#f5f3ef` |
| `--surface-1` | `#ffffff` |
| `--surface-2` | `#f0ede8` |
| `--surface-3` | `#e8e4de` |
| `--border-subtle` | `rgba(0,0,0,0.08)` |
| `--border-active` | `rgba(0,0,0,0.22)` |
| `--text-primary` | `#1a1a1a` |
| `--text-secondary` | `#666666` |
| `--text-tertiary` | `#aaaaaa` |
| `--accent-gold` | `#b8942e` |
| `--accent-gold-hover` | `#a07e22` |
| `--accent-gold-subtle` | `rgba(184,148,46,0.12)` |
| `--success` | `#2e7d52` |
| `--error` | `#a03030` |
| `--warning` | `#8a6020` |
| `--info` | `#2e5090` |
| `--premium-shadow` | `0 0 0 1px rgba(0,0,0,0.06), 0 4px 20px rgba(0,0,0,0.08)` |

Reglas adicionales del tema claro:
- `[data-theme="light"] body`: fondo con gradiente radial dorado (`rgba(184,148,46,0.06)`) + gradiente lineal blanco (`rgba(255,255,255,0.8)`) + `--background`.
- `[data-theme="light"] body::before { opacity: 0.012 }` (ruido más tenue).
- `[data-theme="light"] .sidebar { background: rgba(245,243,239,0.9) }`.
- `[data-theme="light"] .button-primary { color: #ffffff }`.

#### 7.3 Base / reset — [globals.css:67-121](src/app/globals.css#L67)

- `* { box-sizing: border-box }`.
- `html { min-height: 100%; background: var(--background) }`.
- `body`: `min-height: 100vh`, `margin: 0`, color `--text-primary`, fondo con gradiente radial dorado (`rgba(201,168,76,0.08)`) + gradiente lineal (`rgba(255,255,255,0.025)`) + `--background`, fuente `var(--font-inter), Inter, system-ui, sans-serif`.
- `body::before`: capa fija de ruido SVG (`feTurbulence`), `position: fixed`, `inset: 0`, `opacity: 0.02`, `z-index: -1`, `pointer-events: none`.
- `a { color: inherit; text-decoration: none }`.
- `button, input, select, textarea { font: inherit }`; `button { cursor: pointer }`; `button:disabled { cursor: not-allowed; opacity: 0.55 }`.
- `:focus-visible { outline: 2px solid var(--accent-gold); outline-offset: 2px }`.

#### 7.4 Tipografía — [globals.css:125-131](src/app/globals.css#L125)

- `.font-display` → `var(--font-cormorant), "Cormorant Garamond", serif` (usada por `EmptyState`, `KPICard`, `Navbar`, `NexxusLogo`).
- `.font-mono` → `var(--font-jetbrains), "JetBrains Mono", monospace` (usada por `KPICard`).

#### 7.5 Clases de layout y componentes (resumen de las relevantes a este subsistema)

- `.app-shell` ([globals.css:135](src/app/globals.css#L135)): grid `280px minmax(0,1fr)`, `min-height: 100vh`.
- `.sidebar` ([globals.css:143](src/app/globals.css#L143)): `position: sticky`, `top: 0`, columna flex, altura `100vh`, borde derecho, fondo `rgba(10,10,10,0.78)`, `padding: 22px`. Más `.sidebar-nav` (grid, `gap: 6px`, `margin-top: 32px`), `.sidebar-bottom` (grid, `gap: 8px`, `margin-top: auto`), `.sidebar-footer` (Cormorant, `font-size: 18px`, `margin-top: 14px`, centrado), `.mobile-nav-bar { display: none }` por defecto.
- `.surface` ([globals.css:291](src/app/globals.css#L291)): borde `--border-subtle`, `border-radius: var(--radius-card)`, fondo en gradiente + `--surface-1`, `box-shadow: var(--premium-shadow)` (usada por `DataTable`, `EmptyState`, `KPICard`).
- `.elevated` (`background: var(--surface-2)`), `.input`, `.input:focus`.
- `.button` ([globals.css:323](src/app/globals.css#L323)): `inline-flex`, `min-height: 40px`, `gap: 8px`, borde sutil, `border-radius: 6px`, `padding: 0 14px`, color `--text-primary`, fondo `--surface-2`, transición `all 180ms var(--ease-premium)`. `.button:hover` levanta `translateY(-1px)` y cambia `border-color` a `--border-active`. `.button-primary` con borde `rgba(201,168,76,0.35)`, `color: #0a0a0a`, fondo `--accent-gold`; hover → `--accent-gold-hover` (usadas por `EmptyState`, `Navbar`, `Sidebar`).
- `.badge`, `.page`, `.table-wrap` (`overflow-x: auto`), estilos de `table`/`th`/`td` ([globals.css:381-409](src/app/globals.css#L381)): `border-collapse: collapse`, celdas con borde inferior y `padding: 14px 12px`, `th` en mayúsculas/`letter-spacing: 0.05em`, hover de fila con fondo tenue `rgba(255,255,255,0.018)` (usados por `DataTable`).
- Grids específicos de pantalla: `.kpi-grid` (4 columnas), `.dashboard-grid`, `.report-grid`, `.product-detail-grid` (3 columnas), `.metric-grid` (3 columnas), `.form-grid`, `.category-grid` (2 columnas), `.product-card-grid` (2 columnas), `.pos-grid`. También `.responsive-cluster` y `.toolbar`.
- Estilos de autenticación: `.auth-shell`, `.auth-panel` (grid 1fr 1fr), `.auth-brand`, `.auth-form-panel`.

#### 7.6 Responsive

- `@media (max-width: 920px)` ([globals.css:413](src/app/globals.css#L413)): `.app-shell` pasa a una columna; aparece `.mobile-nav-bar` (sticky, blur); `.mobile-menu-button` 44px; `.sidebar` se vuelve `fixed` con `transform: translateY(-120%)`, `opacity: 0` y `pointer-events: none` por defecto, revelándose con `.sidebar-open` (`translateY(0)`, `opacity: 1`, `pointer-events: auto`); se oculta `.desktop-logo`; los grids principales (`.kpi-grid`, `.dashboard-grid`, `.report-grid`, `.product-detail-grid`, `.form-grid`, `.category-grid`, `.pos-grid`) pasan a `1fr`; `.toolbar`/`header` se apilan en columna; `.auth-panel` a una columna y `.auth-brand` se oculta.
- `@media (max-width: 680px)` ([globals.css:519](src/app/globals.css#L519)): `.product-card-grid` y `.metric-grid` a `1fr`; `.button { width: 100% }`; celdas de tabla (`th`/`td`) con `padding: 12px 10px`.

La clase `.sidebar-open` está directamente acoplada al estado `open` de `Sidebar` vía `cn("sidebar", open && "sidebar-open")`.

---

### 8. Mapa de dependencias internas

- `layout.tsx` → `ThemeProvider`, `globals.css`.
- `Navbar` → `ThemeToggle` → `useTheme` (de `ThemeProvider`).
- `Sidebar` → `NexxusLogo`, `cn` (utils).
- `KPICard` → `formatCurrency` (utils).
- `Navbar` → `getInitials` (utils).
- `page.tsx` (`/`) → `redirect("/dashboard")`.

Componentes cliente (`"use client"`): `Navbar`, `Sidebar`, `ThemeProvider`, `ThemeToggle`. El resto (`DataTable`, `EmptyState`, `KPICard`, `NexxusLogo`, `layout.tsx`, `page.tsx`) no declaran la directiva y operan como server components.

---

## Apéndice A — Incertidumbres y puntos a verificar

Esta sección recopila, de forma transparente, todo lo que **no pudo determinarse únicamente a partir del código analizado** (en lugar de inventarlo), junto con el resultado de la verificación adversarial de cada subsistema.

### A.1 Resultado de la verificación

| Subsistema | ¿Fiel al código? | Correcciones aplicadas | Omisiones añadidas | Incertidumbres |
|------------|:---:|:---:|:---:|:---:|
| Arquitectura, Stack y Configuración | Sí | 13 | 3 | 6 |
| Base de Datos (Supabase / PostgreSQL) | Sí | 4 | 3 | 6 |
| Autenticación y Contexto de Negocio | Sí | 7 | 6 | 7 |
| Módulo de Inventario (Productos, Categorías, Variantes, Imágenes) | Sí | 8 | 9 | 8 |
| Módulo de Ventas / Punto de Venta (POS) | Sí | 8 | 10 | 9 |
| Módulo de Finanzas y Dashboard | Sí | 10 | 4 | 8 |
| UI Compartida, Estado Global e Infraestructura de Cliente | Sí | 13 | 10 | 6 |

> *Correcciones* = afirmaciones imprecisas que el verificador ajustó al código. *Omisiones añadidas* = elementos reales que faltaban y se incorporaron. *Incertidumbres* = puntos abajo.

### A.2 Incertidumbres por subsistema

#### Arquitectura, Stack y Configuración

- El README y el middleware mencionan la ruta publica '/register', y existe una Server Action 'register' en src/actions/auth.ts:30, pero NO existe ninguna carpeta/pagina 'register' bajo src/app/(auth)/. No se puede determinar desde estos archivos como se accede al registro de usuarios.
- El detalle concreto de los 'datos locales' que alimentan el modo demo (datasource/store mock) no esta en los archivos de este subsistema; estaria en src/actions/* o un store Zustand no leido aqui.
- El paquete '@eslint/eslintrc' se importa en eslint.config.mjs pero no aparece listado en devDependencies de package.json; presumiblemente es dependencia transitiva, pero no se puede confirmar la version exacta desde los archivos leidos.
- No existe archivo tailwind.config.* entre los archivos leidos; la configuracion de Tailwind v4 vive en CSS (globals.css con '@import "tailwindcss";'), pero no se documento exhaustivamente globals.css porque queda fuera del set solicitado.
- El valor real (en produccion) de las variables de entorno vacias en .env.example (SUPABASE_SERVICE_ROLE_KEY, credenciales de Cloudflare R2, NEXTAUTH_SECRET) no es determinable desde el codigo.
- Aunque @aws-sdk/client-s3 y el preconfigurado bucket R2 indican uso de Cloudflare R2, los archivos leidos en este subsistema no contienen la implementacion de las llamadas a R2 (estaria en src/lib o src/actions no incluidos en la lista).

#### Base de Datos (Supabase / PostgreSQL)

- Orden real de aplicación entre las dos migraciones: la primera migración (202605270001) contiene 'alter table if exists' e índices/políticas condicionados con to_regclass sobre tablas (categorias, productos, movimientos_stock, transacciones) que solo se crean en la segunda migración (202605280001). En una base de datos limpia con orden cronológico de archivos, esos fragmentos de la primera migración no harían nada. No se puede confirmar desde el código si existió un esquema previo donde esas tablas ya existían; el comportamiento exacto depende del estado inicial de la BD.
- No hay archivo de tipos generado oficialmente por 'supabase gen types': supabase.types.ts es claramente escrito/editado a mano (helpers Table<>, index signatures genéricos). Las discrepancias de nullabilidad (business_id como string|null, precio_costo como number|null) podrian ser intencionales o errores; el código no documenta cuál es el caso.
- El seed.sql está vacío de datos; el contenido real del bootstrap de produccion vive en docs/supabase-produccion.md, que no fue proporcionado para leer, por lo que no se puede documentar el procedimiento de bootstrap completo.
- No se proporcionaron los Server Actions, hooks, componentes ni clientes Supabase de la app (src/actions, src/lib, etc.), por lo que no se puede documentar como el codigo TypeScript invoca next_venta_folio, bootstrap_business_defaults ni las inserciones; solo se documenta el contrato de BD.
- Los buckets de Cloudflare R2 / Supabase Storage no estan definidos en config.toml (secciones [storage.buckets.*] comentadas); la integracion con R2 mencionada en el prompt no es verificable desde estos archivos.
- Para venta_lineas, venta_pagos, movimientos_stock y transacciones, el tipo TS usa Table<Row, Insert> sin tercer argumento, por lo que Update queda como Partial<Row>; el codigo no aclara si se permite actualizar esas tablas (las RLS de _business_update existen para todas), por lo que no es seguro si el tipado refleja una restriccion de diseño deliberada.

#### Autenticación y Contexto de Negocio

- La página de login (LoginPage) NO importa ni usa las Server Actions `login`/`register` de src/actions/auth.ts; usa el cliente de navegador con su propio handleSubmit. No pude determinar desde los archivos leídos qué componente, formulario o ruta (si alguno) invoca realmente las Server Actions `login` y `register`.
- No existe ninguna pantalla ni formulario de registro entre los archivos leídos; no se pudo determinar si la Server Action `register` está conectada a alguna UI.
- No leí el contenido de src/middleware.ts (solo el helper updateSession). Por tanto no puedo afirmar qué rutas protege el middleware, si redirige a /login a usuarios no autenticados, ni el matcher configurado.
- El comportamiento de las Server Actions login/register cuando `createSupabaseServerClient()` devuelve null (variables de entorno ausentes) ejecuta igualmente `redirect('/dashboard')` sin autenticar; no está claro si esto es intencional o un bug (no hay comentarios en el código).
- El esquema/estructura exacta de las tablas `business_memberships` y `businesses` (tipos de columnas, restricciones, políticas RLS) no se puede determinar desde estos archivos; solo se conocen las columnas seleccionadas (business_id, role, user_id, status, created_at; id, name, slug) y que `role` se castea a 'admin'.
- El botón '¿Olvidaste tu contraseña?' en la página de login no tiene handler onClick y no apunta a ninguna ruta; no se pudo determinar su funcionalidad prevista.
- No se determinó dónde/cómo se capturan y presentan los AppError lanzados (p.ej. si error.tsx del grupo (auth) u otro boundary los muestra), ni cómo se aprovecha la propiedad `expose` para decidir qué mensajes se muestran al usuario, ya que esa lógica no aparece en los archivos leídos.

#### Módulo de Inventario (Productos, Categorías, Variantes, Imágenes)

- No se pudo confirmar en el código leído si las tablas producto_variantes y movimientos_stock tienen ON DELETE CASCADE sobre productos. eliminarProducto solo ejecuta DELETE en productos y no borra explícitamente variantes ni movimientos, pero la UI (ProductoAcciones) afirma que se borran en cascada. El esquema SQL/migraciones no fue proporcionado.
- Las constraints UNIQUE exactas que producen el código de error 23505 (qué columnas componen la restricción de SKU en productos y de nombre+tipo en categorias) se infieren solo de los mensajes; las definiciones reales de las restricciones no están en los archivos leídos.
- eliminarCategoria (categorias.ts:41) está definida pero no se observa ninguna invocación en los archivos del módulo leídos; no se pudo determinar desde dónde se llama (si es que se llama).
- La consulta de variantesDB en EditarProductoPage NO filtra por business_id (solo por producto_id), a diferencia del resto de consultas del módulo. No se puede determinar desde el código si esto está mitigado por RLS (Row Level Security) en Supabase, ya que las políticas RLS no fueron proporcionadas.
- En actualizarStockVariante (inventario.ts:136) y actualizarStock (inventario.ts:233), la expresión de estatus 'stockDespues === 0 ? "agotado" : stockDespues <= stock_minimo ? "agotado" : "disponible"' marca como 'agotado' incluso cuando hay stock pero está por debajo del mínimo; no se puede determinar si es intencional o un bug (el estado 'pausado' nunca se asigna por estas rutas).
- No se pudieron leer/verificar las políticas RLS de Supabase ni el contenido de createSupabaseServerClient, requireUser y AppError más allá de lo referenciado en business-context.ts; el comportamiento de autenticación subyacente se asume a partir de las firmas.
- imageLoader.ts construye una URL anteponiendo publicUrl solo cuando src NO empieza con 'http'; dado que crearProducto guarda imagen_url como publicUrl absoluta (https://...), no se pudo confirmar en qué casos reales el loader recibe un src relativo.
- El parámetro 'icono' de NuevaCategoriaInput se soporta en la Server Action crearCategoria, pero la página NuevaCategoria no lo envía; no se pudo determinar si hay otra UI que lo use.

#### Módulo de Ventas / Punto de Venta (POS)

- El esquema real de la tabla 'ventas' no es visible: columnas como 'fecha', 'hora', 'created_at', 'estatus' (valor por defecto), 'subtotal', 'descuento' se leen/escriben pero su tipo, defaults y si 'fecha'/'hora' se autogeneran por trigger/DB no puede determinarse desde estos archivos.
- La implementación de la RPC 'next_venta_folio' no está en los archivos leídos; no se puede confirmar su lógica de generación de folio ni su tipo de retorno exacto (se castea a string en el código).
- No se leyeron las políticas RLS de Supabase para 'ventas', 'venta_lineas', 'venta_pagos', 'transacciones', 'productos', 'producto_variantes' ni 'movimientos_stock'; no puede documentarse el aislamiento a nivel de fila más allá del filtro manual por business_id en el código.
- registrarVenta no ejecuta las escrituras dentro de una transacción atómica visible; si una inserción posterior (líneas, pagos, stock) falla, las anteriores no se revierten, pero esto es una observación de comportamiento, no algo declarado explícitamente en el código.
- En registrarAbono y registrarVenta no se comprueba el error de varias operaciones insert/update (venta_pagos, transacciones, updates de stock); el código no captura esos errores, por lo que el comportamiento ante fallo de esas operaciones específicas no está manejado en el código.
- AbonoRapidoBtn recibe la prop 'saldoPendiente' pero no la usa; no es posible saber desde el código si es un resto de una versión previa o intencional.
- El campo 'descuento' siempre se inserta como 0 y no hay UI ni entrada para descuentos en este subsistema; no se puede determinar si existe otra ruta que los aplique.
- El tipo 'Venta' y 'Abono' de ventas.types.ts no se usan en las Server Actions ni en las páginas leídas (las páginas usan tipos inline de la respuesta de Supabase); no se confirma dónde se consumen esos tipos de dominio.
- El comportamiento de revalidación de 'movimientos_stock.stock_antes/stock_despues' para líneas con variante relee 'productos.stock' (padre) en lugar del stock de la variante; no puede determinarse si esto es intencional o un posible bug de diseño.

#### Módulo de Finanzas y Dashboard

- No se pudieron leer las definiciones de esquema SQL/migraciones ni las políticas RLS de las tablas (transacciones, categorias, productos, ventas, venta_lineas, business_memberships, businesses): no estaban entre los archivos solicitados, por lo que no se documentan tipos de columna exactos, constraints, defaults de BD (p.ej. created_at) ni Row Level Security.
- El componente GraficaGastos (src/components/finanzas/GraficaGastos.tsx) y su tipo PuntoGrafica no son importados por ninguna de las páginas de finanzas/dashboard revisadas; no se pudo determinar desde dónde (si acaso) se consume.
- No se leyó la implementación de requireUser() (src/server/auth/require-user.ts) ni de createSupabaseServerClient: el comportamiento exacto de autenticación, manejo de cookies SSR y redirección a login no puede documentarse con certeza, solo que requireBusinessContext depende de ellos.
- No se leyó AppError (src/server/errors/app-error.ts); se documentan los argumentos pasados (code, mensaje, status, y un cuarto booleano en INTERNAL_ERROR) pero no su firma ni semántica exacta del cuarto parámetro.
- No se leyeron Navbar, Sidebar ni DataTable (componentes compartidos); solo se documenta cómo se invocan (props pasadas), no su implementación interna.
- En el dashboard, la consulta de 'transacciones' no incluye .order(), por lo que el orden de ultimasTrx = slice(0,5) depende del orden por defecto que devuelva PostgREST/Supabase, no determinable solo desde este código.
- La columna 'color' de categorias se asume nullable por el manejo `color: string | null` en el casteo y los fallbacks (?? '#c9a84c' / ?? 'var(--surface-3)'), pero la nulabilidad real depende del esquema BD no disponible.
- No se confirmó si existe configuración de R2/Cloudflare relacionada con este subsistema; ninguno de los archivos leídos referencia R2, por lo que no aplica a Finanzas/Dashboard según el código revisado.

#### UI Compartida, Estado Global e Infraestructura de Cliente

- El enunciado menciona Zustand como parte del subsistema, pero src/lib/store.ts está vacío (solo un comentario y `export {}`). No se pudo localizar ningún store de Zustand en los archivos leídos; si existe en otra ruta, no formaba parte de los archivos solicitados.
- No se observa ningún uso de `formatDate` (utils.ts) dentro de los archivos leídos; podría usarse en otros módulos no incluidos en esta tarea.
- El avatar del Navbar muestra siempre `getInitials("Nexxuz Admin")` (texto fijo 'NA'); no se determina, a partir de los archivos leídos, si en algún punto se inyecta el nombre real del usuario autenticado.
- El componente que ensambla `app-shell` + `Sidebar` + `Navbar` (presumiblemente un layout de sección autenticada) no está entre los archivos leídos, por lo que no se documenta dónde se renderiza efectivamente `Sidebar`/`Navbar`.
- El enlace 'Salir' del Sidebar apunta a `/login` mediante un `<Link>`, pero no se observa lógica de cierre de sesión (logout/Supabase) en los archivos leídos; podría manejarse en la ruta destino.
- No se confirma si las clases utilitarias de Tailwind v4 (`@import "tailwindcss"`) se usan extensivamente en los componentes; los componentes leídos usan mayormente clases personalizadas de globals.css y estilos inline.

---

## Apéndice B — Documentación interna existente

El repositorio incluye documentación interna previa (en `docs/`), referenciada a lo largo de este análisis:

- [docs/backend-negocio-compartido.md](backend-negocio-compartido.md) — decisión de diseño del modelo compartido por negocio/equipo (`business_id`, `business_memberships`), reglas de Server Actions y bootstrap inicial.
- [docs/supabase-produccion.md](supabase-produccion.md) — datos del proyecto Supabase de producción, credenciales necesarias para aplicar migraciones, variables de entorno y bootstrap.
- [docs/mejoras-futuras.md](mejoras-futuras.md) — mejoras priorizadas pendientes (p. ej. FUT-001: aviso de reposición a proveedor por bajo stock).
- [docs/prompts-frontend.md](prompts-frontend.md) — prompts de especificación usados para construir las funcionalidades de ventas (pagos parciales/pendientes) y variantes de producto.

---

_Fin del análisis._

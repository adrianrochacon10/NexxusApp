# Supabase produccion

Proyecto:

```txt
https://rmmfrnkveuieqcpgiipv.supabase.co
project ref: rmmfrnkveuieqcpgiipv
```

## Estado

El repositorio ya tiene migraciones para un proyecto vacio:

- `supabase/migrations/202605270001_team_business_model.sql`
- `supabase/migrations/202605280001_production_app_schema.sql`

Esto crea:

- negocio compartido (`businesses`),
- membresias de admins (`business_memberships`),
- perfiles,
- categorias,
- productos,
- variantes por talla/modelo (`producto_variantes`),
- movimientos de stock,
- ventas,
- lineas de venta,
- pagos/abonos,
- transacciones financieras,
- RLS por `business_id`,
- funciones de bootstrap y folios.

## Credenciales necesarias para aplicar migraciones

Con la URL, anon key y service role key no alcanza para crear tablas SQL. Para aplicar migraciones hace falta una de estas dos opciones:

1. `SUPABASE_DB_URL` con password de Postgres.
2. `SUPABASE_ACCESS_TOKEN` de Supabase CLI mas link al proyecto.

La opcion mas directa:

```bash
supabase db push --db-url "postgresql://postgres.rmmfrnkveuieqcpgiipv:<DB_PASSWORD>@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
```

El host exacto puede variar segun la region del proyecto. Copialo desde:

```txt
Supabase Dashboard -> Project Settings -> Database -> Connection string
```

## Variables de entorno runtime

Crear `.env.local` con valores reales. No usar `.env.example` para secretos.

```txt
NEXT_PUBLIC_SUPABASE_URL=https://rmmfrnkveuieqcpgiipv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=...
```

La service role key no debe exponerse al cliente ni subirse al repo.

## Backend v2 (`202611030001_backend_v2.sql`)

Esta migración **borra y recrea** categorías, productos, variantes, movimientos,
ventas, pagos y transacciones (se aprobó porque eran datos de prueba). Conserva
`businesses`, `business_memberships`, `perfiles` y los usuarios de Auth.

Reglas que ahora viven en la base de datos:

- Inventario, ventas, abonos y cancelaciones solo se escriben con las funciones
  `registrar_venta`, `registrar_abono`, `cancelar_venta`, `ajustar_stock`,
  `guardar_producto`, `cambiar_estatus_producto`, `eliminar_pago_venta`.
  Los usuarios no pueden escribir esas tablas directo (ni con la anon key).
- Precio, total, saldo y estado de pago los calcula el servidor; stock nunca negativo.
- Folio consecutivo por negocio (`F-00001`) e idempotencia en ventas/abonos.
- Cancelar devuelve stock y registra la devolución en Finanzas (categoría de sistema "Devoluciones").
- Fechas en la zona horaria del negocio (`businesses.zona_horaria`, por defecto `America/Mexico_City`).

Pruebas: `supabase start` y luego `supabase test db` (`supabase/tests/backend_v2.test.sql`).

### Aplicar en producción

1. Rotar la service role key (ver abajo) **antes**.
2. Respaldo: Dashboard → Database → Backups (o `supabase db dump`).
3. `supabase link --project-ref rmmfrnkveuieqcpgiipv` y `supabase db push`.
4. `supabase gen types typescript --linked --schema public > src/types/supabase.types.ts`
   (debe salir igual al del repo).
5. Revisar Dashboard → Advisors → Security.

## Alta de usuarios

- **Dueño nuevo:** se registra en `/register` (nombre, negocio, correo, contraseña).
  La función `crear_negocio` crea el negocio, lo hace admin y siembra las
  categorías iniciales. Si Supabase pide confirmar el correo, el negocio se crea
  al entrar por primera vez (`/bienvenida`).
- **Agregar un empleado al negocio existente** (todavía no hay invitaciones en la app):
  que se registre, y desde el SQL editor:

```sql
-- Quitar el negocio vacío que se le creó al registrarse (si lo creó) y unirlo al real
delete from public.businesses
where created_by = 'USER_ID_EMPLEADO'
  and id not in (select business_id from public.ventas);

insert into public.business_memberships (business_id, user_id, role, status, joined_at)
values ('BUSINESS_ID_REAL', 'USER_ID_EMPLEADO', 'admin', 'active', now())
on conflict (business_id, user_id) do update set status = 'active';
```

## Importante de seguridad

La service role key que estuvo en `.env.example` debe rotarse antes de produccion:

```txt
Supabase Dashboard -> Project Settings -> API -> JWT Secret / API keys
```

Despues de rotar, actualiza `.env.local` y las variables del hosting.


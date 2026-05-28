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

## Bootstrap despues de aplicar migraciones

1. Crear los 4 usuarios en Supabase Auth.
2. Copiar sus UUID.
3. Ejecutar:

```sql
insert into public.businesses (id, name, slug, created_by)
values (
  '00000000-0000-0000-0000-000000000001',
  'Nexxuz',
  'nexxuz',
  'USER_ID_ADMIN_1'
)
on conflict (id) do nothing;

insert into public.business_memberships (business_id, user_id, role, status, joined_at)
values
  ('00000000-0000-0000-0000-000000000001', 'USER_ID_ADMIN_1', 'admin', 'active', now()),
  ('00000000-0000-0000-0000-000000000001', 'USER_ID_ADMIN_2', 'admin', 'active', now()),
  ('00000000-0000-0000-0000-000000000001', 'USER_ID_ADMIN_3', 'admin', 'active', now()),
  ('00000000-0000-0000-0000-000000000001', 'USER_ID_ADMIN_4', 'admin', 'active', now())
on conflict (business_id, user_id) do update
set role = excluded.role,
    status = excluded.status,
    joined_at = coalesce(public.business_memberships.joined_at, excluded.joined_at);
```

4. Iniciar sesion con un admin y ejecutar:

```sql
select public.bootstrap_business_defaults('00000000-0000-0000-0000-000000000001');
```

Si se ejecuta desde SQL editor con rol propietario y no desde una sesion de app, inserta las categorias manualmente usando el `user_id` de un admin.

## Importante de seguridad

La service role key que estuvo en `.env.example` debe rotarse antes de produccion:

```txt
Supabase Dashboard -> Project Settings -> API -> JWT Secret / API keys
```

Despues de rotar, actualiza `.env.local` y las variables del hosting.


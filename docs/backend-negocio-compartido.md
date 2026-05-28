# Backend: negocio compartido

## Decision

NexxuzApp debe usar un modelo compartido por negocio/equipo. Aunque todos los usuarios tengan el mismo rol `admin`, los datos no deben depender solo de `user_id`, porque los 4 administradores necesitan ver y operar el mismo inventario, ventas y finanzas.

## Modelo base

```txt
businesses
- id
- name
- slug
- created_by

business_memberships
- id
- business_id
- user_id
- role: admin
- status: active | invited | disabled
```

Las tablas operativas deben guardar `business_id`:

```txt
categorias.business_id
productos.business_id
movimientos_stock.business_id
transacciones.business_id
```

Durante la migracion, `business_id` queda nullable para no romper datos existentes. La siguiente fase debe hacer backfill, verificar consistencia y despues volverlo obligatorio.

## Archivos agregados

- `supabase/migrations/202605270001_team_business_model.sql`
- `src/server/auth/require-user.ts`
- `src/server/business/business-context.ts`
- `src/server/errors/app-error.ts`

## Uso esperado en Server Actions

Las nuevas acciones deben empezar cargando contexto:

```ts
const { business, user } = await requireBusinessContext()
```

Despues, toda escritura debe usar `business.id`:

```ts
await supabase.from("productos").insert({
  business_id: business.id,
  user_id: user.id,
  // datos del producto
})
```

## Reglas

- Middleware protege navegacion, pero no reemplaza autorizacion.
- Las Server Actions deben validar que el usuario pertenezca al negocio.
- RLS queda como defensa adicional en Supabase.
- No usar `user_id` como propietario principal de datos compartidos.
- No calcular ventas, stock ni saldos en el cliente como fuente de verdad.

## Pendiente inmediato

1. Crear el negocio inicial en Supabase.
2. Insertar los 4 usuarios en `business_memberships` con `role = 'admin'`.
3. Hacer backfill de `business_id` para datos existentes.
4. Actualizar Server Actions para usar `requireBusinessContext()`.
5. Cuando ya no existan filas sin negocio, aplicar `not null` sobre `business_id`.

## Bootstrap inicial en Supabase

Ejecutar desde el SQL editor de Supabase, reemplazando los UUID de usuarios reales:

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

Despues del bootstrap, cualquier action nueva debe resolver el negocio activo con `requireBusinessContext()` y escribir `business_id`.

-- Production baseline schema for NexxuzApp.
-- This migration assumes 202605270001_team_business_model.sql has already created:
-- businesses, business_memberships, is_business_member(), and is_business_admin().

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.current_business_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select membership.business_id
  from public.business_memberships membership
  where membership.user_id = auth.uid()
    and membership.status = 'active'
  order by membership.created_at asc
  limit 1;
$$;

revoke all on function public.current_business_id() from public;
grant execute on function public.current_business_id() to authenticated;

create table if not exists public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text,
  empresa text,
  logo_url text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'enterprise')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (id, nombre)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_profile on auth.users;
create trigger on_auth_user_created_create_profile
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create table if not exists public.categorias (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null default public.current_business_id() references public.businesses(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete restrict,
  nombre text not null check (char_length(trim(nombre)) >= 2),
  tipo text not null check (tipo in ('producto', 'gasto', 'ingreso')),
  icono text,
  color text,
  atributos_base text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, tipo, nombre)
);

create table if not exists public.productos (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null default public.current_business_id() references public.businesses(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete restrict,
  nombre text not null check (char_length(trim(nombre)) >= 2),
  descripcion text,
  categoria_id uuid references public.categorias(id) on delete set null,
  precio_venta numeric(12, 2) not null check (precio_venta > 0),
  precio_costo numeric(12, 2) not null default 0 check (precio_costo >= 0),
  stock integer not null default 0 check (stock >= 0),
  stock_minimo integer not null default 0 check (stock_minimo >= 0),
  imagen_url text,
  estatus text not null default 'disponible' check (estatus in ('disponible', 'pausado', 'agotado')),
  sku text,
  atributos jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.producto_variantes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null default public.current_business_id() references public.businesses(id) on delete cascade,
  producto_id uuid not null references public.productos(id) on delete cascade,
  nombre text not null check (char_length(trim(nombre)) >= 1),
  sku text,
  atributos jsonb not null default '{}'::jsonb,
  stock integer not null default 0 check (stock >= 0),
  stock_minimo integer not null default 0 check (stock_minimo >= 0),
  estatus text not null default 'disponible' check (estatus in ('disponible', 'pausado', 'agotado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (producto_id, nombre)
);

create table if not exists public.movimientos_stock (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null default public.current_business_id() references public.businesses(id) on delete cascade,
  producto_id uuid not null references public.productos(id) on delete cascade,
  variante_id uuid references public.producto_variantes(id) on delete set null,
  user_id uuid not null default auth.uid() references auth.users(id) on delete restrict,
  tipo text not null check (tipo in ('entrada', 'salida', 'ajuste', 'venta', 'cancelacion')),
  cantidad integer not null check (cantidad > 0),
  stock_antes integer not null check (stock_antes >= 0),
  stock_despues integer not null check (stock_despues >= 0),
  notas text,
  referencia_tipo text,
  referencia_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.ventas (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null default public.current_business_id() references public.businesses(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete restrict,
  folio text not null,
  fecha date not null default current_date,
  hora time not null default localtime(0),
  subtotal numeric(12, 2) not null default 0 check (subtotal >= 0),
  descuento numeric(12, 2) not null default 0 check (descuento >= 0),
  total numeric(12, 2) not null check (total >= 0),
  monto_pagado numeric(12, 2) not null default 0 check (monto_pagado >= 0),
  saldo_pendiente numeric(12, 2) not null default 0 check (saldo_pendiente >= 0),
  forma_pago_inicial text check (forma_pago_inicial in ('efectivo', 'transferencia', 'adeudo', 'tarjeta')),
  estado_pago text not null default 'pendiente' check (estado_pago in ('pagada', 'parcial', 'pendiente')),
  estatus text not null default 'activa' check (estatus in ('activa', 'cancelada')),
  cliente_nombre text,
  cliente_telefono text,
  notas text,
  cancelada_at timestamptz,
  cancelada_por uuid references auth.users(id) on delete set null,
  motivo_cancelacion text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, folio),
  constraint ventas_saldo_consistente check (round((total - monto_pagado)::numeric, 2) = round(saldo_pendiente::numeric, 2)),
  constraint ventas_cancelacion_consistente check (
    (estatus = 'activa' and cancelada_at is null and cancelada_por is null)
    or (estatus = 'cancelada' and cancelada_at is not null and motivo_cancelacion is not null)
  )
);

create table if not exists public.venta_lineas (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null default public.current_business_id() references public.businesses(id) on delete cascade,
  venta_id uuid not null references public.ventas(id) on delete cascade,
  producto_id uuid not null references public.productos(id) on delete restrict,
  variante_id uuid references public.producto_variantes(id) on delete restrict,
  producto_nombre text not null,
  variante_nombre text,
  cantidad integer not null check (cantidad > 0),
  precio_unitario numeric(12, 2) not null check (precio_unitario >= 0),
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.venta_pagos (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null default public.current_business_id() references public.businesses(id) on delete cascade,
  venta_id uuid not null references public.ventas(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete restrict,
  monto numeric(12, 2) not null check (monto > 0),
  forma_pago text not null check (forma_pago in ('efectivo', 'transferencia', 'tarjeta')),
  notas text,
  created_at timestamptz not null default now()
);

create table if not exists public.transacciones (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null default public.current_business_id() references public.businesses(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete restrict,
  fecha date not null default current_date,
  concepto text not null check (char_length(trim(concepto)) >= 2),
  categoria_id uuid references public.categorias(id) on delete set null,
  cantidad integer not null default 1 check (cantidad > 0),
  forma_pago text check (forma_pago in ('efectivo', 'transferencia', 'adeudo', 'tarjeta')),
  monto numeric(12, 2) not null check (monto > 0),
  tipo text not null check (tipo in ('ingreso', 'gasto', 'transferencia')),
  producto_id uuid references public.productos(id) on delete set null,
  venta_id uuid references public.ventas(id) on delete set null,
  venta_pago_id uuid references public.venta_pagos(id) on delete set null,
  notas text,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_productos_business_sku_unique
  on public.productos(business_id, sku)
  where sku is not null and sku <> '';

create unique index if not exists idx_producto_variantes_business_sku_unique
  on public.producto_variantes(business_id, sku)
  where sku is not null and sku <> '';

create index if not exists idx_categorias_business_tipo on public.categorias(business_id, tipo);
create index if not exists idx_productos_business_categoria on public.productos(business_id, categoria_id);
create index if not exists idx_producto_variantes_producto on public.producto_variantes(producto_id);
create index if not exists idx_movimientos_stock_business_producto on public.movimientos_stock(business_id, producto_id, created_at desc);
create index if not exists idx_movimientos_stock_business_variante on public.movimientos_stock(business_id, variante_id, created_at desc);
create index if not exists idx_ventas_business_fecha on public.ventas(business_id, fecha desc, created_at desc);
create index if not exists idx_ventas_business_estado_pago on public.ventas(business_id, estado_pago);
create index if not exists idx_venta_lineas_venta on public.venta_lineas(venta_id);
create index if not exists idx_venta_pagos_venta on public.venta_pagos(venta_id);
create index if not exists idx_transacciones_business_fecha on public.transacciones(business_id, fecha desc, created_at desc);

create or replace function public.assert_product_category_business()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.categoria_id is not null and not exists (
    select 1
    from public.categorias categoria
    where categoria.id = new.categoria_id
      and categoria.business_id = new.business_id
      and categoria.tipo = 'producto'
  ) then
    raise exception 'La categoria del producto no pertenece al negocio o no es de producto' using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function public.assert_variant_product_business()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.productos producto
    where producto.id = new.producto_id
      and producto.business_id = new.business_id
  ) then
    raise exception 'La variante no pertenece al mismo negocio que el producto' using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function public.assert_stock_movement_business()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.productos producto
    where producto.id = new.producto_id
      and producto.business_id = new.business_id
  ) then
    raise exception 'El movimiento de stock no pertenece al negocio del producto' using errcode = '23514';
  end if;

  if new.variante_id is not null and not exists (
    select 1
    from public.producto_variantes variante
    where variante.id = new.variante_id
      and variante.producto_id = new.producto_id
      and variante.business_id = new.business_id
  ) then
    raise exception 'El movimiento de stock no pertenece a una variante valida del producto' using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function public.assert_sale_line_business()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.ventas venta
    where venta.id = new.venta_id
      and venta.business_id = new.business_id
  ) then
    raise exception 'La linea no pertenece al negocio de la venta' using errcode = '23514';
  end if;

  if not exists (
    select 1
    from public.productos producto
    where producto.id = new.producto_id
      and producto.business_id = new.business_id
  ) then
    raise exception 'La linea no pertenece al negocio del producto' using errcode = '23514';
  end if;

  if new.variante_id is not null and not exists (
    select 1
    from public.producto_variantes variante
    where variante.id = new.variante_id
      and variante.producto_id = new.producto_id
      and variante.business_id = new.business_id
  ) then
    raise exception 'La linea no pertenece a una variante valida del producto' using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function public.assert_sale_payment_business()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.ventas venta
    where venta.id = new.venta_id
      and venta.business_id = new.business_id
  ) then
    raise exception 'El pago no pertenece al negocio de la venta' using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function public.assert_transaction_business()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.categoria_id is not null and not exists (
    select 1
    from public.categorias categoria
    where categoria.id = new.categoria_id
      and categoria.business_id = new.business_id
      and categoria.tipo in ('gasto', 'ingreso')
  ) then
    raise exception 'La categoria de la transaccion no pertenece al negocio o no es financiera' using errcode = '23514';
  end if;

  if new.producto_id is not null and not exists (
    select 1
    from public.productos producto
    where producto.id = new.producto_id
      and producto.business_id = new.business_id
  ) then
    raise exception 'El producto de la transaccion no pertenece al negocio' using errcode = '23514';
  end if;

  if new.venta_id is not null and not exists (
    select 1
    from public.ventas venta
    where venta.id = new.venta_id
      and venta.business_id = new.business_id
  ) then
    raise exception 'La venta de la transaccion no pertenece al negocio' using errcode = '23514';
  end if;

  if new.venta_pago_id is not null and not exists (
    select 1
    from public.venta_pagos pago
    where pago.id = new.venta_pago_id
      and pago.business_id = new.business_id
  ) then
    raise exception 'El pago de la transaccion no pertenece al negocio' using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists productos_assert_business on public.productos;
create trigger productos_assert_business
before insert or update on public.productos
for each row execute function public.assert_product_category_business();

drop trigger if exists producto_variantes_assert_business on public.producto_variantes;
create trigger producto_variantes_assert_business
before insert or update on public.producto_variantes
for each row execute function public.assert_variant_product_business();

drop trigger if exists movimientos_stock_assert_business on public.movimientos_stock;
create trigger movimientos_stock_assert_business
before insert or update on public.movimientos_stock
for each row execute function public.assert_stock_movement_business();

drop trigger if exists venta_lineas_assert_business on public.venta_lineas;
create trigger venta_lineas_assert_business
before insert or update on public.venta_lineas
for each row execute function public.assert_sale_line_business();

drop trigger if exists venta_pagos_assert_business on public.venta_pagos;
create trigger venta_pagos_assert_business
before insert or update on public.venta_pagos
for each row execute function public.assert_sale_payment_business();

drop trigger if exists transacciones_assert_business on public.transacciones;
create trigger transacciones_assert_business
before insert or update on public.transacciones
for each row execute function public.assert_transaction_business();

drop trigger if exists perfiles_set_updated_at on public.perfiles;
create trigger perfiles_set_updated_at
before update on public.perfiles
for each row execute function public.set_updated_at();

drop trigger if exists businesses_set_updated_at on public.businesses;
create trigger businesses_set_updated_at
before update on public.businesses
for each row execute function public.set_updated_at();

drop trigger if exists categorias_set_updated_at on public.categorias;
create trigger categorias_set_updated_at
before update on public.categorias
for each row execute function public.set_updated_at();

drop trigger if exists productos_set_updated_at on public.productos;
create trigger productos_set_updated_at
before update on public.productos
for each row execute function public.set_updated_at();

drop trigger if exists producto_variantes_set_updated_at on public.producto_variantes;
create trigger producto_variantes_set_updated_at
before update on public.producto_variantes
for each row execute function public.set_updated_at();

drop trigger if exists ventas_set_updated_at on public.ventas;
create trigger ventas_set_updated_at
before update on public.ventas
for each row execute function public.set_updated_at();

alter table public.perfiles enable row level security;
alter table public.categorias enable row level security;
alter table public.productos enable row level security;
alter table public.producto_variantes enable row level security;
alter table public.movimientos_stock enable row level security;
alter table public.ventas enable row level security;
alter table public.venta_lineas enable row level security;
alter table public.venta_pagos enable row level security;
alter table public.transacciones enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'perfiles' and policyname = 'perfiles_select_own'
  ) then
    create policy perfiles_select_own
      on public.perfiles
      for select
      to authenticated
      using (id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'perfiles' and policyname = 'perfiles_insert_own'
  ) then
    create policy perfiles_insert_own
      on public.perfiles
      for insert
      to authenticated
      with check (id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'perfiles' and policyname = 'perfiles_update_own'
  ) then
    create policy perfiles_update_own
      on public.perfiles
      for update
      to authenticated
      using (id = auth.uid())
      with check (id = auth.uid());
  end if;
end $$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'categorias',
    'productos',
    'producto_variantes',
    'movimientos_stock',
    'ventas',
    'venta_lineas',
    'venta_pagos',
    'transacciones'
  ]
  loop
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = table_name and policyname = table_name || '_business_select'
    ) then
      execute format(
        'create policy %I on public.%I for select to authenticated using (public.is_business_member(business_id))',
        table_name || '_business_select',
        table_name
      );
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = table_name and policyname = table_name || '_business_insert'
    ) then
      execute format(
        'create policy %I on public.%I for insert to authenticated with check (public.is_business_admin(business_id))',
        table_name || '_business_insert',
        table_name
      );
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = table_name and policyname = table_name || '_business_update'
    ) then
      execute format(
        'create policy %I on public.%I for update to authenticated using (public.is_business_admin(business_id)) with check (public.is_business_admin(business_id))',
        table_name || '_business_update',
        table_name
      );
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = table_name and policyname = table_name || '_business_delete'
    ) then
      execute format(
        'create policy %I on public.%I for delete to authenticated using (public.is_business_admin(business_id))',
        table_name || '_business_delete',
        table_name
      );
    end if;
  end loop;
end $$;

create or replace function public.next_venta_folio(target_business_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  next_number integer;
begin
  if not public.is_business_admin(target_business_id) then
    raise exception 'Not authorized for business %', target_business_id using errcode = '42501';
  end if;

  select coalesce(max(substring(folio from 'VNT-([0-9]+)')::integer), 0) + 1
    into next_number
  from public.ventas
  where business_id = target_business_id
    and folio ~ '^VNT-[0-9]+$';

  return 'VNT-' || lpad(next_number::text, 6, '0');
end;
$$;

revoke all on function public.next_venta_folio(uuid) from public;
grant execute on function public.next_venta_folio(uuid) to authenticated;

create or replace function public.bootstrap_business_defaults(target_business_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
begin
  if not public.is_business_admin(target_business_id) then
    raise exception 'Not authorized for business %', target_business_id using errcode = '42501';
  end if;

  insert into public.categorias (business_id, user_id, nombre, tipo, color, atributos_base)
  values
    (target_business_id, actor, 'Playeras', 'producto', '#4a6b9b', array['Talla', 'Color', 'Marca', 'Tipo de tela']),
    (target_business_id, actor, 'Perfumes', 'producto', '#c9a84c', array['Mililitros', 'Aroma', 'Genero', 'Marca']),
    (target_business_id, actor, 'Ventas', 'ingreso', '#4a9b6f', array[]::text[]),
    (target_business_id, actor, 'Transporte', 'gasto', '#9b7a4a', array[]::text[]),
    (target_business_id, actor, 'Publicidad', 'gasto', '#9b4a4a', array[]::text[]),
    (target_business_id, actor, 'Inventario', 'gasto', '#4a6b9b', array[]::text[])
  on conflict (business_id, tipo, nombre) do nothing;
end;
$$;

revoke all on function public.bootstrap_business_defaults(uuid) from public;
grant execute on function public.bootstrap_business_defaults(uuid) to authenticated;

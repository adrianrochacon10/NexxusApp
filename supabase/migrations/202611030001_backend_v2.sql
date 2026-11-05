-- ============================================================================
-- Nexxus · Backend v2
--
-- Reemplaza el esquema operativo (categorías, inventario, ventas, finanzas) por
-- uno donde las reglas del negocio viven en la base de datos:
--   · Stock, ventas, abonos y cancelaciones solo cambian vía funciones atómicas
--     (registrar_venta, registrar_abono, cancelar_venta, ajustar_stock,
--     guardar_producto). Los usuarios no pueden escribir esas tablas directo.
--   · Precio, totales, saldo y estado de pago se calculan en el servidor.
--   · El stock nunca es negativo y todo cambio deja movimiento (antes/después).
--   · Folio consecutivo por negocio sin condiciones de carrera.
--   · Idempotencia en ventas y abonos (doble clic / reintento no duplica).
--   · Cancelar devuelve stock y registra la devolución en finanzas.
--   · Fechas en la zona horaria del negocio, no en UTC.
--
-- ⚠ DESTRUCTIVA: borra las tablas operativas y sus datos (aprobado: datos de
--   prueba). Conserva businesses, business_memberships, perfiles y auth.users.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. Limpieza del esquema anterior
-- ---------------------------------------------------------------------------
drop table if exists
  public.transacciones,
  public.venta_pagos,
  public.venta_lineas,
  public.ventas,
  public.movimientos_stock,
  public.producto_variantes,
  public.productos,
  public.categorias
  cascade;

drop function if exists public.next_venta_folio(uuid);
drop function if exists public.bootstrap_business_defaults(uuid);
drop function if exists public.assert_product_category_business();
drop function if exists public.assert_variant_product_business();
drop function if exists public.assert_stock_movement_business();
drop function if exists public.assert_sale_line_business();
drop function if exists public.assert_sale_payment_business();
drop function if exists public.assert_transaction_business();

create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 1. Negocio, membresías y helpers de autorización
-- ---------------------------------------------------------------------------
alter table public.businesses
  add column if not exists zona_horaria text not null default 'America/Mexico_City',
  add column if not exists siguiente_folio integer not null default 1 check (siguiente_folio >= 1);

-- search_path vacío + nombres calificados: evita secuestro de funciones.
create or replace function public.is_business_member(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.business_memberships m
    where m.business_id = target_business_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
  );
$$;

create or replace function public.is_business_admin(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.business_memberships m
    where m.business_id = target_business_id
      and m.user_id = (select auth.uid())
      and m.role = 'admin'
      and m.status = 'active'
  );
$$;

create or replace function public.current_business_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.business_id
  from public.business_memberships m
  where m.user_id = (select auth.uid())
    and m.status = 'active'
  order by m.created_at asc
  limit 1;
$$;

revoke all on function public.is_business_member(uuid) from public, anon;
revoke all on function public.is_business_admin(uuid) from public, anon;
revoke all on function public.current_business_id() from public, anon;
grant execute on function public.is_business_member(uuid) to authenticated;
grant execute on function public.is_business_admin(uuid) to authenticated;
grant execute on function public.current_business_id() to authenticated;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfiles (id, nombre)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nombre', new.raw_user_meta_data ->> 'name'))
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Falla con 42501 si el usuario actual no administra el negocio.
create or replace function app_private.exigir_admin(p_business_id uuid)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not public.is_business_admin(p_business_id) then
    raise exception 'No tienes acceso a este negocio.' using errcode = '42501';
  end if;
end;
$$;

-- "Ahora" en la zona horaria del negocio.
create or replace function app_private.ahora_local(p_business_id uuid)
returns timestamp
language sql
stable
security definer
set search_path = ''
as $$
  select (now() at time zone b.zona_horaria)
  from public.businesses b
  where b.id = p_business_id;
$$;

-- ---------------------------------------------------------------------------
-- 2. Tablas
-- ---------------------------------------------------------------------------
create table public.categorias (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null default auth.uid(),
  nombre text not null check (char_length(trim(nombre)) between 2 and 60),
  tipo text not null check (tipo in ('producto', 'gasto', 'ingreso')),
  icono text,
  color text check (color is null or color ~ '^#[0-9A-Fa-f]{6}$'),
  atributos_base text[] not null default '{}',
  -- Categorías de sistema ('ventas', 'devoluciones'): las usan las funciones,
  -- no se pueden editar ni borrar.
  clave text check (clave in ('ventas', 'devoluciones')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, tipo, nombre),
  unique (business_id, clave)
);

create table public.productos (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  nombre text not null check (char_length(trim(nombre)) between 2 and 120),
  descripcion text check (descripcion is null or char_length(descripcion) <= 600),
  categoria_id uuid references public.categorias(id) on delete set null,
  precio_venta numeric(12, 2) not null check (precio_venta > 0),
  precio_costo numeric(12, 2) not null default 0 check (precio_costo >= 0),
  -- Con variantes, stock = suma de variantes (lo mantiene un trigger).
  stock integer not null default 0 check (stock >= 0),
  stock_minimo integer not null default 0 check (stock_minimo >= 0),
  tiene_variantes boolean not null default false,
  imagen_url text,
  -- "Agotado" no se guarda: se deriva de stock = 0.
  estatus text not null default 'disponible' check (estatus in ('disponible', 'pausado')),
  sku text check (sku is null or char_length(trim(sku)) between 1 and 60),
  atributos jsonb not null default '{}'::jsonb check (jsonb_typeof(atributos) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.producto_variantes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  producto_id uuid not null references public.productos(id) on delete cascade,
  nombre text not null check (char_length(trim(nombre)) between 1 and 60),
  sku text check (sku is null or char_length(trim(sku)) between 1 and 60),
  atributos jsonb not null default '{}'::jsonb check (jsonb_typeof(atributos) = 'object'),
  stock integer not null default 0 check (stock >= 0),
  stock_minimo integer not null default 0 check (stock_minimo >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (producto_id, nombre)
);

-- Bitácora de inventario: solo se inserta, nunca se edita.
-- stock_antes/stock_despues son del nivel que cambió (variante si aplica).
create table public.movimientos_stock (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  producto_id uuid not null references public.productos(id) on delete cascade,
  variante_id uuid references public.producto_variantes(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  tipo text not null check (tipo in ('entrada', 'salida', 'ajuste', 'venta', 'cancelacion')),
  cantidad integer not null check (cantidad > 0),
  stock_antes integer not null check (stock_antes >= 0),
  stock_despues integer not null check (stock_despues >= 0),
  notas text check (notas is null or char_length(notas) <= 300),
  referencia_tipo text check (referencia_tipo in ('venta')),
  referencia_id uuid,
  created_at timestamptz not null default now(),
  check (abs(stock_despues - stock_antes) = cantidad)
);

create table public.ventas (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  folio text not null,
  fecha date not null,
  hora time(0) not null,
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  descuento numeric(12, 2) not null default 0 check (descuento >= 0),
  total numeric(12, 2) not null check (total >= 0),
  monto_pagado numeric(12, 2) not null default 0 check (monto_pagado >= 0),
  -- saldo_pendiente y estado_pago los calcula un trigger (nunca a mano).
  saldo_pendiente numeric(12, 2) not null default 0 check (saldo_pendiente >= 0),
  estado_pago text not null default 'pendiente' check (estado_pago in ('pagada', 'parcial', 'pendiente')),
  forma_pago_inicial text check (forma_pago_inicial in ('efectivo', 'transferencia', 'tarjeta')),
  estatus text not null default 'activa' check (estatus in ('activa', 'cancelada')),
  cliente_nombre text check (cliente_nombre is null or char_length(trim(cliente_nombre)) between 2 and 120),
  cliente_telefono text check (cliente_telefono is null or char_length(cliente_telefono) <= 30),
  notas text check (notas is null or char_length(notas) <= 500),
  idempotency_key uuid not null,
  cancelada_at timestamptz,
  cancelada_por uuid references auth.users(id) on delete set null,
  motivo_cancelacion text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, folio),
  unique (business_id, idempotency_key),
  check (monto_pagado <= total),
  check (subtotal - descuento = total),
  check (
    (estatus = 'activa' and cancelada_at is null and motivo_cancelacion is null)
    or (estatus = 'cancelada' and cancelada_at is not null and char_length(trim(motivo_cancelacion)) >= 3)
  )
);

create table public.venta_lineas (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  venta_id uuid not null references public.ventas(id) on delete cascade,
  -- set null: borrar un producto no borra el historial de ventas (queda el snapshot).
  producto_id uuid references public.productos(id) on delete set null,
  variante_id uuid references public.producto_variantes(id) on delete set null,
  producto_nombre text not null,
  variante_nombre text,
  cantidad integer not null check (cantidad > 0),
  precio_unitario numeric(12, 2) not null check (precio_unitario >= 0),
  costo_unitario numeric(12, 2) not null default 0 check (costo_unitario >= 0),
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  created_at timestamptz not null default now(),
  check (subtotal = round(cantidad * precio_unitario, 2))
);

create table public.venta_pagos (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  venta_id uuid not null references public.ventas(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  monto numeric(12, 2) not null check (monto > 0),
  forma_pago text not null check (forma_pago in ('efectivo', 'transferencia', 'tarjeta')),
  es_inicial boolean not null default false,
  idempotency_key uuid,
  notas text check (notas is null or char_length(notas) <= 300),
  created_at timestamptz not null default now(),
  unique (business_id, idempotency_key)
);

create table public.transacciones (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null default auth.uid(),
  fecha date not null,
  concepto text not null check (char_length(trim(concepto)) between 2 and 160),
  categoria_id uuid references public.categorias(id) on delete set null,
  cantidad integer not null default 1 check (cantidad > 0),
  forma_pago text check (forma_pago in ('efectivo', 'transferencia', 'adeudo', 'tarjeta')),
  monto numeric(12, 2) not null check (monto > 0),
  tipo text not null check (tipo in ('ingreso', 'gasto', 'transferencia')),
  -- manual: la captura el usuario. venta/abono/devolucion: las crean las funciones.
  origen text not null default 'manual' check (origen in ('manual', 'venta', 'abono', 'devolucion')),
  producto_id uuid references public.productos(id) on delete set null,
  venta_id uuid references public.ventas(id) on delete set null,
  -- cascade: quitar un pago quita su ingreso.
  venta_pago_id uuid unique references public.venta_pagos(id) on delete cascade,
  notas text check (notas is null or char_length(notas) <= 400),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((origen = 'manual') = (venta_id is null)),
  check (origen not in ('venta', 'abono') or venta_pago_id is not null)
);

-- Índices
create unique index productos_business_sku_uq on public.productos (business_id, lower(sku)) where sku is not null;
create unique index producto_variantes_business_sku_uq on public.producto_variantes (business_id, lower(sku)) where sku is not null;
create index categorias_business_tipo_idx on public.categorias (business_id, tipo);
create index productos_business_categoria_idx on public.productos (business_id, categoria_id);
create index producto_variantes_producto_idx on public.producto_variantes (producto_id);
create index movimientos_business_producto_idx on public.movimientos_stock (business_id, producto_id, created_at desc);
create index movimientos_variante_idx on public.movimientos_stock (variante_id);
create index ventas_business_fecha_idx on public.ventas (business_id, fecha desc, created_at desc);
create index ventas_business_pendientes_idx on public.ventas (business_id, estado_pago) where estatus = 'activa' and estado_pago <> 'pagada';
create index venta_lineas_venta_idx on public.venta_lineas (venta_id);
create index venta_lineas_producto_idx on public.venta_lineas (producto_id);
create index venta_pagos_venta_idx on public.venta_pagos (venta_id);
create index transacciones_business_fecha_idx on public.transacciones (business_id, fecha desc, created_at desc);
create index transacciones_venta_idx on public.transacciones (venta_id);
create index transacciones_categoria_idx on public.transacciones (categoria_id);

-- ---------------------------------------------------------------------------
-- 3. Triggers de integridad
-- ---------------------------------------------------------------------------
create trigger categorias_set_updated_at before update on public.categorias
  for each row execute function public.set_updated_at();
create trigger productos_set_updated_at before update on public.productos
  for each row execute function public.set_updated_at();
create trigger producto_variantes_set_updated_at before update on public.producto_variantes
  for each row execute function public.set_updated_at();
create trigger ventas_set_updated_at before update on public.ventas
  for each row execute function public.set_updated_at();
create trigger transacciones_set_updated_at before update on public.transacciones
  for each row execute function public.set_updated_at();

-- Saldo y estado de pago siempre derivados de total vs. pagado.
create or replace function app_private.derivar_estado_pago()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.saldo_pendiente := new.total - new.monto_pagado;
  new.estado_pago := case
    when new.saldo_pendiente = 0 then 'pagada'
    when new.monto_pagado > 0 then 'parcial'
    else 'pendiente'
  end;
  return new;
end;
$$;

create trigger ventas_derivar_estado_pago before insert or update of total, monto_pagado on public.ventas
  for each row execute function app_private.derivar_estado_pago();

-- Con variantes, el stock del producto es la suma de sus variantes.
create or replace function app_private.sincronizar_stock_producto()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_producto_id uuid := coalesce(new.producto_id, old.producto_id);
begin
  update public.productos p
  set stock = coalesce((select sum(v.stock) from public.producto_variantes v where v.producto_id = p.id), 0),
      tiene_variantes = exists (select 1 from public.producto_variantes v where v.producto_id = p.id)
  where p.id = v_producto_id;
  return null;
end;
$$;

create trigger producto_variantes_sincronizar_stock
  after insert or delete or update of stock on public.producto_variantes
  for each row execute function app_private.sincronizar_stock_producto();

-- Ninguna fila puede apuntar a datos de otro negocio.
create or replace function app_private.validar_mismo_negocio()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'productos' then
    if new.categoria_id is not null and not exists (
      select 1 from public.categorias c
      where c.id = new.categoria_id and c.business_id = new.business_id and c.tipo = 'producto'
    ) then
      raise exception 'La categoría no es de producto o no pertenece al negocio.' using errcode = '23514';
    end if;
  elsif tg_table_name = 'producto_variantes' then
    if not exists (select 1 from public.productos p where p.id = new.producto_id and p.business_id = new.business_id) then
      raise exception 'La variante no pertenece al negocio del producto.' using errcode = '23514';
    end if;
  elsif tg_table_name = 'transacciones' then
    if new.categoria_id is not null and not exists (
      select 1 from public.categorias c
      where c.id = new.categoria_id and c.business_id = new.business_id and c.tipo in ('gasto', 'ingreso')
    ) then
      raise exception 'La categoría no es financiera o no pertenece al negocio.' using errcode = '23514';
    end if;
    if new.producto_id is not null and not exists (
      select 1 from public.productos p where p.id = new.producto_id and p.business_id = new.business_id
    ) then
      raise exception 'El producto no pertenece al negocio.' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

create trigger productos_mismo_negocio before insert or update on public.productos
  for each row execute function app_private.validar_mismo_negocio();
create trigger producto_variantes_mismo_negocio before insert or update on public.producto_variantes
  for each row execute function app_private.validar_mismo_negocio();
create trigger transacciones_mismo_negocio before insert or update on public.transacciones
  for each row execute function app_private.validar_mismo_negocio();

-- Las categorías de sistema no se editan ni se borran.
create or replace function app_private.proteger_categoria_sistema()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.clave is not null and current_user <> 'postgres' then
    raise exception 'Esta categoría la usa el sistema y no se puede modificar.' using errcode = '42501';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger categorias_proteger_sistema before update or delete on public.categorias
  for each row execute function app_private.proteger_categoria_sistema();

-- ---------------------------------------------------------------------------
-- 4. Permisos y RLS
--    Lectura: miembros del negocio. Escritura directa solo donde es seguro;
--    inventario, ventas, pagos y movimientos solo vía funciones.
-- ---------------------------------------------------------------------------
revoke all on public.categorias, public.productos, public.producto_variantes, public.movimientos_stock,
  public.ventas, public.venta_lineas, public.venta_pagos, public.transacciones
  from anon, authenticated;

grant select on public.categorias, public.productos, public.producto_variantes, public.movimientos_stock,
  public.ventas, public.venta_lineas, public.venta_pagos, public.transacciones
  to authenticated;

grant insert (business_id, nombre, tipo, icono, color, atributos_base),
      update (nombre, icono, color, atributos_base),
      delete
  on public.categorias to authenticated;

grant delete on public.productos to authenticated;

grant insert (business_id, fecha, concepto, categoria_id, cantidad, forma_pago, monto, tipo, producto_id, notas),
      update (fecha, concepto, categoria_id, cantidad, forma_pago, monto, tipo, producto_id, notas),
      delete
  on public.transacciones to authenticated;

alter table public.categorias enable row level security;
alter table public.productos enable row level security;
alter table public.producto_variantes enable row level security;
alter table public.movimientos_stock enable row level security;
alter table public.ventas enable row level security;
alter table public.venta_lineas enable row level security;
alter table public.venta_pagos enable row level security;
alter table public.transacciones enable row level security;

create policy categorias_select on public.categorias for select to authenticated
  using (public.is_business_member(business_id));
create policy categorias_insert on public.categorias for insert to authenticated
  with check (public.is_business_admin(business_id));
create policy categorias_update on public.categorias for update to authenticated
  using (public.is_business_admin(business_id)) with check (public.is_business_admin(business_id));
create policy categorias_delete on public.categorias for delete to authenticated
  using (public.is_business_admin(business_id));

create policy productos_select on public.productos for select to authenticated
  using (public.is_business_member(business_id));
create policy productos_delete on public.productos for delete to authenticated
  using (public.is_business_admin(business_id));

create policy producto_variantes_select on public.producto_variantes for select to authenticated
  using (public.is_business_member(business_id));
create policy movimientos_stock_select on public.movimientos_stock for select to authenticated
  using (public.is_business_member(business_id));
create policy ventas_select on public.ventas for select to authenticated
  using (public.is_business_member(business_id));
create policy venta_lineas_select on public.venta_lineas for select to authenticated
  using (public.is_business_member(business_id));
create policy venta_pagos_select on public.venta_pagos for select to authenticated
  using (public.is_business_member(business_id));

create policy transacciones_select on public.transacciones for select to authenticated
  using (public.is_business_member(business_id));
create policy transacciones_insert_manual on public.transacciones for insert to authenticated
  with check (public.is_business_admin(business_id) and origen = 'manual');
create policy transacciones_update_manual on public.transacciones for update to authenticated
  using (public.is_business_admin(business_id) and origen = 'manual')
  with check (public.is_business_admin(business_id) and origen = 'manual');
create policy transacciones_delete_manual on public.transacciones for delete to authenticated
  using (public.is_business_admin(business_id) and origen = 'manual');

-- businesses: se crean solo con crear_negocio(); folio y zona horaria no los
-- cambia el usuario directamente.
drop policy if exists businesses_insert_creator on public.businesses;
revoke insert, update, delete on public.businesses from anon, authenticated;
grant update (name, slug) on public.businesses to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Funciones de negocio (RPC)
--    SECURITY DEFINER: escriben donde el usuario no puede. Cada una valida
--    membresía, entradas y reglas antes de tocar datos.
-- ---------------------------------------------------------------------------

-- Categorías iniciales de un negocio nuevo (incluye las de sistema).
create or replace function app_private.categorias_iniciales(p_business_id uuid, p_user_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.categorias (business_id, user_id, nombre, tipo, color, clave, atributos_base)
  values
    (p_business_id, p_user_id, 'Ventas', 'ingreso', '#0E8F8F', 'ventas', '{}'),
    (p_business_id, p_user_id, 'Devoluciones', 'gasto', '#64748B', 'devoluciones', '{}'),
    (p_business_id, p_user_id, 'Otros ingresos', 'ingreso', '#2A82D0', null, '{}'),
    (p_business_id, p_user_id, 'Mercancía', 'gasto', '#7C4DD6', null, '{}'),
    (p_business_id, p_user_id, 'Renta y servicios', 'gasto', '#C2417A', null, '{}'),
    (p_business_id, p_user_id, 'Sueldos', 'gasto', '#8A7A14', null, '{}'),
    (p_business_id, p_user_id, 'General', 'producto', '#2A82D0', null, array['Talla', 'Color'])
  on conflict do nothing;
$$;

-- Registro: crea el negocio del usuario y lo hace admin.
create or replace function public.crear_negocio(p_nombre text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_business_id uuid;
begin
  if v_user is null then
    raise exception 'Inicia sesión para crear tu negocio.' using errcode = '42501';
  end if;
  if char_length(trim(coalesce(p_nombre, ''))) < 2 then
    raise exception 'El nombre del negocio debe tener al menos 2 caracteres.' using errcode = '22023';
  end if;
  if exists (select 1 from public.business_memberships m where m.user_id = v_user and m.status = 'active') then
    raise exception 'Tu cuenta ya pertenece a un negocio.' using errcode = '23505';
  end if;

  insert into public.businesses (name, created_by)
  values (trim(p_nombre), v_user)
  returning id into v_business_id;

  insert into public.business_memberships (business_id, user_id, role, status, joined_at)
  values (v_business_id, v_user, 'admin', 'active', now());

  perform app_private.categorias_iniciales(v_business_id, v_user);
  return v_business_id;
end;
$$;

-- Ajuste manual de inventario. Devuelve el stock nuevo.
--   entrada/salida: p_cantidad = piezas que entran/salen (> 0)
--   ajuste:         p_cantidad = stock contado (>= 0, distinto del actual)
create or replace function public.ajustar_stock(
  p_business_id uuid,
  p_producto_id uuid,
  p_variante_id uuid,
  p_tipo text,
  p_cantidad integer,
  p_notas text default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tiene_variantes boolean;
  v_antes integer;
  v_despues integer;
begin
  perform app_private.exigir_admin(p_business_id);

  if p_tipo not in ('entrada', 'salida', 'ajuste') then
    raise exception 'Tipo de movimiento inválido.' using errcode = '22023';
  end if;
  if p_cantidad is null or p_cantidad < 0 or p_cantidad > 100000 or (p_tipo <> 'ajuste' and p_cantidad = 0) then
    raise exception 'La cantidad no es válida.' using errcode = '22023';
  end if;

  select p.tiene_variantes into v_tiene_variantes
  from public.productos p
  where p.id = p_producto_id and p.business_id = p_business_id
  for update;

  if not found then
    raise exception 'Producto no encontrado.' using errcode = 'P0002';
  end if;

  if v_tiene_variantes and p_variante_id is null then
    raise exception 'Elige la talla o variante a ajustar.' using errcode = '22023';
  end if;
  if not v_tiene_variantes and p_variante_id is not null then
    raise exception 'Este producto no tiene variantes.' using errcode = '22023';
  end if;

  if p_variante_id is not null then
    select v.stock into v_antes
    from public.producto_variantes v
    where v.id = p_variante_id and v.producto_id = p_producto_id
    for update;
    if not found then
      raise exception 'Variante no encontrada.' using errcode = 'P0002';
    end if;
  else
    select p.stock into v_antes from public.productos p where p.id = p_producto_id;
  end if;

  v_despues := case p_tipo
    when 'entrada' then v_antes + p_cantidad
    when 'salida' then v_antes - p_cantidad
    else p_cantidad
  end;

  if v_despues < 0 then
    raise exception 'Solo hay % piezas; no puedes sacar %.', v_antes, p_cantidad using errcode = '23514';
  end if;
  if v_despues = v_antes then
    raise exception 'El stock contado es igual al actual; no hay nada que ajustar.' using errcode = '22023';
  end if;

  if p_variante_id is not null then
    update public.producto_variantes set stock = v_despues where id = p_variante_id;
  else
    update public.productos set stock = v_despues where id = p_producto_id;
  end if;

  insert into public.movimientos_stock (business_id, producto_id, variante_id, user_id, tipo, cantidad, stock_antes, stock_despues, notas)
  values (p_business_id, p_producto_id, p_variante_id, (select auth.uid()), p_tipo,
          abs(v_despues - v_antes), v_antes, v_despues, nullif(trim(p_notas), ''));

  return v_despues;
end;
$$;

-- Crea o actualiza un producto con sus variantes en una sola transacción.
--   p_datos:     { nombre, descripcion, categoria_id, precio_venta, precio_costo,
--                  stock_minimo, imagen_url, sku, atributos, estatus, stock_inicial }
--   p_variantes: [{ id?, nombre, sku, atributos, stock_minimo, stock_inicial }]
-- El stock de algo existente NO se cambia aquí (usar ajustar_stock): stock_inicial
-- solo aplica a productos/variantes nuevos y queda como movimiento "entrada".
create or replace function public.guardar_producto(
  p_business_id uuid,
  p_producto_id uuid,
  p_datos jsonb,
  p_variantes jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_id uuid := p_producto_id;
  v_es_nuevo boolean := p_producto_id is null;
  v_stock_actual integer;
  v_tenia_variantes boolean;
  v_stock_inicial integer;
  v_var jsonb;
  v_var_id uuid;
  v_ids_enviados uuid[] := '{}'::uuid[];
  v_quitada record;
begin
  perform app_private.exigir_admin(p_business_id);

  if jsonb_typeof(coalesce(p_variantes, '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_variantes, '[]'::jsonb)) > 60 then
    raise exception 'Lista de variantes inválida (máximo 60).' using errcode = '22023';
  end if;
  if coalesce(p_datos ->> 'estatus', 'disponible') not in ('disponible', 'pausado') then
    raise exception 'Estatus inválido.' using errcode = '22023';
  end if;

  v_stock_inicial := coalesce((p_datos ->> 'stock_inicial')::integer, 0);
  if v_stock_inicial < 0 then
    raise exception 'El stock no puede ser negativo.' using errcode = '23514';
  end if;

  if v_es_nuevo then
    insert into public.productos (business_id, user_id, nombre, descripcion, categoria_id, precio_venta, precio_costo,
                                  stock_minimo, imagen_url, estatus, sku, atributos)
    values (p_business_id, v_user,
            trim(p_datos ->> 'nombre'),
            nullif(trim(p_datos ->> 'descripcion'), ''),
            (p_datos ->> 'categoria_id')::uuid,
            (p_datos ->> 'precio_venta')::numeric,
            coalesce((p_datos ->> 'precio_costo')::numeric, 0),
            coalesce((p_datos ->> 'stock_minimo')::integer, 0),
            nullif(trim(p_datos ->> 'imagen_url'), ''),
            coalesce(p_datos ->> 'estatus', 'disponible'),
            nullif(trim(p_datos ->> 'sku'), ''),
            coalesce(p_datos -> 'atributos', '{}'::jsonb))
    returning id into v_id;
    v_stock_actual := 0;
    v_tenia_variantes := false;
  else
    select p.stock, p.tiene_variantes into v_stock_actual, v_tenia_variantes
    from public.productos p
    where p.id = p_producto_id and p.business_id = p_business_id
    for update;
    if not found then
      raise exception 'Producto no encontrado.' using errcode = 'P0002';
    end if;

    update public.productos set
      nombre = trim(p_datos ->> 'nombre'),
      descripcion = nullif(trim(p_datos ->> 'descripcion'), ''),
      categoria_id = (p_datos ->> 'categoria_id')::uuid,
      precio_venta = (p_datos ->> 'precio_venta')::numeric,
      precio_costo = coalesce((p_datos ->> 'precio_costo')::numeric, 0),
      stock_minimo = coalesce((p_datos ->> 'stock_minimo')::integer, 0),
      imagen_url = nullif(trim(p_datos ->> 'imagen_url'), ''),
      estatus = coalesce(p_datos ->> 'estatus', 'disponible'),
      sku = nullif(trim(p_datos ->> 'sku'), ''),
      atributos = coalesce(p_datos -> 'atributos', '{}'::jsonb)
    where id = p_producto_id;
  end if;

  -- Pasar de "sin tallas" a "con tallas" con piezas sueltas perdería stock en silencio.
  if jsonb_array_length(coalesce(p_variantes, '[]'::jsonb)) > 0 and not v_tenia_variantes and v_stock_actual > 0 then
    raise exception 'El producto tiene % piezas sin talla. Ajusta su stock a 0 antes de agregar tallas.', v_stock_actual
      using errcode = '23514';
  end if;

  -- Variantes: actualizar existentes, crear nuevas, quitar las ausentes (solo con stock 0).
  for v_var in select * from jsonb_array_elements(coalesce(p_variantes, '[]'::jsonb)) loop
    v_var_id := nullif(v_var ->> 'id', '')::uuid;
    if v_var_id is not null then
      update public.producto_variantes set
        nombre = trim(v_var ->> 'nombre'),
        sku = nullif(trim(v_var ->> 'sku'), ''),
        atributos = coalesce(v_var -> 'atributos', '{}'::jsonb),
        stock_minimo = coalesce((v_var ->> 'stock_minimo')::integer, 0)
      where id = v_var_id and producto_id = v_id;
      if not found then
        raise exception 'Variante no encontrada.' using errcode = 'P0002';
      end if;
    else
      insert into public.producto_variantes (business_id, producto_id, nombre, sku, atributos, stock_minimo)
      values (p_business_id, v_id, trim(v_var ->> 'nombre'), nullif(trim(v_var ->> 'sku'), ''),
              coalesce(v_var -> 'atributos', '{}'::jsonb), coalesce((v_var ->> 'stock_minimo')::integer, 0))
      returning id into v_var_id;

      if coalesce((v_var ->> 'stock_inicial')::integer, 0) < 0 then
        raise exception 'El stock no puede ser negativo.' using errcode = '23514';
      elsif coalesce((v_var ->> 'stock_inicial')::integer, 0) > 0 then
        update public.producto_variantes set stock = (v_var ->> 'stock_inicial')::integer where id = v_var_id;
        insert into public.movimientos_stock (business_id, producto_id, variante_id, user_id, tipo, cantidad, stock_antes, stock_despues, notas)
        values (p_business_id, v_id, v_var_id, v_user, 'entrada', (v_var ->> 'stock_inicial')::integer, 0,
                (v_var ->> 'stock_inicial')::integer, 'Stock inicial');
      end if;
    end if;
    v_ids_enviados := v_ids_enviados || v_var_id;
  end loop;

  for v_quitada in
    select v.id, v.nombre, v.stock from public.producto_variantes v
    where v.producto_id = v_id and not (v.id = any (v_ids_enviados))
  loop
    if v_quitada.stock > 0 then
      raise exception 'La variante "%" tiene % piezas. Ajusta su stock a 0 antes de quitarla.', v_quitada.nombre, v_quitada.stock
        using errcode = '23514';
    end if;
    delete from public.producto_variantes where id = v_quitada.id;
  end loop;

  -- Stock inicial de un producto nuevo sin variantes.
  if v_es_nuevo and jsonb_array_length(coalesce(p_variantes, '[]'::jsonb)) = 0 and v_stock_inicial > 0 then
    update public.productos set stock = v_stock_inicial where id = v_id;
    insert into public.movimientos_stock (business_id, producto_id, user_id, tipo, cantidad, stock_antes, stock_despues, notas)
    values (p_business_id, v_id, v_user, 'entrada', v_stock_inicial, 0, v_stock_inicial, 'Stock inicial');
  end if;

  return v_id;
end;
$$;

create or replace function public.cambiar_estatus_producto(p_business_id uuid, p_producto_id uuid, p_estatus text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform app_private.exigir_admin(p_business_id);
  if p_estatus not in ('disponible', 'pausado') then
    raise exception 'Estatus inválido.' using errcode = '22023';
  end if;
  update public.productos set estatus = p_estatus where id = p_producto_id and business_id = p_business_id;
  if not found then
    raise exception 'Producto no encontrado.' using errcode = 'P0002';
  end if;
end;
$$;

-- Registra una venta completa. Devuelve { venta_id, folio, total, duplicada }.
--   p_lineas: [{ producto_id, variante_id?, cantidad }]  (el precio lo pone la BD)
--   p_pago:   { monto, forma_pago } o null para venta a crédito
--   p_cliente:{ nombre, telefono } (obligatorio si queda saldo)
create or replace function public.registrar_venta(
  p_business_id uuid,
  p_lineas jsonb,
  p_pago jsonb,
  p_cliente jsonb,
  p_notas text,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_existente record;
  v_ahora timestamp;
  v_folio_num integer;
  v_folio text;
  v_venta_id uuid;
  v_linea record;
  v_total numeric(12, 2) := 0;
  v_piezas integer := 0;
  v_monto numeric(12, 2);
  v_forma text;
  v_cliente_nombre text := nullif(trim(p_cliente ->> 'nombre'), '');
  v_pago_id uuid;
  v_antes integer;
  v_categoria uuid;
begin
  perform app_private.exigir_admin(p_business_id);

  if p_idempotency_key is null then
    raise exception 'Falta la llave de idempotencia.' using errcode = '22023';
  end if;

  -- Reintento / doble clic: devolver la venta ya creada.
  select v.id, v.folio, v.total into v_existente
  from public.ventas v
  where v.business_id = p_business_id and v.idempotency_key = p_idempotency_key;
  if found then
    return jsonb_build_object('venta_id', v_existente.id, 'folio', v_existente.folio, 'total', v_existente.total, 'duplicada', true);
  end if;

  if jsonb_typeof(p_lineas) <> 'array' or jsonb_array_length(p_lineas) = 0 or jsonb_array_length(p_lineas) > 100 then
    raise exception 'El ticket debe tener entre 1 y 100 líneas.' using errcode = '22023';
  end if;

  -- Normalizar líneas (agrupa repetidas) en una tabla temporal.
  drop table if exists pg_temp._lineas;
  create temp table _lineas on commit drop as
  select (l ->> 'producto_id')::uuid as producto_id,
         nullif(l ->> 'variante_id', '')::uuid as variante_id,
         sum((l ->> 'cantidad')::integer)::integer as cantidad
  from jsonb_array_elements(p_lineas) l
  group by 1, 2;

  if exists (select 1 from _lineas where cantidad is null or cantidad < 1 or cantidad > 999 or producto_id is null) then
    raise exception 'Hay una cantidad inválida en el ticket.' using errcode = '22023';
  end if;

  -- Bloquear filas en orden fijo (evita interbloqueos entre cajas).
  perform 1 from public.productos p
  where p.id in (select producto_id from _lineas) order by p.id for update;
  perform 1 from public.producto_variantes v
  where v.id in (select variante_id from _lineas where variante_id is not null) order by v.id for update;

  -- Validar y tomar precio/costo/nombre del servidor.
  for v_linea in
    select l.producto_id, l.variante_id, l.cantidad,
           p.nombre as producto_nombre, p.precio_venta, p.precio_costo, p.estatus, p.tiene_variantes,
           p.business_id as p_business, p.stock as p_stock,
           v.nombre as variante_nombre, v.stock as v_stock, v.producto_id as v_producto
    from _lineas l
    left join public.productos p on p.id = l.producto_id
    left join public.producto_variantes v on v.id = l.variante_id
  loop
    if v_linea.p_business is distinct from p_business_id then
      raise exception 'Uno de los productos ya no existe.' using errcode = 'P0002';
    end if;
    if v_linea.estatus = 'pausado' then
      raise exception '"%" está pausado y no se puede vender.', v_linea.producto_nombre using errcode = '23514';
    end if;
    if v_linea.tiene_variantes and v_linea.variante_id is null then
      raise exception 'Elige la talla de "%".', v_linea.producto_nombre using errcode = '22023';
    end if;
    if v_linea.variante_id is not null and v_linea.v_producto is distinct from v_linea.producto_id then
      raise exception 'La talla elegida no corresponde a "%".', v_linea.producto_nombre using errcode = '22023';
    end if;
    if coalesce(v_linea.v_stock, v_linea.p_stock) < v_linea.cantidad then
      raise exception 'Solo quedan % de "%".', coalesce(v_linea.v_stock, v_linea.p_stock),
        v_linea.producto_nombre || coalesce(' (' || v_linea.variante_nombre || ')', '')
        using errcode = '23514';
    end if;
    v_total := v_total + round(v_linea.cantidad * v_linea.precio_venta, 2);
    v_piezas := v_piezas + v_linea.cantidad;
  end loop;

  -- Pago inicial.
  if p_pago is null or jsonb_typeof(p_pago) = 'null' or coalesce(p_pago ->> 'forma_pago', 'adeudo') = 'adeudo' then
    v_monto := 0;
    v_forma := null;
  else
    v_monto := round((p_pago ->> 'monto')::numeric, 2);
    v_forma := p_pago ->> 'forma_pago';
    if v_forma not in ('efectivo', 'transferencia', 'tarjeta') then
      raise exception 'Forma de pago inválida.' using errcode = '22023';
    end if;
    if v_monto is null or v_monto <= 0 then
      raise exception 'El pago debe ser mayor a $0.00.' using errcode = '22023';
    end if;
    if v_monto > v_total then
      raise exception 'El pago (%) no puede ser mayor al total (%).', v_monto, v_total using errcode = '23514';
    end if;
  end if;

  if v_monto < v_total and (v_cliente_nombre is null or char_length(v_cliente_nombre) < 2) then
    raise exception 'Escribe el nombre del cliente para dejar saldo pendiente.' using errcode = '22023';
  end if;

  -- Folio consecutivo: la fila del negocio queda bloqueada hasta el commit.
  update public.businesses set siguiente_folio = siguiente_folio + 1
  where id = p_business_id
  returning siguiente_folio - 1 into v_folio_num;
  v_folio := 'F-' || lpad(v_folio_num::text, 5, '0');
  v_ahora := app_private.ahora_local(p_business_id);

  insert into public.ventas (business_id, user_id, folio, fecha, hora, subtotal, descuento, total, monto_pagado,
                             forma_pago_inicial, cliente_nombre, cliente_telefono, notas, idempotency_key)
  values (p_business_id, v_user, v_folio, v_ahora::date, v_ahora::time(0), v_total, 0, v_total, v_monto,
          v_forma, v_cliente_nombre, nullif(trim(p_cliente ->> 'telefono'), ''), nullif(trim(p_notas), ''),
          p_idempotency_key)
  returning id into v_venta_id;

  -- Líneas + descuento de stock + movimientos.
  for v_linea in
    select l.producto_id, l.variante_id, l.cantidad, p.nombre as producto_nombre, p.precio_venta, p.precio_costo,
           v.nombre as variante_nombre
    from _lineas l
    join public.productos p on p.id = l.producto_id
    left join public.producto_variantes v on v.id = l.variante_id
  loop
    insert into public.venta_lineas (business_id, venta_id, producto_id, variante_id, producto_nombre, variante_nombre,
                                     cantidad, precio_unitario, costo_unitario, subtotal)
    values (p_business_id, v_venta_id, v_linea.producto_id, v_linea.variante_id, v_linea.producto_nombre,
            v_linea.variante_nombre, v_linea.cantidad, v_linea.precio_venta, v_linea.precio_costo,
            round(v_linea.cantidad * v_linea.precio_venta, 2));

    if v_linea.variante_id is not null then
      update public.producto_variantes set stock = stock - v_linea.cantidad
      where id = v_linea.variante_id
      returning stock + v_linea.cantidad into v_antes;
    else
      update public.productos set stock = stock - v_linea.cantidad
      where id = v_linea.producto_id
      returning stock + v_linea.cantidad into v_antes;
    end if;

    insert into public.movimientos_stock (business_id, producto_id, variante_id, user_id, tipo, cantidad,
                                          stock_antes, stock_despues, referencia_tipo, referencia_id, notas)
    values (p_business_id, v_linea.producto_id, v_linea.variante_id, v_user, 'venta', v_linea.cantidad,
            v_antes, v_antes - v_linea.cantidad, 'venta', v_venta_id, 'Venta ' || v_folio);
  end loop;

  -- Pago inicial e ingreso en finanzas.
  if v_monto > 0 then
    insert into public.venta_pagos (business_id, venta_id, user_id, monto, forma_pago, es_inicial)
    values (p_business_id, v_venta_id, v_user, v_monto, v_forma, true)
    returning id into v_pago_id;

    select c.id into v_categoria from public.categorias c where c.business_id = p_business_id and c.clave = 'ventas';

    insert into public.transacciones (business_id, user_id, fecha, concepto, categoria_id, cantidad, forma_pago,
                                      monto, tipo, origen, venta_id, venta_pago_id)
    values (p_business_id, v_user, v_ahora::date, 'Venta ' || v_folio, v_categoria, v_piezas, v_forma,
            v_monto, 'ingreso', 'venta', v_venta_id, v_pago_id);
  end if;

  return jsonb_build_object('venta_id', v_venta_id, 'folio', v_folio, 'total', v_total, 'duplicada', false);
end;
$$;

-- Abono a una venta con saldo. Devuelve { saldo_pendiente, estado_pago, duplicado }.
create or replace function public.registrar_abono(
  p_business_id uuid,
  p_venta_id uuid,
  p_monto numeric,
  p_forma_pago text,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_venta record;
  v_monto numeric(12, 2) := round(p_monto, 2);
  v_pago_id uuid;
  v_categoria uuid;
  v_ahora timestamp;
begin
  perform app_private.exigir_admin(p_business_id);

  if p_idempotency_key is null then
    raise exception 'Falta la llave de idempotencia.' using errcode = '22023';
  end if;
  if exists (select 1 from public.venta_pagos vp where vp.business_id = p_business_id and vp.idempotency_key = p_idempotency_key) then
    select v.saldo_pendiente, v.estado_pago into v_venta from public.ventas v where v.id = p_venta_id;
    return jsonb_build_object('saldo_pendiente', v_venta.saldo_pendiente, 'estado_pago', v_venta.estado_pago, 'duplicado', true);
  end if;

  if p_forma_pago not in ('efectivo', 'transferencia', 'tarjeta') then
    raise exception 'Forma de pago inválida.' using errcode = '22023';
  end if;
  if v_monto is null or v_monto <= 0 then
    raise exception 'El abono debe ser mayor a $0.00.' using errcode = '22023';
  end if;

  -- Bloquea la venta: dos abonos simultáneos no pueden pasar ambos la validación.
  select v.id, v.folio, v.estatus, v.saldo_pendiente into v_venta
  from public.ventas v
  where v.id = p_venta_id and v.business_id = p_business_id
  for update;

  if not found then
    raise exception 'Venta no encontrada.' using errcode = 'P0002';
  end if;
  if v_venta.estatus = 'cancelada' then
    raise exception 'La venta está cancelada y no admite abonos.' using errcode = '23514';
  end if;
  if v_venta.saldo_pendiente = 0 then
    raise exception 'La venta ya está pagada.' using errcode = '23514';
  end if;
  if v_monto > v_venta.saldo_pendiente then
    raise exception 'El abono supera el saldo pendiente. Máximo: %.', v_venta.saldo_pendiente using errcode = '23514';
  end if;

  v_ahora := app_private.ahora_local(p_business_id);

  insert into public.venta_pagos (business_id, venta_id, user_id, monto, forma_pago, idempotency_key)
  values (p_business_id, p_venta_id, v_user, v_monto, p_forma_pago, p_idempotency_key)
  returning id into v_pago_id;

  update public.ventas set monto_pagado = monto_pagado + v_monto where id = p_venta_id;

  select c.id into v_categoria from public.categorias c where c.business_id = p_business_id and c.clave = 'ventas';

  insert into public.transacciones (business_id, user_id, fecha, concepto, categoria_id, cantidad, forma_pago,
                                    monto, tipo, origen, venta_id, venta_pago_id)
  values (p_business_id, v_user, v_ahora::date, 'Abono ' || v_venta.folio, v_categoria, 1, p_forma_pago,
          v_monto, 'ingreso', 'abono', p_venta_id, v_pago_id);

  select v.saldo_pendiente, v.estado_pago into v_venta from public.ventas v where v.id = p_venta_id;
  return jsonb_build_object('saldo_pendiente', v_venta.saldo_pendiente, 'estado_pago', v_venta.estado_pago, 'duplicado', false);
end;
$$;

-- Cancela una venta: devuelve stock y, si se cobró algo, registra la devolución.
-- No borra nada: la venta, sus pagos e ingresos quedan en el historial.
create or replace function public.cancelar_venta(p_business_id uuid, p_venta_id uuid, p_motivo text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_venta record;
  v_linea record;
  v_antes integer;
  v_categoria uuid;
  v_ahora timestamp;
begin
  perform app_private.exigir_admin(p_business_id);

  if char_length(trim(coalesce(p_motivo, ''))) < 3 then
    raise exception 'Escribe el motivo de la cancelación.' using errcode = '22023';
  end if;

  select v.id, v.folio, v.estatus, v.monto_pagado, v.forma_pago_inicial into v_venta
  from public.ventas v
  where v.id = p_venta_id and v.business_id = p_business_id
  for update;

  if not found then
    raise exception 'Venta no encontrada.' using errcode = 'P0002';
  end if;
  if v_venta.estatus = 'cancelada' then
    raise exception 'La venta ya estaba cancelada.' using errcode = '23514';
  end if;

  -- Devolver stock (solo líneas cuyo producto/variante aún existe).
  perform 1 from public.productos p
  where p.id in (select vl.producto_id from public.venta_lineas vl where vl.venta_id = p_venta_id)
  order by p.id for update;

  for v_linea in
    select vl.producto_id, vl.variante_id, vl.cantidad
    from public.venta_lineas vl
    where vl.venta_id = p_venta_id and vl.producto_id is not null
  loop
    if v_linea.variante_id is not null then
      update public.producto_variantes set stock = stock + v_linea.cantidad
      where id = v_linea.variante_id
      returning stock - v_linea.cantidad into v_antes;
    else
      update public.productos set stock = stock + v_linea.cantidad
      where id = v_linea.producto_id and not tiene_variantes
      returning stock - v_linea.cantidad into v_antes;
    end if;

    if found then
      insert into public.movimientos_stock (business_id, producto_id, variante_id, user_id, tipo, cantidad,
                                            stock_antes, stock_despues, referencia_tipo, referencia_id, notas)
      values (p_business_id, v_linea.producto_id, v_linea.variante_id, v_user, 'cancelacion', v_linea.cantidad,
              v_antes, v_antes + v_linea.cantidad, 'venta', p_venta_id, 'Cancelación ' || v_venta.folio);
    end if;
  end loop;

  v_ahora := app_private.ahora_local(p_business_id);

  if v_venta.monto_pagado > 0 then
    select c.id into v_categoria from public.categorias c where c.business_id = p_business_id and c.clave = 'devoluciones';

    insert into public.transacciones (business_id, user_id, fecha, concepto, categoria_id, cantidad, forma_pago,
                                      monto, tipo, origen, venta_id, notas)
    values (p_business_id, v_user, v_ahora::date, 'Devolución ' || v_venta.folio, v_categoria, 1,
            coalesce(v_venta.forma_pago_inicial, 'efectivo'), v_venta.monto_pagado, 'gasto', 'devolucion',
            p_venta_id, trim(p_motivo));
  end if;

  update public.ventas set
    estatus = 'cancelada',
    cancelada_at = now(),
    cancelada_por = v_user,
    motivo_cancelacion = trim(p_motivo)
  where id = p_venta_id;
end;
$$;

-- Quita un pago registrado por error (y su ingreso). Solo en ventas activas.
create or replace function public.eliminar_pago_venta(p_business_id uuid, p_pago_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pago record;
begin
  perform app_private.exigir_admin(p_business_id);

  select vp.id, vp.venta_id, vp.monto into v_pago
  from public.venta_pagos vp
  where vp.id = p_pago_id and vp.business_id = p_business_id;
  if not found then
    raise exception 'Pago no encontrado.' using errcode = 'P0002';
  end if;

  perform 1 from public.ventas v where v.id = v_pago.venta_id and v.estatus = 'activa' for update;
  if not found then
    raise exception 'No se pueden quitar pagos de una venta cancelada.' using errcode = '23514';
  end if;

  delete from public.venta_pagos where id = v_pago.id; -- su transacción cae por cascade
  update public.ventas set monto_pagado = monto_pagado - v_pago.monto where id = v_pago.venta_id;
end;
$$;

-- Solo usuarios autenticados pueden llamar a las RPC; anon no.
do $$
declare
  f text;
begin
  foreach f in array array[
    'public.crear_negocio(text)',
    'public.ajustar_stock(uuid, uuid, uuid, text, integer, text)',
    'public.guardar_producto(uuid, uuid, jsonb, jsonb)',
    'public.cambiar_estatus_producto(uuid, uuid, text)',
    'public.registrar_venta(uuid, jsonb, jsonb, jsonb, text, uuid)',
    'public.registrar_abono(uuid, uuid, numeric, text, uuid)',
    'public.cancelar_venta(uuid, uuid, text)',
    'public.eliminar_pago_venta(uuid, uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;

-- Negocios existentes (de antes de esta migración) reciben sus categorías iniciales.
do $$
declare
  b record;
begin
  for b in select id, created_by from public.businesses loop
    perform app_private.categorias_iniciales(b.id, b.created_by);
  end loop;
end $$;

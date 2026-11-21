-- Precio ajustado por línea y artículos sin registrar (sobrecargo).
--
-- 1. Una línea de inventario puede venderse a un precio distinto al de catálogo
--    (descuentos, Buen Fin, precio especial). Se guarda el precio de lista y el
--    motivo del cambio, que es obligatorio.
-- 2. Una línea "libre" es un artículo que no está en inventario: solo lleva
--    descripción, cantidad y precio. No toca stock ni movimientos.

alter table public.venta_lineas
  add column tipo text not null default 'inventario' check (tipo in ('inventario', 'libre')),
  add column precio_lista numeric(12, 2) check (precio_lista is null or precio_lista >= 0),
  add column nota_precio text check (nota_precio is null or char_length(nota_precio) <= 200);

alter table public.venta_lineas
  add constraint venta_lineas_libre_sin_producto
    check (tipo = 'inventario' or (producto_id is null and variante_id is null and precio_lista is null)),
  add constraint venta_lineas_ajuste_con_motivo
    check (precio_lista is null or char_length(trim(coalesce(nota_precio, ''))) >= 3);

comment on column public.venta_lineas.precio_lista is 'Precio de catálogo cuando se vendió a otro precio; null si se respetó el de catálogo.';
comment on column public.venta_lineas.nota_precio is 'Motivo del cambio de precio (obligatorio si precio_lista no es null).';

-- Formato de p_lineas:
--   inventario: { producto_id, variante_id?, cantidad, precio?, nota_precio? }
--   libre:      { tipo: "libre", descripcion, cantidad, precio }
-- Si "precio" falta o es igual al de catálogo, se usa el de catálogo.
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
  v_precio numeric(12, 2);
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

  -- Líneas de inventario normalizadas (agrupa repetidas).
  drop table if exists pg_temp._lineas;
  create temp table _lineas on commit drop as
  select (l ->> 'producto_id')::uuid as producto_id,
         nullif(l ->> 'variante_id', '')::uuid as variante_id,
         sum((l ->> 'cantidad')::integer)::integer as cantidad,
         min(round((l ->> 'precio')::numeric, 2)) as precio,
         max(nullif(trim(l ->> 'nota_precio'), '')) as nota_precio,
         count(distinct coalesce(round((l ->> 'precio')::numeric, 2), -1)) as precios
  from jsonb_array_elements(p_lineas) l
  where coalesce(l ->> 'tipo', 'inventario') = 'inventario'
  group by 1, 2;

  -- Artículos sin registrar (no se agrupan: cada uno es su propia línea).
  drop table if exists pg_temp._libres;
  create temp table _libres on commit drop as
  select t.ord,
         nullif(trim(t.l ->> 'descripcion'), '') as descripcion,
         (t.l ->> 'cantidad')::integer as cantidad,
         round((t.l ->> 'precio')::numeric, 2) as precio
  from jsonb_array_elements(p_lineas) with ordinality as t(l, ord)
  where t.l ->> 'tipo' = 'libre';

  if exists (select 1 from jsonb_array_elements(p_lineas) l where coalesce(l ->> 'tipo', 'inventario') not in ('inventario', 'libre')) then
    raise exception 'Tipo de línea inválido.' using errcode = '22023';
  end if;
  if exists (select 1 from _lineas where cantidad is null or cantidad < 1 or cantidad > 999 or producto_id is null)
     or exists (select 1 from _libres where cantidad is null or cantidad < 1 or cantidad > 999) then
    raise exception 'Hay una cantidad inválida en el ticket.' using errcode = '22023';
  end if;
  if exists (select 1 from _lineas where precios > 1) then
    raise exception 'Un mismo producto no puede llevar dos precios distintos en el ticket.' using errcode = '22023';
  end if;
  if exists (select 1 from _lineas where precio is not null and (precio < 0 or precio > 10000000))
     or exists (select 1 from _libres where precio is null or precio < 0 or precio > 10000000) then
    raise exception 'Hay un precio inválido en el ticket.' using errcode = '22023';
  end if;
  if exists (select 1 from _libres where descripcion is null or char_length(descripcion) not between 2 and 120) then
    raise exception 'Describe el artículo sin registrar (2 a 120 caracteres).' using errcode = '22023';
  end if;

  -- Bloquear filas en orden fijo (evita interbloqueos entre cajas).
  perform 1 from public.productos p
  where p.id in (select producto_id from _lineas) order by p.id for update;
  perform 1 from public.producto_variantes v
  where v.id in (select variante_id from _lineas where variante_id is not null) order by v.id for update;

  -- Validar; el precio de catálogo, costo y nombre salen del servidor.
  for v_linea in
    select l.producto_id, l.variante_id, l.cantidad, l.precio, l.nota_precio,
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
    v_precio := coalesce(v_linea.precio, v_linea.precio_venta);
    if v_precio <> v_linea.precio_venta and char_length(coalesce(v_linea.nota_precio, '')) < 3 then
      raise exception 'Escribe el motivo del cambio de precio de "%".', v_linea.producto_nombre using errcode = '22023';
    end if;
    v_total := v_total + round(v_linea.cantidad * v_precio, 2);
    v_piezas := v_piezas + v_linea.cantidad;
  end loop;

  select v_total + coalesce(sum(round(cantidad * precio, 2)), 0),
         v_piezas + coalesce(sum(cantidad), 0)::integer
  into v_total, v_piezas
  from _libres;

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

  -- Líneas de inventario + descuento de stock + movimientos.
  for v_linea in
    select l.producto_id, l.variante_id, l.cantidad, l.precio, l.nota_precio,
           p.nombre as producto_nombre, p.precio_venta, p.precio_costo,
           v.nombre as variante_nombre
    from _lineas l
    join public.productos p on p.id = l.producto_id
    left join public.producto_variantes v on v.id = l.variante_id
  loop
    v_precio := coalesce(v_linea.precio, v_linea.precio_venta);

    insert into public.venta_lineas (business_id, venta_id, producto_id, variante_id, producto_nombre, variante_nombre,
                                     cantidad, precio_unitario, costo_unitario, subtotal, tipo, precio_lista, nota_precio)
    values (p_business_id, v_venta_id, v_linea.producto_id, v_linea.variante_id, v_linea.producto_nombre,
            v_linea.variante_nombre, v_linea.cantidad, v_precio, v_linea.precio_costo,
            round(v_linea.cantidad * v_precio, 2), 'inventario',
            case when v_precio <> v_linea.precio_venta then v_linea.precio_venta end,
            case when v_precio <> v_linea.precio_venta then left(v_linea.nota_precio, 200) end);

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

  -- Artículos sin registrar: solo quedan en la venta, sin stock ni costo.
  insert into public.venta_lineas (business_id, venta_id, tipo, producto_nombre, cantidad,
                                   precio_unitario, costo_unitario, subtotal)
  select p_business_id, v_venta_id, 'libre', b.descripcion, b.cantidad, b.precio, 0, round(b.cantidad * b.precio, 2)
  from _libres b
  order by b.ord;

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

revoke all on function public.registrar_venta(uuid, jsonb, jsonb, jsonb, text, uuid) from public, anon;
grant execute on function public.registrar_venta(uuid, jsonb, jsonb, jsonb, text, uuid) to authenticated;

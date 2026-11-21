-- Pruebas del backend v2. Ejecutar: supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(54);

-- ── Usuarios de prueba ──────────────────────────────────────────────────────
insert into auth.users (id, email, aud, role, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-00000000000a', 'a@test.mx', 'authenticated', 'authenticated', '{"nombre":"Ana"}'),
  ('00000000-0000-0000-0000-00000000000b', 'b@test.mx', 'authenticated', 'authenticated', '{"nombre":"Beto"}');

create or replace function pg_temp.como(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end $$;

create or replace function pg_temp.como_anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  perform set_config('role', 'anon', true);
end $$;

create table pg_temp.ctx (k text primary key, v uuid);
grant all on pg_temp.ctx to authenticated, anon;

-- ── Registro: crear_negocio ─────────────────────────────────────────────────
select pg_temp.como('00000000-0000-0000-0000-00000000000a');
insert into pg_temp.ctx values ('biz_a', public.crear_negocio('Boutique A'));
select pg_temp.como('00000000-0000-0000-0000-00000000000b');
insert into pg_temp.ctx values ('biz_b', public.crear_negocio('Tienda B'));

select pg_temp.como('00000000-0000-0000-0000-00000000000a');
select ok(public.is_business_admin((select v from pg_temp.ctx where k = 'biz_a')), 'crear_negocio deja al usuario como admin');
select is((select count(*)::int from public.categorias where clave is not null), 2, 'se crean las categorías de sistema (ventas, devoluciones)');
select throws_ok($$ select public.crear_negocio('Otro') $$, '23505', null, 'una cuenta no puede crear un segundo negocio');

-- ── Productos ──────────────────────────────────────────────────────────────
insert into pg_temp.ctx values ('cat', (select id from public.categorias where tipo = 'producto' limit 1));
insert into pg_temp.ctx values ('playera', public.guardar_producto(
  (select v from pg_temp.ctx where k = 'biz_a'), null,
  jsonb_build_object('nombre', 'Playera Nube', 'categoria_id', (select v from pg_temp.ctx where k = 'cat'),
                     'precio_venta', 249, 'precio_costo', 100, 'stock_minimo', 2, 'sku', 'PLA-001', 'stock_inicial', 5)));
insert into pg_temp.ctx values ('jeans', public.guardar_producto(
  (select v from pg_temp.ctx where k = 'biz_a'), null,
  jsonb_build_object('nombre', 'Jeans Alma', 'categoria_id', (select v from pg_temp.ctx where k = 'cat'),
                     'precio_venta', 899, 'precio_costo', 400, 'sku', 'JEA-001'),
  '[{"nombre":"28","stock_inicial":3},{"nombre":"30","stock_inicial":1}]'::jsonb));

select is((select stock from public.productos where id = (select v from pg_temp.ctx where k = 'playera')), 5, 'stock inicial del producto');
select is((select count(*)::int from public.movimientos_stock where producto_id = (select v from pg_temp.ctx where k = 'playera') and tipo = 'entrada'), 1, 'el stock inicial deja movimiento de entrada');
select is((select stock from public.productos where id = (select v from pg_temp.ctx where k = 'jeans')), 4, 'con variantes, stock del producto = suma de variantes');
select ok((select tiene_variantes from public.productos where id = (select v from pg_temp.ctx where k = 'jeans')), 'tiene_variantes se marca solo');
insert into pg_temp.ctx values ('j28', (select id from public.producto_variantes where nombre = '28'));
insert into pg_temp.ctx values ('j30', (select id from public.producto_variantes where nombre = '30'));

select throws_ok(
  format($$ select public.guardar_producto(%L, null, '{"nombre":"Dup","precio_venta":10,"sku":"pla-001"}'::jsonb) $$,
         (select v from pg_temp.ctx where k = 'biz_a')),
  '23505', null, 'SKU duplicado (sin distinguir mayúsculas) se rechaza');

select throws_ok(
  format($$ select public.guardar_producto(%L, %L, '{"nombre":"Jeans Alma","precio_venta":899}'::jsonb, '[{"id":"%s","nombre":"28"}]'::jsonb) $$,
         (select v from pg_temp.ctx where k = 'biz_a'), (select v from pg_temp.ctx where k = 'jeans'), (select v from pg_temp.ctx where k = 'j28')),
  '23514', null, 'no se puede quitar una variante con stock');

select throws_ok(
  format($$ select public.guardar_producto(%L, %L, '{"nombre":"Playera Nube","precio_venta":249}'::jsonb, '[{"nombre":"M"}]'::jsonb) $$,
         (select v from pg_temp.ctx where k = 'biz_a'), (select v from pg_temp.ctx where k = 'playera')),
  '23514', null, 'no se agregan tallas a un producto con piezas sueltas');

-- Escritura directa bloqueada (solo vía funciones)
select throws_ok(
  format($$ update public.productos set stock = 999 where id = %L $$, (select v from pg_temp.ctx where k = 'playera')),
  '42501', null, 'no se puede editar el stock directamente');
select throws_ok(
  format($$ insert into public.movimientos_stock (business_id, producto_id, tipo, cantidad, stock_antes, stock_despues) values (%L, %L, 'entrada', 1, 0, 1) $$,
         (select v from pg_temp.ctx where k = 'biz_a'), (select v from pg_temp.ctx where k = 'playera')),
  '42501', null, 'no se pueden insertar movimientos directamente');

-- ── Ajustes de stock ───────────────────────────────────────────────────────
select throws_ok(
  format($$ select public.ajustar_stock(%L, %L, null, 'salida', 6) $$,
         (select v from pg_temp.ctx where k = 'biz_a'), (select v from pg_temp.ctx where k = 'playera')),
  '23514', null, 'una salida no puede dejar stock negativo');
select is(public.ajustar_stock((select v from pg_temp.ctx where k = 'biz_a'), (select v from pg_temp.ctx where k = 'playera'), null, 'entrada', 5, 'Compra'),
          10, 'entrada suma al stock');
select throws_ok(
  format($$ select public.ajustar_stock(%L, %L, null, 'entrada', 1) $$,
         (select v from pg_temp.ctx where k = 'biz_a'), (select v from pg_temp.ctx where k = 'jeans')),
  '22023', null, 'producto con variantes exige elegir variante');

-- ── Ventas ─────────────────────────────────────────────────────────────────
-- Venta completa: 2 playeras. El precio lo pone la BD aunque el cliente mande otro.
insert into pg_temp.ctx values ('k1', gen_random_uuid());
insert into pg_temp.ctx values ('venta1', (public.registrar_venta(
  (select v from pg_temp.ctx where k = 'biz_a'),
  jsonb_build_array(jsonb_build_object('producto_id', (select v from pg_temp.ctx where k = 'playera'), 'cantidad', 2, 'precio_unitario', 1)),
  '{"monto":498,"forma_pago":"efectivo"}'::jsonb, null, null,
  (select v from pg_temp.ctx where k = 'k1')) ->> 'venta_id')::uuid);

select is((select total from public.ventas where id = (select v from pg_temp.ctx where k = 'venta1')), 498.00::numeric, 'el total se calcula con el precio del servidor (ignora precio del cliente)');
select is((select folio from public.ventas where id = (select v from pg_temp.ctx where k = 'venta1')), 'F-00001', 'folio consecutivo por negocio');
select is((select estado_pago from public.ventas where id = (select v from pg_temp.ctx where k = 'venta1')), 'pagada', 'estado de pago derivado: pagada');
select is((select stock from public.productos where id = (select v from pg_temp.ctx where k = 'playera')), 8, 'la venta descuenta stock');
select is((select count(*)::int from public.transacciones where venta_id = (select v from pg_temp.ctx where k = 'venta1') and origen = 'venta' and venta_pago_id is not null), 1, 'la venta genera su ingreso ligado al pago');
select is((select fecha from public.ventas where id = (select v from pg_temp.ctx where k = 'venta1')), (now() at time zone 'America/Mexico_City')::date, 'la fecha es la del negocio (CDMX), no UTC');

-- Doble clic: misma llave → misma venta, sin descontar otra vez
select is((public.registrar_venta(
  (select v from pg_temp.ctx where k = 'biz_a'),
  jsonb_build_array(jsonb_build_object('producto_id', (select v from pg_temp.ctx where k = 'playera'), 'cantidad', 2)),
  '{"monto":498,"forma_pago":"efectivo"}'::jsonb, null, null,
  (select v from pg_temp.ctx where k = 'k1')) ->> 'duplicada')::boolean, true, 'reintento con la misma llave no duplica la venta');
select is((select stock from public.productos where id = (select v from pg_temp.ctx where k = 'playera')), 8, 'el reintento no descuenta stock de nuevo');

-- Stock insuficiente
select throws_ok(
  format($$ select public.registrar_venta(%L, '[{"producto_id":"%s","variante_id":"%s","cantidad":2}]'::jsonb, '{"monto":1798,"forma_pago":"tarjeta"}'::jsonb, null, null, gen_random_uuid()) $$,
         (select v from pg_temp.ctx where k = 'biz_a'), (select v from pg_temp.ctx where k = 'jeans'), (select v from pg_temp.ctx where k = 'j30')),
  '23514', null, 'no se vende más de lo que hay en la variante');
select throws_ok(
  format($$ select public.registrar_venta(%L, '[{"producto_id":"%s","cantidad":1}]'::jsonb, null, null, null, gen_random_uuid()) $$,
         (select v from pg_temp.ctx where k = 'biz_a'), (select v from pg_temp.ctx where k = 'jeans')),
  '22023', null, 'producto con tallas exige elegir talla');
select throws_ok(
  format($$ select public.registrar_venta(%L, '[{"producto_id":"%s","cantidad":1}]'::jsonb, '{"monto":500,"forma_pago":"efectivo"}'::jsonb, null, null, gen_random_uuid()) $$,
         (select v from pg_temp.ctx where k = 'biz_a'), (select v from pg_temp.ctx where k = 'playera')),
  '23514', null, 'el pago no puede superar el total');
select throws_ok(
  format($$ select public.registrar_venta(%L, '[{"producto_id":"%s","cantidad":1}]'::jsonb, null, null, null, gen_random_uuid()) $$,
         (select v from pg_temp.ctx where k = 'biz_a'), (select v from pg_temp.ctx where k = 'playera')),
  '22023', null, 'venta a crédito exige nombre del cliente');

-- Venta parcial de una variante: jeans 28 ×2, abona 800 de 1798
insert into pg_temp.ctx values ('venta2', (public.registrar_venta(
  (select v from pg_temp.ctx where k = 'biz_a'),
  jsonb_build_array(jsonb_build_object('producto_id', (select v from pg_temp.ctx where k = 'jeans'), 'variante_id', (select v from pg_temp.ctx where k = 'j28'), 'cantidad', 2)),
  '{"monto":800,"forma_pago":"tarjeta"}'::jsonb, '{"nombre":"Mariana López"}'::jsonb, null, gen_random_uuid()) ->> 'venta_id')::uuid);

select is((select stock from public.producto_variantes where id = (select v from pg_temp.ctx where k = 'j28')), 1, 'la venta descuenta stock de la variante');
select is((select stock from public.productos where id = (select v from pg_temp.ctx where k = 'jeans')), 2, 'el producto refleja la suma de variantes tras la venta');
select is((select stock_antes || '→' || stock_despues from public.movimientos_stock where referencia_id = (select v from pg_temp.ctx where k = 'venta2')), '3→1', 'el movimiento registra antes/después de la variante');
select is((select estado_pago || ' ' || saldo_pendiente from public.ventas where id = (select v from pg_temp.ctx where k = 'venta2')), 'parcial 998.00', 'venta parcial con saldo pendiente');

-- ── Abonos ─────────────────────────────────────────────────────────────────
select throws_ok(
  format($$ select public.registrar_abono(%L, %L, 999, 'efectivo', gen_random_uuid()) $$,
         (select v from pg_temp.ctx where k = 'biz_a'), (select v from pg_temp.ctx where k = 'venta2')),
  '23514', null, 'el abono no puede superar el saldo');
select throws_ok(
  format($$ select public.registrar_abono(%L, %L, 0, 'efectivo', gen_random_uuid()) $$,
         (select v from pg_temp.ctx where k = 'biz_a'), (select v from pg_temp.ctx where k = 'venta2')),
  '22023', null, 'el abono debe ser mayor a cero');
insert into pg_temp.ctx values ('k_abono', gen_random_uuid());
select is(public.registrar_abono((select v from pg_temp.ctx where k = 'biz_a'), (select v from pg_temp.ctx where k = 'venta2'), 500, 'efectivo', (select v from pg_temp.ctx where k = 'k_abono')) ->> 'saldo_pendiente',
          '498.00', 'el abono reduce el saldo');
select is((public.registrar_abono((select v from pg_temp.ctx where k = 'biz_a'), (select v from pg_temp.ctx where k = 'venta2'), 500, 'efectivo', (select v from pg_temp.ctx where k = 'k_abono')) ->> 'duplicado')::boolean,
          true, 'reintento de abono no se cobra dos veces');
select is(public.registrar_abono((select v from pg_temp.ctx where k = 'biz_a'), (select v from pg_temp.ctx where k = 'venta2'), 498, 'transferencia', gen_random_uuid()) ->> 'estado_pago',
          'pagada', 'al liquidar el saldo la venta pasa a pagada');

-- Quitar un pago por error recalcula la venta
select lives_ok(
  format($$ select public.eliminar_pago_venta(%L, (select id from public.venta_pagos where venta_id = %L and forma_pago = 'transferencia')) $$,
         (select v from pg_temp.ctx where k = 'biz_a'), (select v from pg_temp.ctx where k = 'venta2')),
  'se puede quitar un pago registrado por error');
select is((select estado_pago || ' ' || saldo_pendiente from public.ventas where id = (select v from pg_temp.ctx where k = 'venta2')), 'parcial 498.00', 'quitar el pago recalcula saldo y estado');

-- ── Cancelación ────────────────────────────────────────────────────────────
select throws_ok(
  format($$ select public.cancelar_venta(%L, %L, '') $$, (select v from pg_temp.ctx where k = 'biz_a'), (select v from pg_temp.ctx where k = 'venta2')),
  '22023', null, 'cancelar exige motivo');
select lives_ok(
  format($$ select public.cancelar_venta(%L, %L, 'El cliente devolvió la prenda') $$, (select v from pg_temp.ctx where k = 'biz_a'), (select v from pg_temp.ctx where k = 'venta2')),
  'cancelar una venta activa');
select is((select stock from public.producto_variantes where id = (select v from pg_temp.ctx where k = 'j28')), 3, 'cancelar devuelve el stock a la variante');
select is((select count(*)::int from public.movimientos_stock where referencia_id = (select v from pg_temp.ctx where k = 'venta2') and tipo = 'cancelacion'), 1, 'la devolución de stock deja movimiento de cancelación');
select is((select monto from public.transacciones where venta_id = (select v from pg_temp.ctx where k = 'venta2') and origen = 'devolucion' and tipo = 'gasto'), 1300.00::numeric, 'se registra la devolución de lo cobrado en finanzas');
select throws_ok(
  format($$ select public.cancelar_venta(%L, %L, 'otra vez') $$, (select v from pg_temp.ctx where k = 'biz_a'), (select v from pg_temp.ctx where k = 'venta2')),
  '23514', null, 'no se puede cancelar dos veces');
select throws_ok(
  format($$ select public.registrar_abono(%L, %L, 10, 'efectivo', gen_random_uuid()) $$, (select v from pg_temp.ctx where k = 'biz_a'), (select v from pg_temp.ctx where k = 'venta2')),
  '23514', null, 'una venta cancelada no admite abonos');

-- ── Finanzas manuales ──────────────────────────────────────────────────────
delete from public.transacciones where venta_id = (select v from pg_temp.ctx where k = 'venta1');
select is((select count(*)::int from public.transacciones where venta_id = (select v from pg_temp.ctx where k = 'venta1')), 1,
          'las transacciones automáticas no se pueden borrar directamente');
select lives_ok(
  format($$ insert into public.transacciones (business_id, fecha, concepto, categoria_id, monto, tipo, forma_pago) values (%L, current_date, 'Pago de luz', (select id from public.categorias where nombre = 'Renta y servicios'), 1240, 'gasto', 'transferencia') $$,
         (select v from pg_temp.ctx where k = 'biz_a')),
  'una transacción manual sí se puede capturar');
select throws_ok(
  format($$ insert into public.transacciones (business_id, fecha, concepto, monto, tipo, origen) values (%L, current_date, 'Falsa', 99, 'ingreso', 'venta') $$,
         (select v from pg_temp.ctx where k = 'biz_a')),
  '42501', null, 'no se pueden fabricar transacciones automáticas');

-- ── Aislamiento entre negocios ─────────────────────────────────────────────
select pg_temp.como('00000000-0000-0000-0000-00000000000b');
select is((select count(*)::int from public.ventas), 0, 'B no ve las ventas de A');
select throws_ok(
  format($$ select public.registrar_venta(%L, '[{"producto_id":"%s","cantidad":1}]'::jsonb, '{"monto":249,"forma_pago":"efectivo"}'::jsonb, null, null, gen_random_uuid()) $$,
         (select v from pg_temp.ctx where k = 'biz_a'), (select v from pg_temp.ctx where k = 'playera')),
  '42501', null, 'B no puede vender en el negocio de A');
select throws_ok(
  format($$ select public.registrar_venta(%L, '[{"producto_id":"%s","cantidad":1}]'::jsonb, '{"monto":249,"forma_pago":"efectivo"}'::jsonb, null, null, gen_random_uuid()) $$,
         (select v from pg_temp.ctx where k = 'biz_b'), (select v from pg_temp.ctx where k = 'playera')),
  'P0002', null, 'B no puede vender productos de A desde su propio negocio');

-- anon: se verifica por privilegios. (Llamar como anon una función revocada
-- tumba la imagen local postgres:17.6.1.111 — bug del motor, ver reporte.)
reset role;
select is(
  (select count(*)::int from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname in ('crear_negocio', 'ajustar_stock', 'guardar_producto', 'cambiar_estatus_producto',
                       'registrar_venta', 'registrar_abono', 'cancelar_venta', 'eliminar_pago_venta')
     and has_function_privilege('anon', p.oid, 'execute')),
  0, 'anon no puede ejecutar ninguna función de negocio');
select is(
  (select count(*)::int from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname in ('crear_negocio', 'ajustar_stock', 'guardar_producto', 'cambiar_estatus_producto',
                       'registrar_venta', 'registrar_abono', 'cancelar_venta', 'eliminar_pago_venta')
     and has_function_privilege('authenticated', p.oid, 'execute')),
  8, 'authenticated sí puede ejecutar las 8 funciones');
select ok(not has_table_privilege('anon', 'public.ventas', 'select'), 'anon no puede leer ventas');

select * from finish();
rollback;

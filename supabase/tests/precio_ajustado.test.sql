-- Pruebas de precio ajustado y artículos sin registrar. Ejecutar: supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

insert into auth.users (id, email, aud, role, raw_user_meta_data)
values ('00000000-0000-0000-0000-0000000000c1', 'c@test.mx', 'authenticated', 'authenticated', '{"nombre":"Caro"}');

create or replace function pg_temp.como(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end $$;

create table pg_temp.ctx (k text primary key, v uuid);
grant all on pg_temp.ctx to authenticated;

select pg_temp.como('00000000-0000-0000-0000-0000000000c1');
insert into pg_temp.ctx values ('biz', public.crear_negocio('Boutique C'));
insert into pg_temp.ctx values ('cat', (select id from public.categorias where tipo = 'producto' limit 1));
insert into pg_temp.ctx values ('playera', public.guardar_producto(
  (select v from pg_temp.ctx where k = 'biz'), null,
  jsonb_build_object('nombre', 'Playera Nube', 'categoria_id', (select v from pg_temp.ctx where k = 'cat'),
                     'precio_venta', 249, 'precio_costo', 100, 'stock_inicial', 5)));

-- ── Precio ajustado ─────────────────────────────────────────────────────────
select throws_ok(
  format($$ select public.registrar_venta(%L, '[{"producto_id":"%s","cantidad":1,"precio":199}]'::jsonb, '{"monto":199,"forma_pago":"efectivo"}'::jsonb, null, null, gen_random_uuid()) $$,
         (select v from pg_temp.ctx where k = 'biz'), (select v from pg_temp.ctx where k = 'playera')),
  '22023', null, 'cambiar el precio exige motivo');

insert into pg_temp.ctx values ('v1', (public.registrar_venta(
  (select v from pg_temp.ctx where k = 'biz'),
  jsonb_build_array(jsonb_build_object('producto_id', (select v from pg_temp.ctx where k = 'playera'), 'cantidad', 2,
                                       'precio', 199, 'nota_precio', 'Buen Fin')),
  '{"monto":398,"forma_pago":"efectivo"}'::jsonb, null, null, gen_random_uuid()) ->> 'venta_id')::uuid);

select is((select total from public.ventas where id = (select v from pg_temp.ctx where k = 'v1')), 398.00::numeric, 'el total usa el precio ajustado');
select is((select precio_unitario || '|' || precio_lista || '|' || nota_precio from public.venta_lineas where venta_id = (select v from pg_temp.ctx where k = 'v1')),
          '199.00|249.00|Buen Fin', 'la línea guarda precio cobrado, precio de lista y motivo');
select is((select stock from public.productos where id = (select v from pg_temp.ctx where k = 'playera')), 3, 'con precio ajustado sí descuenta stock');

insert into pg_temp.ctx values ('v2', (public.registrar_venta(
  (select v from pg_temp.ctx where k = 'biz'),
  jsonb_build_array(jsonb_build_object('producto_id', (select v from pg_temp.ctx where k = 'playera'), 'cantidad', 1,
                                       'precio', 249, 'nota_precio', 'igual')),
  '{"monto":249,"forma_pago":"efectivo"}'::jsonb, null, null, gen_random_uuid()) ->> 'venta_id')::uuid);
select ok((select precio_lista is null and nota_precio is null from public.venta_lineas where venta_id = (select v from pg_temp.ctx where k = 'v2')),
          'si el precio es el de catálogo no se marca como ajuste');

select throws_ok(
  format($$ select public.registrar_venta(%L, '[{"producto_id":"%s","cantidad":1,"precio":-5,"nota_precio":"mal"}]'::jsonb, null, '{"nombre":"Ana"}'::jsonb, null, gen_random_uuid()) $$,
         (select v from pg_temp.ctx where k = 'biz'), (select v from pg_temp.ctx where k = 'playera')),
  '22023', null, 'precio negativo se rechaza');

-- ── Artículos sin registrar ─────────────────────────────────────────────────
insert into pg_temp.ctx values ('v3', (public.registrar_venta(
  (select v from pg_temp.ctx where k = 'biz'),
  jsonb_build_array(
    jsonb_build_object('producto_id', (select v from pg_temp.ctx where k = 'playera'), 'cantidad', 1),
    jsonb_build_object('tipo', 'libre', 'descripcion', 'Playera negra sobrecargo', 'cantidad', 2, 'precio', 150)),
  '{"monto":549,"forma_pago":"tarjeta"}'::jsonb, null, null, gen_random_uuid()) ->> 'venta_id')::uuid);

select is((select total from public.ventas where id = (select v from pg_temp.ctx where k = 'v3')), 549.00::numeric, 'el total suma inventario + artículos libres');
select is((select count(*)::int from public.venta_lineas where venta_id = (select v from pg_temp.ctx where k = 'v3') and tipo = 'libre' and producto_id is null),
          1, 'el artículo libre queda como línea sin producto');
select is((select stock from public.productos where id = (select v from pg_temp.ctx where k = 'playera')), 1, 'el artículo libre no toca inventario');
select is((select cantidad from public.transacciones where venta_id = (select v from pg_temp.ctx where k = 'v3') and origen = 'venta'), 3, 'las piezas del ingreso incluyen los artículos libres');

insert into pg_temp.ctx values ('v4', (public.registrar_venta(
  (select v from pg_temp.ctx where k = 'biz'),
  '[{"tipo":"libre","descripcion":"Sudadera sobrecargo","cantidad":1,"precio":300}]'::jsonb,
  '{"monto":300,"forma_pago":"efectivo"}'::jsonb, null, null, gen_random_uuid()) ->> 'venta_id')::uuid);
select is((select total from public.ventas where id = (select v from pg_temp.ctx where k = 'v4')), 300.00::numeric, 'una venta puede tener solo artículos libres');

select throws_ok(
  format($$ select public.registrar_venta(%L, '[{"tipo":"libre","descripcion":"x","cantidad":1,"precio":100}]'::jsonb, '{"monto":100,"forma_pago":"efectivo"}'::jsonb, null, null, gen_random_uuid()) $$,
         (select v from pg_temp.ctx where k = 'biz')),
  '22023', null, 'artículo libre exige descripción');
select throws_ok(
  format($$ select public.registrar_venta(%L, '[{"tipo":"libre","descripcion":"Gorra","cantidad":1}]'::jsonb, null, '{"nombre":"Ana"}'::jsonb, null, gen_random_uuid()) $$,
         (select v from pg_temp.ctx where k = 'biz')),
  '22023', null, 'artículo libre exige precio');

-- Cancelar una venta con artículos libres solo devuelve el stock del inventario.
select public.cancelar_venta((select v from pg_temp.ctx where k = 'biz'), (select v from pg_temp.ctx where k = 'v3'), 'Prueba');
select is((select stock from public.productos where id = (select v from pg_temp.ctx where k = 'playera')), 2, 'cancelar devuelve solo el stock de inventario');

select * from finish();
rollback;




SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."assert_product_category_business"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."assert_product_category_business"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."assert_sale_line_business"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."assert_sale_line_business"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."assert_sale_payment_business"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."assert_sale_payment_business"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."assert_stock_movement_business"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."assert_stock_movement_business"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."assert_transaction_business"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."assert_transaction_business"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."assert_variant_product_business"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."assert_variant_product_business"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."bootstrap_business_defaults"("target_business_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."bootstrap_business_defaults"("target_business_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_initial_stock_movement"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if new.stock > 0 then
    insert into public.movimientos_stock (
      producto_id,
      user_id,
      tipo,
      cantidad,
      stock_antes,
      stock_despues,
      notas
    )
    values (
      new.id,
      new.user_id,
      'entrada',
      new.stock,
      0,
      new.stock,
      'Stock inicial'
    );
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."create_initial_stock_movement"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_business_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select membership.business_id
  from public.business_memberships membership
  where membership.user_id = auth.uid()
    and membership.status = 'active'
  order by membership.created_at asc
  limit 1;
$$;


ALTER FUNCTION "public"."current_business_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_auth_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.perfiles (id, nombre)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'nombre', new.raw_user_meta_data ->> 'name')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_auth_user error: %', SQLERRM;
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_auth_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_business_admin"("target_business_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.business_memberships membership
    where membership.business_id = target_business_id
      and membership.user_id = auth.uid()
      and membership.role = 'admin'
      and membership.status = 'active'
  );
$$;


ALTER FUNCTION "public"."is_business_admin"("target_business_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_business_member"("target_business_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.business_memberships membership
    where membership.business_id = target_business_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
  );
$$;


ALTER FUNCTION "public"."is_business_member"("target_business_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."next_venta_folio"("target_business_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
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
$_$;


ALTER FUNCTION "public"."next_venta_folio"("target_business_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."business_memberships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'admin'::"text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "invited_by" "uuid",
    "joined_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "business_memberships_role_check" CHECK (("role" = 'admin'::"text")),
    CONSTRAINT "business_memberships_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'invited'::"text", 'disabled'::"text"])))
);


ALTER TABLE "public"."business_memberships" OWNER TO "postgres";


COMMENT ON TABLE "public"."business_memberships" IS 'Users allowed to operate a business. Current app scope supports only admin members.';



CREATE TABLE IF NOT EXISTS "public"."businesses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "businesses_name_check" CHECK (("char_length"(TRIM(BOTH FROM "name")) >= 2))
);


ALTER TABLE "public"."businesses" OWNER TO "postgres";


COMMENT ON TABLE "public"."businesses" IS 'Shared business workspace. All app data should belong to one business, not a single user.';



CREATE TABLE IF NOT EXISTS "public"."categorias" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" DEFAULT "public"."current_business_id"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "nombre" "text" NOT NULL,
    "tipo" "text" NOT NULL,
    "icono" "text",
    "color" "text",
    "atributos_base" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "categorias_nombre_check" CHECK (("char_length"(TRIM(BOTH FROM "nombre")) >= 2)),
    CONSTRAINT "categorias_tipo_check" CHECK (("tipo" = ANY (ARRAY['producto'::"text", 'gasto'::"text", 'ingreso'::"text"])))
);


ALTER TABLE "public"."categorias" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."movimientos_stock" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" DEFAULT "public"."current_business_id"() NOT NULL,
    "producto_id" "uuid" NOT NULL,
    "variante_id" "uuid",
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "tipo" "text" NOT NULL,
    "cantidad" integer NOT NULL,
    "stock_antes" integer NOT NULL,
    "stock_despues" integer NOT NULL,
    "notas" "text",
    "referencia_tipo" "text",
    "referencia_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "movimientos_stock_cantidad_check" CHECK (("cantidad" > 0)),
    CONSTRAINT "movimientos_stock_stock_antes_check" CHECK (("stock_antes" >= 0)),
    CONSTRAINT "movimientos_stock_stock_despues_check" CHECK (("stock_despues" >= 0)),
    CONSTRAINT "movimientos_stock_tipo_check" CHECK (("tipo" = ANY (ARRAY['entrada'::"text", 'salida'::"text", 'ajuste'::"text", 'venta'::"text", 'cancelacion'::"text"])))
);


ALTER TABLE "public"."movimientos_stock" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."perfiles" (
    "id" "uuid" NOT NULL,
    "nombre" "text",
    "empresa" "text",
    "logo_url" "text",
    "plan" "text" DEFAULT 'free'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "perfiles_plan_check" CHECK (("plan" = ANY (ARRAY['free'::"text", 'pro'::"text", 'enterprise'::"text"])))
);


ALTER TABLE "public"."perfiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."producto_variantes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" DEFAULT "public"."current_business_id"() NOT NULL,
    "producto_id" "uuid" NOT NULL,
    "nombre" "text" NOT NULL,
    "sku" "text",
    "atributos" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "stock" integer DEFAULT 0 NOT NULL,
    "stock_minimo" integer DEFAULT 0 NOT NULL,
    "estatus" "text" DEFAULT 'disponible'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "producto_variantes_estatus_check" CHECK (("estatus" = ANY (ARRAY['disponible'::"text", 'pausado'::"text", 'agotado'::"text"]))),
    CONSTRAINT "producto_variantes_nombre_check" CHECK (("char_length"(TRIM(BOTH FROM "nombre")) >= 1)),
    CONSTRAINT "producto_variantes_stock_check" CHECK (("stock" >= 0)),
    CONSTRAINT "producto_variantes_stock_minimo_check" CHECK (("stock_minimo" >= 0))
);


ALTER TABLE "public"."producto_variantes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."productos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" DEFAULT "public"."current_business_id"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "nombre" "text" NOT NULL,
    "descripcion" "text",
    "categoria_id" "uuid",
    "precio_venta" numeric(12,2) NOT NULL,
    "precio_costo" numeric(12,2) DEFAULT 0 NOT NULL,
    "stock" integer DEFAULT 0 NOT NULL,
    "stock_minimo" integer DEFAULT 0 NOT NULL,
    "imagen_url" "text",
    "estatus" "text" DEFAULT 'disponible'::"text" NOT NULL,
    "sku" "text",
    "atributos" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "productos_estatus_check" CHECK (("estatus" = ANY (ARRAY['disponible'::"text", 'pausado'::"text", 'agotado'::"text"]))),
    CONSTRAINT "productos_nombre_check" CHECK (("char_length"(TRIM(BOTH FROM "nombre")) >= 2)),
    CONSTRAINT "productos_precio_costo_check" CHECK (("precio_costo" >= (0)::numeric)),
    CONSTRAINT "productos_precio_venta_check" CHECK (("precio_venta" > (0)::numeric)),
    CONSTRAINT "productos_stock_check" CHECK (("stock" >= 0)),
    CONSTRAINT "productos_stock_minimo_check" CHECK (("stock_minimo" >= 0))
);


ALTER TABLE "public"."productos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transacciones" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" DEFAULT "public"."current_business_id"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "fecha" "date" DEFAULT CURRENT_DATE NOT NULL,
    "concepto" "text" NOT NULL,
    "categoria_id" "uuid",
    "cantidad" integer DEFAULT 1 NOT NULL,
    "forma_pago" "text",
    "monto" numeric(12,2) NOT NULL,
    "tipo" "text" NOT NULL,
    "producto_id" "uuid",
    "venta_id" "uuid",
    "venta_pago_id" "uuid",
    "notas" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "transacciones_cantidad_check" CHECK (("cantidad" > 0)),
    CONSTRAINT "transacciones_concepto_check" CHECK (("char_length"(TRIM(BOTH FROM "concepto")) >= 2)),
    CONSTRAINT "transacciones_forma_pago_check" CHECK (("forma_pago" = ANY (ARRAY['efectivo'::"text", 'transferencia'::"text", 'adeudo'::"text", 'tarjeta'::"text"]))),
    CONSTRAINT "transacciones_monto_check" CHECK (("monto" > (0)::numeric)),
    CONSTRAINT "transacciones_tipo_check" CHECK (("tipo" = ANY (ARRAY['ingreso'::"text", 'gasto'::"text", 'transferencia'::"text"])))
);


ALTER TABLE "public"."transacciones" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."venta_lineas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" DEFAULT "public"."current_business_id"() NOT NULL,
    "venta_id" "uuid" NOT NULL,
    "producto_id" "uuid" NOT NULL,
    "variante_id" "uuid",
    "producto_nombre" "text" NOT NULL,
    "variante_nombre" "text",
    "cantidad" integer NOT NULL,
    "precio_unitario" numeric(12,2) NOT NULL,
    "subtotal" numeric(12,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "venta_lineas_cantidad_check" CHECK (("cantidad" > 0)),
    CONSTRAINT "venta_lineas_precio_unitario_check" CHECK (("precio_unitario" >= (0)::numeric)),
    CONSTRAINT "venta_lineas_subtotal_check" CHECK (("subtotal" >= (0)::numeric))
);


ALTER TABLE "public"."venta_lineas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."venta_pagos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" DEFAULT "public"."current_business_id"() NOT NULL,
    "venta_id" "uuid" NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "monto" numeric(12,2) NOT NULL,
    "forma_pago" "text" NOT NULL,
    "notas" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "venta_pagos_forma_pago_check" CHECK (("forma_pago" = ANY (ARRAY['efectivo'::"text", 'transferencia'::"text", 'tarjeta'::"text"]))),
    CONSTRAINT "venta_pagos_monto_check" CHECK (("monto" > (0)::numeric))
);


ALTER TABLE "public"."venta_pagos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ventas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" DEFAULT "public"."current_business_id"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "folio" "text" NOT NULL,
    "fecha" "date" DEFAULT CURRENT_DATE NOT NULL,
    "hora" time without time zone DEFAULT LOCALTIME(0) NOT NULL,
    "subtotal" numeric(12,2) DEFAULT 0 NOT NULL,
    "descuento" numeric(12,2) DEFAULT 0 NOT NULL,
    "total" numeric(12,2) NOT NULL,
    "monto_pagado" numeric(12,2) DEFAULT 0 NOT NULL,
    "saldo_pendiente" numeric(12,2) DEFAULT 0 NOT NULL,
    "forma_pago_inicial" "text",
    "estado_pago" "text" DEFAULT 'pendiente'::"text" NOT NULL,
    "estatus" "text" DEFAULT 'activa'::"text" NOT NULL,
    "cliente_nombre" "text",
    "cliente_telefono" "text",
    "notas" "text",
    "cancelada_at" timestamp with time zone,
    "cancelada_por" "uuid",
    "motivo_cancelacion" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ventas_cancelacion_consistente" CHECK (((("estatus" = 'activa'::"text") AND ("cancelada_at" IS NULL) AND ("cancelada_por" IS NULL)) OR (("estatus" = 'cancelada'::"text") AND ("cancelada_at" IS NOT NULL) AND ("motivo_cancelacion" IS NOT NULL)))),
    CONSTRAINT "ventas_descuento_check" CHECK (("descuento" >= (0)::numeric)),
    CONSTRAINT "ventas_estado_pago_check" CHECK (("estado_pago" = ANY (ARRAY['pagada'::"text", 'parcial'::"text", 'pendiente'::"text"]))),
    CONSTRAINT "ventas_estatus_check" CHECK (("estatus" = ANY (ARRAY['activa'::"text", 'cancelada'::"text"]))),
    CONSTRAINT "ventas_forma_pago_inicial_check" CHECK (("forma_pago_inicial" = ANY (ARRAY['efectivo'::"text", 'transferencia'::"text", 'adeudo'::"text", 'tarjeta'::"text"]))),
    CONSTRAINT "ventas_monto_pagado_check" CHECK (("monto_pagado" >= (0)::numeric)),
    CONSTRAINT "ventas_saldo_consistente" CHECK (("round"(("total" - "monto_pagado"), 2) = "round"(("saldo_pendiente")::numeric, 2))),
    CONSTRAINT "ventas_saldo_pendiente_check" CHECK (("saldo_pendiente" >= (0)::numeric)),
    CONSTRAINT "ventas_subtotal_check" CHECK (("subtotal" >= (0)::numeric)),
    CONSTRAINT "ventas_total_check" CHECK (("total" >= (0)::numeric))
);


ALTER TABLE "public"."ventas" OWNER TO "postgres";


ALTER TABLE ONLY "public"."business_memberships"
    ADD CONSTRAINT "business_memberships_business_id_user_id_key" UNIQUE ("business_id", "user_id");



ALTER TABLE ONLY "public"."business_memberships"
    ADD CONSTRAINT "business_memberships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."businesses"
    ADD CONSTRAINT "businesses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."businesses"
    ADD CONSTRAINT "businesses_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."categorias"
    ADD CONSTRAINT "categorias_business_id_tipo_nombre_key" UNIQUE ("business_id", "tipo", "nombre");



ALTER TABLE ONLY "public"."categorias"
    ADD CONSTRAINT "categorias_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."movimientos_stock"
    ADD CONSTRAINT "movimientos_stock_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."perfiles"
    ADD CONSTRAINT "perfiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."producto_variantes"
    ADD CONSTRAINT "producto_variantes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."producto_variantes"
    ADD CONSTRAINT "producto_variantes_producto_id_nombre_key" UNIQUE ("producto_id", "nombre");



ALTER TABLE ONLY "public"."productos"
    ADD CONSTRAINT "productos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transacciones"
    ADD CONSTRAINT "transacciones_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."venta_lineas"
    ADD CONSTRAINT "venta_lineas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."venta_pagos"
    ADD CONSTRAINT "venta_pagos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ventas"
    ADD CONSTRAINT "ventas_business_id_folio_key" UNIQUE ("business_id", "folio");



ALTER TABLE ONLY "public"."ventas"
    ADD CONSTRAINT "ventas_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_business_memberships_business_id" ON "public"."business_memberships" USING "btree" ("business_id");



CREATE INDEX "idx_business_memberships_user_id" ON "public"."business_memberships" USING "btree" ("user_id");



CREATE INDEX "idx_categorias_business_tipo" ON "public"."categorias" USING "btree" ("business_id", "tipo");



CREATE INDEX "idx_movimientos_stock_business_producto" ON "public"."movimientos_stock" USING "btree" ("business_id", "producto_id", "created_at" DESC);



CREATE INDEX "idx_movimientos_stock_business_variante" ON "public"."movimientos_stock" USING "btree" ("business_id", "variante_id", "created_at" DESC);



CREATE UNIQUE INDEX "idx_producto_variantes_business_sku_unique" ON "public"."producto_variantes" USING "btree" ("business_id", "sku") WHERE (("sku" IS NOT NULL) AND ("sku" <> ''::"text"));



CREATE INDEX "idx_producto_variantes_producto" ON "public"."producto_variantes" USING "btree" ("producto_id");



CREATE INDEX "idx_productos_business_categoria" ON "public"."productos" USING "btree" ("business_id", "categoria_id");



CREATE UNIQUE INDEX "idx_productos_business_sku_unique" ON "public"."productos" USING "btree" ("business_id", "sku") WHERE (("sku" IS NOT NULL) AND ("sku" <> ''::"text"));



CREATE INDEX "idx_transacciones_business_fecha" ON "public"."transacciones" USING "btree" ("business_id", "fecha" DESC, "created_at" DESC);



CREATE INDEX "idx_venta_lineas_venta" ON "public"."venta_lineas" USING "btree" ("venta_id");



CREATE INDEX "idx_venta_pagos_venta" ON "public"."venta_pagos" USING "btree" ("venta_id");



CREATE INDEX "idx_ventas_business_estado_pago" ON "public"."ventas" USING "btree" ("business_id", "estado_pago");



CREATE INDEX "idx_ventas_business_fecha" ON "public"."ventas" USING "btree" ("business_id", "fecha" DESC, "created_at" DESC);



CREATE OR REPLACE TRIGGER "businesses_set_updated_at" BEFORE UPDATE ON "public"."businesses" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "categorias_set_updated_at" BEFORE UPDATE ON "public"."categorias" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "movimientos_stock_assert_business" BEFORE INSERT OR UPDATE ON "public"."movimientos_stock" FOR EACH ROW EXECUTE FUNCTION "public"."assert_stock_movement_business"();



CREATE OR REPLACE TRIGGER "perfiles_set_updated_at" BEFORE UPDATE ON "public"."perfiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "producto_variantes_assert_business" BEFORE INSERT OR UPDATE ON "public"."producto_variantes" FOR EACH ROW EXECUTE FUNCTION "public"."assert_variant_product_business"();



CREATE OR REPLACE TRIGGER "producto_variantes_set_updated_at" BEFORE UPDATE ON "public"."producto_variantes" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "productos_assert_business" BEFORE INSERT OR UPDATE ON "public"."productos" FOR EACH ROW EXECUTE FUNCTION "public"."assert_product_category_business"();



CREATE OR REPLACE TRIGGER "productos_set_updated_at" BEFORE UPDATE ON "public"."productos" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "transacciones_assert_business" BEFORE INSERT OR UPDATE ON "public"."transacciones" FOR EACH ROW EXECUTE FUNCTION "public"."assert_transaction_business"();



CREATE OR REPLACE TRIGGER "venta_lineas_assert_business" BEFORE INSERT OR UPDATE ON "public"."venta_lineas" FOR EACH ROW EXECUTE FUNCTION "public"."assert_sale_line_business"();



CREATE OR REPLACE TRIGGER "venta_pagos_assert_business" BEFORE INSERT OR UPDATE ON "public"."venta_pagos" FOR EACH ROW EXECUTE FUNCTION "public"."assert_sale_payment_business"();



CREATE OR REPLACE TRIGGER "ventas_set_updated_at" BEFORE UPDATE ON "public"."ventas" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."business_memberships"
    ADD CONSTRAINT "business_memberships_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."business_memberships"
    ADD CONSTRAINT "business_memberships_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."business_memberships"
    ADD CONSTRAINT "business_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."businesses"
    ADD CONSTRAINT "businesses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."categorias"
    ADD CONSTRAINT "categorias_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."categorias"
    ADD CONSTRAINT "categorias_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."movimientos_stock"
    ADD CONSTRAINT "movimientos_stock_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."movimientos_stock"
    ADD CONSTRAINT "movimientos_stock_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."movimientos_stock"
    ADD CONSTRAINT "movimientos_stock_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."movimientos_stock"
    ADD CONSTRAINT "movimientos_stock_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "public"."producto_variantes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."perfiles"
    ADD CONSTRAINT "perfiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."producto_variantes"
    ADD CONSTRAINT "producto_variantes_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."producto_variantes"
    ADD CONSTRAINT "producto_variantes_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."productos"
    ADD CONSTRAINT "productos_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."productos"
    ADD CONSTRAINT "productos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."productos"
    ADD CONSTRAINT "productos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."transacciones"
    ADD CONSTRAINT "transacciones_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transacciones"
    ADD CONSTRAINT "transacciones_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transacciones"
    ADD CONSTRAINT "transacciones_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transacciones"
    ADD CONSTRAINT "transacciones_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."transacciones"
    ADD CONSTRAINT "transacciones_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "public"."ventas"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transacciones"
    ADD CONSTRAINT "transacciones_venta_pago_id_fkey" FOREIGN KEY ("venta_pago_id") REFERENCES "public"."venta_pagos"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."venta_lineas"
    ADD CONSTRAINT "venta_lineas_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."venta_lineas"
    ADD CONSTRAINT "venta_lineas_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."venta_lineas"
    ADD CONSTRAINT "venta_lineas_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "public"."producto_variantes"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."venta_lineas"
    ADD CONSTRAINT "venta_lineas_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "public"."ventas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."venta_pagos"
    ADD CONSTRAINT "venta_pagos_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."venta_pagos"
    ADD CONSTRAINT "venta_pagos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."venta_pagos"
    ADD CONSTRAINT "venta_pagos_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "public"."ventas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ventas"
    ADD CONSTRAINT "ventas_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ventas"
    ADD CONSTRAINT "ventas_cancelada_por_fkey" FOREIGN KEY ("cancelada_por") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ventas"
    ADD CONSTRAINT "ventas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE "public"."business_memberships" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "business_memberships_insert_admin" ON "public"."business_memberships" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_business_admin"("business_id"));



CREATE POLICY "business_memberships_select_member" ON "public"."business_memberships" FOR SELECT TO "authenticated" USING ("public"."is_business_member"("business_id"));



CREATE POLICY "business_memberships_update_admin" ON "public"."business_memberships" FOR UPDATE TO "authenticated" USING ("public"."is_business_admin"("business_id")) WITH CHECK ("public"."is_business_admin"("business_id"));



ALTER TABLE "public"."businesses" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "businesses_insert_creator" ON "public"."businesses" FOR INSERT TO "authenticated" WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "businesses_select_member" ON "public"."businesses" FOR SELECT TO "authenticated" USING ("public"."is_business_member"("id"));



CREATE POLICY "businesses_update_admin" ON "public"."businesses" FOR UPDATE TO "authenticated" USING ("public"."is_business_admin"("id")) WITH CHECK ("public"."is_business_admin"("id"));



ALTER TABLE "public"."categorias" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "categorias_business_delete" ON "public"."categorias" FOR DELETE TO "authenticated" USING ("public"."is_business_admin"("business_id"));



CREATE POLICY "categorias_business_insert" ON "public"."categorias" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_business_admin"("business_id"));



CREATE POLICY "categorias_business_select" ON "public"."categorias" FOR SELECT TO "authenticated" USING ("public"."is_business_member"("business_id"));



CREATE POLICY "categorias_business_update" ON "public"."categorias" FOR UPDATE TO "authenticated" USING ("public"."is_business_admin"("business_id")) WITH CHECK ("public"."is_business_admin"("business_id"));



ALTER TABLE "public"."movimientos_stock" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "movimientos_stock_business_delete" ON "public"."movimientos_stock" FOR DELETE TO "authenticated" USING ("public"."is_business_admin"("business_id"));



CREATE POLICY "movimientos_stock_business_insert" ON "public"."movimientos_stock" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_business_admin"("business_id"));



CREATE POLICY "movimientos_stock_business_select" ON "public"."movimientos_stock" FOR SELECT TO "authenticated" USING ("public"."is_business_member"("business_id"));



CREATE POLICY "movimientos_stock_business_update" ON "public"."movimientos_stock" FOR UPDATE TO "authenticated" USING ("public"."is_business_admin"("business_id")) WITH CHECK ("public"."is_business_admin"("business_id"));



ALTER TABLE "public"."perfiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "perfiles_insert_own" ON "public"."perfiles" FOR INSERT TO "authenticated" WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "perfiles_select_own" ON "public"."perfiles" FOR SELECT TO "authenticated" USING (("id" = "auth"."uid"()));



CREATE POLICY "perfiles_update_own" ON "public"."perfiles" FOR UPDATE TO "authenticated" USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



ALTER TABLE "public"."producto_variantes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "producto_variantes_business_delete" ON "public"."producto_variantes" FOR DELETE TO "authenticated" USING ("public"."is_business_admin"("business_id"));



CREATE POLICY "producto_variantes_business_insert" ON "public"."producto_variantes" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_business_admin"("business_id"));



CREATE POLICY "producto_variantes_business_select" ON "public"."producto_variantes" FOR SELECT TO "authenticated" USING ("public"."is_business_member"("business_id"));



CREATE POLICY "producto_variantes_business_update" ON "public"."producto_variantes" FOR UPDATE TO "authenticated" USING ("public"."is_business_admin"("business_id")) WITH CHECK ("public"."is_business_admin"("business_id"));



ALTER TABLE "public"."productos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "productos_business_delete" ON "public"."productos" FOR DELETE TO "authenticated" USING ("public"."is_business_admin"("business_id"));



CREATE POLICY "productos_business_insert" ON "public"."productos" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_business_admin"("business_id"));



CREATE POLICY "productos_business_select" ON "public"."productos" FOR SELECT TO "authenticated" USING ("public"."is_business_member"("business_id"));



CREATE POLICY "productos_business_update" ON "public"."productos" FOR UPDATE TO "authenticated" USING ("public"."is_business_admin"("business_id")) WITH CHECK ("public"."is_business_admin"("business_id"));



ALTER TABLE "public"."transacciones" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "transacciones_business_delete" ON "public"."transacciones" FOR DELETE TO "authenticated" USING ("public"."is_business_admin"("business_id"));



CREATE POLICY "transacciones_business_insert" ON "public"."transacciones" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_business_admin"("business_id"));



CREATE POLICY "transacciones_business_select" ON "public"."transacciones" FOR SELECT TO "authenticated" USING ("public"."is_business_member"("business_id"));



CREATE POLICY "transacciones_business_update" ON "public"."transacciones" FOR UPDATE TO "authenticated" USING ("public"."is_business_admin"("business_id")) WITH CHECK ("public"."is_business_admin"("business_id"));



ALTER TABLE "public"."venta_lineas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "venta_lineas_business_delete" ON "public"."venta_lineas" FOR DELETE TO "authenticated" USING ("public"."is_business_admin"("business_id"));



CREATE POLICY "venta_lineas_business_insert" ON "public"."venta_lineas" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_business_admin"("business_id"));



CREATE POLICY "venta_lineas_business_select" ON "public"."venta_lineas" FOR SELECT TO "authenticated" USING ("public"."is_business_member"("business_id"));



CREATE POLICY "venta_lineas_business_update" ON "public"."venta_lineas" FOR UPDATE TO "authenticated" USING ("public"."is_business_admin"("business_id")) WITH CHECK ("public"."is_business_admin"("business_id"));



ALTER TABLE "public"."venta_pagos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "venta_pagos_business_delete" ON "public"."venta_pagos" FOR DELETE TO "authenticated" USING ("public"."is_business_admin"("business_id"));



CREATE POLICY "venta_pagos_business_insert" ON "public"."venta_pagos" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_business_admin"("business_id"));



CREATE POLICY "venta_pagos_business_select" ON "public"."venta_pagos" FOR SELECT TO "authenticated" USING ("public"."is_business_member"("business_id"));



CREATE POLICY "venta_pagos_business_update" ON "public"."venta_pagos" FOR UPDATE TO "authenticated" USING ("public"."is_business_admin"("business_id")) WITH CHECK ("public"."is_business_admin"("business_id"));



ALTER TABLE "public"."ventas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ventas_business_delete" ON "public"."ventas" FOR DELETE TO "authenticated" USING ("public"."is_business_admin"("business_id"));



CREATE POLICY "ventas_business_insert" ON "public"."ventas" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_business_admin"("business_id"));



CREATE POLICY "ventas_business_select" ON "public"."ventas" FOR SELECT TO "authenticated" USING ("public"."is_business_member"("business_id"));



CREATE POLICY "ventas_business_update" ON "public"."ventas" FOR UPDATE TO "authenticated" USING ("public"."is_business_admin"("business_id")) WITH CHECK ("public"."is_business_admin"("business_id"));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."assert_product_category_business"() TO "anon";
GRANT ALL ON FUNCTION "public"."assert_product_category_business"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."assert_product_category_business"() TO "service_role";



GRANT ALL ON FUNCTION "public"."assert_sale_line_business"() TO "anon";
GRANT ALL ON FUNCTION "public"."assert_sale_line_business"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."assert_sale_line_business"() TO "service_role";



GRANT ALL ON FUNCTION "public"."assert_sale_payment_business"() TO "anon";
GRANT ALL ON FUNCTION "public"."assert_sale_payment_business"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."assert_sale_payment_business"() TO "service_role";



GRANT ALL ON FUNCTION "public"."assert_stock_movement_business"() TO "anon";
GRANT ALL ON FUNCTION "public"."assert_stock_movement_business"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."assert_stock_movement_business"() TO "service_role";



GRANT ALL ON FUNCTION "public"."assert_transaction_business"() TO "anon";
GRANT ALL ON FUNCTION "public"."assert_transaction_business"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."assert_transaction_business"() TO "service_role";



GRANT ALL ON FUNCTION "public"."assert_variant_product_business"() TO "anon";
GRANT ALL ON FUNCTION "public"."assert_variant_product_business"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."assert_variant_product_business"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."bootstrap_business_defaults"("target_business_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."bootstrap_business_defaults"("target_business_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."bootstrap_business_defaults"("target_business_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."bootstrap_business_defaults"("target_business_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_initial_stock_movement"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_initial_stock_movement"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_initial_stock_movement"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."current_business_id"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."current_business_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_business_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_business_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_auth_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_auth_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_auth_user"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_business_admin"("target_business_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_business_admin"("target_business_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_business_admin"("target_business_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_business_admin"("target_business_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_business_member"("target_business_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_business_member"("target_business_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_business_member"("target_business_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_business_member"("target_business_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."next_venta_folio"("target_business_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."next_venta_folio"("target_business_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."next_venta_folio"("target_business_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."next_venta_folio"("target_business_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."business_memberships" TO "anon";
GRANT ALL ON TABLE "public"."business_memberships" TO "authenticated";
GRANT ALL ON TABLE "public"."business_memberships" TO "service_role";



GRANT ALL ON TABLE "public"."businesses" TO "anon";
GRANT ALL ON TABLE "public"."businesses" TO "authenticated";
GRANT ALL ON TABLE "public"."businesses" TO "service_role";



GRANT ALL ON TABLE "public"."categorias" TO "anon";
GRANT ALL ON TABLE "public"."categorias" TO "authenticated";
GRANT ALL ON TABLE "public"."categorias" TO "service_role";



GRANT ALL ON TABLE "public"."movimientos_stock" TO "anon";
GRANT ALL ON TABLE "public"."movimientos_stock" TO "authenticated";
GRANT ALL ON TABLE "public"."movimientos_stock" TO "service_role";



GRANT ALL ON TABLE "public"."perfiles" TO "anon";
GRANT ALL ON TABLE "public"."perfiles" TO "authenticated";
GRANT ALL ON TABLE "public"."perfiles" TO "service_role";



GRANT ALL ON TABLE "public"."producto_variantes" TO "anon";
GRANT ALL ON TABLE "public"."producto_variantes" TO "authenticated";
GRANT ALL ON TABLE "public"."producto_variantes" TO "service_role";



GRANT ALL ON TABLE "public"."productos" TO "anon";
GRANT ALL ON TABLE "public"."productos" TO "authenticated";
GRANT ALL ON TABLE "public"."productos" TO "service_role";



GRANT ALL ON TABLE "public"."transacciones" TO "anon";
GRANT ALL ON TABLE "public"."transacciones" TO "authenticated";
GRANT ALL ON TABLE "public"."transacciones" TO "service_role";



GRANT ALL ON TABLE "public"."venta_lineas" TO "anon";
GRANT ALL ON TABLE "public"."venta_lineas" TO "authenticated";
GRANT ALL ON TABLE "public"."venta_lineas" TO "service_role";



GRANT ALL ON TABLE "public"."venta_pagos" TO "anon";
GRANT ALL ON TABLE "public"."venta_pagos" TO "authenticated";
GRANT ALL ON TABLE "public"."venta_pagos" TO "service_role";



GRANT ALL ON TABLE "public"."ventas" TO "anon";
GRANT ALL ON TABLE "public"."ventas" TO "authenticated";
GRANT ALL ON TABLE "public"."ventas" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";




































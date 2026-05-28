-- Team/business shared ownership model for NexxuzApp.
-- Supabase remains the database/auth provider; business logic stays in Next.js.

create extension if not exists pgcrypto;

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) >= 2),
  slug text unique,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_memberships (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role = 'admin'),
  status text not null default 'active' check (status in ('active', 'invited', 'disabled')),
  invited_by uuid references auth.users(id) on delete set null,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  unique (business_id, user_id)
);

create index if not exists idx_business_memberships_user_id
  on public.business_memberships(user_id);

create index if not exists idx_business_memberships_business_id
  on public.business_memberships(business_id);

alter table if exists public.categorias
  add column if not exists business_id uuid references public.businesses(id) on delete cascade;

alter table if exists public.productos
  add column if not exists business_id uuid references public.businesses(id) on delete cascade;

alter table if exists public.movimientos_stock
  add column if not exists business_id uuid references public.businesses(id) on delete cascade;

alter table if exists public.transacciones
  add column if not exists business_id uuid references public.businesses(id) on delete cascade;

do $$
begin
  if to_regclass('public.categorias') is not null then
    create index if not exists idx_categorias_business_id
      on public.categorias(business_id);
  end if;

  if to_regclass('public.productos') is not null then
    create index if not exists idx_productos_business_id
      on public.productos(business_id);

    create unique index if not exists idx_productos_business_sku_unique
      on public.productos(business_id, sku)
      where sku is not null;
  end if;

  if to_regclass('public.movimientos_stock') is not null then
    create index if not exists idx_movimientos_stock_business_id
      on public.movimientos_stock(business_id);
  end if;

  if to_regclass('public.transacciones') is not null then
    create index if not exists idx_transacciones_business_id
      on public.transacciones(business_id);
  end if;
end $$;

create or replace function public.is_business_member(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_memberships membership
    where membership.business_id = target_business_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
  );
$$;

create or replace function public.is_business_admin(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_memberships membership
    where membership.business_id = target_business_id
      and membership.user_id = auth.uid()
      and membership.role = 'admin'
      and membership.status = 'active'
  );
$$;

revoke all on function public.is_business_member(uuid) from public;
revoke all on function public.is_business_admin(uuid) from public;
grant execute on function public.is_business_member(uuid) to authenticated;
grant execute on function public.is_business_admin(uuid) to authenticated;

alter table public.businesses enable row level security;
alter table public.business_memberships enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'businesses' and policyname = 'businesses_select_member'
  ) then
    create policy businesses_select_member
      on public.businesses
      for select
      to authenticated
      using (public.is_business_member(id));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'businesses' and policyname = 'businesses_insert_creator'
  ) then
    create policy businesses_insert_creator
      on public.businesses
      for insert
      to authenticated
      with check (created_by = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'businesses' and policyname = 'businesses_update_admin'
  ) then
    create policy businesses_update_admin
      on public.businesses
      for update
      to authenticated
      using (public.is_business_admin(id))
      with check (public.is_business_admin(id));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'business_memberships' and policyname = 'business_memberships_select_member'
  ) then
    create policy business_memberships_select_member
      on public.business_memberships
      for select
      to authenticated
      using (public.is_business_member(business_id));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'business_memberships' and policyname = 'business_memberships_insert_admin'
  ) then
    create policy business_memberships_insert_admin
      on public.business_memberships
      for insert
      to authenticated
      with check (public.is_business_admin(business_id));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'business_memberships' and policyname = 'business_memberships_update_admin'
  ) then
    create policy business_memberships_update_admin
      on public.business_memberships
      for update
      to authenticated
      using (public.is_business_admin(business_id))
      with check (public.is_business_admin(business_id));
  end if;
end $$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['categorias', 'productos', 'movimientos_stock', 'transacciones']
  loop
    if to_regclass(format('public.%I', table_name)) is not null then
      execute format('alter table public.%I enable row level security', table_name);

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
    end if;
  end loop;
end $$;

comment on table public.businesses is 'Shared business workspace. All app data should belong to one business, not a single user.';
comment on table public.business_memberships is 'Users allowed to operate a business. Current app scope supports only admin members.';

do $$
begin
  if to_regclass('public.categorias') is not null then
    comment on column public.categorias.business_id is 'Business owner. New code should use this instead of user_id for shared team data.';
  end if;

  if to_regclass('public.productos') is not null then
    comment on column public.productos.business_id is 'Business owner. New code should use this instead of user_id for shared team data.';
  end if;

  if to_regclass('public.movimientos_stock') is not null then
    comment on column public.movimientos_stock.business_id is 'Business owner. New code should use this instead of user_id for shared team data.';
  end if;

  if to_regclass('public.transacciones') is not null then
    comment on column public.transacciones.business_id is 'Business owner. New code should use this instead of user_id for shared team data.';
  end if;
end $$;

-- CRM North Creative Labs — Fase 1 (roles, perfiles, extensión de leads)
-- Requiere que supabase/schema.sql ya haya sido ejecutado.
-- Ejecutar una sola vez en el SQL Editor del proyecto Supabase.
-- NO vuelve a tocar las policies anon_insert_leads / anon_update_leads.

-- ── Enums ──────────────────────────────────────────────────────────────
create type public.staff_role as enum ('admin', 'ventas', 'disenador', 'client');

create type public.lead_status as enum (
    'nuevo',
    'contactado',
    'esperando_respuesta',
    'reunion',
    'cotizacion_enviada',
    'negociacion',
    'ganado',
    'perdido',
    'archivado'
);

-- ── Tabla profiles (un perfil por usuario de auth.users) ────────────────
create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text,
    role staff_role,
    active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create or replace function public.set_profiles_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated_at
    before update on public.profiles
    for each row
    execute function public.set_profiles_updated_at();

-- ── Autocreación de perfil al crear un usuario en auth.users ────────────
-- El role queda NULL hasta que un admin lo asigne manualmente (SQL Editor).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id, full_name)
    values (new.id, new.raw_user_meta_data ->> 'full_name')
    on conflict (id) do nothing;
    return new;
end;
$$;

create trigger trg_handle_new_user
    after insert on auth.users
    for each row
    execute function public.handle_new_user();

-- Backfill: usuarios de auth.users creados antes de este trigger
insert into public.profiles (id, full_name)
select id, raw_user_meta_data ->> 'full_name'
from auth.users
on conflict (id) do nothing;

-- ── Helper para políticas RLS (evita repetir subqueries y recursión) ───
create or replace function public.current_profile_role()
returns public.staff_role
language sql
stable
security definer
set search_path = public
as $$
    select role from public.profiles where id = auth.uid();
$$;

-- ── RLS en profiles: solo lectura, solo para staff activo por rol ───────
alter table public.profiles enable row level security;

create policy "staff_select_profiles"
    on public.profiles
    for select
    to authenticated
    using (public.current_profile_role() in ('admin', 'ventas', 'disenador'));

-- Sin policies de insert/update/delete: la fila la crea el trigger
-- (security definer, bypassa RLS). Editar role/active se hace por
-- SQL Editor en Fase 1 — evita que alguien se autoasigne 'admin' desde
-- la app, ya que admin y el resto comparten el mismo rol Postgres
-- "authenticated".

-- ── Extender leads con columnas de CRM ──────────────────────────────────
alter table public.leads
    add column estado public.lead_status not null default 'nuevo',
    add column assigned_to uuid references public.profiles(id) on delete set null,
    add column source text not null default 'web_form'
        check (source in ('web_form', 'referido', 'instagram', 'facebook', 'whatsapp', 'llamada', 'email', 'otro')),
    add column archived boolean not null default false;

create index idx_leads_estado on public.leads (estado);
create index idx_leads_assigned_to on public.leads (assigned_to);
create index idx_leads_archived on public.leads (archived);
create index idx_leads_created_at on public.leads (created_at desc);

-- ── Grants para authenticated en leads ──────────────────────────────────
-- schema.sql ya corrió "revoke all on public.leads from anon, authenticated",
-- así que authenticated hoy no tiene ningún privilegio aquí. Sin este
-- grant, las policies de abajo quedarían inertes.
grant select, insert, update, delete on public.leads to authenticated;

-- ── RLS en leads para authenticated (staff del CRM) ─────────────────────
-- IMPORTANTE: esto se suma a anon_insert_leads / anon_update_leads ya
-- existentes, NO las reemplaza ni las modifica.
create policy "staff_select_leads"
    on public.leads
    for select
    to authenticated
    using (public.current_profile_role() in ('admin', 'ventas', 'disenador'));

create policy "staff_insert_leads"
    on public.leads
    for insert
    to authenticated
    with check (public.current_profile_role() in ('admin', 'ventas'));

create policy "staff_update_leads"
    on public.leads
    for update
    to authenticated
    using (public.current_profile_role() in ('admin', 'ventas'))
    with check (public.current_profile_role() in ('admin', 'ventas'));

create policy "staff_delete_leads"
    on public.leads
    for delete
    to authenticated
    using (public.current_profile_role() = 'admin');

-- ── Paso manual post-migración (no es SQL) ──────────────────────────────
-- 1. Crear el primer usuario admin en Supabase Dashboard > Authentication > Users.
-- 2. Ejecutar: update public.profiles set role = 'admin' where id = '<uuid del usuario>';

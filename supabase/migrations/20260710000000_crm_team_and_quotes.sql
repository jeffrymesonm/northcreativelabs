-- CRM North Creative Labs — Equipo (crear usuarios) + cotizaciones con más campos
-- Requiere todas las migraciones anteriores.
-- Ejecutar una sola vez en el SQL Editor del proyecto Supabase.

-- ── profiles: guardar el email (evita depender de la Admin API solo para listar) ──
alter table public.profiles add column email text;

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id, full_name, email)
    values (new.id, new.raw_user_meta_data ->> 'full_name', new.email)
    on conflict (id) do nothing;
    return new;
end;
$$;

-- ── profiles: un admin puede cambiar role/active de cualquier perfil ──────
-- (crear el usuario en sí sigue requiriendo la Admin API vía Service Role,
-- ver actions/team.ts — esto solo habilita editar un perfil ya existente).
create policy "admin_update_profiles"
    on public.profiles for update
    to authenticated
    using (public.current_profile_role() = 'admin')
    with check (public.current_profile_role() = 'admin');

grant update (role, active, full_name) on public.profiles to authenticated;

-- ── quotes: descripción/notas y archivo PDF adjunto ───────────────────────
alter table public.quotes add column notes text;

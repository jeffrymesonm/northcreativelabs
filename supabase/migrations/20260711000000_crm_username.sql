-- CRM North Creative Labs — login por nombre de usuario en vez de email
-- Requiere todas las migraciones anteriores.
-- Ejecutar una sola vez en el SQL Editor del proyecto Supabase.

alter table public.profiles add column username text unique;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id, full_name, email, username)
    values (
        new.id,
        new.raw_user_meta_data ->> 'full_name',
        new.email,
        new.raw_user_meta_data ->> 'username'
    )
    on conflict (id) do nothing;
    return new;
end;
$$;

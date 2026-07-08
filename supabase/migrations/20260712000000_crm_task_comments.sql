-- CRM North Creative Labs — Comentarios en tareas de un lead
-- Requiere todas las migraciones anteriores.
-- Ejecutar una sola vez en el SQL Editor del proyecto Supabase.

-- ── lead_task_comments ───────────────────────────────────────────────────
create table public.lead_task_comments (
    id uuid primary key default gen_random_uuid(),
    task_id uuid not null references public.lead_tasks(id) on delete cascade,
    author_id uuid references public.profiles(id) on delete set null,
    body text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index idx_lead_task_comments_task_id on public.lead_task_comments (task_id);

create or replace function public.set_lead_task_comments_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger trg_lead_task_comments_updated_at
    before update on public.lead_task_comments
    for each row
    execute function public.set_lead_task_comments_updated_at();

alter table public.lead_task_comments enable row level security;
grant select, insert, update, delete on public.lead_task_comments to authenticated;

create policy "staff_select_lead_task_comments"
    on public.lead_task_comments for select
    to authenticated
    using (public.current_profile_role() in ('admin', 'ventas', 'disenador'));

create policy "staff_insert_lead_task_comments"
    on public.lead_task_comments for insert
    to authenticated
    with check (public.current_profile_role() in ('admin', 'ventas', 'disenador'));

create policy "owner_or_admin_update_lead_task_comments"
    on public.lead_task_comments for update
    to authenticated
    using (author_id = auth.uid() or public.current_profile_role() = 'admin')
    with check (author_id = auth.uid() or public.current_profile_role() = 'admin');

create policy "owner_or_admin_delete_lead_task_comments"
    on public.lead_task_comments for delete
    to authenticated
    using (author_id = auth.uid() or public.current_profile_role() = 'admin');

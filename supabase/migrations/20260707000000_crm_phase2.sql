-- CRM North Creative Labs — Fase 2 (notas, tareas, timeline automático)
-- Requiere schema.sql + 20260705000000_crm_phase1.sql + 20260706000000_fix_step2_update_rpc.sql
-- Ejecutar una sola vez en el SQL Editor del proyecto Supabase.

-- ── lead_notes ───────────────────────────────────────────────────────────
create table public.lead_notes (
    id uuid primary key default gen_random_uuid(),
    lead_id uuid not null references public.leads(id) on delete cascade,
    author_id uuid references public.profiles(id) on delete set null,
    body text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index idx_lead_notes_lead_id on public.lead_notes (lead_id);

create or replace function public.set_lead_notes_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger trg_lead_notes_updated_at
    before update on public.lead_notes
    for each row
    execute function public.set_lead_notes_updated_at();

-- ── lead_tasks ───────────────────────────────────────────────────────────
create table public.lead_tasks (
    id uuid primary key default gen_random_uuid(),
    lead_id uuid not null references public.leads(id) on delete cascade,
    title text not null,
    description text,
    due_date date,
    status text not null default 'pending' check (status in ('pending', 'done', 'cancelled')),
    assigned_to uuid references public.profiles(id) on delete set null,
    created_by uuid references public.profiles(id) on delete set null,
    completed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index idx_lead_tasks_lead_id on public.lead_tasks (lead_id);
create index idx_lead_tasks_assigned_to on public.lead_tasks (assigned_to);

create or replace function public.set_lead_tasks_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger trg_lead_tasks_updated_at
    before update on public.lead_tasks
    for each row
    execute function public.set_lead_tasks_updated_at();

-- ── lead_activity (timeline, solo lectura para la app — se llena por triggers) ──
create table public.lead_activity (
    id uuid primary key default gen_random_uuid(),
    lead_id uuid not null references public.leads(id) on delete cascade,
    actor_id uuid references public.profiles(id) on delete set null,
    type text not null check (type in (
        'created', 'status_changed', 'assigned', 'step2_completed', 'note_added', 'task_created', 'task_completed'
    )),
    description text not null,
    metadata jsonb,
    created_at timestamptz not null default now()
);

create index idx_lead_activity_lead_id on public.lead_activity (lead_id, created_at desc);

-- ── Triggers de registro automático (SECURITY DEFINER: siempre pueden
-- escribir en lead_activity sin importar los grants del rol que dispara
-- el evento) ──────────────────────────────────────────────────────────
create or replace function public.log_lead_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.lead_activity (lead_id, actor_id, type, description)
    values (new.id, auth.uid(), 'created', 'Lead creado');
    return new;
end;
$$;

create trigger trg_log_lead_created
    after insert on public.leads
    for each row
    execute function public.log_lead_created();

create or replace function public.log_lead_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if new.estado is distinct from old.estado then
        insert into public.lead_activity (lead_id, actor_id, type, description, metadata)
        values (
            new.id, auth.uid(), 'status_changed',
            'Estado cambiado de ' || old.estado || ' a ' || new.estado,
            jsonb_build_object('from', old.estado, 'to', new.estado)
        );
    end if;

    if new.assigned_to is distinct from old.assigned_to then
        insert into public.lead_activity (lead_id, actor_id, type, description, metadata)
        values (
            new.id, auth.uid(), 'assigned',
            'Responsable actualizado',
            jsonb_build_object('from', old.assigned_to, 'to', new.assigned_to)
        );
    end if;

    if new.step2_status = 'completed' and old.step2_status is distinct from 'completed' then
        insert into public.lead_activity (lead_id, actor_id, type, description)
        values (new.id, auth.uid(), 'step2_completed', 'El cliente completó la información del Paso 2');
    end if;

    return new;
end;
$$;

create trigger trg_log_lead_update
    after update on public.leads
    for each row
    execute function public.log_lead_update();

create or replace function public.log_note_added()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.lead_activity (lead_id, actor_id, type, description)
    values (new.lead_id, new.author_id, 'note_added', 'Nota agregada');
    return new;
end;
$$;

create trigger trg_log_note_added
    after insert on public.lead_notes
    for each row
    execute function public.log_note_added();

create or replace function public.log_task_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if tg_op = 'INSERT' then
        insert into public.lead_activity (lead_id, actor_id, type, description)
        values (new.lead_id, new.created_by, 'task_created', 'Tarea creada: ' || new.title);
    elsif tg_op = 'UPDATE' and new.status = 'done' and old.status is distinct from 'done' then
        insert into public.lead_activity (lead_id, actor_id, type, description)
        values (new.lead_id, auth.uid(), 'task_completed', 'Tarea completada: ' || new.title);
    end if;
    return new;
end;
$$;

create trigger trg_log_task_insert
    after insert on public.lead_tasks
    for each row
    execute function public.log_task_event();

create trigger trg_log_task_update
    after update on public.lead_tasks
    for each row
    execute function public.log_task_event();

-- ── RLS ──────────────────────────────────────────────────────────────────
alter table public.lead_notes enable row level security;
alter table public.lead_tasks enable row level security;
alter table public.lead_activity enable row level security;

grant select, insert, update, delete on public.lead_notes to authenticated;
grant select, insert, update, delete on public.lead_tasks to authenticated;
grant select on public.lead_activity to authenticated;

-- lead_notes: todo el staff lee y crea; solo el autor o un admin edita/borra.
create policy "staff_select_lead_notes"
    on public.lead_notes for select
    to authenticated
    using (public.current_profile_role() in ('admin', 'ventas', 'disenador'));

create policy "staff_insert_lead_notes"
    on public.lead_notes for insert
    to authenticated
    with check (public.current_profile_role() in ('admin', 'ventas', 'disenador'));

create policy "owner_or_admin_update_lead_notes"
    on public.lead_notes for update
    to authenticated
    using (author_id = auth.uid() or public.current_profile_role() = 'admin')
    with check (author_id = auth.uid() or public.current_profile_role() = 'admin');

create policy "owner_or_admin_delete_lead_notes"
    on public.lead_notes for delete
    to authenticated
    using (author_id = auth.uid() or public.current_profile_role() = 'admin');

-- lead_tasks: todo el staff lee, crea y actualiza (ej. marcar completada);
-- solo admin borra.
create policy "staff_select_lead_tasks"
    on public.lead_tasks for select
    to authenticated
    using (public.current_profile_role() in ('admin', 'ventas', 'disenador'));

create policy "staff_insert_lead_tasks"
    on public.lead_tasks for insert
    to authenticated
    with check (public.current_profile_role() in ('admin', 'ventas', 'disenador'));

create policy "staff_update_lead_tasks"
    on public.lead_tasks for update
    to authenticated
    using (public.current_profile_role() in ('admin', 'ventas', 'disenador'))
    with check (public.current_profile_role() in ('admin', 'ventas', 'disenador'));

create policy "admin_delete_lead_tasks"
    on public.lead_tasks for delete
    to authenticated
    using (public.current_profile_role() = 'admin');

-- lead_activity: únicamente lectura para el staff. Nadie inserta/edita/borra
-- manualmente — solo los triggers (SECURITY DEFINER, bypasean RLS).
create policy "staff_select_lead_activity"
    on public.lead_activity for select
    to authenticated
    using (public.current_profile_role() in ('admin', 'ventas', 'disenador'));

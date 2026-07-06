-- CRM North Creative Labs — Fase 3 (archivos, cotizaciones)
-- Requiere schema.sql + 20260705000000_crm_phase1.sql +
-- 20260706000000_fix_step2_update_rpc.sql + 20260707000000_crm_phase2.sql
-- Ejecutar una sola vez en el SQL Editor del proyecto Supabase.

-- ── Bucket de Storage para archivos de leads (privado) ──────────────────
insert into storage.buckets (id, name, public)
values ('lead-files', 'lead-files', false)
on conflict (id) do nothing;

-- Políticas sobre storage.objects, acotadas al bucket 'lead-files'.
create policy "staff_select_lead_files_objects"
    on storage.objects for select
    to authenticated
    using (bucket_id = 'lead-files' and public.current_profile_role() in ('admin', 'ventas', 'disenador'));

create policy "staff_insert_lead_files_objects"
    on storage.objects for insert
    to authenticated
    with check (bucket_id = 'lead-files' and public.current_profile_role() in ('admin', 'ventas', 'disenador'));

create policy "owner_or_admin_delete_lead_files_objects"
    on storage.objects for delete
    to authenticated
    using (
        bucket_id = 'lead-files'
        and (owner = auth.uid() or public.current_profile_role() = 'admin')
    );

-- ── lead_files (referencia en Postgres; el archivo real vive en Storage) ─
create table public.lead_files (
    id uuid primary key default gen_random_uuid(),
    lead_id uuid not null references public.leads(id) on delete cascade,
    storage_path text not null,
    file_name text not null,
    file_type text,
    size_bytes bigint,
    uploaded_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now()
);

create index idx_lead_files_lead_id on public.lead_files (lead_id);

alter table public.lead_files enable row level security;
grant select, insert, delete on public.lead_files to authenticated;

create policy "staff_select_lead_files"
    on public.lead_files for select
    to authenticated
    using (public.current_profile_role() in ('admin', 'ventas', 'disenador'));

create policy "staff_insert_lead_files"
    on public.lead_files for insert
    to authenticated
    with check (public.current_profile_role() in ('admin', 'ventas', 'disenador'));

create policy "owner_or_admin_delete_lead_files"
    on public.lead_files for delete
    to authenticated
    using (uploaded_by = auth.uid() or public.current_profile_role() = 'admin');

-- ── quotes (cotizaciones) ────────────────────────────────────────────────
create table public.quotes (
    id uuid primary key default gen_random_uuid(),
    lead_id uuid not null references public.leads(id) on delete cascade,
    version int not null,
    amount numeric(12, 2) not null,
    currency text not null default 'USD',
    status text not null default 'borrador' check (status in ('borrador', 'enviada', 'aceptada', 'rechazada', 'expirada')),
    pdf_storage_path text,
    created_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index idx_quotes_lead_id on public.quotes (lead_id);

create or replace function public.set_quotes_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger trg_quotes_updated_at
    before update on public.quotes
    for each row
    execute function public.set_quotes_updated_at();

-- Auto-numera la versión por lead (1, 2, 3...) — el cliente nunca la calcula.
create or replace function public.set_quote_version()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    select coalesce(max(version), 0) + 1 into new.version
    from public.quotes
    where lead_id = new.lead_id;
    return new;
end;
$$;

create trigger trg_set_quote_version
    before insert on public.quotes
    for each row
    execute function public.set_quote_version();

alter table public.quotes enable row level security;
grant select, insert, update, delete on public.quotes to authenticated;

create policy "staff_select_quotes"
    on public.quotes for select
    to authenticated
    using (public.current_profile_role() in ('admin', 'ventas', 'disenador'));

create policy "sales_insert_quotes"
    on public.quotes for insert
    to authenticated
    with check (public.current_profile_role() in ('admin', 'ventas'));

create policy "sales_update_quotes"
    on public.quotes for update
    to authenticated
    using (public.current_profile_role() in ('admin', 'ventas'))
    with check (public.current_profile_role() in ('admin', 'ventas'));

create policy "admin_delete_quotes"
    on public.quotes for delete
    to authenticated
    using (public.current_profile_role() = 'admin');

-- ── Ampliar el timeline con los nuevos tipos de evento ──────────────────
-- Nombre por convención de Postgres para un CHECK de una sola columna sin
-- nombre explícito. Si esta línea falla, avisa: hay que buscar el nombre
-- real con `select conname from pg_constraint where conrelid = 'public.lead_activity'::regclass;`
alter table public.lead_activity drop constraint if exists lead_activity_type_check;
alter table public.lead_activity add constraint lead_activity_type_check check (type in (
    'created', 'status_changed', 'assigned', 'step2_completed',
    'note_added', 'task_created', 'task_completed',
    'file_added', 'quote_created', 'quote_status_changed'
));

create or replace function public.log_file_added()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.lead_activity (lead_id, actor_id, type, description)
    values (new.lead_id, new.uploaded_by, 'file_added', 'Archivo agregado: ' || new.file_name);
    return new;
end;
$$;

create trigger trg_log_file_added
    after insert on public.lead_files
    for each row
    execute function public.log_file_added();

create or replace function public.log_quote_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if tg_op = 'INSERT' then
        insert into public.lead_activity (lead_id, actor_id, type, description)
        values (new.lead_id, new.created_by, 'quote_created', 'Cotización v' || new.version || ' creada');
    elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
        insert into public.lead_activity (lead_id, actor_id, type, description, metadata)
        values (
            new.lead_id, auth.uid(), 'quote_status_changed',
            'Cotización v' || new.version || ' → ' || new.status,
            jsonb_build_object('from', old.status, 'to', new.status)
        );
    end if;
    return new;
end;
$$;

create trigger trg_log_quote_insert
    after insert on public.quotes
    for each row
    execute function public.log_quote_event();

create trigger trg_log_quote_update
    after update on public.quotes
    for each row
    execute function public.log_quote_event();

-- CRM North Creative Labs — Cotizaciones con items detallados
-- Requiere todas las migraciones anteriores.
-- Ejecutar una sola vez en el SQL Editor del proyecto Supabase.

-- ── quote_items (líneas de una cotización) ──────────────────────────────
create table public.quote_items (
    id uuid primary key default gen_random_uuid(),
    quote_id uuid not null references public.quotes(id) on delete cascade,
    description text not null,
    quantity numeric(10, 2) not null default 1,
    unit_price numeric(12, 2) not null,
    sort_order int not null default 0,
    created_at timestamptz not null default now()
);

create index idx_quote_items_quote_id on public.quote_items (quote_id);

alter table public.quote_items enable row level security;
grant select, insert on public.quote_items to authenticated;

create policy "staff_select_quote_items"
    on public.quote_items for select
    to authenticated
    using (public.current_profile_role() in ('admin', 'ventas', 'disenador'));

create policy "sales_insert_quote_items"
    on public.quote_items for insert
    to authenticated
    with check (public.current_profile_role() in ('admin', 'ventas'));

-- ── RPC: crea la cotización y sus items en una sola operación atómica ───
-- p_items: jsonb array de {description, quantity, unit_price}. El monto
-- total (quotes.amount) se calcula aquí — el cliente nunca lo envía.
-- SECURITY INVOKER (por defecto): corre con los permisos de quien llama,
-- así que sigue respetando las políticas sales_insert_quotes /
-- sales_insert_quote_items de arriba.
create or replace function public.create_quote_with_items(
    p_lead_id uuid,
    p_currency text,
    p_notes text,
    p_items jsonb
)
returns uuid
language plpgsql
as $$
declare
    v_quote_id uuid;
    v_amount numeric(12, 2);
begin
    select coalesce(sum((item->>'quantity')::numeric * (item->>'unit_price')::numeric), 0)
    into v_amount
    from jsonb_array_elements(p_items) as item;

    if v_amount <= 0 then
        raise exception 'La cotización debe tener al menos un item con precio válido.';
    end if;

    insert into public.quotes (lead_id, amount, currency, notes, created_by)
    values (p_lead_id, v_amount, coalesce(nullif(p_currency, ''), 'USD'), p_notes, auth.uid())
    returning id into v_quote_id;

    insert into public.quote_items (quote_id, description, quantity, unit_price, sort_order)
    select
        v_quote_id,
        item ->> 'description',
        (item ->> 'quantity')::numeric,
        (item ->> 'unit_price')::numeric,
        (ord - 1)::int
    from jsonb_array_elements(p_items) with ordinality as t(item, ord);

    return v_quote_id;
end;
$$;

grant execute on function public.create_quote_with_items(uuid, text, text, jsonb) to authenticated;

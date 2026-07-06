-- North Creative Labs — tabla de leads (formulario en 2 pasos)
-- Ejecutar una sola vez en el SQL Editor del proyecto Supabase.

create table if not exists public.leads (
    id uuid primary key,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    -- Paso 1 (obligatorios en el formulario)
    name text not null,
    project_type text not null check (project_type in ('negocio', 'portfolio', 'landing', 'e-commerce', 'otro')),
    budget text check (budget in ('100-300', '300-600', '600-1000', '1000+')),
    needs text not null,
    contact_info text not null,
    locale text check (locale in ('es', 'en', 'de')),

    -- Seguimiento del Paso 2
    step2_status text not null default 'pending' check (step2_status in ('pending', 'skipped', 'completed')),
    step2_completed_at timestamptz,

    -- Paso 2 — Sobre tu negocio
    business_name text,
    business_description text,
    has_website boolean,
    website_url text,

    -- Paso 2 — Objetivo del proyecto
    goals text[] check (goals <@ array['more_clients', 'sell_products', 'show_services', 'bookings', 'quotes', 'automate', 'improve_existing', 'other']::text[]),
    goals_other text,

    -- Paso 2 — Funcionalidades
    features text[] check (features <@ array['whatsapp', 'contact_form', 'booking_calendar', 'online_store', 'blog', 'chat', 'client_area', 'user_login', 'admin_panel', 'social_integration', 'online_payments', 'seo', 'multilanguage', 'other']::text[]),
    features_other text,

    -- Paso 2 — Contenido disponible
    existing_content text[] check (existing_content <@ array['logo', 'brand_manual', 'photos', 'videos', 'texts', 'catalog', 'domain', 'hosting']::text[]),

    -- Paso 2 — Diseño
    design_reference_url text,
    design_style text,

    -- Paso 2 — SEO
    seo_location text,
    seo_main_service text,

    -- Paso 2 — Información adicional
    additional_info text
);

-- updated_at se actualiza solo en cada UPDATE
create or replace function public.set_leads_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists trg_leads_updated_at on public.leads;
create trigger trg_leads_updated_at
    before update on public.leads
    for each row
    execute function public.set_leads_updated_at();

-- RLS: el rol anon (usado por la anon/publishable key en el navegador)
-- puede CREAR leads y ACTUALIZAR solo los campos del Paso 2.
-- No puede leer (SELECT) ni borrar (DELETE) nada — evita exponer
-- datos de contacto de otros leads a través de la key pública.
alter table public.leads enable row level security;

revoke all on public.leads from anon, authenticated;

grant insert on public.leads to anon;

grant update (
    business_name,
    business_description,
    has_website,
    website_url,
    goals,
    goals_other,
    features,
    features_other,
    existing_content,
    design_reference_url,
    design_style,
    seo_location,
    seo_main_service,
    additional_info,
    step2_status,
    step2_completed_at,
    locale,
    updated_at
) on public.leads to anon;

create policy "anon_insert_leads"
    on public.leads
    for insert
    to anon
    with check (true);

create policy "anon_update_leads"
    on public.leads
    for update
    to anon
    using (true)
    with check (true);

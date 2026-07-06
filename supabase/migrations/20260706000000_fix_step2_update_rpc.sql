-- Fix: PostgREST necesita privilegio SELECT para poder ejecutar CUALQUIER
-- UPDATE (incluso con Prefer: return=minimal, sin pedir los datos de vuelta),
-- porque calcula internamente cuántas filas coincidieron. Esto es incompatible
-- con la decisión de nunca darle SELECT a la key pública (anon) sobre `leads`.
--
-- Solución: el Paso 2 ya no actualiza la tabla directamente desde el
-- navegador. En su lugar llama a esta función (SECURITY DEFINER), que corre
-- con privilegios propios y nunca necesita un GRANT de lectura para `anon`.
--
-- Ejecutar una sola vez en el SQL Editor, después de schema.sql y de
-- 20260705000000_crm_phase1.sql.

-- Ya no se necesita el UPDATE directo de anon sobre leads: se reemplaza
-- por la función de abajo, que es la única vía de escritura del Paso 2.
revoke update on public.leads from anon;
drop policy if exists "anon_update_leads" on public.leads;

create or replace function public.update_lead_step2(
    p_lead_id uuid,
    p_business_name text default null,
    p_business_description text default null,
    p_has_website boolean default null,
    p_website_url text default null,
    p_goals text[] default null,
    p_goals_other text default null,
    p_features text[] default null,
    p_features_other text default null,
    p_existing_content text[] default null,
    p_design_reference_url text default null,
    p_design_style text default null,
    p_seo_location text default null,
    p_seo_main_service text default null,
    p_additional_info text default null,
    p_step2_status text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    -- coalesce: una llamada parcial (ej. solo marcar "skipped") nunca borra
    -- datos ya guardados en otras columnas.
    update public.leads
    set
        business_name = coalesce(p_business_name, business_name),
        business_description = coalesce(p_business_description, business_description),
        has_website = coalesce(p_has_website, has_website),
        website_url = coalesce(p_website_url, website_url),
        goals = coalesce(p_goals, goals),
        goals_other = coalesce(p_goals_other, goals_other),
        features = coalesce(p_features, features),
        features_other = coalesce(p_features_other, features_other),
        existing_content = coalesce(p_existing_content, existing_content),
        design_reference_url = coalesce(p_design_reference_url, design_reference_url),
        design_style = coalesce(p_design_style, design_style),
        seo_location = coalesce(p_seo_location, seo_location),
        seo_main_service = coalesce(p_seo_main_service, seo_main_service),
        additional_info = coalesce(p_additional_info, additional_info),
        step2_status = coalesce(p_step2_status, step2_status),
        step2_completed_at = case when p_step2_status = 'completed' then now() else step2_completed_at end
    where id = p_lead_id;
end;
$$;

grant execute on function public.update_lead_step2(
    uuid, text, text, boolean, text, text[], text, text[], text, text[], text, text, text, text, text, text
) to anon;

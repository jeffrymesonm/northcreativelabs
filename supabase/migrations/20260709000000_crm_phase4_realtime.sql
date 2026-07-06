-- CRM North Creative Labs — Fase 4 (Realtime en el Dashboard)
-- Requiere las migraciones anteriores (schema.sql, fase1, fix RPC, fase2, fase3).
-- Ejecutar una sola vez en el SQL Editor del proyecto Supabase.

-- Habilita la difusión de cambios de `leads` por Supabase Realtime.
-- Nota: si esta tabla ya estuviera agregada a la publicación (poco probable
-- en un proyecto nuevo), este comando falla con "already member of
-- publication" — en ese caso ya está listo, no hay nada más que hacer.
alter publication supabase_realtime add table public.leads;

-- La seguridad de Realtime la sigue dando el RLS ya existente: un cliente
-- solo recibe el evento de una fila si su policy de SELECT sobre esa fila
-- lo permite. anon no tiene SELECT sobre leads (ver schema.sql), así que
-- la key pública del sitio nunca recibe estos eventos — solo el staff
-- autenticado (admin/ventas/disenador, ver 20260705000000_crm_phase1.sql).

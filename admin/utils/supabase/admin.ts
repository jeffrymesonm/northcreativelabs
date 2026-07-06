import 'server-only'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Cliente con la Service Role Key — bypasea RLS por completo.
 *
 * SOLO usar dentro de Server Actions, y solo después de verificar que quien
 * llama ya es 'admin' (getCurrentProfile().role === 'admin'). Nunca importar
 * esto desde un Client Component ni exponer SUPABASE_SERVICE_ROLE_KEY con
 * el prefijo NEXT_PUBLIC_. El paquete `server-only` hace que el build falle
 * si este archivo termina en un bundle de cliente.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

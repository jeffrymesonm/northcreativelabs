import { createClient } from '@/utils/supabase/server'
import type { ProfileRow } from '@/types'

/** Lista de staff activo, para selects de "responsable" (asignación de leads/tareas). */
export async function getStaffProfiles(): Promise<ProfileRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('active', true)
    .not('role', 'is', null)
    .order('full_name')

  return data ?? []
}

/** Todos los perfiles (incluye inactivos y sin rol asignado), para /team. */
export async function getAllProfiles(): Promise<ProfileRow[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
  return data ?? []
}

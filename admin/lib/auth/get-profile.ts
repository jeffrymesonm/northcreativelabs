import { cache } from 'react'
import { createClient } from '@/utils/supabase/server'
import type { ProfileRow } from '@/types'

/**
 * Perfil (rol/estado) del usuario autenticado en la request actual.
 * Memoizado con cache() de React para no repetir el round-trip a
 * `profiles` cuando varios Server Components la llaman en el mismo render.
 * Devuelve null si no hay sesión o si el perfil aún no tiene rol asignado
 * (usuario recién creado, pendiente de que un admin lo active).
 */
export const getCurrentProfile = cache(async (): Promise<ProfileRow | null> => {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile ?? null
})

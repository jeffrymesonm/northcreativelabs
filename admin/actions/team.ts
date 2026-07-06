'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getCurrentProfile } from '@/lib/auth/get-profile'
import { isValidUsername, usernameToInternalEmail } from '@/lib/auth/username'
import type { StaffRole } from '@/types'

async function requireAdmin() {
  const profile = await getCurrentProfile()
  if (profile?.role !== 'admin') return null
  return profile
}

export async function createStaffUser(input: {
  username: string
  password: string
  fullName: string
  role: StaffRole
}) {
  const admin = await requireAdmin()
  if (!admin) return { error: 'Solo un administrador puede crear usuarios.' }

  const username = input.username.trim().toLowerCase()
  if (!isValidUsername(username)) {
    return { error: 'El usuario debe tener 3-32 caracteres: minúsculas, números, puntos, guiones.' }
  }
  if (input.password.length < 8) return { error: 'La contraseña debe tener al menos 8 caracteres.' }

  const supabaseAdmin = createAdminClient()

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: usernameToInternalEmail(username),
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.fullName, username },
  })

  if (error || !data.user) {
    if (error?.message?.toLowerCase().includes('already')) {
      return { error: 'Ese nombre de usuario ya existe.' }
    }
    return { error: error?.message ?? 'No se pudo crear el usuario.' }
  }

  // El trigger handle_new_user ya creó la fila en profiles con role = null;
  // la Service Role bypasea RLS, así que podemos asignar el rol ahora mismo.
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ role: input.role, full_name: input.fullName, username })
    .eq('id', data.user.id)

  if (profileError) {
    return { error: 'Usuario creado, pero no se pudo asignar el rol. Hazlo manualmente desde /team.' }
  }

  revalidatePath('/team')
  return {}
}

export async function updateStaffRole(profileId: string, role: StaffRole) {
  const admin = await requireAdmin()
  if (!admin) return { error: 'No tienes permiso para cambiar roles.' }

  const supabase = await createClient()
  const { error } = await supabase.from('profiles').update({ role }).eq('id', profileId)
  if (error) return { error: 'No se pudo actualizar el rol.' }

  revalidatePath('/team')
  return {}
}

export async function updateStaffActive(profileId: string, active: boolean) {
  const admin = await requireAdmin()
  if (!admin) return { error: 'No tienes permiso para activar/desactivar usuarios.' }

  const supabase = await createClient()
  const { error } = await supabase.from('profiles').update({ active }).eq('id', profileId)
  if (error) return { error: 'No se pudo actualizar el estado del usuario.' }

  revalidatePath('/team')
  return {}
}

export async function updateStaffPassword(profileId: string, newPassword: string) {
  const admin = await requireAdmin()
  if (!admin) return { error: 'No tienes permiso para cambiar contraseñas.' }
  if (newPassword.length < 8) return { error: 'La contraseña debe tener al menos 8 caracteres.' }

  const supabaseAdmin = createAdminClient()
  const { error } = await supabaseAdmin.auth.admin.updateUserById(profileId, { password: newPassword })
  if (error) return { error: 'No se pudo actualizar la contraseña.' }

  return {}
}

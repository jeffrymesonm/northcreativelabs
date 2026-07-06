'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { loginSchema, type LoginInput } from '@/lib/validations/login'
import { loginIdentifierToEmail } from '@/lib/auth/username'

export type SignInResult = { error: string } | { error?: undefined }

/**
 * Recibe los datos ya validados en el cliente por React Hook Form, pero
 * los revalida aquí igualmente (nunca confiar en la validación del
 * cliente para una acción de servidor — mismo criterio que un endpoint
 * público).
 */
export async function signIn(input: LoginInput): Promise<SignInResult> {
  const validated = loginSchema.safeParse(input)

  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? 'Datos inválidos.' }
  }

  const email = loginIdentifierToEmail(validated.data.username)
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password: validated.data.password })

  if (error) {
    return { error: 'Usuario o contraseña incorrectos.' }
  }

  redirect('/')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

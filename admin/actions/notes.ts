'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { getCurrentProfile } from '@/lib/auth/get-profile'

export async function addNote(leadId: string, body: string) {
  const profile = await getCurrentProfile()
  if (!profile?.role) return { error: 'No autorizado.' }

  const trimmed = body.trim()
  if (!trimmed) return { error: 'La nota no puede estar vacía.' }

  const supabase = await createClient()
  const { error } = await supabase.from('lead_notes').insert({
    lead_id: leadId,
    author_id: profile.id,
    body: trimmed,
  })

  if (error) return { error: 'No se pudo guardar la nota.' }
  revalidatePath(`/leads/${leadId}`)
  return {}
}

export async function updateNote(noteId: string, leadId: string, body: string) {
  const profile = await getCurrentProfile()
  if (!profile?.role) return { error: 'No autorizado.' }

  const trimmed = body.trim()
  if (!trimmed) return { error: 'La nota no puede estar vacía.' }

  const supabase = await createClient()
  const { error } = await supabase.from('lead_notes').update({ body: trimmed }).eq('id', noteId)

  if (error) return { error: 'No se pudo actualizar la nota.' }
  revalidatePath(`/leads/${leadId}`)
  return {}
}

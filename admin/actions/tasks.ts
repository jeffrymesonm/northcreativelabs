'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { getCurrentProfile } from '@/lib/auth/get-profile'

export type CreateTaskInput = {
  title: string
  description?: string
  dueDate?: string
  assignedTo?: string
}

export async function createTask(leadId: string, input: CreateTaskInput) {
  const profile = await getCurrentProfile()
  if (!profile?.role) return { error: 'No autorizado.' }

  const title = input.title.trim()
  if (!title) return { error: 'El título es obligatorio.' }

  const supabase = await createClient()
  const { error } = await supabase.from('lead_tasks').insert({
    lead_id: leadId,
    title,
    description: input.description?.trim() || null,
    due_date: input.dueDate || null,
    assigned_to: input.assignedTo || null,
    created_by: profile.id,
  })

  if (error) return { error: 'No se pudo crear la tarea.' }
  revalidatePath(`/leads/${leadId}`)
  return {}
}

export async function toggleTaskStatus(taskId: string, leadId: string, done: boolean) {
  const profile = await getCurrentProfile()
  if (!profile?.role) return { error: 'No autorizado.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('lead_tasks')
    .update({ status: done ? 'done' : 'pending', completed_at: done ? new Date().toISOString() : null })
    .eq('id', taskId)

  if (error) return { error: 'No se pudo actualizar la tarea.' }
  revalidatePath(`/leads/${leadId}`)
  return {}
}

export async function addTaskComment(taskId: string, leadId: string, body: string) {
  const profile = await getCurrentProfile()
  if (!profile?.role) return { error: 'No autorizado.' }

  const trimmed = body.trim()
  if (!trimmed) return { error: 'El comentario no puede estar vacío.' }

  const supabase = await createClient()
  const { error } = await supabase.from('lead_task_comments').insert({
    task_id: taskId,
    author_id: profile.id,
    body: trimmed,
  })

  if (error) return { error: 'No se pudo guardar el comentario.' }
  revalidatePath(`/leads/${leadId}`)
  return {}
}

export async function updateTaskComment(commentId: string, leadId: string, body: string) {
  const profile = await getCurrentProfile()
  if (!profile?.role) return { error: 'No autorizado.' }

  const trimmed = body.trim()
  if (!trimmed) return { error: 'El comentario no puede estar vacío.' }

  const supabase = await createClient()
  const { error } = await supabase.from('lead_task_comments').update({ body: trimmed }).eq('id', commentId)

  if (error) return { error: 'No se pudo actualizar el comentario.' }
  revalidatePath(`/leads/${leadId}`)
  return {}
}

export async function deleteTaskComment(commentId: string, leadId: string) {
  const profile = await getCurrentProfile()
  if (!profile?.role) return { error: 'No autorizado.' }

  const supabase = await createClient()
  const { error } = await supabase.from('lead_task_comments').delete().eq('id', commentId)

  if (error) return { error: 'No se pudo borrar el comentario.' }
  revalidatePath(`/leads/${leadId}`)
  return {}
}

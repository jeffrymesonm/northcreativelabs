'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { getCurrentProfile } from '@/lib/auth/get-profile'
import type { LeadRow, LeadStatus } from '@/types'

const CAN_EDIT_LEADS: Array<string> = ['admin', 'ventas']

export type CreateLeadInput = {
  name: string
  businessName: string
  projectType: LeadRow['project_type']
  budget: LeadRow['budget']
  needs: string
  contactInfo: string
  source: string
  assignedTo: string | null
}

/**
 * Crea un lead a mano desde el CRM (a diferencia de los que llegan por el
 * formulario público). `source` nunca es 'web_form' aquí — eso queda
 * reservado para los leads que sí vienen del sitio. `step2_status` se marca
 * 'skipped' porque un lead manual no pasa por el paso 2 del formulario.
 */
export async function createLead(input: CreateLeadInput) {
  const profile = await getCurrentProfile()
  if (!profile?.role || !CAN_EDIT_LEADS.includes(profile.role)) {
    return { error: 'No tienes permiso para crear leads.' }
  }

  const name = input.name.trim()
  const needs = input.needs.trim()
  const contactInfo = input.contactInfo.trim()
  if (!name || !needs || !contactInfo) {
    return { error: 'Nombre, necesidad y contacto son obligatorios.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('leads').insert({
    name,
    business_name: input.businessName.trim() || null,
    project_type: input.projectType,
    budget: input.budget,
    needs,
    contact_info: contactInfo,
    source: input.source,
    assigned_to: input.assignedTo,
    step2_status: 'skipped',
  })
  if (error) return { error: 'No se pudo crear el lead.' }

  revalidatePath('/leads')
  revalidatePath('/')
  return {}
}

/**
 * Borra de Storage los archivos (adjuntos y PDFs de cotización) de los
 * leads dados. El cascade de Postgres borra las filas relacionadas, pero
 * no los objetos en Storage — sin esto quedarían huérfanos.
 */
async function cleanupLeadStorage(supabase: Awaited<ReturnType<typeof createClient>>, leadIds: string[]) {
  const [{ data: files }, { data: quotes }] = await Promise.all([
    supabase.from('lead_files').select('storage_path').in('lead_id', leadIds),
    supabase.from('quotes').select('pdf_storage_path').in('lead_id', leadIds).not('pdf_storage_path', 'is', null),
  ])

  const paths = [
    ...(files ?? []).map((f) => f.storage_path),
    ...(quotes ?? []).map((q) => q.pdf_storage_path as string),
  ]

  if (paths.length) await supabase.storage.from('lead-files').remove(paths)
}

export async function updateLeadStatus(leadId: string, estado: LeadStatus) {
  const profile = await getCurrentProfile()
  if (!profile?.role || !CAN_EDIT_LEADS.includes(profile.role)) {
    return { error: 'No tienes permiso para cambiar el estado de este lead.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('leads').update({ estado }).eq('id', leadId)
  if (error) return { error: 'No se pudo actualizar el estado.' }

  revalidatePath(`/leads/${leadId}`)
  revalidatePath('/leads')
  revalidatePath('/')
  return {}
}

export async function updateLeadAssignment(leadId: string, assignedTo: string | null) {
  const profile = await getCurrentProfile()
  if (!profile?.role || !CAN_EDIT_LEADS.includes(profile.role)) {
    return { error: 'No tienes permiso para reasignar este lead.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('leads').update({ assigned_to: assignedTo }).eq('id', leadId)
  if (error) return { error: 'No se pudo actualizar el responsable.' }

  revalidatePath(`/leads/${leadId}`)
  revalidatePath('/leads')
  return {}
}

export async function bulkArchiveLeads(leadIds: string[]) {
  const profile = await getCurrentProfile()
  if (!profile?.role || !CAN_EDIT_LEADS.includes(profile.role)) {
    return { error: 'No tienes permiso para archivar estos leads.' }
  }
  if (!leadIds.length) return {}

  const supabase = await createClient()
  const { error } = await supabase.from('leads').update({ archived: true }).in('id', leadIds)
  if (error) return { error: 'No se pudo archivar los leads seleccionados.' }

  revalidatePath('/leads')
  revalidatePath('/')
  return {}
}

export async function bulkUpdateStatus(leadIds: string[], estado: LeadStatus) {
  const profile = await getCurrentProfile()
  if (!profile?.role || !CAN_EDIT_LEADS.includes(profile.role)) {
    return { error: 'No tienes permiso para cambiar el estado de estos leads.' }
  }
  if (!leadIds.length) return {}

  const supabase = await createClient()
  const { error } = await supabase.from('leads').update({ estado }).in('id', leadIds)
  if (error) return { error: 'No se pudo actualizar el estado de los leads seleccionados.' }

  revalidatePath('/leads')
  revalidatePath('/')
  return {}
}

export async function bulkAssignLeads(leadIds: string[], assignedTo: string | null) {
  const profile = await getCurrentProfile()
  if (!profile?.role || !CAN_EDIT_LEADS.includes(profile.role)) {
    return { error: 'No tienes permiso para reasignar estos leads.' }
  }
  if (!leadIds.length) return {}

  const supabase = await createClient()
  const { error } = await supabase.from('leads').update({ assigned_to: assignedTo }).in('id', leadIds)
  if (error) return { error: 'No se pudo reasignar los leads seleccionados.' }

  revalidatePath('/leads')
  return {}
}

/** Borrado permanente — solo admin (coincide con la policy RLS de leads). */
export async function deleteLead(leadId: string) {
  const profile = await getCurrentProfile()
  if (profile?.role !== 'admin') return { error: 'Solo un administrador puede eliminar leads.' }

  const supabase = await createClient()
  await cleanupLeadStorage(supabase, [leadId])

  const { error } = await supabase.from('leads').delete().eq('id', leadId)
  if (error) return { error: 'No se pudo eliminar el lead.' }

  revalidatePath('/leads')
  revalidatePath('/')
  redirect('/leads')
}

export async function bulkDeleteLeads(leadIds: string[]) {
  const profile = await getCurrentProfile()
  if (profile?.role !== 'admin') return { error: 'Solo un administrador puede eliminar leads.' }
  if (!leadIds.length) return {}

  const supabase = await createClient()
  await cleanupLeadStorage(supabase, leadIds)

  const { error } = await supabase.from('leads').delete().in('id', leadIds)
  if (error) return { error: 'No se pudo eliminar los leads seleccionados.' }

  revalidatePath('/leads')
  revalidatePath('/')
  return {}
}

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { getCurrentProfile } from '@/lib/auth/get-profile'
import type { QuoteStatus } from '@/types'

const CAN_MANAGE_QUOTES = ['admin', 'ventas']

export async function createQuote(leadId: string, formData: FormData) {
  const profile = await getCurrentProfile()
  if (!profile?.role || !CAN_MANAGE_QUOTES.includes(profile.role)) {
    return { error: 'No tienes permiso para crear cotizaciones.' }
  }

  const amount = Number(formData.get('amount'))
  const currency = String(formData.get('currency') ?? 'USD') || 'USD'
  const notes = String(formData.get('notes') ?? '').trim() || null
  const pdf = formData.get('pdf')

  if (!Number.isFinite(amount) || amount <= 0) return { error: 'Ingresa un monto válido.' }

  const supabase = await createClient()

  let pdfStoragePath: string | null = null
  if (pdf instanceof File && pdf.size > 0) {
    pdfStoragePath = `${leadId}/quotes/${Date.now()}-${pdf.name}`
    const { error: uploadError } = await supabase.storage.from('lead-files').upload(pdfStoragePath, pdf)
    if (uploadError) return { error: 'No se pudo subir el PDF de la cotización.' }
  }

  const { error } = await supabase.from('quotes').insert({
    lead_id: leadId,
    amount,
    currency,
    notes,
    pdf_storage_path: pdfStoragePath,
    created_by: profile.id,
  })

  if (error) {
    if (pdfStoragePath) await supabase.storage.from('lead-files').remove([pdfStoragePath])
    return { error: 'No se pudo crear la cotización.' }
  }

  revalidatePath(`/leads/${leadId}`)
  return {}
}

export async function updateQuoteStatus(quoteId: string, leadId: string, status: QuoteStatus) {
  const profile = await getCurrentProfile()
  if (!profile?.role || !CAN_MANAGE_QUOTES.includes(profile.role)) {
    return { error: 'No tienes permiso para actualizar esta cotización.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('quotes').update({ status }).eq('id', quoteId)
  if (error) return { error: 'No se pudo actualizar el estado de la cotización.' }

  revalidatePath(`/leads/${leadId}`)
  return {}
}

'use server'

import { createElement } from 'react'
import { revalidatePath } from 'next/cache'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/utils/supabase/server'
import { getCurrentProfile } from '@/lib/auth/get-profile'
import { QuoteDocument } from '@/lib/pdf/quote-document'
import type { LeadRow, QuoteRow, QuoteStatus } from '@/types'

type QuoteWithLead = QuoteRow & { lead: Pick<LeadRow, 'name' | 'business_name' | 'contact_info'> }

const CAN_MANAGE_QUOTES = ['admin', 'ventas']

export type QuoteItemInput = { description: string; quantity: number; unitPrice: number }

export async function createQuote(
  leadId: string,
  input: { currency: string; notes?: string; items: QuoteItemInput[] }
) {
  const profile = await getCurrentProfile()
  if (!profile?.role || !CAN_MANAGE_QUOTES.includes(profile.role)) {
    return { error: 'No tienes permiso para crear cotizaciones.' }
  }

  const items = input.items
    .map((item) => ({
      description: item.description.trim(),
      quantity: Number(item.quantity),
      unit_price: Number(item.unitPrice),
    }))
    .filter((item) => item.description && item.quantity > 0 && item.unit_price > 0)

  if (!items.length) return { error: 'Agrega al menos un item con descripción, cantidad y precio válidos.' }

  const supabase = await createClient()

  const { data: quoteId, error: rpcError } = await supabase.rpc('create_quote_with_items', {
    p_lead_id: leadId,
    p_currency: input.currency || 'USD',
    p_notes: input.notes?.trim() || null,
    p_items: items,
  })

  if (rpcError || !quoteId) return { error: 'No se pudo crear la cotización.' }

  await generateAndAttachQuotePdf(supabase, quoteId, leadId, items)

  revalidatePath(`/leads/${leadId}`)
  return {}
}

/** Genera el PDF de la cotización y lo adjunta — un fallo aquí no revierte la cotización ya creada. */
async function generateAndAttachQuotePdf(
  supabase: Awaited<ReturnType<typeof createClient>>,
  quoteId: string,
  leadId: string,
  items: { description: string; quantity: number; unit_price: number }[]
) {
  try {
    const { data } = await supabase
      .from('quotes')
      .select('*, lead:leads(name, business_name, contact_info)')
      .eq('id', quoteId)
      .single()

    const quote = data as unknown as QuoteWithLead | null
    if (!quote) return

    const pdfBuffer = await renderToBuffer(
      createElement(QuoteDocument, {
        leadName: quote.lead.name,
        businessName: quote.lead.business_name,
        contactInfo: quote.lead.contact_info,
        version: quote.version,
        currency: quote.currency,
        notes: quote.notes,
        createdAt: quote.created_at,
        items,
        amount: quote.amount,
      }) as Parameters<typeof renderToBuffer>[0]
    )

    const pdfStoragePath = `${leadId}/quotes/${quoteId}.pdf`
    const { error: uploadError } = await supabase.storage
      .from('lead-files')
      .upload(pdfStoragePath, pdfBuffer, { contentType: 'application/pdf' })

    if (!uploadError) {
      await supabase.from('quotes').update({ pdf_storage_path: pdfStoragePath }).eq('id', quoteId)
    }
  } catch {
    // La cotización ya existe aunque falle la generación del PDF; no bloquea el flujo.
  }
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

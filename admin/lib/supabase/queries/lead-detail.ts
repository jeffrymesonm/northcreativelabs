import { createClient } from '@/utils/supabase/server'
import type {
  LeadActivityWithActor,
  LeadFileWithUploader,
  LeadNoteWithAuthor,
  LeadTaskWithAssignee,
  LeadWithAssignee,
  QuoteWithCreator,
} from '@/types'

export async function getLeadById(id: string): Promise<LeadWithAssignee | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('leads')
    .select('*, assignee:profiles!assigned_to(id, full_name)')
    .eq('id', id)
    .single()

  return (data as unknown as LeadWithAssignee) ?? null
}

export async function getLeadNotes(leadId: string): Promise<LeadNoteWithAuthor[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('lead_notes')
    .select('*, author:profiles!author_id(id, full_name)')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })

  return (data as unknown as LeadNoteWithAuthor[]) ?? []
}

export async function getLeadTasks(leadId: string): Promise<LeadTaskWithAssignee[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('lead_tasks')
    .select(
      '*, assignee:profiles!assigned_to(id, full_name), comments:lead_task_comments(*, author:profiles!author_id(id, full_name))'
    )
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
    .order('created_at', { referencedTable: 'lead_task_comments', ascending: true })

  return (data as unknown as LeadTaskWithAssignee[]) ?? []
}

export async function getLeadActivity(leadId: string): Promise<LeadActivityWithActor[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('lead_activity')
    .select('*, actor:profiles!actor_id(id, full_name)')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })

  return (data as unknown as LeadActivityWithActor[]) ?? []
}

/** URL firmada por 1 hora — el bucket es privado, no hay acceso público directo. */
const SIGNED_URL_EXPIRY_SECONDS = 3600

export async function getLeadFiles(leadId: string): Promise<LeadFileWithUploader[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('lead_files')
    .select('*, uploader:profiles!uploaded_by(id, full_name)')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })

  const files = (data as unknown as LeadFileWithUploader[]) ?? []
  if (!files.length) return []

  const { data: signedUrls } = await supabase.storage
    .from('lead-files')
    .createSignedUrls(
      files.map((f) => f.storage_path),
      SIGNED_URL_EXPIRY_SECONDS
    )

  return files.map((file, index) => ({
    ...file,
    signedUrl: signedUrls?.[index]?.signedUrl ?? null,
  }))
}

export async function getQuotes(leadId: string): Promise<QuoteWithCreator[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('quotes')
    .select('*, creator:profiles!created_by(id, full_name), items:quote_items(*)')
    .eq('lead_id', leadId)
    .order('version', { ascending: false })
    .order('sort_order', { referencedTable: 'quote_items', ascending: true })

  const quotes = (data as unknown as (QuoteWithCreator & { pdfSignedUrl?: null })[]) ?? []

  const withPdf = quotes.filter((q) => q.pdf_storage_path)
  if (!withPdf.length) return quotes.map((q) => ({ ...q, pdfSignedUrl: null }))

  const { data: signedUrls } = await supabase.storage
    .from('lead-files')
    .createSignedUrls(
      withPdf.map((q) => q.pdf_storage_path as string),
      SIGNED_URL_EXPIRY_SECONDS
    )

  const urlByPath = new Map(withPdf.map((q, i) => [q.pdf_storage_path, signedUrls?.[i]?.signedUrl ?? null]))

  return quotes.map((q) => ({
    ...q,
    pdfSignedUrl: q.pdf_storage_path ? (urlByPath.get(q.pdf_storage_path) ?? null) : null,
  }))
}

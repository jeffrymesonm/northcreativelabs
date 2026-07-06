import { createClient } from '@/utils/supabase/server'
import type { LeadStatus, LeadWithAssignee } from '@/types'

export const LEADS_PAGE_SIZE = 20

const SORTABLE_COLUMNS = ['name', 'business_name', 'project_type', 'budget', 'estado', 'created_at'] as const
export type SortableColumn = (typeof SORTABLE_COLUMNS)[number]

export type LeadsSearchParams = {
  q?: string
  estado?: string
  sort?: string
  dir?: string
  page?: string
}

function parsePage(page?: string) {
  const parsed = Number(page)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1
}

function parseSort(sort?: string): SortableColumn {
  return (SORTABLE_COLUMNS as readonly string[]).includes(sort ?? '') ? (sort as SortableColumn) : 'created_at'
}

/**
 * Arma y ejecuta la consulta de la tabla de leads con búsqueda, filtro por
 * estado, orden y paginación resueltos server-side (nunca traer todo y
 * filtrar en el cliente).
 */
export async function getLeads(searchParams: LeadsSearchParams) {
  const supabase = await createClient()

  const page = parsePage(searchParams.page)
  const sort = parseSort(searchParams.sort)
  const ascending = searchParams.dir === 'asc'
  const from = (page - 1) * LEADS_PAGE_SIZE
  const to = from + LEADS_PAGE_SIZE - 1

  let query = supabase
    .from('leads')
    .select('*, assignee:profiles!assigned_to(id, full_name)', { count: 'exact' })
    .eq('archived', false)

  const q = searchParams.q?.trim()
  if (q) {
    const escaped = q.replace(/[%_]/g, '\\$&')
    query = query.or(`name.ilike.%${escaped}%,business_name.ilike.%${escaped}%,contact_info.ilike.%${escaped}%`)
  }

  if (searchParams.estado && searchParams.estado !== 'todos') {
    query = query.eq('estado', searchParams.estado as LeadStatus)
  }

  query = query.order(sort, { ascending }).range(from, to)

  const { data, count, error } = await query

  if (error) {
    console.error('Error al consultar leads:', error.message)
    return { rows: [] as LeadWithAssignee[], totalCount: 0, page, pageSize: LEADS_PAGE_SIZE }
  }

  return {
    rows: (data ?? []) as unknown as LeadWithAssignee[],
    totalCount: count ?? 0,
    page,
    pageSize: LEADS_PAGE_SIZE,
  }
}

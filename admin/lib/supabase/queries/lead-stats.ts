import { createClient } from '@/utils/supabase/server'
import type { LeadStatus } from '@/types'

export type StatusCardKey = 'nuevo' | 'contactado' | 'cotizacion_enviada' | 'ganado' | 'perdido'

export type PeriodCounts = { today: number; week: number; month: number }

export type LeadStatusCounts = Record<StatusCardKey, PeriodCounts>

const STATUS_CARD_KEYS: StatusCardKey[] = ['nuevo', 'contactado', 'cotizacion_enviada', 'ganado', 'perdido']

/**
 * Límites de fecha en UTC (nunca hora local, ver reglas del proyecto).
 * Semana = lunes como primer día (ISO).
 */
function getUtcBoundaries() {
  const now = new Date()
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

  const isoDay = now.getUTCDay() === 0 ? 7 : now.getUTCDay() // domingo=0 -> 7
  const weekStart = new Date(todayStart)
  weekStart.setUTCDate(weekStart.getUTCDate() - (isoDay - 1))

  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))

  return { todayStart, weekStart, monthStart }
}

/**
 * Cuenta leads no archivados por estado, agrupados en hoy/semana/mes según
 * `created_at`. Nota (Fase 1): sin una tabla de historial de estados, esta
 * es la única lectura honesta posible — "de los leads creados en este
 * período, cuántos están HOY en cada estado" (no "cuándo entraron a ese
 * estado"). Una vista/función SQL agrupada es la mejora natural cuando
 * llegue Realtime en una fase posterior.
 */
export async function getLeadStatusCounts(): Promise<LeadStatusCounts> {
  const supabase = await createClient()
  const { todayStart, weekStart, monthStart } = getUtcBoundaries()

  const { data, error } = await supabase
    .from('leads')
    .select('estado, created_at')
    .eq('archived', false)
    .gte('created_at', monthStart.toISOString())

  const counts: LeadStatusCounts = Object.fromEntries(
    STATUS_CARD_KEYS.map((key) => [key, { today: 0, week: 0, month: 0 }])
  ) as LeadStatusCounts

  if (error || !data) return counts

  for (const row of data as { estado: LeadStatus; created_at: string }[]) {
    if (!STATUS_CARD_KEYS.includes(row.estado as StatusCardKey)) continue
    const key = row.estado as StatusCardKey
    const createdAt = new Date(row.created_at)

    counts[key].month += 1
    if (createdAt >= weekStart) counts[key].week += 1
    if (createdAt >= todayStart) counts[key].today += 1
  }

  return counts
}

export type MonthlyLeadCount = { month: string; label: string; count: number }

/**
 * Leads creados por mes (UTC) en los últimos 6 meses, incluyendo el actual.
 * Para el gráfico mensual del dashboard.
 */
export async function getMonthlyLeadCounts(): Promise<MonthlyLeadCount[]> {
  const supabase = await createClient()
  const now = new Date()
  const rangeStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1))

  const buckets: MonthlyLeadCount[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))
    buckets.push({
      month: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`,
      label: new Intl.DateTimeFormat('es-DO', { month: 'short', timeZone: 'UTC' }).format(d),
      count: 0,
    })
  }

  const { data, error } = await supabase
    .from('leads')
    .select('created_at')
    .eq('archived', false)
    .gte('created_at', rangeStart.toISOString())

  if (error || !data) return buckets

  const bucketByMonth = new Map(buckets.map((b) => [b.month, b]))
  for (const row of data as { created_at: string }[]) {
    const d = new Date(row.created_at)
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
    const bucket = bucketByMonth.get(key)
    if (bucket) bucket.count += 1
  }

  return buckets
}

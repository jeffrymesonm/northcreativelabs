import { StatusCard } from '@/components/dashboard/status-card'
import type { LeadStatusCounts, StatusCardKey } from '@/lib/supabase/queries/lead-stats'

const CARDS: { key: StatusCardKey; label: string }[] = [
  { key: 'nuevo', label: 'Leads nuevos' },
  { key: 'contactado', label: 'Contactados' },
  { key: 'cotizacion_enviada', label: 'Cotizaciones enviadas' },
  { key: 'ganado', label: 'Ganados' },
  { key: 'perdido', label: 'Perdidos' },
]

export function StatusCardsGrid({ counts }: { counts: LeadStatusCounts }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {CARDS.map(({ key, label }) => (
        <StatusCard key={key} label={label} counts={counts[key]} />
      ))}
    </div>
  )
}

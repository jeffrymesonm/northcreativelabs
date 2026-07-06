import { getLeadStatusCounts, getMonthlyLeadCounts } from '@/lib/supabase/queries/lead-stats'
import { StatusCardsGrid } from '@/components/dashboard/status-cards-grid'
import { MonthlyLeadsChart } from '@/components/dashboard/monthly-leads-chart'

export default async function DashboardPage() {
  const [counts, monthly] = await Promise.all([getLeadStatusCounts(), getMonthlyLeadCounts()])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Resumen de leads. Cada tarjeta muestra el total del mes, con hoy y esta semana debajo.
        </p>
      </div>
      <StatusCardsGrid counts={counts} />
      <MonthlyLeadsChart data={monthly} />
    </div>
  )
}

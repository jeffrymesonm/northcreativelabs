import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PeriodCounts } from '@/lib/supabase/queries/lead-stats'

export function StatusCard({ label, counts }: { label: string; counts: PeriodCounts }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-3xl font-semibold">{counts.month}</p>
        <p className="text-xs text-muted-foreground">
          {counts.today} hoy · {counts.week} esta semana
        </p>
      </CardContent>
    </Card>
  )
}

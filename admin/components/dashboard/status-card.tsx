'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCountUp } from '@/lib/hooks/use-count-up'
import { cn } from '@/lib/utils'
import type { PeriodCounts } from '@/lib/supabase/queries/lead-stats'

export function StatusCard({ label, counts }: { label: string; counts: PeriodCounts }) {
  const { value, pulsing } = useCountUp(counts.month)

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-shadow duration-500',
        pulsing && 'ring-1 ring-signal/70'
      )}
    >
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="font-mono text-3xl font-semibold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">
          {counts.today} hoy · {counts.week} esta semana
        </p>
      </CardContent>
      {pulsing && (
        <span className="absolute right-3 top-3 size-1.5 rounded-full bg-signal animate-signal-pulse" />
      )}
    </Card>
  )
}

'use client'

import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import type { MonthlyLeadCount } from '@/lib/supabase/queries/lead-stats'

const chartConfig: ChartConfig = {
  count: {
    label: 'Leads',
    theme: { light: 'oklch(0.78 0.13 70)', dark: 'oklch(0.78 0.13 70)' },
  },
}

export function MonthlyLeadsChart({ data }: { data: MonthlyLeadCount[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-base">Leads por mes</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
          <BarChart data={data} margin={{ left: -20 }}>
            <defs>
              <linearGradient id="leadsBarFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-count)" stopOpacity={1} />
                <stop offset="100%" stopColor="var(--color-count)" stopOpacity={0.35} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent hideLabel={false} />} />
            <Bar
              dataKey="count"
              fill="url(#leadsBarFill)"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
              animationDuration={600}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

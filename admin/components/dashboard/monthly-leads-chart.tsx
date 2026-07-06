'use client'

import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import type { MonthlyLeadCount } from '@/lib/supabase/queries/lead-stats'

const chartConfig: ChartConfig = {
  count: {
    label: 'Leads',
    theme: { light: '#2a78d6', dark: '#3987e5' },
  },
}

export function MonthlyLeadsChart({ data }: { data: MonthlyLeadCount[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Leads por mes</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
          <BarChart data={data} margin={{ left: -20 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent hideLabel={false} />} />
            <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

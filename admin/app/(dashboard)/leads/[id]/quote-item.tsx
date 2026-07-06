'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { FileText } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { updateQuoteStatus } from '@/actions/quotes'
import { QUOTE_STATUS_LABELS, QUOTE_STATUS_OPTIONS } from '@/lib/constants/leads'
import type { QuoteStatus, QuoteWithCreator } from '@/types'

export function QuoteItem({ quote, canEdit }: { quote: QuoteWithCreator; canEdit: boolean }) {
  const [isPending, startTransition] = useTransition()
  const dateFormatter = new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium' })
  const amountFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: quote.currency || 'USD' })

  function handleStatusChange(value: string | null) {
    if (!value) return
    startTransition(async () => {
      const result = await updateQuoteStatus(quote.id, quote.lead_id, value as QuoteStatus)
      if (result?.error) toast.error(result.error)
    })
  }

  return (
    <li className="flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <p className="text-sm font-medium">
          v{quote.version} · {amountFormatter.format(quote.amount)}
        </p>
        <p className="text-xs text-muted-foreground">
          {quote.creator?.full_name ?? 'Usuario'} · {dateFormatter.format(new Date(quote.created_at))}
        </p>
        {quote.notes && <p className="text-sm whitespace-pre-wrap">{quote.notes}</p>}
        {quote.pdfSignedUrl && (
          <a
            href={quote.pdfSignedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <FileText className="size-3.5" />
            Ver PDF
          </a>
        )}
      </div>
      <Select value={quote.status} onValueChange={handleStatusChange} disabled={!canEdit || isPending}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {QUOTE_STATUS_OPTIONS.map((status) => (
            <SelectItem key={status} value={status}>
              {QUOTE_STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </li>
  )
}

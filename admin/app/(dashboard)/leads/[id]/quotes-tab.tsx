import { QuoteForm } from './quote-form'
import { QuoteItem } from './quote-item'
import type { QuoteWithCreator } from '@/types'

export function QuotesTab({ leadId, quotes, canEdit }: { leadId: string; quotes: QuoteWithCreator[]; canEdit: boolean }) {
  return (
    <div className="space-y-6">
      {canEdit && <QuoteForm leadId={leadId} />}

      {quotes.length ? (
        <ul className="space-y-2">
          {quotes.map((quote) => (
            <QuoteItem key={quote.id} quote={quote} canEdit={canEdit} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Todavía no hay cotizaciones para este lead.</p>
      )}
    </div>
  )
}

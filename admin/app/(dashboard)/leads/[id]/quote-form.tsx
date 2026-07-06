'use client'

import { useRef, useTransition } from 'react'
import { toast } from 'sonner'
import { createQuote } from '@/actions/quotes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export function QuoteForm({ leadId }: { leadId: string }) {
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createQuote(leadId, formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Cotización creada.')
        formRef.current?.reset()
      }
    })
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-3 rounded-md border p-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1">
          <Label>Monto</Label>
          <Input name="amount" type="number" min="0" step="0.01" placeholder="0.00" required />
        </div>
        <div className="space-y-1">
          <Label>Moneda</Label>
          <Input name="currency" defaultValue="USD" />
        </div>
        <div className="space-y-1 sm:col-span-2 lg:col-span-2">
          <Label>PDF de la cotización (opcional)</Label>
          <Input name="pdf" type="file" accept="application/pdf" />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Notas (opcional)</Label>
        <Textarea name="notes" placeholder="Detalle de lo que incluye esta cotización…" rows={2} />
      </div>
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? 'Creando…' : 'Nueva cotización'}
      </Button>
    </form>
  )
}

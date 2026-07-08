'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { createQuote, type QuoteItemInput } from '@/actions/quotes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const EMPTY_ITEM: QuoteItemInput = { description: '', quantity: 1, unitPrice: 0 }

export function QuoteForm({ leadId }: { leadId: string }) {
  const [isPending, startTransition] = useTransition()
  const [currency, setCurrency] = useState('USD')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<QuoteItemInput[]>([{ ...EMPTY_ITEM }])

  const total = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0)
  const totalFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' })

  function updateItem(index: number, patch: Partial<QuoteItemInput>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  function addItem() {
    setItems((prev) => [...prev, { ...EMPTY_ITEM }])
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await createQuote(leadId, { currency, notes, items })
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Cotización creada.')
        setNotes('')
        setItems([{ ...EMPTY_ITEM }])
      }
    })
  }

  return (
    <div className="space-y-3 rounded-md border p-3">
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_5rem_7rem_auto] sm:items-end">
            <div className="space-y-1">
              {index === 0 && <Label>Descripción</Label>}
              <Input
                value={item.description}
                onChange={(e) => updateItem(index, { description: e.target.value })}
                placeholder="Ej: Landing page (1 página)"
              />
            </div>
            <div className="space-y-1">
              {index === 0 && <Label>Cant.</Label>}
              <Input
                type="number"
                min="0"
                step="1"
                value={item.quantity}
                onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              {index === 0 && <Label>Precio unitario</Label>}
              <Input
                type="number"
                min="0"
                step="0.01"
                value={item.unitPrice}
                onChange={(e) => updateItem(index, { unitPrice: Number(e.target.value) })}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeItem(index)}
              disabled={items.length === 1}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1">
        <Plus className="size-3.5" />
        Agregar item
      </Button>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1">
          <Label>Moneda</Label>
          <Input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} />
        </div>
        <div className="flex items-end justify-start sm:col-span-1">
          <p className="text-sm">
            Total: <span className="font-medium">{totalFormatter.format(total)}</span>
          </p>
        </div>
      </div>

      <div className="space-y-1">
        <Label>Notas (opcional)</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Detalle de lo que incluye esta cotización…"
          rows={2}
        />
      </div>

      <Button type="button" size="sm" onClick={handleSubmit} disabled={isPending || total <= 0}>
        {isPending ? 'Creando…' : 'Nueva cotización'}
      </Button>
    </div>
  )
}

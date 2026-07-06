'use client'

import { useRef, useTransition } from 'react'
import { toast } from 'sonner'
import { addNote } from '@/actions/notes'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export function NoteForm({ leadId }: { leadId: string }) {
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(formData: FormData) {
    const body = String(formData.get('body') ?? '')
    startTransition(async () => {
      const result = await addNote(leadId, body)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Nota agregada.')
        formRef.current?.reset()
      }
    })
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-2">
      <Textarea name="body" placeholder="Escribe una nota interna sobre este lead…" rows={3} required />
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? 'Guardando…' : 'Agregar nota'}
      </Button>
    </form>
  )
}

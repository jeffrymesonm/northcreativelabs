'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Pencil } from 'lucide-react'
import { updateNote } from '@/actions/notes'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { LeadNoteWithAuthor } from '@/types'

export function NoteItem({ note, canEdit }: { note: LeadNoteWithAuthor; canEdit: boolean }) {
  const [isPending, startTransition] = useTransition()
  const [isEditing, setIsEditing] = useState(false)
  const [body, setBody] = useState(note.body)
  const dateFormatter = new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium', timeStyle: 'short' })

  function handleSave() {
    startTransition(async () => {
      const result = await updateNote(note.id, note.lead_id, body)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Nota actualizada.')
        setIsEditing(false)
      }
    })
  }

  function handleCancel() {
    setBody(note.body)
    setIsEditing(false)
  }

  return (
    <li className="rounded-md border p-3">
      {isEditing ? (
        <div className="space-y-2">
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={isPending || !body.trim()}>
              Guardar
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel} disabled={isPending}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm whitespace-pre-wrap">{note.body}</p>
          <div className="mt-1 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {note.author?.full_name ?? 'Usuario'} · {dateFormatter.format(new Date(note.created_at))}
              {note.updated_at !== note.created_at ? ' · editada' : ''}
            </p>
            {canEdit && (
              <Button variant="ghost" size="icon-sm" onClick={() => setIsEditing(true)}>
                <Pencil className="size-3.5" />
              </Button>
            )}
          </div>
        </>
      )}
    </li>
  )
}

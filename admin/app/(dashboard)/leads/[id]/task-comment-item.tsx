'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Pencil, Trash2 } from 'lucide-react'
import { deleteTaskComment, updateTaskComment } from '@/actions/tasks'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { LeadTaskCommentWithAuthor } from '@/types'

export function TaskCommentItem({
  comment,
  leadId,
  canEdit,
}: {
  comment: LeadTaskCommentWithAuthor
  leadId: string
  canEdit: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [isEditing, setIsEditing] = useState(false)
  const [body, setBody] = useState(comment.body)
  const dateFormatter = new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium', timeStyle: 'short' })

  function handleSave() {
    startTransition(async () => {
      const result = await updateTaskComment(comment.id, leadId, body)
      if (result?.error) toast.error(result.error)
      else setIsEditing(false)
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteTaskComment(comment.id, leadId)
      if (result?.error) toast.error(result.error)
    })
  }

  if (isEditing) {
    return (
      <li className="space-y-2 rounded-md bg-muted/40 p-2">
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={2} />
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={isPending || !body.trim()}>
            Guardar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} disabled={isPending}>
            Cancelar
          </Button>
        </div>
      </li>
    )
  }

  return (
    <li className="flex items-start justify-between gap-2 rounded-md bg-muted/40 p-2">
      <div className="min-w-0">
        <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
        <p className="text-xs text-muted-foreground">
          {comment.author?.full_name ?? 'Usuario'} · {dateFormatter.format(new Date(comment.created_at))}
          {comment.updated_at !== comment.created_at ? ' · editado' : ''}
        </p>
      </div>
      {canEdit && (
        <div className="flex shrink-0 gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => setIsEditing(true)} disabled={isPending}>
            <Pencil className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={handleDelete} disabled={isPending}>
            <Trash2 className="size-3.5 text-destructive" />
          </Button>
        </div>
      )}
    </li>
  )
}

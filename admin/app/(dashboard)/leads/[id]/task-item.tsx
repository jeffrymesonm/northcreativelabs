'use client'

import { useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { MessageSquare } from 'lucide-react'
import { addTaskComment, toggleTaskStatus } from '@/actions/tasks'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { TaskCommentItem } from './task-comment-item'
import type { LeadTaskWithAssignee } from '@/types'

export function TaskItem({
  task,
  currentUserId,
  isAdmin,
}: {
  task: LeadTaskWithAssignee
  currentUserId?: string
  isAdmin: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [isCommentPending, startCommentTransition] = useTransition()
  const [showComments, setShowComments] = useState(false)
  const dateFormatter = new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium' })
  const commentFormRef = useRef<HTMLFormElement>(null)

  function handleToggle(checked: boolean) {
    startTransition(async () => {
      const result = await toggleTaskStatus(task.id, task.lead_id, checked)
      if (result?.error) toast.error(result.error)
    })
  }

  function handleAddComment(formData: FormData) {
    const body = String(formData.get('body') ?? '')
    startCommentTransition(async () => {
      const result = await addTaskComment(task.id, task.lead_id, body)
      if (result?.error) toast.error(result.error)
      else commentFormRef.current?.reset()
    })
  }

  return (
    <li className="rounded-md border p-3">
      <div className="flex items-start gap-3">
        <Checkbox
          checked={task.status === 'done'}
          onCheckedChange={(checked) => handleToggle(checked === true)}
          disabled={isPending}
          className="mt-0.5"
        />
        <div className="flex-1">
          <p className={`text-sm ${task.status === 'done' ? 'text-muted-foreground line-through' : ''}`}>
            {task.title}
          </p>
          <p className="text-xs text-muted-foreground">
            {task.assignee?.full_name ?? 'Sin asignar'}
            {task.due_date ? ` · vence ${dateFormatter.format(new Date(task.due_date))}` : ''}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowComments((v) => !v)} className="gap-1">
          <MessageSquare className="size-3.5" />
          {task.comments.length || ''}
        </Button>
      </div>

      {showComments && (
        <div className="mt-3 space-y-2 border-t pt-3 pl-7">
          {task.comments.length > 0 && (
            <ul className="space-y-2">
              {task.comments.map((comment) => (
                <TaskCommentItem
                  key={comment.id}
                  comment={comment}
                  leadId={task.lead_id}
                  canEdit={isAdmin || comment.author_id === currentUserId}
                />
              ))}
            </ul>
          )}
          <form ref={commentFormRef} action={handleAddComment} className="flex items-start gap-2">
            <Textarea name="body" placeholder="Escribe un comentario…" rows={2} required className="flex-1" />
            <Button type="submit" size="sm" disabled={isCommentPending}>
              Enviar
            </Button>
          </form>
        </div>
      )}
    </li>
  )
}

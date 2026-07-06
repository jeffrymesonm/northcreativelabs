'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { toggleTaskStatus } from '@/actions/tasks'
import { Checkbox } from '@/components/ui/checkbox'
import type { LeadTaskWithAssignee } from '@/types'

export function TaskItem({ task }: { task: LeadTaskWithAssignee }) {
  const [isPending, startTransition] = useTransition()
  const dateFormatter = new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium' })

  function handleToggle(checked: boolean) {
    startTransition(async () => {
      const result = await toggleTaskStatus(task.id, task.lead_id, checked)
      if (result?.error) toast.error(result.error)
    })
  }

  return (
    <li className="flex items-start gap-3 rounded-md border p-3">
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
    </li>
  )
}

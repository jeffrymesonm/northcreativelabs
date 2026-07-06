import { TaskForm } from './task-form'
import { TaskItem } from './task-item'
import type { LeadTaskWithAssignee, ProfileRow } from '@/types'

export function TasksTab({
  leadId,
  tasks,
  staff,
}: {
  leadId: string
  tasks: LeadTaskWithAssignee[]
  staff: ProfileRow[]
}) {
  return (
    <div className="space-y-6">
      <TaskForm leadId={leadId} staff={staff} />

      {tasks.length ? (
        <ul className="space-y-2">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Todavía no hay tareas para este lead.</p>
      )}
    </div>
  )
}

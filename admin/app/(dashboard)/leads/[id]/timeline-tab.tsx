import {
  CheckCircle2,
  FileText,
  ListChecks,
  Paperclip,
  Plus,
  Receipt,
  UserCog,
  type LucideIcon,
} from 'lucide-react'
import { ACTIVITY_TYPE_LABELS } from '@/lib/constants/leads'
import type { ActivityType, LeadActivityWithActor } from '@/types'

const ACTIVITY_ICONS: Record<ActivityType, LucideIcon> = {
  created: Plus,
  status_changed: ListChecks,
  assigned: UserCog,
  step2_completed: CheckCircle2,
  note_added: FileText,
  task_created: ListChecks,
  task_completed: CheckCircle2,
  file_added: Paperclip,
  quote_created: Receipt,
  quote_status_changed: Receipt,
}

export function TimelineTab({ activity }: { activity: LeadActivityWithActor[] }) {
  if (!activity.length) {
    return <p className="text-sm text-muted-foreground">Todavía no hay actividad registrada para este lead.</p>
  }

  const dateFormatter = new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <ul className="space-y-4">
      {activity.map((entry) => {
        const Icon = ACTIVITY_ICONS[entry.type] ?? FileText
        return (
          <li key={entry.id} className="flex gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
              <Icon className="size-4 text-muted-foreground" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium">{entry.description}</p>
              <p className="text-xs text-muted-foreground">
                {ACTIVITY_TYPE_LABELS[entry.type]} · {entry.actor?.full_name ?? 'Sistema'} ·{' '}
                {dateFormatter.format(new Date(entry.created_at))}
              </p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

import { NoteForm } from './note-form'
import type { LeadNoteWithAuthor } from '@/types'

export function NotesTab({ leadId, notes }: { leadId: string; notes: LeadNoteWithAuthor[] }) {
  const dateFormatter = new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <div className="space-y-6">
      <NoteForm leadId={leadId} />

      {notes.length ? (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li key={note.id} className="rounded-md border p-3">
              <p className="text-sm whitespace-pre-wrap">{note.body}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {note.author?.full_name ?? 'Usuario'} · {dateFormatter.format(new Date(note.created_at))}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Todavía no hay notas para este lead.</p>
      )}
    </div>
  )
}

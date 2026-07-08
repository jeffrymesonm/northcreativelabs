import { NoteForm } from './note-form'
import { NoteItem } from './note-item'
import type { LeadNoteWithAuthor } from '@/types'

export function NotesTab({
  leadId,
  notes,
  currentUserId,
  isAdmin,
}: {
  leadId: string
  notes: LeadNoteWithAuthor[]
  currentUserId?: string
  isAdmin: boolean
}) {
  return (
    <div className="space-y-6">
      <NoteForm leadId={leadId} />

      {notes.length ? (
        <ul className="space-y-3">
          {notes.map((note) => (
            <NoteItem key={note.id} note={note} canEdit={isAdmin || note.author_id === currentUserId} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Todavía no hay notas para este lead.</p>
      )}
    </div>
  )
}

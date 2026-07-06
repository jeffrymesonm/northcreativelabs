'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Download, FileText, Trash2 } from 'lucide-react'
import { deleteLeadFile } from '@/actions/files'
import { Button } from '@/components/ui/button'
import type { LeadFileWithUploader } from '@/types'

function formatSize(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FileItem({ file, canDelete }: { file: LeadFileWithUploader; canDelete: boolean }) {
  const [isPending, startTransition] = useTransition()
  const dateFormatter = new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium' })

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteLeadFile(file.id, file.lead_id, file.storage_path)
      if (result?.error) toast.error(result.error)
    })
  }

  return (
    <li className="flex items-center gap-3 rounded-md border p-3">
      <FileText className="size-5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{file.file_name}</p>
        <p className="text-xs text-muted-foreground">
          {formatSize(file.size_bytes)} · {file.uploader?.full_name ?? 'Usuario'} ·{' '}
          {dateFormatter.format(new Date(file.created_at))}
        </p>
      </div>
      {file.signedUrl && (
        <Button
          variant="ghost"
          size="icon"
          render={<a href={file.signedUrl} target="_blank" rel="noopener noreferrer" download={file.file_name} />}
        >
          <Download className="size-4" />
        </Button>
      )}
      {canDelete && (
        <Button variant="ghost" size="icon" onClick={handleDelete} disabled={isPending}>
          <Trash2 className="size-4 text-destructive" />
        </Button>
      )}
    </li>
  )
}

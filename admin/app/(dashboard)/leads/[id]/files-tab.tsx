import { FileUploadForm } from './file-upload-form'
import { FileItem } from './file-item'
import type { LeadFileWithUploader } from '@/types'

export function FilesTab({
  leadId,
  files,
  currentUserId,
  isAdmin,
}: {
  leadId: string
  files: LeadFileWithUploader[]
  currentUserId?: string
  isAdmin: boolean
}) {
  return (
    <div className="space-y-6">
      <FileUploadForm leadId={leadId} />

      {files.length ? (
        <ul className="space-y-2">
          {files.map((file) => (
            <FileItem key={file.id} file={file} canDelete={isAdmin || file.uploaded_by === currentUserId} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Todavía no hay archivos para este lead.</p>
      )}
    </div>
  )
}

'use client'

import { useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { uploadLeadFile } from '@/actions/files'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function FileUploadForm({ leadId }: { leadId: string }) {
  const [isPending, startTransition] = useTransition()
  const [fileName, setFileName] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await uploadLeadFile(leadId, formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Archivo subido.')
        formRef.current?.reset()
        setFileName(null)
      }
    })
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Input
        name="file"
        type="file"
        required
        onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        className="sm:max-w-xs"
      />
      <Button type="submit" size="sm" disabled={isPending || !fileName}>
        {isPending ? 'Subiendo…' : 'Subir archivo'}
      </Button>
    </form>
  )
}

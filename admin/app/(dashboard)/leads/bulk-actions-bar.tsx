'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Archive, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { bulkArchiveLeads, bulkAssignLeads, bulkDeleteLeads, bulkUpdateStatus } from '@/actions/leads'
import { LEAD_STATUS_LABELS, LEAD_STATUS_OPTIONS } from '@/lib/constants/leads'
import type { LeadStatus, ProfileRow } from '@/types'

export function BulkActionsBar({
  leadIds,
  staff,
  isAdmin,
  onDone,
}: {
  leadIds: string[]
  staff: ProfileRow[]
  isAdmin: boolean
  onDone: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function runAction(action: () => Promise<{ error?: string }>) {
    startTransition(async () => {
      const result = await action()
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(`${leadIds.length} lead(s) actualizados.`)
        onDone()
        router.refresh()
      }
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 p-3">
      <span className="text-sm font-medium">{leadIds.length} seleccionados</span>

      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => runAction(() => bulkArchiveLeads(leadIds))}
      >
        <Archive className="size-4" />
        Archivar
      </Button>

      <Select
        disabled={isPending}
        onValueChange={(value: string | null) => value && runAction(() => bulkUpdateStatus(leadIds, value as LeadStatus))}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Cambiar estado a…" />
        </SelectTrigger>
        <SelectContent>
          {LEAD_STATUS_OPTIONS.map((status) => (
            <SelectItem key={status} value={status}>
              {LEAD_STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        disabled={isPending}
        onValueChange={(value: string | null) => {
          const assignedTo = !value || value === 'sin_asignar' ? null : value
          runAction(() => bulkAssignLeads(leadIds, assignedTo))
        }}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Asignar a…" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="sin_asignar">— sin asignar —</SelectItem>
          {staff.map((member) => (
            <SelectItem key={member.id} value={member.id}>
              {member.full_name ?? member.id}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isAdmin && (
        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="destructive" size="sm" />} disabled={isPending}>
            <Trash2 className="size-4" />
            Eliminar
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar {leadIds.length} lead(s)?</AlertDialogTitle>
              <AlertDialogDescription>
                Se borrarán permanentemente junto con sus notas, tareas, archivos, cotizaciones y timeline. Esta
                acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={() => runAction(() => bulkDeleteLeads(leadIds))}>
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <Button variant="ghost" size="sm" onClick={onDone} disabled={isPending}>
        Cancelar
      </Button>
    </div>
  )
}

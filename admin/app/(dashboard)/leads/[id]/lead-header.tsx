'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, Trash2 } from 'lucide-react'
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
import { deleteLead, updateLeadAssignment, updateLeadStatus } from '@/actions/leads'
import { LEAD_STATUS_LABELS, LEAD_STATUS_OPTIONS, PROJECT_TYPE_LABELS } from '@/lib/constants/leads'
import type { LeadStatus, LeadWithAssignee, ProfileRow } from '@/types'

export function LeadHeader({
  lead,
  staff,
  canEdit,
  isAdmin,
}: {
  lead: LeadWithAssignee
  staff: ProfileRow[]
  canEdit: boolean
  isAdmin: boolean
}) {
  const [isPending, startTransition] = useTransition()

  function handleStatusChange(value: string | null) {
    if (!value) return
    startTransition(async () => {
      const result = await updateLeadStatus(lead.id, value as LeadStatus)
      if (result?.error) toast.error(result.error)
      else toast.success('Estado actualizado.')
    })
  }

  function handleAssigneeChange(value: string | null) {
    startTransition(async () => {
      const result = await updateLeadAssignment(lead.id, !value || value === 'sin_asignar' ? null : value)
      if (result?.error) toast.error(result.error)
      else toast.success('Responsable actualizado.')
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteLead(lead.id)
      if (result?.error) toast.error(result.error)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link href="/leads" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Volver a leads
        </Link>

        {isAdmin && (
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="destructive" size="sm" />} disabled={isPending}>
              <Trash2 className="size-4" />
              Eliminar lead
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar este lead?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se borrará permanentemente junto con sus notas, tareas, archivos, cotizaciones y timeline. Esta
                  acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={handleDelete}>
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-2xl font-semibold">{lead.name}</h1>
          <p className="text-sm text-muted-foreground">
            {lead.business_name ?? 'Sin nombre de negocio'} · {PROJECT_TYPE_LABELS[lead.project_type] ?? lead.project_type}
          </p>
          <p className="text-sm text-muted-foreground">{lead.contact_info}</p>
        </div>

        <div className="flex gap-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Estado</p>
            <Select value={lead.estado} onValueChange={handleStatusChange} disabled={!canEdit || isPending}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAD_STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {LEAD_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Responsable</p>
            <Select
              value={lead.assignee?.id ?? 'sin_asignar'}
              onValueChange={handleAssigneeChange}
              disabled={!canEdit || isPending}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
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
          </div>
        </div>
      </div>
    </div>
  )
}

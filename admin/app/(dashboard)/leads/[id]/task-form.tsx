'use client'

import { useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { createTask } from '@/actions/tasks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ProfileRow } from '@/types'

export function TaskForm({ leadId, staff }: { leadId: string; staff: ProfileRow[] }) {
  const [isPending, startTransition] = useTransition()
  const [assignedTo, setAssignedTo] = useState<string>('sin_asignar')
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(formData: FormData) {
    const title = String(formData.get('title') ?? '')
    const dueDate = String(formData.get('due_date') ?? '')

    startTransition(async () => {
      const result = await createTask(leadId, {
        title,
        dueDate: dueDate || undefined,
        assignedTo: assignedTo === 'sin_asignar' ? undefined : assignedTo,
      })
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Tarea creada.')
        formRef.current?.reset()
        setAssignedTo('sin_asignar')
      }
    })
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <div className="flex-1 space-y-1">
        <label className="text-xs text-muted-foreground">Título</label>
        <Input name="title" placeholder="Ej: Llamar para agendar reunión" required />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Vence</label>
        <Input name="due_date" type="date" className="w-40" />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Asignar a</label>
        <Select value={assignedTo} onValueChange={(value) => setAssignedTo(value ?? 'sin_asignar')}>
          <SelectTrigger className="w-44">
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
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? 'Creando…' : 'Crear tarea'}
      </Button>
    </form>
  )
}

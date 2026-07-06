'use client'

import { useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { createStaffUser } from '@/actions/team'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { STAFF_ROLE_LABELS } from '@/lib/constants/leads'
import type { StaffRole } from '@/types'

const CREATABLE_ROLES: StaffRole[] = ['admin', 'ventas', 'disenador', 'client']

export function CreateStaffForm() {
  const [isPending, startTransition] = useTransition()
  const [role, setRole] = useState<StaffRole>('ventas')
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(formData: FormData) {
    const username = String(formData.get('username') ?? '')
    const password = String(formData.get('password') ?? '')
    const fullName = String(formData.get('full_name') ?? '')

    startTransition(async () => {
      const result = await createStaffUser({ username, password, fullName, role })
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Usuario creado.')
        formRef.current?.reset()
        setRole('ventas')
      }
    })
  }

  return (
    <form ref={formRef} action={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <div className="space-y-1">
        <Label htmlFor="full_name">Nombre completo</Label>
        <Input id="full_name" name="full_name" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="username">Usuario</Label>
        <Input id="username" name="username" placeholder="jperez" required autoComplete="off" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="password">Contraseña</Label>
        <Input id="password" name="password" type="password" minLength={8} required autoComplete="new-password" />
      </div>
      <div className="space-y-1">
        <Label>Rol</Label>
        <Select value={role} onValueChange={(v) => v && setRole(v as StaffRole)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CREATABLE_ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {STAFF_ROLE_LABELS[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-end">
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? 'Creando…' : 'Crear usuario'}
        </Button>
      </div>
    </form>
  )
}

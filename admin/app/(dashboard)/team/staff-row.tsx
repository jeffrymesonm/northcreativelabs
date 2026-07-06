'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { updateStaffActive, updateStaffPassword, updateStaffRole } from '@/actions/team'
import { STAFF_ROLE_LABELS } from '@/lib/constants/leads'
import type { ProfileRow, StaffRole } from '@/types'

const ASSIGNABLE_ROLES: StaffRole[] = ['admin', 'ventas', 'disenador', 'client']

export function StaffRow({ profile, isSelf }: { profile: ProfileRow; isSelf: boolean }) {
  const [isPending, startTransition] = useTransition()
  const [showPasswordField, setShowPasswordField] = useState(false)
  const [newPassword, setNewPassword] = useState('')

  function handleRoleChange(value: string | null) {
    if (!value) return
    startTransition(async () => {
      const result = await updateStaffRole(profile.id, value as StaffRole)
      if (result?.error) toast.error(result.error)
      else toast.success('Rol actualizado.')
    })
  }

  function handleActiveChange(checked: boolean) {
    startTransition(async () => {
      const result = await updateStaffActive(profile.id, checked)
      if (result?.error) toast.error(result.error)
      else toast.success(checked ? 'Usuario activado.' : 'Usuario desactivado.')
    })
  }

  function handlePasswordSubmit() {
    startTransition(async () => {
      const result = await updateStaffPassword(profile.id, newPassword)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Contraseña actualizada.')
        setNewPassword('')
        setShowPasswordField(false)
      }
    })
  }

  return (
    <li className="flex flex-col gap-3 rounded-md border p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">
            {profile.full_name ?? '— sin nombre —'}{' '}
            {isSelf && <span className="text-xs text-muted-foreground">(tú)</span>}
          </p>
          <p className="text-xs text-muted-foreground">{profile.username ?? profile.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={profile.role ?? 'sin_rol'} onValueChange={handleRoleChange} disabled={isPending || isSelf}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {!profile.role && <SelectItem value="sin_rol">— sin rol —</SelectItem>}
              {ASSIGNABLE_ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {STAFF_ROLE_LABELS[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Switch checked={profile.active} onCheckedChange={handleActiveChange} disabled={isPending || isSelf} />
            <span className="text-xs text-muted-foreground">{profile.active ? 'Activo' : 'Inactivo'}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShowPasswordField((v) => !v)} disabled={isPending}>
            <KeyRound className="size-4" />
          </Button>
        </div>
      </div>

      {showPasswordField && (
        <div className="flex items-center gap-2 border-t pt-3">
          <Input
            type="password"
            placeholder="Nueva contraseña (mín. 8 caracteres)"
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="max-w-xs"
          />
          <Button size="sm" onClick={handlePasswordSubmit} disabled={isPending || newPassword.length < 8}>
            Guardar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowPasswordField(false)} disabled={isPending}>
            Cancelar
          </Button>
        </div>
      )}
    </li>
  )
}

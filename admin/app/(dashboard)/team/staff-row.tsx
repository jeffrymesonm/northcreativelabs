'use client'

import { useState, useTransition, type CSSProperties } from 'react'
import { toast } from 'sonner'
import { KeyRound, Pencil, Trash2 } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { deleteStaffUser, updateStaffActive, updateStaffPassword, updateStaffProfile, updateStaffRole } from '@/actions/team'
import { STAFF_ROLE_LABELS } from '@/lib/constants/leads'
import type { ProfileRow, StaffRole } from '@/types'

const ASSIGNABLE_ROLES: StaffRole[] = ['admin', 'ventas', 'disenador', 'client']

export function StaffRow({
  profile,
  isSelf,
  style,
}: {
  profile: ProfileRow
  isSelf: boolean
  style?: CSSProperties
}) {
  const [isPending, startTransition] = useTransition()
  const [showPasswordField, setShowPasswordField] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [username, setUsername] = useState(profile.username ?? '')
  const [deleteOpen, setDeleteOpen] = useState(false)

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

  function handleProfileSubmit() {
    startTransition(async () => {
      const result = await updateStaffProfile(profile.id, { fullName, username })
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Usuario actualizado.')
        setIsEditingProfile(false)
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteStaffUser(profile.id)
      if (result?.error) {
        toast.error(result.error)
        setDeleteOpen(false)
      } else {
        toast.success('Usuario eliminado.')
      }
    })
  }

  return (
    <li
      className="animate-fade-in-up flex flex-col gap-3 rounded-lg border bg-card p-3 transition-colors hover:border-signal/30"
      style={style}
    >
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
          <Button variant="ghost" size="icon" onClick={() => setIsEditingProfile((v) => !v)} disabled={isPending}>
            <Pencil className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShowPasswordField((v) => !v)} disabled={isPending}>
            <KeyRound className="size-4" />
          </Button>
          <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <AlertDialogTrigger
              render={<Button variant="ghost" size="icon" disabled={isPending || isSelf} />}
            >
              <Trash2 className="size-4 text-destructive" />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar a {profile.full_name ?? profile.username}?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. La cuenta se elimina por completo; sus notas, tareas y
                  cotizaciones pasadas se conservan sin autor.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={isPending}>
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {isEditingProfile && (
        <div className="flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center">
          <Input
            placeholder="Nombre completo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="max-w-xs"
          />
          <Input
            placeholder="usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="max-w-xs"
          />
          <Button size="sm" onClick={handleProfileSubmit} disabled={isPending || !fullName.trim() || !username.trim()}>
            Guardar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setIsEditingProfile(false)} disabled={isPending}>
            Cancelar
          </Button>
        </div>
      )}

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

'use client'

import { useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { createLead } from '@/actions/leads'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  BUDGET_LABELS,
  BUDGET_OPTIONS,
  LEAD_SOURCE_LABELS,
  LEAD_SOURCE_OPTIONS,
  PROJECT_TYPE_LABELS,
  PROJECT_TYPE_OPTIONS,
} from '@/lib/constants/leads'
import type { LeadRow, ProfileRow } from '@/types'

export function CreateLeadSheet({ staff }: { staff: ProfileRow[] }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [projectType, setProjectType] = useState<LeadRow['project_type']>('negocio')
  const [budget, setBudget] = useState<LeadRow['budget']>(null)
  const [source, setSource] = useState<string>('referido')
  const [assignedTo, setAssignedTo] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function reset() {
    formRef.current?.reset()
    setProjectType('negocio')
    setBudget(null)
    setSource('referido')
    setAssignedTo(null)
  }

  function handleSubmit(formData: FormData) {
    const name = String(formData.get('name') ?? '')
    const businessName = String(formData.get('business_name') ?? '')
    const needs = String(formData.get('needs') ?? '')
    const contactInfo = String(formData.get('contact_info') ?? '')

    startTransition(async () => {
      const result = await createLead({
        name,
        businessName,
        projectType,
        budget,
        needs,
        contactInfo,
        source,
        assignedTo,
      })
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Lead creado.')
        reset()
        setOpen(false)
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button size="sm" />}>
        <Plus className="size-4" />
        Nuevo lead
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Nuevo lead</SheetTitle>
        </SheetHeader>

        <form ref={formRef} action={handleSubmit} className="flex flex-col gap-4 px-4">
          <div className="space-y-1">
            <Label htmlFor="name">Nombre *</Label>
            <Input id="name" name="name" required />
          </div>

          <div className="space-y-1">
            <Label htmlFor="business_name">Empresa (opcional)</Label>
            <Input id="business_name" name="business_name" />
          </div>

          <div className="space-y-1">
            <Label>Tipo de proyecto *</Label>
            <Select value={projectType} onValueChange={(v) => v && setProjectType(v as LeadRow['project_type'])}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_TYPE_OPTIONS.map((type) => (
                  <SelectItem key={type} value={type}>
                    {PROJECT_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Presupuesto (opcional)</Label>
            <Select
              value={budget ?? 'sin_definir'}
              onValueChange={(v) => setBudget(!v || v === 'sin_definir' ? null : (v as LeadRow['budget']))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sin_definir">Sin definir</SelectItem>
                {BUDGET_OPTIONS.map((b) => (
                  <SelectItem key={b} value={b}>
                    {BUDGET_LABELS[b]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="needs">¿Qué necesita? *</Label>
            <Textarea id="needs" name="needs" required placeholder="Ej: Landing para captar leads" />
          </div>

          <div className="space-y-1">
            <Label htmlFor="contact_info">Contacto (email o WhatsApp) *</Label>
            <Input id="contact_info" name="contact_info" required />
          </div>

          <div className="space-y-1">
            <Label>Origen *</Label>
            <Select value={source} onValueChange={(v) => v && setSource(v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAD_SOURCE_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {LEAD_SOURCE_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Asignar a (opcional)</Label>
            <Select
              value={assignedTo ?? 'sin_asignar'}
              onValueChange={(v) => setAssignedTo(!v || v === 'sin_asignar' ? null : v)}
            >
              <SelectTrigger className="w-full">
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
        </form>

        <SheetFooter className="flex-row justify-end gap-2 border-t">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={() => formRef.current?.requestSubmit()} disabled={isPending}>
            {isPending ? 'Creando…' : 'Crear lead'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

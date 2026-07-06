'use client'

import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { LEAD_STATUS_BADGE_CLASS, LEAD_STATUS_LABELS, PROJECT_TYPE_LABELS, BUDGET_LABELS } from '@/lib/constants/leads'
import type { LeadWithAssignee } from '@/types'

export const columns: ColumnDef<LeadWithAssignee>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
        onCheckedChange={(checked) => table.toggleAllPageRowsSelected(checked === true)}
        aria-label="Seleccionar todos"
      />
    ),
    cell: ({ row }) => (
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(checked) => row.toggleSelected(checked === true)}
          aria-label="Seleccionar fila"
        />
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'name',
    header: 'Nombre',
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: 'business_name',
    header: 'Empresa',
    cell: ({ row }) => row.original.business_name ?? '—',
  },
  {
    accessorKey: 'project_type',
    header: 'Tipo',
    cell: ({ row }) => PROJECT_TYPE_LABELS[row.original.project_type] ?? row.original.project_type,
  },
  {
    accessorKey: 'budget',
    header: 'Presupuesto',
    cell: ({ row }) => (row.original.budget ? (BUDGET_LABELS[row.original.budget] ?? row.original.budget) : '—'),
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }) => (
      <Badge variant="outline" className={LEAD_STATUS_BADGE_CLASS[row.original.estado]}>
        {LEAD_STATUS_LABELS[row.original.estado]}
      </Badge>
    ),
  },
  {
    id: 'assigned_to',
    header: 'Responsable',
    cell: ({ row }) => row.original.assignee?.full_name ?? '— sin asignar —',
  },
  {
    accessorKey: 'created_at',
    header: 'Fecha',
    cell: ({ row }) =>
      new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium' }).format(new Date(row.original.created_at)),
  },
]

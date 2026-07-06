'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { flexRender, getCoreRowModel, useReactTable, type RowSelectionState } from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { BulkActionsBar } from './bulk-actions-bar'
import { columns } from './columns'
import type { LeadWithAssignee, ProfileRow } from '@/types'

type Props = {
  data: LeadWithAssignee[]
  totalCount: number
  page: number
  pageSize: number
  staff: ProfileRow[]
  canBulkEdit: boolean
  isAdmin: boolean
}

export function LeadsTable({ data, totalCount, page, pageSize, staff, canBulkEdit, isAdmin }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize))
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const visibleColumns = canBulkEdit ? columns : columns.filter((c) => c.id !== 'select')

  const currentSort = searchParams.get('sort') ?? 'created_at'
  const currentDir = searchParams.get('dir') === 'asc' ? 'asc' : 'desc'

  const table = useReactTable({
    data,
    columns: visibleColumns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount,
    enableRowSelection: canBulkEdit,
    getRowId: (row) => row.id,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
  })

  const selectedIds = Object.keys(rowSelection)

  function goToPage(next: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(next))
    router.push(`/leads?${params.toString()}`)
  }

  function toggleSort(columnId: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (currentSort === columnId) {
      params.set('dir', currentDir === 'asc' ? 'desc' : 'asc')
    } else {
      params.set('sort', columnId)
      params.set('dir', 'asc')
    }
    params.set('page', '1')
    router.push(`/leads?${params.toString()}`)
  }

  const SORTABLE_IDS = new Set(['name', 'business_name', 'project_type', 'budget', 'estado', 'created_at'])

  return (
    <div className="space-y-4">
      {canBulkEdit && selectedIds.length > 0 && (
        <BulkActionsBar leadIds={selectedIds} staff={staff} isAdmin={isAdmin} onDone={() => setRowSelection({})} />
      )}

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const columnId = header.column.id
                  const sortable = SORTABLE_IDS.has(columnId)
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : sortable ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(columnId)}
                          className="flex items-center gap-1 hover:text-foreground"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {currentSort === columnId ? (
                            currentDir === 'asc' ? (
                              <ArrowUp className="size-3.5" />
                            ) : (
                              <ArrowDown className="size-3.5" />
                            )
                          ) : (
                            <ArrowUpDown className="size-3.5 opacity-40" />
                          )}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  data-state={row.getIsSelected() ? 'selected' : undefined}
                  onClick={() => router.push(`/leads/${row.original.id}`)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={visibleColumns.length} className="h-24 text-center text-muted-foreground">
                  No hay leads que coincidan con la búsqueda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {totalCount} lead{totalCount === 1 ? '' : 's'} · página {page} de {pageCount}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
            <ChevronLeft className="size-4" />
            Anterior
          </Button>
          <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => goToPage(page + 1)}>
            Siguiente
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

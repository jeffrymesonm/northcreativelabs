'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LEAD_STATUS_LABELS, LEAD_STATUS_OPTIONS } from '@/lib/constants/leads'

function pushParams(router: ReturnType<typeof useRouter>, params: URLSearchParams, updates: Record<string, string>) {
  const next = new URLSearchParams(params.toString())
  for (const [key, value] of Object.entries(updates)) {
    if (value) next.set(key, value)
    else next.delete(key)
  }
  next.set('page', '1')
  router.push(`/leads?${next.toString()}`)
}

export function LeadsToolbar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')

  const debouncedSearch = useDebouncedCallback((value: string) => {
    pushParams(router, searchParams, { q: value })
  }, 350)

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Input
        placeholder="Buscar por nombre, empresa o contacto…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          debouncedSearch(e.target.value)
        }}
        className="sm:max-w-xs"
      />
      <Select
        value={searchParams.get('estado') ?? 'todos'}
        onValueChange={(value) => pushParams(router, searchParams, { estado: !value || value === 'todos' ? '' : value })}
      >
        <SelectTrigger className="sm:w-56">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos los estados</SelectItem>
          {LEAD_STATUS_OPTIONS.map((status) => (
            <SelectItem key={status} value={status}>
              {LEAD_STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

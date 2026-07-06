'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'
import type { LeadRow } from '@/types'

/**
 * Escucha nuevos leads en tiempo real (Supabase Realtime) y:
 *  - muestra una notificación dentro del panel
 *  - refresca los Server Components de la ruta actual (contadores del
 *    Dashboard, tabla de /leads) sin recargar la página
 *
 * Montado una sola vez en el layout del dashboard, activo en todas las
 * páginas autenticadas. RLS ya garantiza que solo el staff recibe estos
 * eventos (anon no tiene SELECT sobre `leads`).
 */
export function LeadNotifications() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('leads-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'leads' },
        (payload) => {
          const lead = payload.new as LeadRow
          toast.info(`Nuevo lead: ${lead.name}`, {
            description: lead.business_name ?? lead.needs,
          })
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [router])

  return null
}

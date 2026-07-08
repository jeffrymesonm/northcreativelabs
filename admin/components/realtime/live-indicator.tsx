'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { cn } from '@/lib/utils'

/**
 * Punto ámbar que refleja el estado real del canal de Supabase Realtime
 * (el mismo tipo de conexión que usa LeadNotifications) — no es decorativo,
 * si el realtime se cae el indicador dice "conectando" de verdad.
 */
export function LiveIndicator() {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting')

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel('leads-live-status').subscribe((channelStatus) => {
      if (channelStatus === 'SUBSCRIBED') setStatus('connected')
      else if (channelStatus === 'CHANNEL_ERROR' || channelStatus === 'TIMED_OUT' || channelStatus === 'CLOSED') {
        setStatus('error')
      }
    })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const connected = status === 'connected'

  return (
    <span
      className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex"
      title={connected ? 'Conectado en tiempo real' : 'Conectando…'}
    >
      <span className="relative flex size-2">
        {connected && (
          <span className="absolute inline-flex size-full animate-signal-pulse rounded-full bg-signal" />
        )}
        <span className={cn('relative inline-flex size-2 rounded-full', connected ? 'bg-signal' : 'bg-muted-foreground/50')} />
      </span>
      En vivo
    </span>
  )
}

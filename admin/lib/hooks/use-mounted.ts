'use client'

import { useSyncExternalStore } from 'react'

function subscribe() {
  return () => {}
}

/**
 * true solo después de la hidratación. Se usa con useSyncExternalStore (no
 * un useEffect + setState) para evitar el aviso de React Compiler sobre
 * setState síncrono dentro de un efecto.
 */
export function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )
}

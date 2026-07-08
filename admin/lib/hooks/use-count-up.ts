'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Anima un número entero desde su valor anterior hasta `target`. En el
 * primer render solo cuenta desde 0 (efecto de carga); en renders
 * posteriores, si el valor sube, además marca `pulsing` por un instante —
 * así las tarjetas de stats reaccionan visualmente cuando entra un lead
 * nuevo por Realtime, en vez de solo saltar al número nuevo.
 */
export function useCountUp(target: number, duration = 700) {
  const [value, setValue] = useState(0)
  const [pulsing, setPulsing] = useState(false)
  const prevTarget = useRef<number | null>(null)
  const pulseTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    const reduceMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const from = prevTarget.current ?? 0
    const isFirstRender = prevTarget.current === null
    const to = target
    prevTarget.current = target

    if (reduceMotion || from === to) {
      setValue(to)
      return
    }

    if (!isFirstRender && to > from) {
      setPulsing(true)
      clearTimeout(pulseTimeout.current)
      pulseTimeout.current = setTimeout(() => setPulsing(false), 1400)
    }

    const start = performance.now()
    let frame: number

    function tick(now: number) {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(from + (to - from) * eased))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(frame)
  }, [target, duration])

  useEffect(() => () => clearTimeout(pulseTimeout.current), [])

  return { value, pulsing }
}

import { useEffect, useRef } from 'react'

const GLITCH_MS = 300

/**
 * Retro/CRT temporal effects — docs/retro-crt-plan.md Layer D.
 *
 * Returns a ref to attach to the board frame (.dungeon-frame). Do NOT attach
 * it to .app: these classes animate `filter`/`transform`, which creates a
 * containing block and would reparent the fixed-position modals.
 *
 * Class toggling is imperative rather than state-driven — these are transient
 * presentation effects, so routing them through React state would only cause
 * cascading re-renders of the whole board.
 */
export function useCrtEffects(activePlayerIndex: number, suppressed: boolean, enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null)
  const prevPlayer = useRef(activePlayerIndex)

  // Channel-change glitch on turn transitions.
  useEffect(() => {
    if (prevPlayer.current === activePlayerIndex) return
    prevPlayer.current = activePlayerIndex

    const el = ref.current
    // Plan §11: never glitch while a question or blocking modal is on screen.
    if (!el || !enabled || suppressed) return

    el.classList.add('crt-glitch')
    const t = setTimeout(() => el.classList.remove('crt-glitch'), GLITCH_MS)
    return () => {
      clearTimeout(t)
      el.classList.remove('crt-glitch')
    }
  }, [activePlayerIndex, suppressed, enabled])

  return ref
}

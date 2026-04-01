/**
 * Bidirectional scroll synchronization between two scroll containers.
 *
 * Uses proportional sync: if panel A is scrolled to 40% of its
 * scrollable range, panel B is set to 40% of its own range.
 * This works even when the two panels have different total heights.
 */

import { useEffect, useRef, useCallback, type RefCallback } from "react"

type ScrollRole = "sidebar" | "content"

const registry: Record<ScrollRole, HTMLElement | null> = {
  sidebar: null,
  content: null,
}

let activeSource: ScrollRole | null = null
let rafId: number | null = null

function handleScroll(source: ScrollRole) {
  if (activeSource && activeSource !== source) return

  activeSource = source
  const from = registry[source]
  const to = registry[source === "sidebar" ? "content" : "sidebar"]

  if (!from || !to) {
    activeSource = null
    return
  }

  const maxFrom = from.scrollHeight - from.clientHeight
  const maxTo = to.scrollHeight - to.clientHeight

  if (maxFrom <= 0 || maxTo <= 0) {
    activeSource = null
    return
  }

  const ratio = from.scrollTop / maxFrom
  to.scrollTop = ratio * maxTo

  if (rafId !== null) cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(() => {
    activeSource = null
    rafId = null
  })
}

/**
 * Returns a ref callback that registers the element for scroll sync
 * and cleans up on unmount.
 */
export function useScrollSyncRef(role: ScrollRole): RefCallback<HTMLElement> {
  const listenerRef = useRef<(() => void) | null>(null)

  const cleanup = useCallback(() => {
    const el = registry[role]
    if (el && listenerRef.current) {
      el.removeEventListener("scroll", listenerRef.current)
    }
    registry[role] = null
    listenerRef.current = null
  }, [role])

  useEffect(() => cleanup, [cleanup])

  return useCallback(
    (el: HTMLElement | null) => {
      cleanup()
      if (!el) return

      registry[role] = el
      const listener = () => handleScroll(role)
      listenerRef.current = listener
      el.addEventListener("scroll", listener, { passive: true })
    },
    [role, cleanup],
  )
}

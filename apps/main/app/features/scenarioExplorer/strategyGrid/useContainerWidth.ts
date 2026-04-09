"use client"

import { useState, useEffect, useCallback, type RefObject } from "react"

/**
 * Observes the inline size of a container element via ResizeObserver.
 * Returns the current width in pixels (0 before the first measurement).
 */
export function useContainerWidth(ref: RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(0)

  const handleResize = useCallback((entries: ResizeObserverEntry[]) => {
    for (const entry of entries) {
      const inlineSize =
        entry.borderBoxSize?.[0]?.inlineSize ?? entry.contentRect.width
      setWidth(inlineSize)
    }
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new ResizeObserver(handleResize)
    observer.observe(el, { box: "border-box" })

    // Measure immediately
    setWidth(el.getBoundingClientRect().width)

    return () => observer.disconnect()
  }, [ref, handleResize])

  return width
}

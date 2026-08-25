/**
 * useScrollDownIndicator - Tracks whether a vertically-scrollable element
 * currently has more content hidden below than what's visible, so a
 * caller can show a "there's more, scroll down" affordance instead of
 * leaving users to discover overflow by accident.
 *
 * Vertical sibling of useScrollRightIndicator (scenarioExplorer/explorer/
 * tools/hooks/) - no shared/generic version of this exists yet, so this
 * mirrors that one's shape rather than generalizing it.
 *
 * Unlike the horizontal version, this one takes the scrollable element's
 * ref as a parameter instead of creating its own: the target element here
 * (the storyboard's right column) already has other effects attached to
 * its own ref elsewhere, so this attaches its own scroll listener directly
 * rather than asking the caller to wire an `onScroll` prop that something
 * else might also need.
 */

import { useCallback, useEffect, useState } from "react"
import type { DependencyList, RefObject } from "react"

export function useScrollDownIndicator<T extends HTMLElement>(
  scrollRef: RefObject<T | null>,
  deps: DependencyList = [],
) {
  const [canScrollDown, setCanScrollDown] = useState(false)

  const checkOverflow = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollDown(el.scrollHeight - el.clientHeight - el.scrollTop > 1)
  }, [scrollRef])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    checkOverflow()
    const observer = new ResizeObserver(checkOverflow)
    observer.observe(el)
    el.addEventListener("scroll", checkOverflow, { passive: true })
    return () => {
      observer.disconnect()
      el.removeEventListener("scroll", checkOverflow)
    }
    // deps is a caller-supplied list we can't statically verify; that's the point.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkOverflow, scrollRef, ...deps])

  return { canScrollDown, checkOverflow }
}

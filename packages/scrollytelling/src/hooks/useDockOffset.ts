"use client"

/**
 * useDockOffset - Scroll-driven offset that "docks" an element to another element's position.
 *
 * Returns a MotionValue<number> representing the translateY offset needed to make a
 * fixed-position element scroll away with the page once a reference element reaches
 * the viewport top. This creates the "stopped in place" effect where a floating element
 * visually anchors to a panel and scrolls off with it.
 *
 * Reads layout inside requestAnimationFrame to avoid forced synchronous reflow.
 * All writes go through a MotionValue so Framer Motion can update the DOM directly
 * without React re-renders.
 *
 * @param dockRef - The element to dock to. Once its top scrolls above y=0,
 *   the returned offset equals rect.top (negative), moving the consumer upward
 *   in lockstep with the page.
 * @param containerRef - Optional fallback. When dockRef is not provided, docks
 *   to this container's bottom edge reaching the bottom of the viewport.
 *
 * @example
 * // Headline docks to the third panel — scrolls away once the panel's top
 * // hits the viewport top.
 * const dockOffsetMV = useDockOffset(thirdPanelRef, containerRef)
 *
 * <motion.div style={{ y: dockOffsetMV }}>...</motion.div>
 */

import { useEffect, useRef } from "react"
import type { RefObject } from "react"
import { useMotionValue } from "@repo/motion"
import type { MotionValue } from "@repo/motion"

export function useDockOffset(
  dockRef?: RefObject<HTMLElement | null>,
  containerRef?: RefObject<HTMLElement | null>,
): MotionValue<number> {
  const offsetMV = useMotionValue(0)
  const rafRef = useRef<number | null>(null)

  // Store refs in a stable ref so the effect doesn't close over stale values
  const dockRefRef = useRef(dockRef)
  dockRefRef.current = dockRef
  const containerRefRef = useRef(containerRef)
  containerRefRef.current = containerRef

  useEffect(() => {
    const handleScroll = () => {
      // Cancel any pending frame — we only need the latest position
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }

      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        let offset = 0

        const dock = dockRefRef.current?.current
        const container = containerRefRef.current?.current

        if (dock) {
          // Dock when the panel's TOP reaches the viewport top.
          // rect.top is negative once the panel top has scrolled above y=0,
          // so the consumer moves up in exact lockstep with the panel's top edge.
          const rect = dock.getBoundingClientRect()
          if (rect.top < 0) {
            offset = rect.top
          }
        } else if (container) {
          // Fallback: dock to the container's bottom edge reaching viewport bottom.
          const rect = container.getBoundingClientRect()
          const viewportHeight = window.innerHeight
          if (rect.bottom < viewportHeight) {
            offset = rect.bottom - viewportHeight
          }
        }

        offsetMV.set(offset)
      })
    }

    // Measure immediately so the initial value is correct (e.g. after HMR
    // when the page is already scrolled)
    handleScroll()

    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", handleScroll)
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [offsetMV])

  return offsetMV
}

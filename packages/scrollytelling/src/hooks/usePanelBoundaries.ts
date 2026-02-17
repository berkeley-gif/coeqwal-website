"use client"

/**
 * usePanelBoundaries - Compute scroll progress boundaries from actual DOM positions.
 *
 * Instead of hardcoding magic numbers like 0.86, this hook measures each panel's
 * offsetTop against the container's total scroll range to produce progress fractions
 * that are always correct regardless of viewport size or panel heights.
 *
 * Uses ResizeObserver to stay current when layout changes.
 *
 * @example
 * const panel1Ref = useRef(null)
 * const panel2Ref = useRef(null)
 * const panel3Ref = useRef(null)
 *
 * const boundaries = usePanelBoundaries(containerRef, [panel1Ref, panel2Ref, panel3Ref])
 * // boundaries.panels[2].start — progress when panel 3 top reaches viewport top
 * // boundaries.panels[2].mid   — progress at panel 3 midpoint
 * // boundaries.panels[2].end   — progress when panel 3 bottom reaches viewport top
 */

import { useState, useEffect, useRef } from "react"
import type { RefObject } from "react"

export interface PanelBoundary {
  /** Progress (0-1) when this panel's top reaches the viewport top */
  start: number
  /** Progress (0-1) at the midpoint of this panel */
  mid: number
  /** Progress (0-1) when this panel's bottom reaches the viewport top */
  end: number
}

export interface PanelBoundaries {
  /** Boundary data for each panel, in the same order as the refs */
  panels: PanelBoundary[]
  /** Whether boundaries have been measured (false on first render before layout) */
  ready: boolean
}

const EMPTY_BOUNDARIES: PanelBoundaries = { panels: [], ready: false }

export function usePanelBoundaries(
  containerRef: RefObject<HTMLElement | null>,
  panelRefs: RefObject<HTMLElement | null>[],
): PanelBoundaries {
  const [boundaries, setBoundaries] =
    useState<PanelBoundaries>(EMPTY_BOUNDARIES)

  // Store panelRefs in a stable ref so the effect doesn't re-run when the array is recreated
  const panelRefsRef = useRef(panelRefs)
  panelRefsRef.current = panelRefs

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const measure = () => {
      const refs = panelRefsRef.current
      const containerRect = container.getBoundingClientRect()
      const scrollY = window.scrollY
      const containerTop = containerRect.top + scrollY
      const containerHeight = container.scrollHeight
      const viewportHeight = window.innerHeight

      // Total scroll range matches Framer Motion useScroll with offset ["start start", "end end"]
      const scrollRange = containerHeight - viewportHeight
      if (scrollRange <= 0) return

      const panels: PanelBoundary[] = refs.map((ref) => {
        const el = ref.current
        if (!el) return { start: 0, mid: 0, end: 0 }

        // Use getBoundingClientRect for accurate position regardless of DOM nesting
        const elRect = el.getBoundingClientRect()
        const panelTop = elRect.top + scrollY - containerTop
        const panelHeight = elRect.height

        const start = panelTop / scrollRange
        const end = (panelTop + panelHeight) / scrollRange
        const mid = (start + end) / 2

        return { start, mid, end }
      })

      setBoundaries((prev) => {
        // Only update if values actually changed to avoid unnecessary re-renders
        if (
          prev.ready &&
          prev.panels.length === panels.length &&
          prev.panels.every(
            (p, i) =>
              Math.abs(p.start - (panels[i]?.start ?? 0)) < 0.0001 &&
              Math.abs(p.end - (panels[i]?.end ?? 0)) < 0.0001,
          )
        ) {
          return prev
        }
        return { panels, ready: true }
      })
    }

    // Initial measurement after a frame to ensure layout is complete
    requestAnimationFrame(measure)

    // Re-measure on container resize
    const observer = new ResizeObserver(() => {
      requestAnimationFrame(measure)
    })
    observer.observe(container)

    // Viewport height changes affect scrollRange
    window.addEventListener("resize", measure)

    return () => {
      observer.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [containerRef])

  return boundaries
}

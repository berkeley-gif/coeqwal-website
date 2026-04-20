"use client"

/**
 * useMeetingProgress - Scroll progress at which two DOM elements' edges meet.
 *
 * Returns a number (0–1) representing the scroll progress within
 * `containerRef` at which the specified edge of `refA` will reach the same
 * viewport Y position as the specified edge of `refB` (i.e. they meet).
 *
 * Re-computes via ResizeObserver so it stays accurate across layout changes.
 *
 * @example
 * // Progress when VideoHero's bottom reaches the MorphingHeadline's top
 * const crossfadeAt = useMeetingProgress(containerRef, panel1Ref, headlineRef, {
 *   edgeA: "bottom",
 *   edgeB: "top",
 * })
 */

import { useState, useEffect, useRef } from "react"
import type { RefObject } from "react"

export type ElementEdge = "top" | "bottom" | "center"

export interface MeetingProgressOptions {
  /** Which edge of refA to track (default: "bottom") */
  edgeA?: ElementEdge
  /** Which edge of refB to track (default: "top") */
  edgeB?: ElementEdge
}

function getEdgeY(rect: DOMRect, edge: ElementEdge): number {
  if (edge === "top") return rect.top
  if (edge === "bottom") return rect.bottom
  return rect.top + rect.height / 2
}

function getScrollRate(el: Element): number {
  const pos = getComputedStyle(el).position
  return pos === "fixed" ? 0 : 1
}

export function useMeetingProgress(
  containerRef: RefObject<HTMLElement | null>,
  refA: RefObject<HTMLElement | null>,
  refB: RefObject<HTMLElement | null>,
  options: MeetingProgressOptions = {},
): number {
  const [progress, setProgress] = useState(0)

  const optsRef = useRef(options)
  optsRef.current = options

  // Keep the last committed value in a ref so we can skip no-op updates
  // that only differ by sub-pixel rounding. Without this guard the
  // ResizeObserver → setProgress → re-render → layout shift → observer
  // cycle can exceed React's update depth limit.
  const lastValueRef = useRef(0)

  useEffect(() => {
    const measure = () => {
      const container = containerRef.current
      const elA = refA.current
      const elB = refB.current
      if (!container || !elA || !elB) return

      const scrollRange = container.scrollHeight - window.innerHeight
      if (scrollRange <= 0) return

      const { edgeA = "bottom", edgeB = "top" } = optsRef.current
      const rectA = elA.getBoundingClientRect()
      const rectB = elB.getBoundingClientRect()
      const scrollY = window.scrollY

      const edgeAY = getEdgeY(rectA, edgeA)
      const edgeBY = getEdgeY(rectB, edgeB)

      const rateA = getScrollRate(elA)
      const rateB = getScrollRate(elB)
      const rateDiff = rateB - rateA

      let meetingScrollY: number
      if (rateDiff === 0) {
        meetingScrollY = edgeBY <= edgeAY ? 0 : scrollRange
      } else {
        const deltaScroll = (edgeBY - edgeAY) / rateDiff
        meetingScrollY = scrollY + deltaScroll
      }

      const next = Math.max(0, Math.min(1, meetingScrollY / scrollRange))
      if (Math.abs(next - lastValueRef.current) > 1e-4) {
        lastValueRef.current = next
        setProgress(next)
      }
    }

    requestAnimationFrame(measure)

    // Observe the container plus refA and refB. Observing the ref
    // elements is important when one of them is a dynamic-size
    // marker (e.g. a viewport-center marker whose height is set
    // from measured headline height after mount) — without it the
    // initial measurement captures the pre-measured size and never
    // updates. It also makes the hook self-healing against font
    // loads, text changes, and reflows in the tracked elements.
    const observer = new ResizeObserver(() => requestAnimationFrame(measure))
    const container = containerRef.current
    if (container) observer.observe(container)
    const elA = refA.current
    if (elA) observer.observe(elA)
    const elB = refB.current
    if (elB) observer.observe(elB)
    window.addEventListener("resize", measure)

    return () => {
      observer.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [containerRef, refA, refB])

  return progress
}

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
        // Same rate: relative gap is constant.
        // If already meeting (or past), return 0; otherwise they never will.
        meetingScrollY = edgeBY <= edgeAY ? 0 : scrollRange
      } else {
        const deltaScroll = (edgeBY - edgeAY) / rateDiff
        meetingScrollY = scrollY + deltaScroll
      }

      setProgress(Math.max(0, Math.min(1, meetingScrollY / scrollRange)))
    }

    requestAnimationFrame(measure)

    const observer = new ResizeObserver(() => requestAnimationFrame(measure))
    const container = containerRef.current
    if (container) observer.observe(container)
    window.addEventListener("resize", measure)

    return () => {
      observer.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [containerRef, refA, refB])

  return progress
}

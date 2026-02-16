"use client"

/**
 * useScrollProgress - Core scroll progress tracking hook
 *
 * Returns a MotionValue (0-1) representing scroll progress through a target element.
 * If no ref is provided, attempts to use the nearest ScrollSection context.
 *
 * @example
 * // With a ref
 * const sectionRef = useRef(null)
 * const progress = useScrollProgress(sectionRef)
 *
 * // With context (inside a ScrollSection)
 * const progress = useScrollProgress()
 */

import { useRef, useContext } from "react"
import { useScroll } from "@repo/motion"
import type { RefObject } from "react"
import type { MotionValue } from "framer-motion"
import type { ScrollProgressOptions } from "../types"
import { ScrollSectionContext } from "../components/ScrollSection"

export function useScrollProgress(
  targetRef?: RefObject<HTMLElement | null>,
  options: ScrollProgressOptions = {},
): MotionValue<number> {
  const {
    offset = ["start start", "end end"],
    layoutEffect = false,
  } = options

  const context = useContext(ScrollSectionContext)
  const fallbackRef = useRef<HTMLElement>(null)

  // If no ref provided and we're inside a ScrollSection, use context
  if (!targetRef && context) {
    return context.progress
  }

  const ref = targetRef || fallbackRef

  const { scrollYProgress } = useScroll({
    target: ref,
    offset,
    layoutEffect,
  })

  return scrollYProgress
}

import type { RefObject } from "react"
import type { MotionValue } from "@repo/motion"

/** Progress range as [start, end] where values are 0-1 */
export type ProgressRange = [number, number]

/** Scroll phase names */
export type ScrollPhase = "before" | "enter" | "hold" | "exit" | "after"

/** Phase thresholds configuration */
export interface PhaseThresholds {
  /** Progress range for the enter phase (element animates in) */
  enter: ProgressRange
  /** Progress range for the hold phase (element stays visible) */
  hold?: ProgressRange
  /** Progress range for the exit phase (element animates out) */
  exit?: ProgressRange
}

/** Animation type for ScrollElement */
export type AnimationType = "fade" | "slideUp" | "slideLeft" | "none"

/** Framer Motion scroll offset - use string tuples like ["start start", "end end"] */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ScrollOffset = any

/** Options for useScrollProgress hook */
export interface ScrollProgressOptions {
  /** Framer Motion scroll offset (default: ["start start", "end end"]) */
  offset?: ScrollOffset
  /**
   * Required when ref is defined in a parent component.
   * Set to false to use useEffect instead of useLayoutEffect.
   * @see https://github.com/motiondivision/motion/issues/2483
   */
  layoutEffect?: boolean
}

/** Context value shared by ScrollSection with children */
export interface ScrollSectionContextValue {
  /** Scroll progress MotionValue (0-1) through the section */
  progress: MotionValue<number>
  /** Ref to the scroll section container */
  sectionRef: RefObject<HTMLElement | null>
}

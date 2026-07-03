"use client"

/**
 * useScrollValue - Map scroll progress to any animated value
 *
 * Thin wrapper over Framer Motion's useTransform with clearer naming
 * for scroll-linked use cases.
 *
 * Supports an optional `ease` function to apply non-linear easing within
 * each keyframe segment. This lets you slow down the start/end of a transition
 * without adding more scroll distance.
 *
 * @example
 * const progress = useScrollProgress(ref)
 * const opacity = useScrollValue(progress, [0.2, 0.4], [0, 1])
 * const y = useScrollValue(progress, [0, 0.3], [100, 0], { ease: easeOut })
 */

import { useTransform, MotionValue } from "@repo/motion"
import type { EasingFunction } from "@repo/motion"

export interface ScrollValueOptions {
  /**
   * Easing function(s) applied to each keyframe segment.
   * A single function applies to all segments. An array applies one per segment.
   * Common easings: easeIn, easeOut, easeInOut (import from @repo/scrollytelling).
   */
  ease?: EasingFunction | EasingFunction[]
}

export function useScrollValue(
  progress: MotionValue<number>,
  inputRange: number[],
  outputRange: number[],
  options?: ScrollValueOptions,
): MotionValue<number> {
  return useTransform(progress, inputRange, outputRange, options)
}

/**
 * useScrollString - Map scroll progress to string values (e.g., colors, transforms)
 */
export function useScrollString(
  progress: MotionValue<number>,
  inputRange: number[],
  outputRange: string[],
  options?: ScrollValueOptions,
): MotionValue<string> {
  return useTransform(progress, inputRange, outputRange, options)
}

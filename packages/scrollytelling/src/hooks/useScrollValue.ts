"use client"

/**
 * useScrollValue - Map scroll progress to any animated value
 *
 * Thin wrapper over Framer Motion's useTransform with clearer naming
 * for scroll-linked use cases.
 *
 * @example
 * const progress = useScrollProgress(ref)
 * const opacity = useScrollValue(progress, [0.2, 0.4], [0, 1])
 * const y = useScrollValue(progress, [0, 0.3], [100, 0])
 */

import { useTransform, MotionValue } from "@repo/motion"

export function useScrollValue(
  progress: MotionValue<number>,
  inputRange: number[],
  outputRange: number[],
): MotionValue<number> {
  return useTransform(progress, inputRange, outputRange)
}

/**
 * useScrollString - Map scroll progress to string values (e.g., colors, transforms)
 */
export function useScrollString(
  progress: MotionValue<number>,
  inputRange: number[],
  outputRange: string[],
): MotionValue<string> {
  return useTransform(progress, inputRange, outputRange)
}

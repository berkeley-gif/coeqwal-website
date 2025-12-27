/**
 * Constants for scroll choreography
 * Centralized to ensure consistency and easy adjustments
 */

/** Animation durations (in milliseconds) */
export const ANIMATION_DURATION = {
  /** Standard fade animations */
  FADE: 600,
  /** Layer fade animations (slightly longer for smoothness) */
  LAYER_FADE: 800,
  /** Camera movement transitions */
  CAMERA: 1500,
  /** Smooth easing transitions */
  EASE: 2000,
} as const

/** Animation easing functions */
export const EASING = {
  /** Smooth ease-out for natural deceleration */
  EASE_OUT: (t: number) => t * (2 - t),
} as const

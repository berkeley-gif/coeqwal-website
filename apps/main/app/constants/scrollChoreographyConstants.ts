/**
 * Constants for scroll choreography
 * Centralized to ensure consistency and easy adjustments
 */

// ==================== SPACING CONSTANTS ====================

/** Vertical spacing between panels (in viewport height units) */
export const PANEL_SPACING = {
  /** Standard spacing between most panels */
  STANDARD: "75vh",
  /** Extra spacing for major transitions */
  LARGE: "100vh",
  /** Minimal spacing for closely related content */
  SMALL: "50vh",
} as const

/** Sticky section heights for scroll-pinned animations */
export const STICKY_HEIGHTS = {
  /** Rivers panel - extended for smooth animation */
  RIVERS: "200vh",
  /** Baseline scenario cards */
  SCENARIOS: "300vh",
} as const

/** Entrance/exit ramps for graceful panel appearances */
export const ENTRANCE_RAMPS = {
  /** First panel entrance ramp */
  FIRST_PANEL: "80vh",
  /** Standard panel transition space */
  STANDARD: "40vh",
} as const

// ==================== ANIMATION TIMINGS ====================

/** Animation durations (in milliseconds) */
export const ANIMATION_DURATION = {
  /** Standard fade animations */
  FADE: 600,
  /** Camera movement transitions */
  CAMERA: 1500,
  /** Smooth easing transitions */
  EASE: 2000,
} as const

/** Animation easing functions */
export const EASING = {
  /** Smooth ease-out for natural deceleration */
  EASE_OUT: (t: number) => t * (2 - t),
  /** Custom cubic bezier for polished motion */
  CUSTOM: [0.25, 0.1, 0.25, 1] as const,
} as const

// ==================== SCROLL PROGRESS RANGES ====================

/** Progress ranges for river animation within sticky panel */
export const RIVER_ANIMATION = {
  /** Start drawing rivers at 20% of panel scroll */
  DRAW_START: 0.2,
  /** Finish drawing rivers at 70% of panel scroll */
  DRAW_END: 0.7,
} as const

/** Progress ranges for basin/inflow fade-out during river animation */
export const BASIN_FADE = {
  /** Start fading out basins at 15% of panel scroll */
  FADE_START: 0.15,
  /** Finish fading out basins at 60% of panel scroll (maximum overlap with rivers) */
  FADE_END: 0.6,
} as const

/** Progress ranges for label fade-in timing */
export const LABEL_FADE = {
  /** River labels fade in from 30% to 50% of animation */
  RIVER_START: 0.3,
  RIVER_END: 0.5,
  /** Delta marker appears late in animation (80-95%) */
  DELTA_START: 0.8,
  DELTA_END: 0.95,
} as const

// ==================== INTERSECTION OBSERVER CONFIG ====================

/** Intersection observer thresholds for panel detection */
export const OBSERVER_THRESHOLDS = {
  /** Early trigger for graceful entrances */
  EARLY: 0.1,
  /** Standard midpoint trigger */
  STANDARD: 0.5,
  /** Delayed trigger for intentional lag */
  LATE: 0.7,
} as const

// ==================== OPACITY VALUES ====================

/** Standard opacity values for map features */
export const OPACITY = {
  /** Fully visible features */
  VISIBLE: 0.9,
  /** Hidden features */
  HIDDEN: 0,
  /** Semi-transparent features */
  SEMI: 0.5,
} as const

// ==================== UTILITY ====================

/** Clamp a value between min and max */
export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value))

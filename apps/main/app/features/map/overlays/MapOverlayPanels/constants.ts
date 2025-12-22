/**
 * MapOverlayPanels constants
 *
 * Animation thresholds and panel configuration for the scroll-driven storytelling.
 */

/**
 * Animation thresholds for scenario-intro section panels.
 * Values represent progress (0-1) through the section.
 */
export const PANEL_ANIMATION_THRESHOLDS = {
  strategyInfo: {
    fadeStart: 0.12,
    fadeEnd: 0.18,
  },
  keyOperations: {
    fadeStart: 0.28,
    fadeEnd: 0.34,
  },
  keyOutcomes: {
    fadeStart: 0.48,
    fadeEnd: 0.54,
  },
  summary: {
    fadeStart: 0.48,
    fadeEnd: 0.54,
  },
} as const

/**
 * Panel position configuration
 */
export const PANEL_POSITIONS = {
  paragraphTop: "15vh",
} as const

/**
 * Section IDs used in the scrollama steps.
 * These map to the SectionId type in the store.
 */
export const SECTION_IDS = [
  "california",
  "central-valley",
  "basins",
  "watersheds",
  "arrows",
  "find-basin",
  "rivers",
  "delta",
  "distribution",
  "calsim",
  "coeqwal",
  "public-data",
  "scenario-intro",
  "scenario-conclusion",
] as const

export type ScrollSectionId = (typeof SECTION_IDS)[number]

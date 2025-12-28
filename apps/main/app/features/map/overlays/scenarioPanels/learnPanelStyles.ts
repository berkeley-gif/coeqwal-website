/**
 * Learn mode panel styles - card styles for scenario panels in the Learn section.
 *
 * Shared styles (used by both Learn and Explore) are in scenarios/components/shared/scenarioStyles.ts
 */

import type { Theme, SxProps } from "@repo/ui/mui"

/**
 * Get base panel container styles
 * Used by all scenario panels in Learn mode
 */
export const getLearnPanelBaseStyles = (theme: Theme): SxProps<Theme> => ({
  backgroundColor: theme.background.whiteOverlay[95],
  borderRadius: theme.borderRadius.none,
  padding: theme.space.panel.xs,
  pointerEvents: "auto",
})

/**
 * Standard panel max-width breakpoints
 * These are fixed values for consistent panel sizing across the app
 * TODO: these are currently dummy breakpoints waiting for me to figure out.
 */
export const learnPanelMaxWidth = {
  xs: "100%",
  sm: "360px",
  md: "420px",
  lg: "460px",
  xl: "500px",
} as const

/**
 * StrategyRow styles - shared styles for strategy panels
 */

import type { Theme } from "@repo/ui/mui"

/**
 * Base panel container styles
 * Used by all strategy panels in the Learn section
 */
export const panelBaseStyles = {
  backgroundColor: "rgba(255, 255, 255, 0.95)",
  borderRadius: 0,
  padding: { xs: 2, sm: 2.5, md: 3 },
  boxSizing: "border-box",
  pointerEvents: "auto",
} as const

/**
 * Standard panel max-width breakpoints
 */
export const panelMaxWidth = {
  xs: "100%",
  sm: "360px",
  md: "420px",
  lg: "460px",
  xl: "500px",
} as const

/**
 * Get title typography styles
 */
export const getTitleStyles = (theme: Theme, clickable: boolean = false) => ({
  fontWeight: theme.typography.fontWeightMedium,
  fontSize: theme.typography.body2.fontSize,
  lineHeight: 1.3,
  color: theme.palette.grey[900],
  ...(clickable && {
    cursor: "pointer",
    "&:hover": {
      color: theme.palette.blue.bright,
    },
  }),
})

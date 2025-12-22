/**
 * Shared styles for StrategyRow panel components
 *
 * These styles are shared between StrategyInfoPanel, KeyOperationsPanel,
 * KeyOutcomesPanel, and StrategyRow.
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

/**
 * Get description typography styles
 */
export const getDescriptionStyles = (theme: Theme) => ({
  lineHeight: 1.4,
  fontSize: theme.typography.nav.fontSize,
  color: theme.palette.grey[700],
})

/**
 * Icon container styles for key operations
 */
export const iconContainerStyles = {
  display: "flex",
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 1.5,
  alignItems: "center",
} as const

/**
 * Individual icon box styles (size responsive)
 */
export const getIconBoxStyles = (theme: Theme) => ({
  width: { xs: theme.spacing(4), lg: theme.spacing(5) },
  height: { xs: theme.spacing(4), lg: theme.spacing(5) },
  cursor: "pointer",
})

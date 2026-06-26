"use client"

/**
 * tooltipSurface - The shared look for every tooltip and popover.
 *
 * Returns one style object (paper background, light border, radius, shadow,
 * padding, compact text) so those values do not drift between components. Pass
 * in `elevated` for free-floating overlays that need a stronger shadow.
 */

import { Theme } from "@mui/material/styles"

export interface TooltipSurfaceOptions {
  /** Use the larger shadow (for free-floating overlays rather than anchored tooltips) */
  elevated?: boolean
  /** Tighter padding and smaller text, for short single-line labels */
  compact?: boolean
}

export function tooltipSurface(
  theme: Theme,
  { elevated = false, compact = false }: TooltipSurfaceOptions = {},
) {
  const base = {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    border: theme.border.light,
    borderRadius: theme.borderRadius.md,
    boxShadow: elevated ? theme.shadow.lg : theme.shadow.md,
  }

  if (compact) {
    return {
      ...base,
      // padding (not the `p` shorthand) so this object is valid in both sx and theme styleOverrides
      padding: theme.spacing(theme.space.component.sm),
      ...theme.typography.compactCaption,
    }
  }

  return {
    ...base,
    padding: theme.spacing(theme.space.component.lg),
    ...theme.typography.compactSubtitle,
  }
}

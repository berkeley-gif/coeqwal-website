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
}

export function tooltipSurface(
  theme: Theme,
  { elevated = false }: TooltipSurfaceOptions = {},
) {
  return {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    border: theme.border.light,
    borderRadius: theme.borderRadius.md,
    boxShadow: elevated ? theme.shadow.lg : theme.shadow.md,
    p: theme.space.component.xl,
    ...theme.typography.compactSubtitle,
  }
}

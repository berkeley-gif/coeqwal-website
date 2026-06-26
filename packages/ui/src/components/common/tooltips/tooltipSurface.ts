"use client"

/**
 * tooltipSurface - The shared look for every tooltip and popover.
 *
 * Returns one style object (paper background, light border, radius, shadow,
 * padding, compact text) so those values do not drift between components. Pass
 * in `elevated` for free-floating overlays that need a stronger shadow.
 */

import { Theme } from "@mui/material/styles"

/**
 * Padding density:
 * - "compact" (8px): short single-line labels
 * - "default" (16px): standard hover hints
 * - "spacious" (24px): rich descriptions such as tier definitions
 */
export type TooltipDensity = "compact" | "default" | "spacious"

export interface TooltipSurfaceOptions {
  /** Use the larger shadow (for free-floating overlays rather than anchored tooltips) */
  elevated?: boolean
  /** Padding and text scale (default: "default") */
  density?: TooltipDensity
}

export function tooltipSurface(
  theme: Theme,
  { elevated = false, density = "default" }: TooltipSurfaceOptions = {},
) {
  const base = {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    border: theme.border.light,
    borderRadius: theme.borderRadius.md,
    boxShadow: elevated ? theme.shadow.lg : theme.shadow.md,
  }

  if (density === "compact") {
    return {
      ...base,
      // padding (not the `p` shorthand) so this object is valid in both sx and theme styleOverrides
      padding: theme.spacing(theme.space.component.sm),
      ...theme.typography.compactCaption,
    }
  }

  const padding =
    density === "spacious" ? theme.space.component.xl : theme.space.component.lg
  return {
    ...base,
    padding: theme.spacing(padding),
    ...theme.typography.compactSubtitle,
  }
}

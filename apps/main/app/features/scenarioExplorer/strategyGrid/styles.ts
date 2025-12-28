/**
 * StrategyGrid styles
 */

import type { Theme } from "@repo/ui/mui"

export const gridStyles = {
  /**
   * Main grid container
   */
  container: (showMapView: boolean, theme: Theme, compact?: boolean) => ({
    display: "grid",
    gridTemplateColumns: theme.scenarios.grid.columns,
    gap: compact
      ? theme.scenarios.grid.gap.compact
      : theme.scenarios.grid.gap.default,
    columnGap: theme.space.gap.lg,
    alignItems: "start",
    width: "100%",
    ...(showMapView && {
      maxHeight: "40vh",
      overflowY: "auto",
      overflowX: "hidden",
      pt: theme.space.component.sm,
    }),
  }),
} as const


/**
 * StrategyGrid styles
 *
 * Uses theme.scenarios for consistent styling across apps.
 * See packages/ui/src/themes/theme.tsx for style definitions.
 */

import type { Theme } from "@repo/ui/mui"

export const gridStyles = {
  /**
   * Main grid container
   * Uses theme.scenarios.grid for column configuration
   */
  container: (showMapView: boolean, theme: Theme, compact?: boolean) => ({
    display: "grid",
    gridTemplateColumns: theme.scenarios.grid.columns,
    gap: theme.spacing(compact
      ? theme.scenarios.grid.gap.compact
      : theme.scenarios.grid.gap.default),
    columnGap: theme.spacing(2),
    alignItems: "start",
    width: "100%",
    ...(showMapView && {
      maxHeight: "40vh",
      overflowY: "auto",
      overflowX: "hidden",
      pt: 1,
    }),
  }),

  /**
   * Operations icons row
   */
  operationsIcons: {
    display: "flex",
    gap: { xs: 0.5, md: 1 },
    alignItems: "center",
    flexDirection: { xs: "column", md: "row" },
    justifyContent: "flex-start",
  },

  /**
   * Single icon box
   * Uses theme.scenarios.icon.sizes for consistent sizing
   */
  iconBox: (showMapView: boolean, theme: Theme) => ({
    width: showMapView
      ? theme.spacing(theme.scenarios.icon.sizes.sm)
      : { xs: theme.spacing(theme.scenarios.icon.sizes.md), lg: theme.spacing(theme.scenarios.icon.sizes.lg) },
    height: showMapView
      ? theme.spacing(theme.scenarios.icon.sizes.sm)
      : { xs: theme.spacing(theme.scenarios.icon.sizes.md), lg: theme.spacing(theme.scenarios.icon.sizes.lg) },
    cursor: "pointer",
  }),

  /**
   * Container for outcome charts
   */
  outcomeChartsContainer: (theme: Theme) => ({
    gridColumn: { xs: "1 / -1", lg: "auto" },
    display: "grid",
    gridTemplateColumns: {
      xs: "repeat(3, 1fr)",
      lg: "repeat(auto-fit, minmax(60px, 1fr))",
    },
    gap: theme.spacing(1),
    mt: { xs: 2, lg: 0 },
    maxWidth: "100%",
  }),

  /**
   * Single outcome visualization box
   * Uses theme.scenarios.outcome for base styles and states
   */
  outcomeBox: (
    showMapView: boolean,
    isActive: boolean,
    isSelected: boolean,
    theme: Theme,
  ) => ({
    ...theme.scenarios.outcome.box,
    gap: showMapView ? 0.5 : 1,
    cursor: showMapView && isActive ? "pointer" : "default",
    ...(isActive ? theme.scenarios.outcome.states.active : theme.scenarios.outcome.states.inactive),
    ...(isSelected && theme.scenarios.outcome.states.selected),
    "&:hover": {
      ...(showMapView && isActive && theme.scenarios.outcome.states.hover),
    },
  }),

  /**
   * Outcome label text
   * Uses theme.scenarios.outcome.label for consistent text styling
   */
  outcomeLabel: (showMapView: boolean, isActive: boolean, theme: Theme) => ({
    ...theme.scenarios.outcome.label,
    color: isActive ? theme.palette.blue.darkest : theme.palette.grey[500],
    fontWeight: theme.typography.fontWeightRegular,
    fontSize: showMapView
      ? "0.6rem"
      : theme.typography.compact.caption.fontSize,
    lineHeight: theme.typography.compact.caption.lineHeight,
  }),
} as const

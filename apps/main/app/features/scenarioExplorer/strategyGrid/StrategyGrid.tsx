"use client"

/**
 * StrategyGrid - Scenario grid with outcome visualizations
 *
 * Orchestrates the display of scenarios in a grid layout with:
 * - Column headers (StrategyGridHeader)
 * - Scenario rows with outcomes (StrategyGridContent)
 * - Tooltip management for outcome info
 *
 * This is a fully controlled component that accepts all state as props.
 * Parent components are responsible for state management via useScenarioExplorerStore()
 * or useExploreUserWorkflowStore().
 *
 * @see StrategyGridHeader for header rendering
 * @see StrategyGridContent for content rendering
 * @see layoutConfig.ts for spacing constant documentation
 */

import React, { useState, useEffect } from "react"
import { Box, useTheme, useMediaQuery } from "@repo/ui/mui"
import { useTierTooltipState } from "../../tooltips/useTierTooltipState"
import { TierTooltipPortal } from "../../tooltips/TierTooltipPortal"
import { type StrategyGridProps } from "./types"
import { StrategyGridHeader } from "./StrategyGridHeader"
import { StrategyGridContent } from "./StrategyGridContent"

/**
 * StrategyGrid component - main grid orchestrator
 *
 * Supports three render modes:
 * - "all": Renders both headers and content (default)
 * - "headersOnly": Renders only column headers (for fixed header pattern)
 * - "contentOnly": Renders only scenario rows (for scrollable content)
 */
const StrategyGrid = React.memo(function StrategyGridComponent({
  getChartDataForScenario,
  outcomeNames,
  scenarios: scenariosProp,
  highlightedScenarios,
  showSearchDivider = false,
  onOutcomeSelect,
  onTierClick,
  onToggleScenario,
  selectedScenarios,
  selectedOutcomes,
  showMapView,
  showOnlyChosen,
  showDefinitions,
  compact = false,
  renderMode = "all",
  sortBy,
  sortDirection = "asc",
  onSortChange,
}: StrategyGridProps) {
  const theme = useTheme()

  // Responsive glyph size: 50px at sm, 60px at md+
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"))
  const glyphSize = isMdUp ? 60 : 50

  // Responsive breakpoints for layout modes
  const isSmUp = useMediaQuery(theme.breakpoints.up("sm"))
  // Full 4-column layout at 1400px+ (custom breakpoint from theme)
  const isFullWidth = useMediaQuery(
    `(min-width: ${theme.scenarios.grid.fullBreakpoint}px)`,
  )

  /**
   * Layout mode determines how columns are arranged:
   * - "full": All 4 columns inline (1400px+)
   * - "wrapped": Columns 1-3 inline, column 4 wraps below (600-1399px)
   * - "compact": Mobile layout (below 600px)
   */
  const layoutMode = isFullWidth ? "full" : isSmUp ? "wrapped" : "compact"

  // Determine if we're in "aligned grid" mode (headers align with glyphs)
  // Only in full 4-column mode do labels/controls appear in the header row
  const isAlignedGrid = !compact && !showMapView && isFullWidth

  // =========================================================================
  // Tooltip State Management
  // =========================================================================

  const {
    openTooltip: activeTooltip,
    anchor: tooltipAnchor,
    handleToggleWithAnchor,
    handleClose: closeTooltip,
    forceClose: forceCloseTooltip,
  } = useTierTooltipState()

  const [tooltipPosition, setTooltipPosition] = useState<{
    top: number
    right: number
  } | null>(null)

  // Calculate tooltip position when anchor changes (for Portal positioning)
  useEffect(() => {
    if (tooltipAnchor) {
      const rect = tooltipAnchor.getBoundingClientRect()
      setTooltipPosition({
        top: rect.top - 8,
        right: window.innerWidth - rect.left + 24,
      })
    } else {
      setTooltipPosition(null)
    }
  }, [tooltipAnchor])

  // =========================================================================
  // Summary Panel State
  // =========================================================================

  // Track which scenarios have expanded summaries
  const [expandedSummaries, setExpandedSummaries] = useState<
    Record<string, string | null>
  >({})

  // Toggle summary for a scenario with a specific outcome
  const toggleSummary = (scenarioId: string, outcome: string) => {
    setExpandedSummaries((prev) => {
      const currentOutcome = prev[scenarioId]
      if (currentOutcome === outcome) {
        const { [scenarioId]: _removed, ...rest } = prev
        void _removed
        return rest
      }
      return { ...prev, [scenarioId]: outcome }
    })
  }

  // =========================================================================
  // Derived Values
  // =========================================================================

  const displayScenarios = scenariosProp ?? []
  const highlighted = highlightedScenarios || new Set<string>()

  // Whether sort controls should be shown
  const sortEnabled = !!onSortChange

  // =========================================================================
  // Render
  // =========================================================================

  const shouldRenderHeaders = renderMode !== "contentOnly" && !showMapView
  const shouldRenderContent = renderMode !== "headersOnly"

  return (
    <Box sx={{ position: "relative" }}>
      {/* Active outcome tooltip - rendered via Portal */}
      <TierTooltipPortal
        outcome={activeTooltip}
        position={tooltipPosition}
        onClose={closeTooltip}
        onForceClose={forceCloseTooltip}
      />

      <Box
        sx={{
          display: "grid",
          /**
           * Responsive grid columns:
           * - xs: 2 columns (checkbox + content)
           * - sm (600-1399px): 4 columns (checkbox + scenario + operations + empty), outcomes wrap below
           * - 1400px+: Full 4 columns with outcomes inline
           */
          gridTemplateColumns: {
            xs: theme.scenarios.grid.columns.xs,
            sm: theme.scenarios.grid.columns.sm,
          },
          // Custom breakpoint for full 4-column layout at 1400px+
          [`@media (min-width: ${theme.scenarios.grid.fullBreakpoint}px)`]: {
            gridTemplateColumns: theme.scenarios.grid.columns.full,
          },
          /**
           * Grid gap configuration:
           * - rowGap: Varies by mode (compact uses larger gap between rows)
           * - columnGap: Always 8px (LAYOUT.gridGap) for consistent column spacing
           *
           * Subgrid rows inherit columnGap automatically, so we only set it here.
           */
          rowGap: compact
            ? theme.scenarios.grid.gap.compact
            : theme.scenarios.grid.gap.default,
          columnGap: theme.scenarios.grid.gap.default,
          alignItems: "start",
          width: "100%",
          ...(showMapView && {
            maxHeight: "40vh",
            overflowY: "auto",
            overflowX: "hidden",
            pt: theme.space.component.sm,
          }),
        }}
      >
        {/* Column headers */}
        {shouldRenderHeaders && (
          <StrategyGridHeader
            outcomeNames={outcomeNames}
            compact={compact}
            layoutMode={layoutMode}
            activeTooltip={activeTooltip}
            sortBy={sortBy ?? null}
            sortDirection={sortDirection}
            sortEnabled={sortEnabled}
            onTooltipToggle={handleToggleWithAnchor}
            onSortChange={onSortChange}
          />
        )}

        {/* Scenario rows */}
        {shouldRenderContent && (
          <StrategyGridContent
            scenarios={displayScenarios}
            highlightedScenarios={highlighted}
            showSearchDivider={showSearchDivider}
            selectedScenarios={selectedScenarios}
            showOnlyChosen={showOnlyChosen}
            showDefinitions={showDefinitions}
            showMapView={showMapView}
            compact={compact}
            layoutMode={layoutMode}
            outcomeNames={outcomeNames}
            getChartDataForScenario={getChartDataForScenario}
            selectedOutcomes={selectedOutcomes}
            expandedSummaries={expandedSummaries}
            activeTooltip={activeTooltip}
            sortBy={sortBy ?? null}
            sortDirection={sortDirection}
            sortEnabled={sortEnabled}
            glyphSize={glyphSize}
            isAlignedGrid={isAlignedGrid}
            onToggleScenario={onToggleScenario}
            onOutcomeSelect={onOutcomeSelect}
            onTierClick={onTierClick}
            onToggleSummary={toggleSummary}
            onTooltipToggle={handleToggleWithAnchor}
            onSortChange={onSortChange}
          />
        )}
      </Box>
    </Box>
  )
})

export default StrategyGrid
export type { StrategyGridProps }

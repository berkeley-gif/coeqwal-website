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
 * Parent components are responsible for state management via slice hooks
 * or useExploreUserWorkflowStore().
 *
 * @see StrategyGridHeader for header rendering
 * @see StrategyGridContent for content rendering
 * @see layoutConfig.ts for spacing constant documentation
 */

import React, { useEffect, useRef } from "react"
import { Box, useTheme } from "@repo/ui/mui"
import { useTierTooltipState } from "../../../../../../tooltips/useTierTooltipState"
import { TierTooltipPortal } from "../../../../../../tooltips/TierTooltipPortal"
import { type StrategyGridProps } from "./types"
import { StrategyGridHeader } from "./StrategyGridHeader"
import { StrategyGridContent } from "./StrategyGridContent"
import { useContainerWidth } from "./useContainerWidth"
import { useListInfoTooltipSync } from "../tour"

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
  themeMatchingScenarioIds,
  showThemeDivider = false,
  showAllThemeDividers = false,
  iconMatchingScenarioIds,
  showIconDivider = false,
  onToggleScenario,
  onTierClick,
  selectedScenarios,
  selectedOutcomes,
  showMapView,
  showOnlyChosen,
  showAlternativeBaselines,
  onShowOnlyChosenChange,
  onShowAlternativeBaselinesChange,
  compact = false,
  renderMode = "all",
  showOperations = true,
  outcomesOnly = false,
  hideColumnTitles = false,
  groupByTheme = false,
  scenariosInContiguousThemeOrder = true,
  sortBy,
  sortDirection = "asc",
  onSortChange,
  onThemeBadgeClick,
  onIconClick,
  scenarioColors,
  pinnedScenarioIds,
  activeScenarioIds,
  onRowHover,
  hideOutcomes = false,
  onLayoutModeChange,
}: StrategyGridProps) {
  const theme = useTheme()

  // Container-width-based responsive layout (replaces viewport useMediaQuery)
  const containerRef = useRef<HTMLDivElement>(null)
  const containerWidth = useContainerWidth(containerRef)

  const SM_BREAKPOINT = 600
  const MD_BREAKPOINT = 900
  const FULL_BREAKPOINT = theme.scenarios.grid.fullBreakpoint

  const glyphSize = containerWidth >= MD_BREAKPOINT ? 60 : 50

  /**
   * Layout mode determines how columns are arranged:
   * - "full": All 4 columns inline (container ≥ fullBreakpoint, currently 1200px)
   * - "wrapped": Columns 1-3 inline, column 4 wraps below (600px - fullBreakpoint)
   * - "compact": Mobile layout (below 600px)
   *
   * Derived from container width so the grid adapts when placed in a
   * sidebar or other constrained context, not just at viewport breakpoints.
   */
  const layoutMode =
    containerWidth >= FULL_BREAKPOINT
      ? "full"
      : containerWidth >= SM_BREAKPOINT
        ? "wrapped"
        : "compact"

  const isAlignedGrid = !compact && !showMapView && layoutMode === "full"

  useEffect(() => {
    onLayoutModeChange?.(layoutMode)
  }, [layoutMode, onLayoutModeChange])

  // =========================================================================
  // Tooltip State Management
  // =========================================================================

  const {
    openTooltip: activeTooltip,
    anchor: tooltipAnchor,
    scenarioContext,
    handleToggleWithAnchor,
    handleToggleWithContext,
    handleClose: closeTooltip,
    forceClose: forceCloseTooltip,
  } = useTierTooltipState()

  useListInfoTooltipSync(
    activeTooltip,
    outcomeNames,
    handleToggleWithAnchor,
    forceCloseTooltip,
  )

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
    <Box
      ref={containerRef}
      sx={{
        position: "relative",
        containerType: "inline-size",
        containerName: "strategy-grid",
      }}
    >
      {/* Active outcome tooltip - uses MUI Popper for viewport-aware positioning */}
      {/* WCAG 4.1.2: Pass chart data for accessible text representation */}
      <TierTooltipPortal
        outcomeCode={activeTooltip}
        anchorEl={tooltipAnchor}
        onClose={closeTooltip}
        onForceClose={forceCloseTooltip}
        scenarioLabel={scenarioContext?.scenarioLabel}
        chartData={scenarioContext?.chartData}
      />

      <Box
        sx={{
          display: "grid",
          /**
           * Responsive grid columns via @container queries:
           * - default: 2 columns (checkbox + content)
           * - 600px+: 4 columns (checkbox + scenario + operations + outcomes wrap)
           * - fullBreakpoint+: Full 4 columns with outcomes inline
           *
           * When hideOutcomes is true, columns stay at 2-3 (no col 4),
           * and a descendant selector hides `.outcome-col` elements.
           */
          gridTemplateColumns: outcomesOnly
            ? "1fr"
            : theme.scenarios.grid.columns.xs,
          ...(!outcomesOnly &&
            (hideOutcomes
              ? {
                  [`@container strategy-grid (min-width: ${SM_BREAKPOINT}px)`]:
                    {
                      gridTemplateColumns: showOperations
                        ? "32px minmax(0, 1fr) auto"
                        : "32px minmax(0, 1fr) 0px",
                    },
                }
              : {
                  [`@container strategy-grid (min-width: ${SM_BREAKPOINT}px)`]:
                    {
                      gridTemplateColumns: showOperations
                        ? "32px minmax(0, 600px) 140px 1fr"
                        : "32px minmax(0, 600px) 0px 1fr",
                    },
                  [`@container strategy-grid (min-width: ${FULL_BREAKPOINT}px)`]:
                    {
                      gridTemplateColumns: showOperations
                        ? theme.scenarios.grid.columns.full
                        : "32px 0.382fr 0px 1fr",
                    },
                })),
          transition: "grid-template-columns 300ms ease",
          ...(hideOutcomes && {
            "& .outcome-col": { display: "none" },
          }),
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
            showOperations={showOperations}
            outcomesOnly={outcomesOnly}
            hideColumnTitles={hideColumnTitles}
            activeTooltip={activeTooltip}
            sortBy={sortBy ?? null}
            sortDirection={sortDirection}
            sortEnabled={sortEnabled}
            showOnlyChosen={showOnlyChosen}
            showAlternativeBaselines={showAlternativeBaselines}
            onShowOnlyChosenChange={onShowOnlyChosenChange}
            onShowAlternativeBaselinesChange={onShowAlternativeBaselinesChange}
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
            themeMatchingScenarioIds={themeMatchingScenarioIds}
            showThemeDivider={showThemeDivider}
            showAllThemeDividers={showAllThemeDividers}
            groupByTheme={groupByTheme}
            scenariosInContiguousThemeOrder={scenariosInContiguousThemeOrder}
            iconMatchingScenarioIds={iconMatchingScenarioIds}
            showIconDivider={showIconDivider}
            selectedScenarios={selectedScenarios}
            showOnlyChosen={showOnlyChosen}
            showAlternativeBaselines={showAlternativeBaselines}
            compact={compact}
            layoutMode={layoutMode}
            showOperations={showOperations}
            outcomesOnly={outcomesOnly}
            outcomeNames={outcomeNames}
            getChartDataForScenario={getChartDataForScenario}
            selectedOutcomes={selectedOutcomes}
            activeTooltip={activeTooltip}
            sortBy={sortBy ?? null}
            sortDirection={sortDirection}
            sortEnabled={sortEnabled}
            glyphSize={glyphSize}
            isAlignedGrid={isAlignedGrid}
            onToggleScenario={onToggleScenario}
            onTierClick={onTierClick}
            onTooltipToggle={handleToggleWithAnchor}
            onTooltipToggleWithContext={handleToggleWithContext}
            onSortChange={onSortChange}
            onThemeBadgeClick={onThemeBadgeClick}
            onIconClick={onIconClick}
            scenarioColors={scenarioColors}
            pinnedScenarioIds={pinnedScenarioIds}
            activeScenarioIds={activeScenarioIds}
            onRowHover={onRowHover}
          />
        )}
      </Box>
    </Box>
  )
})

export default StrategyGrid
export type { StrategyGridProps }

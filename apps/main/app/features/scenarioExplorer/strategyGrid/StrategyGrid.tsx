"use client"

/**
 * StrategyGrid: Displays scenarios in a grid with outcome visualizations
 *
 * This is a fully controlled component that accepts all state as props.
 * Parent components are responsible for state management via useScenarioExplorerStore()
 * or useExploreUserWorkflowStore().
 *
 * Uses shared components from scenarios/components/shared for DRY rendering.
 */

import React, { useState, useEffect } from "react"
import {
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  Checkbox,
} from "@repo/ui/mui"
import { InfoIconButton, SortButton } from "@repo/ui"
import { useTierTooltipState } from "../../tooltips/useTierTooltipState"
import { SummaryPanel } from "../../map/overlays/scenarioPanels"
import type { ScenarioTheme } from "../../../content/scenarios"

// Shared components
import {
  OutcomeGlyphItem,
  OperationsIconGroup,
  StrategyHeader,
  formatOutcomeLabel,
} from "../../scenarios/components/shared"

// Import extracted types and components
import { type StrategyGridProps } from "./types"
import { TierTooltipPortal } from "../../tooltips/TierTooltipPortal"
import { GridControls } from "./GridControls"

// Strategy Grid component
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
  onShowOnlyChosenChange,
  onShowDefinitionsChange,
  sortBy,
  sortDirection = "asc",
  onSortChange,
}: StrategyGridProps) {
  const theme = useTheme()

  // Responsive glyph size: 50px at sm, 60px at md+
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"))
  const glyphSize = isMdUp ? 60 : 50

  // Use unified tooltip state management
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

  const chosenScenarios = selectedScenarios
  const toggleScenarioChoice = onToggleScenario
  const displayScenarios = scenariosProp ?? []
  const highlighted = highlightedScenarios || new Set<string>()

  // Render outcome item for a scenario
  const renderOutcomeItem = (
    scenario: {
      scenarioId: string
      label: string
      description: string
      theme?: ScenarioTheme
    },
    displayName: string,
    name: string,
  ) => {
    const scenarioChartData = getChartDataForScenario(scenario.scenarioId)
    const chartData = scenarioChartData[displayName]
    const isActive = chartData !== undefined && chartData.length > 0
    const isSelected =
      expandedSummaries[scenario.scenarioId] === displayName ||
      (selectedOutcomes[scenario.scenarioId] === displayName && !!onTierClick)
    const isSorted = sortBy === displayName

    return (
      <OutcomeGlyphItem
        key={displayName}
        displayName={displayName}
        name={name}
        chartData={chartData}
        isActive={isActive}
        isSelected={isSelected}
        isTooltipActive={activeTooltip === name}
        size={glyphSize}
        showLabel={compact}
        showInfoButton={true}
        showSortButton={!!onSortChange}
        sortState={isSorted ? sortDirection : null}
        onGlyphClick={() => {
          if (isActive) {
            onOutcomeSelect(scenario.scenarioId, displayName)
            if (onTierClick) onTierClick(scenario.scenarioId, displayName)
            toggleSummary(scenario.scenarioId, displayName)
          }
        }}
        onInfoClick={(e) => {
          handleToggleWithAnchor(name, e.currentTarget)
        }}
        onSortAsc={(e) => {
          e.stopPropagation()
          if (sortDirection === "asc" && sortBy === displayName) {
            onSortChange?.(null, "asc")
          } else {
            onSortChange?.(displayName, "asc")
          }
        }}
        onSortDesc={(e) => {
          e.stopPropagation()
          if (sortDirection === "desc" && sortBy === displayName) {
            onSortChange?.(null, "asc")
          } else {
            onSortChange?.(displayName, "desc")
          }
        }}
      />
    )
  }

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
        }}
      >
        {/* Column header - only render if not contentOnly mode */}
        {renderMode !== "contentOnly" && !showMapView && (
          <>
            <Box
              sx={{
                gridColumn: compact ? "1 / -1" : "1 / 3",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: compact ? "space-between" : "flex-start",
                height: theme.spacing(5.5),
              }}
            >
              <Typography variant="subtitle2">Choose scenarios</Typography>
              {compact && (
                <GridControls
                  showOnlyChosen={showOnlyChosen}
                  showDefinitions={showDefinitions}
                  onShowOnlyChosenChange={onShowOnlyChosenChange}
                  onShowDefinitionsChange={onShowDefinitionsChange}
                />
              )}
            </Box>
            {!compact && (
              <>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-end",
                    height: theme.spacing(5.5),
                  }}
                >
                  <Typography variant="subtitle2" sx={{ ml: -1 }}>
                    Key operations
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: { xs: "none", lg: "flex" },
                    alignItems: "flex-end",
                    justifyContent: "space-between",
                    gap: theme.space.gap.lg,
                    height: theme.spacing(5.5),
                  }}
                >
                  {/* Align with center of first outcome label column */}
                  <Typography
                    variant="subtitle2"
                    sx={{ ml: theme.space.component.xl }}
                  >
                    Key outcomes
                  </Typography>
                  <GridControls
                    showOnlyChosen={showOnlyChosen}
                    showDefinitions={showDefinitions}
                    onShowOnlyChosenChange={onShowOnlyChosenChange}
                    onShowDefinitionsChange={onShowDefinitionsChange}
                  />
                </Box>
              </>
            )}
          </>
        )}

        {/* Outcome name headers - only in full-width list view */}
        {renderMode !== "contentOnly" && (
          <Box
            sx={{
              gridColumn: "4 / -1",
              display: compact ? "none" : { xs: "none", lg: "grid" },
              gridTemplateColumns: `repeat(${outcomeNames.length}, 1fr)`,
              gap: theme.space.gap.sm,
              pb: theme.space.component.md,
            }}
          >
            {outcomeNames.map(({ name, displayName }) => {
              const isSorted = sortBy === displayName

              return (
                <Box
                  key={displayName}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 0,
                  }}
                >
                  <Typography
                    variant="compactCaption"
                    component="div"
                    sx={{
                      textAlign: "center",
                      fontWeight: theme.typography.fontWeightMedium,
                      color: theme.palette.blue.darkest,
                    }}
                  >
                    {formatOutcomeLabel(displayName)}
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 0,
                      mt: theme.space.component.xs,
                    }}
                  >
                    <InfoIconButton
                      isActive={activeTooltip === name}
                      onClick={(e) =>
                        handleToggleWithAnchor(name, e.currentTarget)
                      }
                      title="Click for outcome details"
                    />

                    {onSortChange && (
                      <SortButton
                        sortState={isSorted ? sortDirection : null}
                        onAscClick={() => {
                          if (sortDirection === "asc") {
                            onSortChange(null, "asc")
                          } else {
                            onSortChange(displayName, "asc")
                          }
                        }}
                        onDescClick={() => {
                          if (sortDirection === "desc") {
                            onSortChange(null, "asc")
                          } else {
                            onSortChange(displayName, "desc")
                          }
                        }}
                        title="Sort by this outcome"
                      />
                    )}
                  </Box>
                </Box>
              )
            })}
          </Box>
        )}

        {/* Scenario rows */}
        {renderMode !== "headersOnly" &&
          displayScenarios
            .filter((scenario) =>
              showOnlyChosen
                ? chosenScenarios.includes(scenario.scenarioId)
                : true,
            )
            .flatMap((scenario, index, filteredArray) => {
              const isHighlighted = highlighted.has(scenario.scenarioId)
              const nextScenario = filteredArray[index + 1]
              const isNextHighlighted = nextScenario
                ? highlighted.has(nextScenario.scenarioId)
                : false
              const shouldShowDivider =
                showSearchDivider && isHighlighted && !isNextHighlighted

              const scenarioRow = (
                <Box
                  key={scenario.scenarioId}
                  sx={{
                    gridColumn: "1 / -1",
                    display: "grid",
                    gridTemplateColumns: compact
                      ? "32px 1fr"
                      : { xs: "subgrid", lg: "subgrid" },
                    backgroundColor: isHighlighted
                      ? theme.palette.common.white
                      : "#faf8f5",
                    borderRadius: theme.borderRadius.md,
                    padding: compact
                      ? theme.space.component.xl
                      : theme.space.component.md,
                    gap: theme.space.gap.sm,
                    alignItems: compact ? "stretch" : "start",
                    transition: theme.transition.default,
                    border: isHighlighted
                      ? theme.border.active
                      : "2px solid transparent",
                    "&:hover": {
                      backgroundColor: theme.palette.background.paper,
                    },
                    ...(index === 0 && { marginTop: theme.space.component.sm }),
                  }}
                >
                  {/* Column 1: Checkbox */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "flex-start",
                      pointerEvents: "auto",
                      cursor: "pointer",
                      ...(compact && { gridRow: "1 / -1" }),
                    }}
                    onClick={(event) => {
                      event.stopPropagation()
                      toggleScenarioChoice(scenario.scenarioId)
                    }}
                  >
                    <Checkbox
                      checked={chosenScenarios.includes(scenario.scenarioId)}
                      onChange={() => {}}
                      sx={{
                        padding: 0,
                        margin: 0,
                        cursor: "pointer",
                        pointerEvents: "none",
                        position: "relative",
                        top: theme.spacing(0.375),
                        transform: "scale(0.9)",
                      }}
                    />
                  </Box>

                  {/* Content: compact vs non-compact layout */}
                  {compact ? (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: theme.space.gap.md,
                      }}
                    >
                      {/* First row: Title/description + Key operations */}
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "stretch",
                          gap: theme.space.gap.lg,
                        }}
                      >
                        <StrategyHeader
                          strategy={scenario}
                          showDescription={showDefinitions}
                          titleVariant="body2"
                        />
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: theme.space.gap.md,
                            flexShrink: 0,
                          }}
                        >
                          <Typography variant="subtitle2">
                            Key operations
                          </Typography>
                          <OperationsIconGroup
                            scenarioId={scenario.scenarioId}
                            theme={scenario.theme}
                            size="md"
                          />
                        </Box>
                      </Box>

                      {/* Key outcomes section */}
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: theme.space.gap.md,
                        }}
                      >
                        <Typography variant="subtitle2">
                          Key outcomes
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: theme.space.gap.lg,
                          }}
                        >
                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: {
                                xs: "repeat(3, 1fr)",
                                sm: "repeat(5, 1fr)",
                              },
                              gap: theme.space.gap.sm,
                            }}
                          >
                            {outcomeNames
                              .slice(0, 5)
                              .map(({ name, displayName }) =>
                                renderOutcomeItem(scenario, displayName, name),
                              )}
                          </Box>
                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: {
                                xs: "repeat(3, 1fr)",
                                sm: "repeat(5, 1fr)",
                              },
                              gap: theme.space.gap.sm,
                            }}
                          >
                            {outcomeNames
                              .slice(5)
                              .map(({ name, displayName }) =>
                                renderOutcomeItem(scenario, displayName, name),
                              )}
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  ) : (
                    <>
                      {/* Non-compact: Column 2 - Scenario name and description */}
                      <Box sx={{ pr: 1 }}>
                        <StrategyHeader
                          strategy={scenario}
                          showDescription={showDefinitions}
                          titleVariant="body2"
                          descriptionMaxWidth="none"
                        />
                      </Box>

                      {/* Non-compact: Column 3 - Key operations */}
                      <OperationsIconGroup
                        scenarioId={scenario.scenarioId}
                        theme={scenario.theme}
                        size={showMapView ? "sm" : "md"}
                      />

                      {/* Non-compact: Column 4 - Outcome charts */}
                      <Box
                        sx={{
                          gridColumn: { xs: "1 / -1", lg: "auto" },
                          display: "grid",
                          gridTemplateColumns: {
                            xs: "repeat(3, 1fr)",
                            lg: "repeat(auto-fit, minmax(60px, 1fr))",
                          },
                          gap: theme.space.gap.sm,
                          mt: { xs: theme.space.component.lg, lg: 0 },
                          maxWidth: "100%",
                        }}
                      >
                        {outcomeNames.map(({ name, displayName }) =>
                          renderOutcomeItem(scenario, displayName, name),
                        )}
                      </Box>
                    </>
                  )}
                </Box>
              )

              // Summary row (shown when an outcome is clicked)
              const selectedOutcomeForSummary =
                expandedSummaries[scenario.scenarioId]
              const summaryRow =
                selectedOutcomeForSummary && !showMapView ? (
                  <Box
                    key={`summary-${scenario.scenarioId}`}
                    sx={{
                      gridColumn: "1 / -1",
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "32px minmax(0, 1fr)",
                        lg: "32px minmax(0, 1fr)",
                      },
                      gap: theme.space.gap.sm,
                      columnGap: theme.space.gap.lg,
                      alignItems: "start",
                      mb: theme.space.component.sm,
                    }}
                  >
                    <Box />
                    <Box sx={{ pr: 2, position: "relative" }}>
                      <Box
                        component="button"
                        onClick={() =>
                          toggleSummary(
                            scenario.scenarioId,
                            selectedOutcomeForSummary,
                          )
                        }
                        sx={{
                          position: "absolute",
                          top: theme.space.component.sm,
                          right: theme.space.component.sm,
                          background: "none",
                          ...theme.typography.body2,
                          border: "none",
                          cursor: "pointer",
                          padding: theme.space.component.xs,
                          display: "flex",
                          alignItems: "center",
                          color: theme.palette.grey[500],
                          borderRadius: theme.borderRadius.circle,
                          zIndex: 1,
                          "&:hover": {
                            color: theme.palette.grey[700],
                            backgroundColor: theme.palette.grey[200],
                          },
                        }}
                        aria-label="Close summary"
                      >
                        ×
                      </Box>
                      <SummaryPanel
                        scenarioId={scenario.scenarioId}
                        outcome={selectedOutcomeForSummary}
                        variant="inline"
                      />
                    </Box>
                  </Box>
                ) : null

              const rows = [scenarioRow]
              if (summaryRow) rows.push(summaryRow)

              if (shouldShowDivider) {
                rows.push(
                  <Box
                    key={`divider-${scenario.scenarioId}`}
                    sx={{
                      gridColumn: "1 / -1",
                      my: theme.space.section.sm,
                      height: "1px",
                      backgroundColor: theme.palette.grey[300],
                    }}
                  />,
                )
              }

              return rows
            })}
      </Box>
    </Box>
  )
})

export default StrategyGrid
export type { StrategyGridProps }

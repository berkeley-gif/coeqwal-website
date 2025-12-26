/**
 * StrategyGrid: Displays scenario strategies in a grid with outcome visualizations
 *
 * This is a fully controlled component that accepts all state as props.
 * Parent components are responsible for state management via useScenarioExplorerStore()
 * or useExploreUserWorkflowStore().
 *
 * Uses shared components from scenarios/components/shared for DRY rendering.
 */

import React, { useState, useEffect } from "react"
import { Box, Typography, useTheme, useMediaQuery, Checkbox } from "@repo/ui/mui"
import { InfoIconButton, SortButton } from "@repo/ui"
import { strategies } from "../../../content/scenarios"
import { useTierTooltipState } from "../../tooltips/useTierTooltipState"
import { SummaryPanel } from "../../map/overlays/SummaryPanel"

// Shared components
import {
  OutcomeGlyphItem,
  OperationsIconGroup,
  StrategyHeader,
} from "../../scenarios/components/shared"

// Import extracted types, styles, and components
import { gridStyles } from "./StrategyGrid/styles"
import { type StrategyGridProps } from "./StrategyGrid/types"
import { TierTooltipPortal } from "./StrategyGrid/TierTooltipPortal"
import { GridControls } from "./StrategyGrid/GridControls"

// Strategy Grid component
const StrategyGrid = React.memo(function StrategyGridComponent({
  getChartDataForStrategy,
  outcomeNames,
  strategies: strategiesProp,
  highlightedStrategies,
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

  // Track which strategies have expanded summaries
  const [expandedSummaries, setExpandedSummaries] = useState<
    Record<string, string | null>
  >({})

  // Toggle summary for a strategy with a specific outcome
  const toggleSummary = (strategyValue: string, outcome: string) => {
    setExpandedSummaries((prev) => {
      const currentOutcome = prev[strategyValue]
      if (currentOutcome === outcome) {
        const { [strategyValue]: _removed, ...rest } = prev
        void _removed
        return rest
      }
      return { ...prev, [strategyValue]: outcome }
    })
  }

  const chosenStrategies = selectedScenarios
  const toggleStrategyChoice = onToggleScenario
  const displayStrategies = strategiesProp || strategies
  const highlighted = highlightedStrategies || new Set<string>()

  // Render outcome item for a strategy
  const renderOutcomeItem = (
    strategy: { value: string; label: string; description: string; theme?: string },
    displayName: string,
    name: string,
  ) => {
    const strategyChartData = getChartDataForStrategy(strategy.value)
    const chartData = strategyChartData[displayName]
    const isActive = chartData !== undefined && chartData.length > 0
    const isSelected =
      (expandedSummaries[strategy.value] === displayName) ||
      (selectedOutcomes[strategy.value] === displayName && !!onTierClick)
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
        showLabel={true}
        showInfoButton={true}
        showSortButton={!!onSortChange}
        sortState={isSorted ? sortDirection : null}
        onGlyphClick={() => {
          if (isActive) {
            onOutcomeSelect(strategy.value, displayName)
            if (onTierClick) onTierClick(strategy.value, displayName)
            toggleSummary(strategy.value, displayName)
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

      <Box sx={gridStyles.container(showMapView, theme, compact)}>
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
              <Typography variant="subtitle2" sx={{ ml: 0.5 }}>
                Choose strategies
              </Typography>
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
                  <Typography variant="subtitle2">Key operations</Typography>
                </Box>
                <Box
                  sx={{
                    display: { xs: "none", lg: "flex" },
                    alignItems: "flex-end",
                    justifyContent: "space-between",
                    gap: 2,
                    height: theme.spacing(5.5),
                  }}
                >
                  <Typography variant="subtitle2">Key outcomes</Typography>
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
              gap: theme.spacing(1),
              pb: 1.5,
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
                    {displayName === "Freshwater for in-Delta uses" ? (
                      <>
                        Freshwater for{" "}
                        <span style={{ whiteSpace: "nowrap" }}>in-Delta</span>{" "}
                        uses
                      </>
                    ) : displayName === "Reservoir storage" ? (
                      <>
                        Reservoir
                        <br />
                        storage
                      </>
                    ) : (
                      name
                    )}
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 0,
                      mt: 0.5,
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

        {/* Strategy rows */}
        {renderMode !== "headersOnly" &&
          displayStrategies
            .filter((strategy) =>
              showOnlyChosen ? chosenStrategies.includes(strategy.value) : true,
            )
            .flatMap((strategy, index, filteredArray) => {
              const isHighlighted = highlighted.has(strategy.value)
              const nextStrategy = filteredArray[index + 1]
              const isNextHighlighted = nextStrategy
                ? highlighted.has(nextStrategy.value)
                : false
              const shouldShowDivider =
                showSearchDivider && isHighlighted && !isNextHighlighted

              const strategyRow = (
                <Box
                  key={strategy.value}
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
                    padding: compact ? theme.spacing(3) : theme.spacing(1.5),
                    gap: theme.spacing(1),
                    alignItems: compact ? "stretch" : "start",
                    transition: theme.transition.default,
                    border: isHighlighted
                      ? theme.border.focus
                      : "2px solid transparent",
                    "&:hover": {
                      backgroundColor: theme.palette.common.white,
                    },
                    ...(index === 0 && !showMapView && { marginTop: "-8px" }),
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
                      toggleStrategyChoice(strategy.value)
                    }}
                  >
                    <Checkbox
                      checked={chosenStrategies.includes(strategy.value)}
                      onChange={() => {}}
                      sx={{
                        padding: 0,
                        margin: 0,
                        cursor: "pointer",
                        pointerEvents: "none",
                        position: "relative",
                        top: theme.spacing(0.125),
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
                        gap: theme.spacing(1.5),
                      }}
                    >
                      {/* First row: Title/description + Key operations */}
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "stretch",
                          gap: theme.spacing(2),
                        }}
                      >
                        <StrategyHeader
                          strategy={strategy}
                          showDescription={showDefinitions}
                          titleVariant="body2"
                        />
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: theme.spacing(1.5),
                            flexShrink: 0,
                          }}
                        >
                          <Typography variant="subtitle2">
                            Key operations
                          </Typography>
                          <OperationsIconGroup
                            strategyValue={strategy.value}
                            theme={strategy.theme}
                            size="md"
                          />
                        </Box>
                      </Box>

                      {/* Key outcomes section */}
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: theme.spacing(1.5),
                        }}
                      >
                        <Typography variant="subtitle2">Key outcomes</Typography>
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: theme.spacing(2.5),
                          }}
                        >
                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: {
                                xs: "repeat(3, 1fr)",
                                sm: "repeat(5, 1fr)",
                              },
                              gap: theme.spacing(1),
                            }}
                          >
                            {outcomeNames.slice(0, 5).map(({ name, displayName }) =>
                              renderOutcomeItem(strategy, displayName, name)
                            )}
                          </Box>
                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: {
                                xs: "repeat(3, 1fr)",
                                sm: "repeat(5, 1fr)",
                              },
                              gap: theme.spacing(1),
                            }}
                          >
                            {outcomeNames.slice(5).map(({ name, displayName }) =>
                              renderOutcomeItem(strategy, displayName, name)
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  ) : (
                    <>
                      {/* Non-compact: Column 2 - Strategy name and description */}
                      <Box sx={{ pr: 1 }}>
                        <StrategyHeader
                          strategy={strategy}
                          showDescription={showDefinitions}
                          titleVariant="body2"
                          descriptionMaxWidth={theme.layout.maxWidth.sm}
                        />
                      </Box>

                      {/* Non-compact: Column 3 - Key operations */}
                      <OperationsIconGroup
                        strategyValue={strategy.value}
                        theme={strategy.theme}
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
                          gap: theme.spacing(1),
                          mt: { xs: 2, lg: 0 },
                          maxWidth: "100%",
                        }}
                      >
                        {outcomeNames.map(({ name, displayName }) =>
                          renderOutcomeItem(strategy, displayName, name)
                        )}
                      </Box>
                    </>
                  )}
                </Box>
              )

              // Summary row (shown when an outcome is clicked)
              const selectedOutcomeForSummary = expandedSummaries[strategy.value]
              const summaryRow =
                selectedOutcomeForSummary && !showMapView ? (
                  <Box
                    key={`summary-${strategy.value}`}
                    sx={{
                      gridColumn: "1 / -1",
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "32px minmax(0, 1fr)",
                        lg: "32px minmax(0, 1fr)",
                      },
                      gap: theme.spacing(1),
                      columnGap: theme.spacing(2),
                      alignItems: "start",
                      mb: theme.spacing(1),
                    }}
                  >
                    <Box />
                    <Box sx={{ pr: 2, position: "relative" }}>
                      <Box
                        component="button"
                        onClick={() =>
                          toggleSummary(strategy.value, selectedOutcomeForSummary)
                        }
                        sx={{
                          position: "absolute",
                          top: theme.spacing(1),
                          right: theme.spacing(1),
                          background: "none",
                          ...theme.typography.body2,
                          border: "none",
                          cursor: "pointer",
                          padding: 0.5,
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
                        strategy={strategy.value}
                        outcome={selectedOutcomeForSummary}
                        variant="inline"
                      />
                    </Box>
                  </Box>
                ) : null

              const rows = [strategyRow]
              if (summaryRow) rows.push(summaryRow)

              if (shouldShowDivider) {
                rows.push(
                  <Box
                    key={`divider-${strategy.value}`}
                    sx={{
                      gridColumn: "1 / -1",
                      my: theme.spacing(3),
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

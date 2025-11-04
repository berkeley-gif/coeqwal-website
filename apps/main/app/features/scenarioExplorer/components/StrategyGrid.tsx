/**
 * StrategyGrid: Displays scenario strategies in a grid with outcome visualizations
 *
 * This is a fully controlled component that accepts all state as props.
 * Parent components are responsible for state management via useScenarioExplorerStore()
 * or useExploreUserWorkflowStore().
 */

import React, { useState } from "react"
import {
  Box,
  Typography,
  useTheme,
  InfoIcon,
  Theme,
  Checkbox,
} from "@repo/ui/mui"
import {
  InfoTooltip,
  DocumentListIcon,
  DocumentCheckedIcon,
  DocumentExpandedIcon,
  DocumentCollapsedIcon,
} from "@repo/ui"
import { ScenarioGlyph } from "@repo/viz"
import { strategies } from "../../../lib/scenarios"
import TierTooltipContent from "./TierTooltipContent"
import TogglePair from "./TogglePair"

// Map outcome keys to display labels (no longer needed - using API names directly)
const getOutcomeDisplayLabel = (name: string): string => {
  return name
}

/**
 * Helper function to detect if tier data represents a single value
 * Uses the tierType metadata from the API
 */
function isSingleValueTier(
  chartData:
    | Array<{ label: string; color: string; value: number; tierType?: string }>
    | undefined,
): boolean {
  if (!chartData || chartData.length === 0) return false
  // Check the tierType metadata from the first data point (all points in a tier have the same type)
  return chartData[0]?.tierType === "single_value"
}

interface StrategyGridProps {
  // Data props
  getChartDataForStrategy: (
    strategyValue: string,
  ) => Record<string, Array<{ label: string; color: string; value: number }>>
  outcomeNames: Array<{
    shortCode: string
    name: string
    displayName: string
  }>

  // Event handlers
  onOutcomeSelect: (strategyValue: string, outcome: string) => void
  onTierClick?: (strategy: string, outcome: string) => void
  onToggleScenario: (strategyValue: string) => void

  // State props (fully controlled)
  selectedScenarios: string[]
  selectedOutcomes: Record<string, string | null> // strategy -> outcome mapping (null = no outcome selected)
  showMapView: boolean
  showOnlyChosen: boolean
  showDefinitions: boolean

  // UI control handlers
  onMapViewChange: (enabled: boolean) => void
  onShowOnlyChosenChange: (enabled: boolean) => void
  onShowDefinitionsChange: (enabled: boolean) => void
}

const gridStyles = {
  container: (showMapView: boolean, theme: Theme) => ({
    display: "grid",
    gridTemplateColumns: {
      xs: "32px minmax(0, 1fr) auto",
      lg: "32px minmax(0, 0.8fr) auto minmax(0, 2fr)",
    },
    gap: theme.spacing(1),
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
  operationsIcons: {
    display: "flex",
    gap: { xs: 0.5, md: 1 },
    alignItems: "center",
    flexDirection: { xs: "column", md: "row" },
    justifyContent: "flex-start",
  },
  iconBox: (showMapView: boolean, theme: Theme) => ({
    width: showMapView
      ? theme.spacing(3.5)
      : { xs: theme.spacing(4), lg: theme.spacing(5) },
    height: showMapView
      ? theme.spacing(3.5)
      : { xs: theme.spacing(4), lg: theme.spacing(5) },
    cursor: "pointer",
  }),
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
  outcomeBox: (
    showMapView: boolean,
    isActive: boolean,
    isSelected: boolean,
    theme: Theme,
  ) => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: showMapView ? 0.5 : 1,
    cursor: showMapView && isActive ? "pointer" : "default",
    padding: 0.5,
    borderRadius: theme.borderRadius.rounded,
    transition: "all 0.2s ease",
    backgroundColor: "transparent",
    opacity: isActive ? 1 : 0.7,
    border: isSelected
      ? `2px solid ${theme.palette.blue.bright}`
      : "2px solid transparent",
    "&:hover": {
      backgroundColor:
        showMapView && isActive ? theme.palette.grey[100] : "transparent",
    },
  }),
  outcomeLabel: (showMapView: boolean, isActive: boolean, theme: Theme) => ({
    color: isActive ? theme.palette.blue.darkest : theme.palette.grey[500],
    fontWeight: theme.typography.fontWeightRegular,
    textAlign: "center",
    fontSize: showMapView
      ? "0.6rem"
      : theme.typography.compact.caption.fontSize,
    lineHeight: showMapView
      ? theme.typography.compact.caption.lineHeight
      : theme.typography.compact.caption.lineHeight,
    whiteSpace: "pre-line",
  }),
} as const

// Strategy Grid component
const StrategyGrid = React.memo(function StrategyGridComponent({
  getChartDataForStrategy,
  outcomeNames,
  onOutcomeSelect,
  onTierClick,
  onToggleScenario,
  selectedScenarios,
  selectedOutcomes,
  showMapView,
  showOnlyChosen,
  showDefinitions,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onMapViewChange, // Unused after removing list/map toggle, but kept for backward compatibility
  onShowOnlyChosenChange,
  onShowDefinitionsChange,
}: StrategyGridProps) {
  const theme = useTheme()
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)
  const [tooltipAnchor, setTooltipAnchor] = useState<HTMLElement | null>(null)

  const chosenStrategies = selectedScenarios
  const toggleStrategyChoice = onToggleScenario

  return (
    <Box sx={{ position: "relative" }}>
      {/* Active outcome tooltip */}
      {activeTooltip && tooltipAnchor && (
        <Box
          sx={{
            position: "absolute",
            top: tooltipAnchor.offsetTop,
            right: `calc(100% - ${tooltipAnchor.offsetLeft}px + 16px)`,
            zIndex: 1000,
            backgroundColor: "white",
            padding: 2,
            borderRadius: theme.borderRadius.rounded,
            boxShadow: theme.shadow.subtle,
            width: theme.spacing(56.25),
            "&::after": {
              content: '""',
              position: "absolute",
              right: theme.spacing(-1),
              top: theme.spacing(2.5),
              width: 0,
              height: 0,
              borderTop: "8px solid transparent",
              borderBottom: "8px solid transparent",
              borderLeft: "8px solid white",
            },
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
            <Box
              component="button"
              onClick={() => {
                setActiveTooltip(null)
                setTooltipAnchor(null)
              }}
              sx={{
                border: "none",
                background: "none",
                cursor: "pointer",
                padding: theme.spacing(0.5),
                fontSize: theme.typography.h6.fontSize,
                lineHeight: 1,
                color: theme.palette.grey[600],
                "&:hover": {
                  color: theme.palette.grey[800],
                },
              }}
            >
              ×
            </Box>
          </Box>
          <TierTooltipContent outcome={activeTooltip} showTitle={true} />
        </Box>
      )}

      <Box sx={gridStyles.container(showMapView, theme)}>
        {/* Column header */}
        {!showMapView && (
          <>
            <Box
              sx={{
                gridColumn: "1 / 3",
                display: "flex",
                alignItems: "center",
                height: theme.spacing(7),
              }}
            >
              <Typography variant="subtitle2" sx={{ ml: 0.5 }}>
                Choose strategies
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                height: theme.spacing(7),
              }}
            >
              <Typography variant="subtitle2">Key operations</Typography>
            </Box>
            <Box
              sx={{
                display: { xs: "none", lg: "flex" },
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
                height: theme.spacing(7),
              }}
            >
              <Typography variant="subtitle2">Key outcomes</Typography>

              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <InfoTooltip description="Show all strategies or only chosen ones">
                  <Box>
                    <TogglePair
                      leftIcon={
                        <DocumentListIcon active={!showOnlyChosen} size={40} />
                      }
                      rightIcon={
                        <DocumentCheckedIcon
                          active={showOnlyChosen}
                          size={40}
                        />
                      }
                      onLeftClick={() => onShowOnlyChosenChange(false)}
                      onRightClick={() => onShowOnlyChosenChange(true)}
                      gap={-0.5}
                    />
                  </Box>
                </InfoTooltip>

                <InfoTooltip description="Show or hide strategy details">
                  <Box>
                    <TogglePair
                      leftIcon={
                        <DocumentExpandedIcon
                          active={showDefinitions}
                          size={40}
                        />
                      }
                      rightIcon={
                        <DocumentCollapsedIcon
                          active={!showDefinitions}
                          size={40}
                        />
                      }
                      onLeftClick={() => onShowDefinitionsChange(true)}
                      onRightClick={() => onShowDefinitionsChange(false)}
                      gap={-0.5}
                    />
                  </Box>
                </InfoTooltip>
              </Box>
            </Box>
          </>
        )}
        {/* Outcome name headers - show in both list and map view */}
        <Box sx={{ gridColumn: "1 / 3" }} />{" "}
        {/* Empty for checkbox + strategy columns */}
        <Box /> {/* Empty for operations column */}
        <Box
          sx={{
            display: { xs: "none", lg: "grid" },
            gridTemplateColumns: `repeat(${outcomeNames.length}, 1fr)`,
            gap: theme.spacing(1),
            pb: 1.5, // Padding below headers
          }}
        >
          {outcomeNames.map(({ name, displayName }) => (
            <Box
              key={displayName}
              component="button"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                if (activeTooltip === name) {
                  setActiveTooltip(null)
                  setTooltipAnchor(null)
                } else {
                  setActiveTooltip(name)
                  setTooltipAnchor(e.currentTarget)
                }
              }}
              sx={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: theme.spacing(0.5),
                textAlign: "center",
                fontSize: theme.typography.compact.caption.fontSize,
                fontWeight: theme.typography.fontWeightMedium,
                color: theme.palette.blue.darkest,
                lineHeight: theme.typography.compact.caption.lineHeight,
                "&:hover": {
                  backgroundColor: theme.palette.action.hover,
                  borderRadius: 1,
                },
              }}
            >
              {displayName === "Freshwater for in-Delta uses"
                ? "Freshwater for in-Delta uses"
                : getOutcomeDisplayLabel(name)}{" "}
              <InfoIcon
                sx={{
                  fontSize: theme.typography.compact.micro.fontSize,
                  color: theme.palette.blue.bright,
                  verticalAlign: "baseline",
                  marginLeft: theme.spacing(0.25),
                }}
              />
            </Box>
          ))}
        </Box>
        {/* Strategy rows */}
        {strategies
          .filter((strategy) =>
            showOnlyChosen ? chosenStrategies.includes(strategy.value) : true,
          )
          .map((strategy, index) => (
            <Box
              key={strategy.value}
              sx={{
                gridColumn: "1 / -1", // Span all columns
                display: "grid",
                gridTemplateColumns: {
                  xs: "subgrid", // Mobile: use parent grid
                  lg: "subgrid", // Desktop: use parent grid
                },
                backgroundColor: "#faf8f5",
                borderRadius: theme.borderRadius.rounded,
                padding: showMapView ? theme.spacing(1) : theme.spacing(1.5),
                gap: theme.spacing(1),
                alignItems: "start",
                transition: "background-color 0.2s ease",
                "&:hover": {
                  backgroundColor: theme.palette.common.white,
                },
                ...(index === 0 && !showMapView && { marginTop: "-8px" }), // Pull first row closer to headers in table view
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
                    "& svg": {
                      strokeWidth: theme.spacing(0.125),
                    },
                    "& path": {
                      strokeWidth: theme.spacing(0.125),
                    },
                  }}
                />
              </Box>

              {/* Column 2: Strategy name and description */}
              <Box sx={{ pr: 1 }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: theme.typography.fontWeightMedium,
                    mb: showDefinitions ? 0.5 : 0,
                    fontSize: showMapView
                      ? theme.typography.compact.title.fontSize
                      : theme.typography.body2.fontSize,
                    lineHeight: 1.3,
                    whiteSpace: "pre-line",
                  }}
                >
                  {strategy.value === "current-ops-historical-ag"
                    ? "Current operations with\nhistorical agricultural land use" // hack to get desired line break
                    : strategy.label}
                </Typography>
                {showDefinitions && (
                  <Typography
                    variant="body2"
                    sx={{
                      lineHeight: showMapView ? 1.3 : 1.4,
                      fontSize: showMapView
                        ? theme.typography.compact.subtitle.fontSize
                        : theme.typography.nav.fontSize,
                    }}
                  >
                    {strategy.description
                      .split(/(\bTUCPs?\b)/g)
                      .map((part, index) => {
                        if (part.match(/\bTUCPs?\b/)) {
                          return (
                            <span key={index}>
                              {part}
                              <InfoTooltip
                                description="Temporary Urgent Change Petitions permit changes during droughts to meet human health and safety needs and protect endangered species"
                                placement="top"
                              >
                                <InfoIcon
                                  sx={{
                                    fontSize:
                                      theme.typography.compact.subtitle
                                        .fontSize,
                                    ml: 0.5,
                                    cursor: "pointer",
                                    color: theme.palette.blue.bright,
                                    "&:hover": {
                                      color: theme.palette.blue.darkest,
                                    },
                                  }}
                                />
                              </InfoTooltip>
                            </span>
                          )
                        }
                        return part
                      })}
                  </Typography>
                )}
              </Box>

              {/* Column 3: Operations/assumptions icons */}
              <Box
                sx={{
                  display: "flex", // Always visible
                  gap: { xs: 0.5, md: 1 },
                  alignItems: "flex-start",
                  flexDirection: { xs: "column", md: "row" }, // Stack vertically on mobile, row on desktop
                  justifyContent: "flex-start",
                }}
              >
                {/* Current operations icons */}
                <InfoTooltip description="Current operations" placement="top">
                  <Box
                    sx={{
                      width: showMapView
                        ? theme.spacing(3.5)
                        : { xs: theme.spacing(4), lg: theme.spacing(5) },
                      height: showMapView
                        ? theme.spacing(3.5)
                        : { xs: theme.spacing(4), lg: theme.spacing(5) },
                      cursor: "pointer",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/icons/current_ops.svg"
                      alt="Current operations"
                      style={{ width: "100%", height: "100%" }}
                    />
                  </Box>
                </InfoTooltip>

                {/* Land use icon - different for historical strategy */}
                <InfoTooltip
                  description={
                    strategy.value === "current-ops-historical-ag"
                      ? "Historical land use (2004-2013)"
                      : "Current land use considerations"
                  }
                  placement="top"
                >
                  <Box
                    sx={{
                      width: showMapView
                        ? theme.spacing(3.5)
                        : { xs: theme.spacing(4), lg: theme.spacing(5) },
                      height: showMapView
                        ? theme.spacing(3.5)
                        : { xs: theme.spacing(4), lg: theme.spacing(5) },
                      cursor: "pointer",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        strategy.value === "current-ops-historical-ag"
                          ? "/images/icons/land_use_prev.svg"
                          : "/images/icons/land_use.svg"
                      }
                      alt={
                        strategy.value === "current-ops-historical-ag"
                          ? "Historical land use"
                          : "Current land use"
                      }
                      style={{ width: "100%", height: "100%" }}
                    />
                  </Box>
                </InfoTooltip>
                {/* No TUCP icon */}
                {strategy.value === "current-ops-wo-tucp" && (
                  <InfoTooltip description="Without TUCPs" placement="top">
                    <Box
                      sx={{
                        width: showMapView
                          ? theme.spacing(3.5)
                          : { xs: theme.spacing(4), lg: theme.spacing(5) },
                        height: showMapView
                          ? theme.spacing(3.5)
                          : { xs: theme.spacing(4), lg: theme.spacing(5) },
                        cursor: "pointer",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/images/icons/no_tucp.svg"
                        alt="Without TUCPs"
                        style={{ width: "100%", height: "100%" }}
                      />
                    </Box>
                  </InfoTooltip>
                )}
              </Box>

              {/* Column 4: Outcome charts (responsive layout) */}
              <Box
                sx={{
                  gridColumn: { xs: "1 / -1", lg: "auto" }, // Full width on mobile, auto on desktop
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "repeat(3, 1fr)", // Mobile: 3x3 grid
                    lg: "repeat(auto-fit, minmax(60px, 1fr))", // Desktop: auto-fit to available space
                  },
                  gap: theme.spacing(1),
                  mt: { xs: 2, lg: 0 }, // Add top margin on mobile
                  maxWidth: "100%",
                }}
              >
                {outcomeNames.map(({ displayName }) => {
                  // Get chart data for this strategy
                  const strategyChartData = getChartDataForStrategy(
                    strategy.value,
                  )

                  // Check if this outcome exists for this strategy
                  const isActiveForStrategy =
                    strategyChartData[displayName] !== undefined &&
                    strategyChartData[displayName].length > 0

                  const chartBox = (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: showMapView ? 0.5 : 1,
                        cursor:
                          onTierClick && isActiveForStrategy
                            ? "pointer"
                            : "default",
                        padding: 0,
                        borderRadius: theme.borderRadius.rounded,
                        transition: "all 0.2s ease",
                        backgroundColor: "transparent",
                        opacity: isActiveForStrategy ? 1 : 0.7, // Dim for inactive outcomes
                        border:
                          selectedOutcomes[strategy.value] === displayName &&
                          onTierClick
                            ? `2px solid ${theme.palette.blue.bright}`
                            : "2px solid transparent",
                        "&:hover": {
                          backgroundColor:
                            onTierClick && isActiveForStrategy
                              ? theme.palette.grey[100]
                              : "transparent",
                        },
                      }}
                      onClick={
                        onTierClick && isActiveForStrategy
                          ? () => {
                              onOutcomeSelect(strategy.value, displayName)
                              onTierClick(strategy.value, displayName)
                            }
                          : undefined
                      }
                    >
                      {(() => {
                        const chartData = isActiveForStrategy
                          ? strategyChartData[displayName]
                          : undefined

                        const values: [number, number, number, number] =
                          chartData
                            ? (chartData
                                .map((tier) => tier.value)
                                .slice(0, 4) as [
                                number,
                                number,
                                number,
                                number,
                              ])
                            : [0, 0, 0, 0]

                        const variant = isSingleValueTier(chartData)
                          ? "dots"
                          : "bars"

                        return (
                          <ScenarioGlyph
                            variant={variant}
                            values={values}
                            size={showMapView ? 45 : 50}
                            tierColors={
                              isActiveForStrategy
                                ? (strategyChartData[displayName]
                                    ?.map((tier) => tier.color)
                                    .slice(0, 4) as [
                                    string,
                                    string,
                                    string,
                                    string,
                                  ]) || [
                                    theme.palette.tiers.tier1,
                                    theme.palette.tiers.tier2,
                                    theme.palette.tiers.tier3,
                                    theme.palette.tiers.tier4,
                                  ]
                                : [
                                    theme.palette.grey[300],
                                    theme.palette.grey[300],
                                    theme.palette.grey[300],
                                    theme.palette.grey[300],
                                  ] // Grey colors for inactive outcomes
                            }
                          />
                        )
                      })()}
                    </Box>
                  )

                  // No tooltips on charts - use header info icons instead
                  return <div key={displayName}>{chartBox}</div>
                })}
              </Box>
            </Box>
          ))}
      </Box>
    </Box>
  )
})

export default StrategyGrid
export type { StrategyGridProps }

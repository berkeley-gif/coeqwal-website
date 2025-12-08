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
import { CURRENT_OPERATIONS_ICONS } from "../../../components/ScenarioCard"
import TierTooltipContent from "./TierTooltipContent"
import TogglePair from "./TogglePair"
import { getThemeIcon, getThemeIconDescription } from "./ThemeIcons"

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

/**
 * Generate a plain language summary for a specific outcome
 */
function generateOutcomePlainSummary(
  outcome: string,
  chartData: Array<{ label: string; color: string; value: number }> | undefined,
): string {
  if (!chartData || chartData.length === 0) {
    return `No data available for ${outcome}.`
  }

  // Calculate totals and percentages
  const total = chartData.reduce((sum, tier) => sum + tier.value, 0)
  if (total === 0) return `No data available for ${outcome}.`

  const tierData: Record<number, { count: number; pct: number }> = {}
  for (const point of chartData) {
    const tierLevel = parseInt(point.label.replace("Tier ", ""))
    tierData[tierLevel] = {
      count: point.value,
      pct: (point.value / total) * 100,
    }
  }

  const tier1Pct = tierData[1]?.pct || 0
  const tier4Count = tierData[4]?.count || 0
  const tier3Count = tierData[3]?.count || 0

  // Generate outcome-specific summaries
  if (
    outcome === "Community deliveries" ||
    outcome === "Community water system deliveries"
  ) {
    if (tier1Pct >= 80) {
      return `The vast majority of water systems (${tierData[1]?.count} of ${total}) are thriving under this scenario with optimal water deliveries.`
    } else if (tier1Pct >= 50) {
      const struggling = tier4Count + tier3Count
      return `Most water systems are doing well, but ${struggling} system${struggling > 1 ? "s are" : " is"} experiencing challenges with water deliveries.`
    } else {
      return `Significant challenges face water systems under this scenario. ${tier4Count > 0 ? `${tier4Count} system${tier4Count > 1 ? "s are" : " is"} at critical levels.` : ""}`
    }
  } else if (outcome === "Agricultural revenue") {
    if (tier1Pct >= 80) {
      return `Agricultural districts are largely thriving (${tierData[1]?.count} of ${total} at optimal levels) with strong water deliveries supporting revenue.`
    } else if (tier1Pct >= 50) {
      return `Most agricultural districts receive adequate water, though some are experiencing reduced deliveries affecting revenue.`
    } else {
      return `Agricultural districts face significant water delivery challenges that impact revenue.`
    }
  } else if (outcome.includes("Salmon") || outcome.includes("salmon")) {
    if (tier1Pct >= 70) {
      return `Conditions are favorable for salmon populations under this scenario.`
    } else if (tier4Count > 0) {
      return `Salmon populations face critical stress under this scenario. Conservation measures may be needed.`
    } else {
      return `Salmon populations experience mixed conditions under this scenario.`
    }
  } else if (outcome.includes("Delta")) {
    if (tier1Pct >= 70) {
      return `Delta conditions are well-maintained under this scenario.`
    } else if (tier4Count > 0) {
      return `The Delta ecosystem faces stress under this scenario.`
    } else {
      return `Delta conditions show mixed results under this scenario.`
    }
  } else if (outcome.includes("Storage") || outcome.includes("Reservoir")) {
    if (tier1Pct >= 70) {
      return `Reservoir storage levels remain healthy under this scenario.`
    } else if (tier4Count > 0) {
      return `Reservoir storage is critically low under this scenario.`
    } else {
      return `Reservoir storage shows moderate levels under this scenario.`
    }
  }

  // Generic summary for other outcomes
  if (tier1Pct >= 70) {
    return `This outcome performs well under this scenario with ${Math.round(tier1Pct)}% at optimal levels.`
  } else if (tier4Count > 0) {
    return `This outcome shows critical stress in ${tier4Count} location${tier4Count > 1 ? "s" : ""}.`
  } else if (tier3Count > 0) {
    return `This outcome shows some risk in ${tier3Count} location${tier3Count > 1 ? "s" : ""}.`
  }
  return `This outcome shows mixed performance under this scenario.`
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
  strategies?: Array<{
    value: string
    label: string
    description: string
    theme?: string
  }> // Optional filtered strategies list
  highlightedStrategies?: Set<string> // Strategy values to highlight (search matches)
  showSearchDivider?: boolean // Whether to show a divider between search results and other strategies

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
  onShowOnlyChosenChange,
  onShowDefinitionsChange,
}: StrategyGridProps) {
  const theme = useTheme()
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)
  const [tooltipAnchor, setTooltipAnchor] = useState<HTMLElement | null>(null)

  // Track which strategies have expanded summaries and which outcome is selected
  const [expandedSummaries, setExpandedSummaries] = useState<
    Record<string, string | null>
  >({})

  // Toggle summary for a strategy with a specific outcome
  const toggleSummary = (strategyValue: string, outcome: string) => {
    setExpandedSummaries((prev) => {
      const currentOutcome = prev[strategyValue]
      if (currentOutcome === outcome) {
        // Clicking same outcome closes the summary
        const { [strategyValue]: _removed, ...rest } = prev
        void _removed // Explicitly mark as intentionally unused
        return rest
      }
      // Open or switch to new outcome
      return { ...prev, [strategyValue]: outcome }
    })
  }

  const chosenStrategies = selectedScenarios
  const toggleStrategyChoice = onToggleScenario

  // Use provided strategies or fallback to all strategies
  const displayStrategies = strategiesProp || strategies
  const highlighted = highlightedStrategies || new Set<string>()

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
                height: theme.spacing(5.5),
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
                height: theme.spacing(5.5),
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
                height: theme.spacing(5.5),
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
              {displayName === "Freshwater for in-Delta uses" ? (
                <>
                  Freshwater for{" "}
                  <span style={{ whiteSpace: "nowrap" }}>in-Delta</span> uses
                </>
              ) : (
                getOutcomeDisplayLabel(name)
              )}{" "}
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
        {displayStrategies
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
                  gridColumn: "1 / -1", // Span all columns
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "subgrid", // Mobile: use parent grid
                    lg: "subgrid", // Desktop: use parent grid
                  },
                  backgroundColor: isHighlighted
                    ? theme.palette.common.white
                    : "#faf8f5",
                  borderRadius: theme.borderRadius.rounded,
                  padding: showMapView ? theme.spacing(1) : theme.spacing(1.5),
                  gap: theme.spacing(1),
                  alignItems: "start",
                  transition: "all 0.2s ease",
                  border: isHighlighted
                    ? `2px solid ${theme.palette.blue.bright}`
                    : "2px solid transparent",
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
                  {/* Theme-specific icon for non-baseline strategies */}
                  {strategy.theme && strategy.theme !== "baseline" ? (
                    <>
                      {/* Theme icon (Groundwater/Environmental) */}
                      <InfoTooltip
                        description={getThemeIconDescription(
                          strategy.theme,
                          strategy.value,
                        )}
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
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {getThemeIcon(strategy.theme)}
                        </Box>
                      </InfoTooltip>

                      {/* Land use icon for non-baseline */}
                      <InfoTooltip
                        description="2020 LandIQ land use"
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
                            src="/images/icons/land_use.svg"
                            alt="2020 Land use"
                            style={{ width: "100%", height: "100%" }}
                          />
                        </Box>
                      </InfoTooltip>

                      {/* TUCP icon for non-baseline (most have TUCPs) */}
                      <InfoTooltip
                        description="Temporary Urgent Change Petitions (TUCPs) permit changes during droughts to meet human health and safety needs and protect endangered species."
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
                            src="/images/icons/tucp.svg"
                            alt="TUCPs allowed"
                            style={{ width: "100%", height: "100%" }}
                          />
                        </Box>
                      </InfoTooltip>
                    </>
                  ) : (
                    <>
                      {/* Baseline: Current operations icon */}
                      <InfoTooltip
                        description={
                          CURRENT_OPERATIONS_ICONS[0]?.description ||
                          "Current operations"
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
                              CURRENT_OPERATIONS_ICONS[0]?.path ||
                              "/images/icons/current_ops.svg"
                            }
                            alt={
                              CURRENT_OPERATIONS_ICONS[0]?.alt ||
                              "Current operations"
                            }
                            style={{ width: "100%", height: "100%" }}
                          />
                        </Box>
                      </InfoTooltip>

                      {/* Baseline: Land use icon - different for historical strategy */}
                      <InfoTooltip
                        description={
                          strategy.value === "current-ops-historical-ag"
                            ? "Historical land use (2004-2013)"
                            : CURRENT_OPERATIONS_ICONS[1]?.description ||
                              "Current land use"
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
                                : CURRENT_OPERATIONS_ICONS[1]?.path ||
                                  "/images/icons/land_use.svg"
                            }
                            alt={
                              strategy.value === "current-ops-historical-ag"
                                ? "Historical land use"
                                : CURRENT_OPERATIONS_ICONS[1]?.alt ||
                                  "Current land use"
                            }
                            style={{ width: "100%", height: "100%" }}
                          />
                        </Box>
                      </InfoTooltip>

                      {/* Baseline: TUCP icon - show for strategies that include TUCPs */}
                      {strategy.value !== "current-ops-wo-tucp" &&
                        strategy.value !== "usbr-2024-wo-tucp" && (
                          <InfoTooltip
                            description="Temporary Urgent Change Petitions (TUCPs) permit changes during droughts to meet human health and safety needs and protect endangered species."
                            placement="top"
                          >
                            <Box
                              sx={{
                                width: showMapView
                                  ? theme.spacing(3.5)
                                  : {
                                      xs: theme.spacing(4),
                                      lg: theme.spacing(5),
                                    },
                                height: showMapView
                                  ? theme.spacing(3.5)
                                  : {
                                      xs: theme.spacing(4),
                                      lg: theme.spacing(5),
                                    },
                                cursor: "pointer",
                              }}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src="/images/icons/tucp.svg"
                                alt="TUCPs allowed"
                                style={{ width: "100%", height: "100%" }}
                              />
                            </Box>
                          </InfoTooltip>
                        )}

                      {/* Baseline: No TUCP icon - show for strategies without TUCPs */}
                      {(strategy.value === "current-ops-wo-tucp" ||
                        strategy.value === "usbr-2024-wo-tucp") && (
                        <InfoTooltip
                          description="Without TUCPs"
                          placement="top"
                        >
                          <Box
                            sx={{
                              width: showMapView
                                ? theme.spacing(3.5)
                                : {
                                    xs: theme.spacing(4),
                                    lg: theme.spacing(5),
                                  },
                              height: showMapView
                                ? theme.spacing(3.5)
                                : {
                                    xs: theme.spacing(4),
                                    lg: theme.spacing(5),
                                  },
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
                    </>
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
                          cursor: isActiveForStrategy ? "pointer" : "default",
                          padding: 0,
                          borderRadius: theme.borderRadius.rounded,
                          transition: "all 0.2s ease",
                          backgroundColor:
                            expandedSummaries[strategy.value] === displayName
                              ? theme.palette.blue.bright + "10"
                              : "transparent",
                          opacity: isActiveForStrategy ? 1 : 0.7, // Dim for inactive outcomes
                          border:
                            expandedSummaries[strategy.value] === displayName ||
                            (selectedOutcomes[strategy.value] === displayName &&
                              onTierClick)
                              ? `2px solid ${theme.palette.blue.bright}`
                              : "2px solid transparent",
                          "&:hover": {
                            backgroundColor: isActiveForStrategy
                              ? theme.palette.grey[100]
                              : "transparent",
                          },
                        }}
                        onClick={
                          isActiveForStrategy
                            ? () => {
                                onOutcomeSelect(strategy.value, displayName)
                                if (onTierClick) {
                                  onTierClick(strategy.value, displayName)
                                }
                                // Toggle summary for this outcome
                                toggleSummary(strategy.value, displayName)
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
            )

            // Get the selected outcome for this strategy's summary (if any)
            const selectedOutcomeForSummary = expandedSummaries[strategy.value]
            const strategyChartDataForSummary = getChartDataForStrategy(
              strategy.value,
            )

            // Summary row (shown when an outcome is clicked)
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
                    py: theme.spacing(1.5),
                    px: theme.spacing(1),
                    backgroundColor: theme.palette.grey[50],
                    borderRadius: theme.borderRadius.standard,
                    mb: theme.spacing(1),
                  }}
                >
                  {/* Empty checkbox column for alignment */}
                  <Box />

                  {/* Summary content */}
                  <Box sx={{ pr: 2 }}>
                    {/* Outcome name header */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: theme.typography.fontWeightMedium,
                          color: theme.palette.blue.darkest,
                          fontSize: theme.typography.body2.fontSize,
                        }}
                      >
                        {selectedOutcomeForSummary}
                      </Typography>
                      {/* Close button */}
                      <Box
                        component="button"
                        onClick={() =>
                          toggleSummary(
                            strategy.value,
                            selectedOutcomeForSummary,
                          )
                        }
                        sx={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0.5,
                          display: "flex",
                          alignItems: "center",
                          color: theme.palette.grey[500],
                          fontSize: "16px",
                          borderRadius: "50%",
                          "&:hover": {
                            color: theme.palette.grey[700],
                            backgroundColor: theme.palette.grey[200],
                          },
                        }}
                        aria-label="Close summary"
                      >
                        ×
                      </Box>
                    </Box>

                    {/* Plain language summary */}
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.grey[800],
                        fontSize: theme.typography.nav.fontSize,
                        lineHeight: 1.5,
                      }}
                    >
                      {generateOutcomePlainSummary(
                        selectedOutcomeForSummary,
                        strategyChartDataForSummary[selectedOutcomeForSummary],
                      )}
                    </Typography>
                  </Box>
                </Box>
              ) : null

            // Return strategy row plus summary and optional divider
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

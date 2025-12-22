/**
 * StrategyGrid: Displays scenario strategies in a grid with outcome visualizations
 *
 * This is a fully controlled component that accepts all state as props.
 * Parent components are responsible for state management via useScenarioExplorerStore()
 * or useExploreUserWorkflowStore().
 *
 * Note: Types and styles have been extracted to StrategyGrid/ folder for better organization.
 * Future refactoring will extract sub-components.
 */

import React, { useState, useEffect } from "react"
import { Box, Typography, useTheme, Checkbox } from "@repo/ui/mui"
import { InfoTooltip, InfoIconButton, SortButton } from "@repo/ui"
import { ScenarioGlyph } from "@repo/viz"
import { strategies } from "../../../content/scenarios"
import { CURRENT_OPERATIONS_ICONS } from "../../../content/scenarios"
import { getThemeIcon, getThemeIconDescription } from "./ThemeIcons"
import { useTierTooltipState } from "../../tooltips/useTierTooltipState"
import { SummaryPanel } from "../../map/overlays/SummaryPanel"

// Import extracted types, styles, and components
import { gridStyles } from "./StrategyGrid/styles"
import { isSingleValueTier, type StrategyGridProps } from "./StrategyGrid/types"
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
        top: rect.top - 8, // Align arrow with top of anchor
        right: window.innerWidth - rect.left + 24, // Position to the left of anchor
      })
    } else {
      setTooltipPosition(null)
    }
  }, [tooltipAnchor])

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
        {/* Outcome name headers - only render if not contentOnly mode, show in full-width list view only (not compact mode) */}
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
                  {/* Outcome label */}
                  <Typography
                    component="div"
                    sx={{
                      textAlign: "center",
                      fontSize: theme.typography.compact.caption.fontSize,
                      fontWeight: theme.typography.fontWeightMedium,
                      color: theme.palette.blue.darkest,
                      lineHeight: theme.typography.compact.caption.lineHeight,
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

                  {/* Icons row below label */}
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
                            onSortChange(null, "asc") // Clear sort
                          } else {
                            onSortChange(displayName, "asc")
                          }
                        }}
                        onDescClick={() => {
                          if (sortDirection === "desc") {
                            onSortChange(null, "asc") // Clear sort
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

        {/* Strategy rows - only render if not headersOnly mode */}
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
                      ? "32px 1fr" // Compact: checkbox column + content column
                      : { xs: "subgrid", lg: "subgrid" },
                    backgroundColor: isHighlighted
                      ? theme.palette.common.white
                      : "#faf8f5",
                    borderRadius: theme.borderRadius.md,
                    padding: compact ? theme.spacing(3) : theme.spacing(1.5),
                    gap: theme.spacing(1),
                    alignItems: compact ? "stretch" : "start",
                    transition: "all 0.2s ease",
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
                      alignItems: compact ? "flex-start" : "flex-start",
                      pointerEvents: "auto",
                      cursor: "pointer",
                      ...(compact && { gridRow: "1 / -1" }), // Span all rows in compact
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

                  {/* Column 2: Content (in compact mode, contains everything else) */}
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
                        {/* Left column: Title + Description */}
                        <Box
                          sx={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            gap: theme.spacing(1.5),
                          }}
                        >
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontWeight: theme.typography.fontWeightMedium,
                              fontSize: "1.1rem",
                              maxWidth: "280px",
                            }}
                          >
                            {strategy.value === "current-ops-historical-ag"
                              ? "Current operations with historical agricultural land use"
                              : strategy.label}
                          </Typography>
                          {showDefinitions && (
                            <Typography
                              variant="body2"
                              sx={{
                                lineHeight: 1.4,
                                fontSize: theme.typography.nav.fontSize,
                                maxWidth: "400px",
                              }}
                            >
                              {strategy.description
                                .split(/(\bTUCPs?\b)/g)
                                .map((part, idx) => {
                                  if (part.match(/\bTUCPs?\b/)) {
                                    return (
                                      <span key={idx}>
                                        {part}
                                        <InfoIconButton
                                          variant="inline"
                                          tooltipContent={
                                            <>
                                              <Box
                                                component="span"
                                                sx={{ fontWeight: 600 }}
                                              >
                                                Temporary Urgent Change
                                                Petitions
                                              </Box>{" "}
                                              permit changes during droughts to
                                              meet human health and safety needs
                                              and protect endangered species.
                                            </>
                                          }
                                        />
                                      </span>
                                    )
                                  }
                                  return part
                                })}
                            </Typography>
                          )}
                        </Box>
                        {/* Right column: Key operations */}
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
                          <Box
                            sx={{
                              display: "flex",
                              gap: 0.5,
                              alignItems: "flex-start",
                              flexDirection: "row",
                            }}
                          >
                            {strategy.theme && strategy.theme !== "baseline" ? (
                              <>
                                <InfoTooltip
                                  description={getThemeIconDescription(
                                    strategy.theme,
                                    strategy.value,
                                  )}
                                  placement="top"
                                >
                                  <Box
                                    sx={{
                                      width: {
                                        xs: theme.spacing(4),
                                        lg: theme.spacing(5),
                                      },
                                      height: {
                                        xs: theme.spacing(4),
                                        lg: theme.spacing(5),
                                      },
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    {getThemeIcon(strategy.theme)}
                                  </Box>
                                </InfoTooltip>
                                <InfoTooltip
                                  description="2020 LandIQ land use"
                                  placement="top"
                                >
                                  <Box
                                    sx={{
                                      width: {
                                        xs: theme.spacing(4),
                                        lg: theme.spacing(5),
                                      },
                                      height: {
                                        xs: theme.spacing(4),
                                        lg: theme.spacing(5),
                                      },
                                      cursor: "pointer",
                                    }}
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={
                                        CURRENT_OPERATIONS_ICONS[1]?.path ||
                                        "/images/icons/land_use.svg"
                                      }
                                      alt={
                                        CURRENT_OPERATIONS_ICONS[1]?.alt ||
                                        "Land use"
                                      }
                                      style={{ width: "100%", height: "100%" }}
                                    />
                                  </Box>
                                </InfoTooltip>
                              </>
                            ) : (
                              <>
                                <InfoTooltip
                                  description={
                                    CURRENT_OPERATIONS_ICONS[0]?.description ||
                                    "Current operations"
                                  }
                                  placement="top"
                                >
                                  <Box
                                    sx={{
                                      width: {
                                        xs: theme.spacing(4),
                                        lg: theme.spacing(5),
                                      },
                                      height: {
                                        xs: theme.spacing(4),
                                        lg: theme.spacing(5),
                                      },
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
                                <InfoTooltip
                                  description={
                                    strategy.value ===
                                    "current-ops-historical-ag"
                                      ? "Historical land use (2004-2013)"
                                      : CURRENT_OPERATIONS_ICONS[1]
                                          ?.description || "Current land use"
                                  }
                                  placement="top"
                                >
                                  <Box
                                    sx={{
                                      width: {
                                        xs: theme.spacing(4),
                                        lg: theme.spacing(5),
                                      },
                                      height: {
                                        xs: theme.spacing(4),
                                        lg: theme.spacing(5),
                                      },
                                      cursor: "pointer",
                                    }}
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={
                                        strategy.value ===
                                        "current-ops-historical-ag"
                                          ? "/images/icons/land_use_prev.svg"
                                          : CURRENT_OPERATIONS_ICONS[1]?.path ||
                                            "/images/icons/land_use.svg"
                                      }
                                      alt={
                                        CURRENT_OPERATIONS_ICONS[1]?.alt ||
                                        "Land use"
                                      }
                                      style={{ width: "100%", height: "100%" }}
                                    />
                                  </Box>
                                </InfoTooltip>
                                {strategy.value.includes("tucp") && (
                                  <InfoTooltip
                                    description={
                                      CURRENT_OPERATIONS_ICONS[2]
                                        ?.description || "TUCP included"
                                    }
                                    placement="top"
                                  >
                                    <Box
                                      sx={{
                                        width: {
                                          xs: theme.spacing(4),
                                          lg: theme.spacing(5),
                                        },
                                        height: {
                                          xs: theme.spacing(4),
                                          lg: theme.spacing(5),
                                        },
                                        cursor: "pointer",
                                      }}
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={
                                          CURRENT_OPERATIONS_ICONS[2]?.path ||
                                          "/images/icons/tucp.svg"
                                        }
                                        alt={
                                          CURRENT_OPERATIONS_ICONS[2]?.alt ||
                                          "TUCP"
                                        }
                                        style={{
                                          width: "100%",
                                          height: "100%",
                                        }}
                                      />
                                    </Box>
                                  </InfoTooltip>
                                )}
                                {!strategy.value.includes("tucp") &&
                                  strategy.theme === "baseline" && (
                                    <InfoTooltip
                                      description="No TUCP included"
                                      placement="top"
                                    >
                                      <Box
                                        sx={{
                                          width: {
                                            xs: theme.spacing(4),
                                            lg: theme.spacing(5),
                                          },
                                          height: {
                                            xs: theme.spacing(4),
                                            lg: theme.spacing(5),
                                          },
                                          cursor: "pointer",
                                        }}
                                      >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                          src="/images/icons/no_tucp.svg"
                                          alt="No TUCP"
                                          style={{
                                            width: "100%",
                                            height: "100%",
                                          }}
                                        />
                                      </Box>
                                    </InfoTooltip>
                                  )}
                              </>
                            )}
                          </Box>
                        </Box>
                      </Box>

                      {/* Key outcomes section in compact mode */}
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: theme.spacing(1.5),
                        }}
                      >
                        <Typography variant="subtitle2">
                          Key outcomes
                        </Typography>
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
                            {outcomeNames
                              .slice(0, 5)
                              .map(({ name, displayName }) => {
                                const strategyChartData =
                                  getChartDataForStrategy(strategy.value)
                                const isActiveForStrategy =
                                  strategyChartData[displayName] !==
                                    undefined &&
                                  strategyChartData[displayName].length > 0
                                const isSortedByThisOutcome =
                                  sortBy === displayName

                                return (
                                  <div key={displayName}>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: 0.5,
                                        cursor: isActiveForStrategy
                                          ? "pointer"
                                          : "default",
                                        padding: 0,
                                        borderRadius:
                                          theme.borderRadius.md,
                                        transition: "all 0.2s ease",
                                        backgroundColor:
                                          expandedSummaries[strategy.value] ===
                                          displayName
                                            ? theme.palette.blue.bright + "10"
                                            : "transparent",
                                        opacity: isActiveForStrategy ? 1 : 0.7,
                                        border:
                                          expandedSummaries[strategy.value] ===
                                            displayName ||
                                          (selectedOutcomes[strategy.value] ===
                                            displayName &&
                                            onTierClick)
                                            ? theme.border.focus
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
                                              onOutcomeSelect(
                                                strategy.value,
                                                displayName,
                                              )
                                              if (onTierClick)
                                                onTierClick(
                                                  strategy.value,
                                                  displayName,
                                                )
                                              toggleSummary(
                                                strategy.value,
                                                displayName,
                                              )
                                            }
                                          : undefined
                                      }
                                    >
                                      {isActiveForStrategy ? (
                                        (() => {
                                          const chartData =
                                            strategyChartData[displayName]
                                          const values: [
                                            number,
                                            number,
                                            number,
                                            number,
                                          ] = chartData
                                            ? (chartData
                                                .map((tier) => tier.value)
                                                .slice(0, 4) as [
                                                number,
                                                number,
                                                number,
                                                number,
                                              ])
                                            : [0, 0, 0, 0]
                                          const variant = isSingleValueTier(
                                            chartData,
                                          )
                                            ? "dots"
                                            : "bars"

                                          return (
                                            <ScenarioGlyph
                                              variant={variant}
                                              values={values}
                                              size={60}
                                              tierColors={
                                                (chartData
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
                                              }
                                            />
                                          )
                                        })()
                                      ) : (
                                        <Box
                                          sx={{
                                            width: 60,
                                            height: 60,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            backgroundColor:
                                              theme.palette.grey[100],
                                            borderRadius:
                                              theme.borderRadius.md,
                                            border: theme.border.medium,
                                          }}
                                        >
                                          <Typography
                                            sx={{
                                              fontSize: "0.6rem",
                                              color: theme.palette.text.primary,
                                              textAlign: "center",
                                              lineHeight: 1.2,
                                              px: 0.5,
                                            }}
                                          >
                                            No data at this time
                                          </Typography>
                                        </Box>
                                      )}
                                      <Box
                                        sx={{
                                          display: "flex",
                                          flexDirection: "column",
                                          alignItems: "center",
                                          mt: 0.5,
                                        }}
                                      >
                                        <Typography
                                          component="div"
                                          sx={{
                                            textAlign: "center",
                                            fontSize: "0.65rem",
                                            fontWeight:
                                              theme.typography.fontWeightMedium,
                                            color: isActiveForStrategy
                                              ? theme.palette.blue.darkest
                                              : theme.palette.grey[500],
                                            lineHeight: 1.2,
                                            maxWidth: "70px",
                                          }}
                                        >
                                          {displayName}
                                        </Typography>
                                        <Box
                                          sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: 0,
                                            mt: 0.25,
                                          }}
                                        >
                                          <InfoIconButton
                                            isActive={activeTooltip === name}
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleToggleWithAnchor(
                                                name,
                                                e.currentTarget,
                                              )
                                            }}
                                            title="Click for outcome details"
                                          />
                                          {onSortChange && (
                                            <SortButton
                                              sortState={
                                                isSortedByThisOutcome
                                                  ? sortDirection
                                                  : null
                                              }
                                              onAscClick={(e) => {
                                                e.stopPropagation()
                                                onSortChange(
                                                  sortDirection === "asc"
                                                    ? null
                                                    : displayName,
                                                  "asc",
                                                )
                                              }}
                                              onDescClick={(e) => {
                                                e.stopPropagation()
                                                onSortChange(
                                                  sortDirection === "desc"
                                                    ? null
                                                    : displayName,
                                                  "desc",
                                                )
                                              }}
                                              title="Sort by this outcome"
                                            />
                                          )}
                                        </Box>
                                      </Box>
                                    </Box>
                                  </div>
                                )
                              })}
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
                            {outcomeNames
                              .slice(5)
                              .map(({ name, displayName }) => {
                                const strategyChartData =
                                  getChartDataForStrategy(strategy.value)
                                const isActiveForStrategy =
                                  strategyChartData[displayName] !==
                                    undefined &&
                                  strategyChartData[displayName].length > 0
                                const isSortedByThisOutcome =
                                  sortBy === displayName

                                return (
                                  <div key={displayName}>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: 0.5,
                                        cursor: isActiveForStrategy
                                          ? "pointer"
                                          : "default",
                                        padding: 0,
                                        borderRadius:
                                          theme.borderRadius.md,
                                        transition: "all 0.2s ease",
                                        backgroundColor:
                                          expandedSummaries[strategy.value] ===
                                          displayName
                                            ? theme.palette.blue.bright + "10"
                                            : "transparent",
                                        opacity: isActiveForStrategy ? 1 : 0.7,
                                        border:
                                          expandedSummaries[strategy.value] ===
                                            displayName ||
                                          (selectedOutcomes[strategy.value] ===
                                            displayName &&
                                            onTierClick)
                                            ? theme.border.focus
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
                                              onOutcomeSelect(
                                                strategy.value,
                                                displayName,
                                              )
                                              if (onTierClick)
                                                onTierClick(
                                                  strategy.value,
                                                  displayName,
                                                )
                                              toggleSummary(
                                                strategy.value,
                                                displayName,
                                              )
                                            }
                                          : undefined
                                      }
                                    >
                                      {isActiveForStrategy ? (
                                        (() => {
                                          const chartData =
                                            strategyChartData[displayName]
                                          const values: [
                                            number,
                                            number,
                                            number,
                                            number,
                                          ] = chartData
                                            ? (chartData
                                                .map((tier) => tier.value)
                                                .slice(0, 4) as [
                                                number,
                                                number,
                                                number,
                                                number,
                                              ])
                                            : [0, 0, 0, 0]
                                          const variant = isSingleValueTier(
                                            chartData,
                                          )
                                            ? "dots"
                                            : "bars"

                                          return (
                                            <ScenarioGlyph
                                              variant={variant}
                                              values={values}
                                              size={60}
                                              tierColors={
                                                (chartData
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
                                              }
                                            />
                                          )
                                        })()
                                      ) : (
                                        <Box
                                          sx={{
                                            width: 60,
                                            height: 60,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            backgroundColor:
                                              theme.palette.grey[100],
                                            borderRadius:
                                              theme.borderRadius.md,
                                            border: theme.border.medium,
                                          }}
                                        >
                                          <Typography
                                            sx={{
                                              fontSize: "0.6rem",
                                              color: theme.palette.text.primary,
                                              textAlign: "center",
                                              lineHeight: 1.2,
                                              px: 0.5,
                                            }}
                                          >
                                            No data at this time
                                          </Typography>
                                        </Box>
                                      )}
                                      <Box
                                        sx={{
                                          display: "flex",
                                          flexDirection: "column",
                                          alignItems: "center",
                                          mt: 0.5,
                                        }}
                                      >
                                        <Typography
                                          component="div"
                                          sx={{
                                            textAlign: "center",
                                            fontSize: "0.65rem",
                                            fontWeight:
                                              theme.typography.fontWeightMedium,
                                            color: isActiveForStrategy
                                              ? theme.palette.blue.darkest
                                              : theme.palette.grey[500],
                                            lineHeight: 1.2,
                                            maxWidth: "70px",
                                          }}
                                        >
                                          {displayName}
                                        </Typography>
                                        <Box
                                          sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: 0,
                                            mt: 0.25,
                                          }}
                                        >
                                          <InfoIconButton
                                            isActive={activeTooltip === name}
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleToggleWithAnchor(
                                                name,
                                                e.currentTarget,
                                              )
                                            }}
                                            title="Click for outcome details"
                                          />
                                          {onSortChange && (
                                            <SortButton
                                              sortState={
                                                isSortedByThisOutcome
                                                  ? sortDirection
                                                  : null
                                              }
                                              onAscClick={(e) => {
                                                e.stopPropagation()
                                                onSortChange(
                                                  sortDirection === "asc"
                                                    ? null
                                                    : displayName,
                                                  "asc",
                                                )
                                              }}
                                              onDescClick={(e) => {
                                                e.stopPropagation()
                                                onSortChange(
                                                  sortDirection === "desc"
                                                    ? null
                                                    : displayName,
                                                  "desc",
                                                )
                                              }}
                                              title="Sort by this outcome"
                                            />
                                          )}
                                        </Box>
                                      </Box>
                                    </Box>
                                  </div>
                                )
                              })}
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  ) : (
                    /* Non-compact: Original column 2 - Strategy name and description */
                    <Box sx={{ pr: 1 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: theme.typography.fontWeightMedium,
                          fontSize: "1.1rem",
                          maxWidth: "280px",
                          mb: showDefinitions ? 0.5 : 0,
                          lineHeight: 1.3,
                          whiteSpace: "pre-line",
                        }}
                      >
                        {strategy.value === "current-ops-historical-ag"
                          ? "Current operations with\nhistorical agricultural land use"
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
                                    <InfoIconButton
                                      variant="inline"
                                      tooltipContent={
                                        <>
                                          <Box
                                            component="span"
                                            sx={{ fontWeight: 600 }}
                                          >
                                            Temporary Urgent Change Petitions
                                          </Box>{" "}
                                          permit changes during droughts to meet
                                          human health and safety needs and
                                          protect endangered species.
                                        </>
                                      }
                                    />
                                  </span>
                                )
                              }
                              return part
                            })}
                        </Typography>
                      )}
                    </Box>
                  )}

                  {/* Column 3: Key operations (non-compact only) */}
                  {!compact && (
                    <Box
                      sx={{
                        display: "flex",
                        gap: { xs: 0.5, md: 1 },
                        alignItems: "flex-start",
                        flexDirection: { xs: "column", md: "row" },
                        justifyContent: "flex-start",
                      }}
                    >
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
                  )}

                  {/* Column 4: Outcome charts (non-compact only - compact outcomes are in Column 2) */}
                  {!compact && (
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
                      {outcomeNames.map(({ displayName }) => {
                        const strategyChartData = getChartDataForStrategy(
                          strategy.value,
                        )
                        const isActiveForStrategy =
                          strategyChartData[displayName] !== undefined &&
                          strategyChartData[displayName].length > 0

                        return (
                          <div key={displayName}>
                            <Box
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 0.5,
                                cursor: isActiveForStrategy
                                  ? "pointer"
                                  : "default",
                                padding: 0,
                                borderRadius: theme.borderRadius.md,
                                transition: "all 0.2s ease",
                                backgroundColor:
                                  expandedSummaries[strategy.value] ===
                                  displayName
                                    ? theme.palette.blue.bright + "10"
                                    : "transparent",
                                opacity: isActiveForStrategy ? 1 : 0.7,
                                border:
                                  expandedSummaries[strategy.value] ===
                                    displayName ||
                                  (selectedOutcomes[strategy.value] ===
                                    displayName &&
                                    onTierClick)
                                    ? theme.border.focus
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
                                      onOutcomeSelect(
                                        strategy.value,
                                        displayName,
                                      )
                                      if (onTierClick)
                                        onTierClick(strategy.value, displayName)
                                      toggleSummary(strategy.value, displayName)
                                    }
                                  : undefined
                              }
                            >
                              {isActiveForStrategy ? (
                                (() => {
                                  const chartData =
                                    strategyChartData[displayName]
                                  const values: [
                                    number,
                                    number,
                                    number,
                                    number,
                                  ] = chartData
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
                                      size={60}
                                      tierColors={
                                        (chartData
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
                                      }
                                    />
                                  )
                                })()
                              ) : (
                                <Box
                                  sx={{
                                    width: 60,
                                    height: 60,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor: theme.palette.grey[100],
                                    borderRadius: theme.borderRadius.md,
                                    border: theme.border.medium,
                                  }}
                                >
                                  <Typography
                                    sx={{
                                      fontSize: "0.6rem",
                                      color: theme.palette.text.primary,
                                      textAlign: "center",
                                      lineHeight: 1.2,
                                      px: 0.5,
                                    }}
                                  >
                                    No data at this time
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </div>
                        )
                      })}
                    </Box>
                  )}
                </Box>
              )

              // Get the selected outcome for this strategy's summary (if any)
              const selectedOutcomeForSummary =
                expandedSummaries[strategy.value]

              // Summary row (shown when an outcome is clicked) - uses same SummaryPanel as Learn map
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
                    {/* Empty checkbox column for alignment */}
                    <Box />

                    {/* Summary content - using the same SummaryPanel as Learn map */}
                    <Box sx={{ pr: 2, position: "relative" }}>
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
                          position: "absolute",
                          top: theme.spacing(1),
                          right: theme.spacing(1),
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0.5,
                          display: "flex",
                          alignItems: "center",
                          color: theme.palette.grey[500],
                          fontSize: "16px",
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

              // Strategy row plus summary and optional divider
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

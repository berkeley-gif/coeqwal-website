import React from "react"
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
  MapIcon as MapViewIcon,
} from "@repo/ui"
import { ScenarioGlyph } from "@repo/viz"
import { strategies } from "../../../lib/scenarios"
import { useExploreUserWorkflowStore } from "@repo/state"
import OutcomeTooltip from "./OutcomeTooltip"
import TogglePair from "./TogglePair"

interface StrategyGridProps {
  getChartDataForStrategy: (
    strategyValue: string,
  ) => Record<string, Array<{ label: string; color: string; value: number }>>
  outcomeNames: Array<{
    shortCode: string
    name: string
    displayName: string
  }>
  onOutcomeSelect: (strategyValue: string, outcome: string) => void
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
  iconBox: (showMapView: boolean) => ({
    width: showMapView ? "28px" : { xs: "32px", lg: "40px" },
    height: showMapView ? "28px" : { xs: "32px", lg: "40px" },
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
    fontWeight: 400,
    textAlign: "center",
    fontSize: showMapView ? "0.6rem" : "0.75rem",
    lineHeight: showMapView ? 1.1 : 1.2,
    whiteSpace: "pre-line",
  }),
} as const

// Strategy Grid component
const StrategyGrid = React.memo(function StrategyGridComponent({
  getChartDataForStrategy,
  outcomeNames,
  onOutcomeSelect,
}: StrategyGridProps) {
  const theme = useTheme()

  // Get all necessary state from the store
  const {
    explore: {
      showMapView,
      showOnlyChosen,
      showDefinitions,
      chosenStrategies,
      selectedOutcomes,
    },
    setMapView,
    setShowOnlyChosen,
    setShowDefinitions,
    toggleStrategyChoice,
  } = useExploreUserWorkflowStore()

  return (
    <Box sx={gridStyles.container(showMapView, theme)}>
      {/* Column header */}
      {!showMapView && (
        <>
          <Box
            sx={{
              gridColumn: "1 / 3",
              display: "flex",
              alignItems: "center",
              gap: 2,
              height: "56px",
            }}
          >
            <Typography variant="subtitle2" sx={{ ml: 0.5 }}>
              Choose strategies
            </Typography>

            <Box sx={{ ml: 10 }}>
              <TogglePair
                leftIcon={
                  <DocumentListIcon active={!showOnlyChosen} size={40} />
                }
                rightIcon={
                  <DocumentCheckedIcon active={showOnlyChosen} size={40} />
                }
                onLeftClick={() => setShowOnlyChosen(false)}
                onRightClick={() => setShowOnlyChosen(true)}
                gap={-0.5}
              />
            </Box>

            <TogglePair
              leftIcon={
                <DocumentExpandedIcon active={showDefinitions} size={40} />
              }
              rightIcon={
                <DocumentCollapsedIcon active={!showDefinitions} size={40} />
              }
              onLeftClick={() => setShowDefinitions(true)}
              onRightClick={() => setShowDefinitions(false)}
              gap={-0.5}
              sx={{ ml: -1.5 }}
            />
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", height: "56px" }}>
            <Typography variant="subtitle2">Key operations</Typography>
          </Box>
          <Box
            sx={{
              display: { xs: "none", lg: "flex" },
              alignItems: "center",
              justifyContent: "space-between",
              gap: theme.spacing(theme.cards.spacing.standard),
              height: "56px",
            }}
          >
            <Typography variant="subtitle2">Key outcomes</Typography>

            <Box
              sx={{
                padding: "2px 4px",
                borderRadius: 1,
                marginTop: "-20px",
                "&:hover": { backgroundColor: theme.palette.grey[100] },
              }}
            >
              <TogglePair
                leftIcon={<DocumentListIcon active={!showMapView} size={52} />}
                rightIcon={<MapViewIcon active={showMapView} size={52} />}
                onLeftClick={() => setMapView(false)}
                onRightClick={() => setMapView(true)}
                gap={-0.25}
              />
            </Box>
          </Box>
        </>
      )}

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
                  top: "1px",
                  transform: "scale(0.9)",
                  "& svg": {
                    strokeWidth: "1px",
                  },
                  "& path": {
                    strokeWidth: "1px",
                  },
                }}
              />
            </Box>

            {/* Column 2: Strategy name and description */}
            <Box sx={{ pr: 1 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 500,
                  mb: showDefinitions ? 0.5 : 0,
                  fontSize: showMapView ? "0.9rem" : "1rem",
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
                    fontSize: showMapView ? "0.8rem" : "0.875rem",
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
                                  fontSize: "0.8rem",
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
                    width: showMapView ? "28px" : { xs: "32px", lg: "40px" },
                    height: showMapView ? "28px" : { xs: "32px", lg: "40px" },
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
                    width: showMapView ? "28px" : { xs: "32px", lg: "40px" },
                    height: showMapView ? "28px" : { xs: "32px", lg: "40px" },
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
                      width: showMapView ? "28px" : { xs: "32px", lg: "40px" },
                      height: showMapView ? "28px" : { xs: "32px", lg: "40px" },
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
              {outcomeNames.map(({ name, displayName }) => {
                // Get chart data for this strategy
                const strategyChartData = getChartDataForStrategy(
                  strategy.value,
                )

                // Check if this outcome exists for this strategy
                const isActiveForStrategy =
                  strategyChartData[displayName] !== undefined &&
                  strategyChartData[displayName].length > 0

                return (
                  <OutcomeTooltip key={displayName} outcome={displayName}>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: showMapView ? 0.5 : 1,
                        cursor:
                          showMapView && isActiveForStrategy
                            ? "pointer"
                            : "default",
                        padding: 0,
                        borderRadius: theme.borderRadius.rounded,
                        transition: "all 0.2s ease",
                        backgroundColor: "transparent",
                        opacity: isActiveForStrategy ? 1 : 0.7, // Dim for inactive outcomes
                        border:
                          selectedOutcomes[strategy.value] === displayName &&
                          showMapView
                            ? `2px solid ${theme.palette.blue.bright}`
                            : "2px solid transparent",
                        "&:hover": {
                          backgroundColor:
                            showMapView && isActiveForStrategy
                              ? theme.palette.grey[100]
                              : "transparent",
                        },
                      }}
                      onClick={
                        showMapView && isActiveForStrategy
                          ? () => onOutcomeSelect(strategy.value, displayName)
                          : undefined
                      }
                    >
                      <ScenarioGlyph
                        variant="bars"
                        values={
                          isActiveForStrategy
                            ? (strategyChartData[displayName]
                                ?.map((tier) => tier.value)
                                .slice(0, 4) as [
                                number,
                                number,
                                number,
                                number,
                              ]) || [0, 0, 0, 0]
                            : [0, 0, 0, 0] // Empty chart for inactive outcomes
                        }
                        size={showMapView ? 35 : 50}
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
                      <Typography
                        variant="caption"
                        sx={gridStyles.outcomeLabel(
                          showMapView,
                          isActiveForStrategy,
                          theme,
                        )}
                      >
                        {displayName === "Freshwater for in-Delta uses"
                          ? "Freshwater for\nin-Delta uses"
                          : name}
                      </Typography>
                    </Box>
                  </OutcomeTooltip>
                )
              })}
            </Box>
          </Box>
        ))}
    </Box>
  )
})

export default StrategyGrid
export type { StrategyGridProps }

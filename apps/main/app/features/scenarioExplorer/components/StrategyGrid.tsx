import React from "react"
import {
  Box,
  Typography,
  useTheme,
  InfoIcon,
  Theme,
} from "@repo/ui/mui"
import { InfoTooltip } from "@repo/ui"
import { ScenarioGlyph } from "@repo/viz"
import { strategies } from "../../../lib/scenarios"
import OutcomeTooltip from "./OutcomeTooltip"

interface StrategyGridProps {
  showMapView: boolean
  showOnlyChosen: boolean
  showDefinitions: boolean
  chosenStrategies: string[]
  toggleStrategyChoice: (value: string) => void
  setMapView: (show: boolean) => void
  setShowOnlyChosen: (show: boolean) => void
  setShowDefinitions: (show: boolean) => void
  selectedOutcomes: Record<string, string | null>
  onOutcomeSelect: (strategyValue: string, outcome: string) => void
  getChartDataForStrategy: (strategyValue: string) => Record<string, Array<{ label: string; color: string; value: number }>>
  outcomeNames: Array<{ shortCode: string; name: string; displayName: string; isActive: boolean }>
}

// Reusable styles, eventually use theme?
const gridStyles = {
  container: (showMapView: boolean, theme: Theme) => ({
    display: "grid",
    gridTemplateColumns: {
      xs: "0.5fr minmax(200px, 3fr) minmax(80px, 1fr)",
      lg: "0.5fr minmax(300px, 4fr) 1fr minmax(540px, 9fr)",
    },
    gap: showMapView ? theme.spacing(1) : theme.spacing(theme.cards.spacing.standard),
    alignItems: "start",
    ...(showMapView && {
      maxHeight: "40vh",
      overflow: "auto",
    }),
  }),
  headerBox: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  headerBoxFlex: (theme: Theme) => ({
    display: { xs: "none", lg: "flex" },
    alignItems: "baseline",
    gap: theme.spacing(theme.cards.spacing.standard),
  }),
  mapViewToggle: (theme: Theme) => ({
    cursor: "pointer",
    color: theme.palette.blue.bright,
    textDecoration: "none",
    fontSize: "0.8rem",
    "&:hover": { color: theme.palette.blue.darkest },
  }),
  strategyRow: (showMapView: boolean, theme: Theme) => ({
    gridColumn: "1 / -1",
    display: "grid",
    gridTemplateColumns: { xs: "subgrid", lg: "subgrid" },
    backgroundColor: "#faf8f5",
    borderRadius: theme.borderRadius.rounded,
    padding: showMapView ? theme.spacing(1) : theme.spacing(theme.cards.spacing.standard),
    gap: showMapView ? theme.spacing(1) : theme.spacing(theme.cards.spacing.standard),
    alignItems: "start",
  }),
  starIcon: {
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    pt: 1,
    cursor: "pointer",
  },
  strategyTitle: (showMapView: boolean, showDefinitions: boolean) => ({
    fontWeight: 500,
    mb: showDefinitions ? (showMapView ? 0.5 : 1) : 0,
    fontSize: showMapView ? "0.9rem" : undefined,
  }),
  strategyDescription: (showMapView: boolean) => ({
    lineHeight: showMapView ? 1.3 : 1.5,
    fontSize: showMapView ? "0.8rem" : undefined,
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
  outcomeChartsContainer: (theme: any) => ({
    gridColumn: { xs: "1 / -1", lg: "auto" },
    display: "grid",
    gridTemplateColumns: {
      xs: "repeat(3, 1fr)",
      lg: "repeat(9, minmax(60px, 1fr))",
    },
    gap: theme.spacing(theme.cards.spacing.standard),
    minWidth: { xs: "auto", lg: "540px" },
    mt: { xs: 2, lg: 0 },
  }),
  outcomeBox: (showMapView: boolean, isActive: boolean, isSelected: boolean, theme: Theme) => ({
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
    border: isSelected ? `2px solid ${theme.palette.blue.bright}` : "2px solid transparent",
    "&:hover": {
      backgroundColor: showMapView && isActive ? theme.palette.grey[100] : "transparent",
    },
  }),
  outcomeLabel: (showMapView: boolean, isActive: boolean, theme: Theme) => ({
    color: isActive ? theme.palette.blue.darkest : theme.palette.grey[500],
    fontWeight: 500,
    textAlign: "center",
    fontSize: showMapView ? "0.6rem" : "0.7rem",
    lineHeight: showMapView ? 1.1 : 1.2,
  }),
} as const

// Strategy Grid component (memoized)
const StrategyGrid = React.memo(function StrategyGridComponent({
  showMapView,
  showOnlyChosen,
  showDefinitions,
  chosenStrategies,
  toggleStrategyChoice,
  setMapView,
  selectedOutcomes,
  onOutcomeSelect,
  getChartDataForStrategy,
  outcomeNames,
}: StrategyGridProps) {
  const theme = useTheme()

  return (
    <Box sx={gridStyles.container(showMapView, theme)}>
      {/* Column Headers - only show in table view */}
      {!showMapView && (
        <>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Typography variant="subtitle2">Choose</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2">Strategy</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2">Key operations</Typography>
          </Box>
          <Box
            sx={{
              display: { xs: "none", lg: "flex" },
              alignItems: "baseline",
              gap: theme.spacing(theme.cards.spacing.standard),
            }}
          >
            <Typography variant="subtitle2">Key outcomes</Typography>
            <Typography
              variant="body2"
              onClick={() => setMapView(!showMapView)}
              sx={{
                cursor: "pointer",
                color: theme.palette.blue.bright,
                textDecoration: "none",
                fontSize: "0.8rem",
                "&:hover": { color: theme.palette.blue.darkest },
              }}
            >
              {showMapView ? "Back to list view" : "Show outcomes on map"}
            </Typography>
          </Box>
        </>
      )}

      {/* Strategy rows */}
      {strategies
        .filter((strategy) =>
          showOnlyChosen ? chosenStrategies.includes(strategy.value) : true,
        )
        .map((strategy) => (
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
              padding: showMapView
                ? theme.spacing(1)
                : theme.spacing(theme.cards.spacing.standard),
              gap: showMapView
                ? theme.spacing(1)
                : theme.spacing(theme.cards.spacing.standard),
              alignItems: "start",
            }}
          >
            {/* Column 1: Star icon */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-start",
                pt: 1,
                cursor: "pointer",
              }}
              onClick={() => toggleStrategyChoice(strategy.value)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                  stroke={theme.palette.blue.bright}
                  strokeWidth="2"
                  fill={
                    chosenStrategies.includes(strategy.value)
                      ? theme.palette.blue.bright
                      : "none"
                  }
                />
              </svg>
            </Box>

            {/* Column 2: Strategy name and description */}
            <Box>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 500,
                  mb: showDefinitions ? (showMapView ? 0.5 : 1) : 0,
                  fontSize: showMapView ? "0.9rem" : undefined,
                }}
              >
                {strategy.label}
              </Typography>
              {showDefinitions && (
                <Typography
                  variant="body2"
                  sx={{
                    lineHeight: showMapView ? 1.3 : 1.5,
                    fontSize: showMapView ? "0.8rem" : undefined,
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
                alignItems: "center",
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
                  lg: "repeat(9, minmax(60px, 1fr))", // Desktop: 9 in a row
                },
                gap: theme.spacing(theme.cards.spacing.standard),
                minWidth: { xs: "auto", lg: "540px" },
                mt: { xs: 2, lg: 0 }, // Add top margin on mobile
              }}
            >
              {outcomeNames.map(({ name, displayName, isActive }) => {
                // Get chart data for this specific strategy
                const strategyChartData = getChartDataForStrategy(strategy.value)
                
                return (
                  <OutcomeTooltip key={displayName} outcome={displayName}>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: showMapView ? 0.5 : 1,
                        cursor: showMapView && isActive ? "pointer" : "default",
                        padding: 0.5,
                        borderRadius: theme.borderRadius.rounded,
                        transition: "all 0.2s ease",
                        backgroundColor: "transparent",
                        opacity: isActive ? 1 : 0.7, // Dim for inactive outcomes
                        border:
                          selectedOutcomes[strategy.value] === displayName &&
                          showMapView
                            ? `2px solid ${theme.palette.blue.bright}`
                            : "2px solid transparent",
                        "&:hover": {
                          backgroundColor: showMapView && isActive
                            ? theme.palette.grey[100]
                            : "transparent",
                        },
                      }}
                      onClick={
                        showMapView && isActive
                          ? () => onOutcomeSelect(strategy.value, displayName)
                          : undefined
                      }
                    >
                      <ScenarioGlyph
                        variant="bars"
                        values={
                          isActive 
                            ? (strategyChartData[displayName]?.map(tier => tier.value).slice(0, 4) as [number, number, number, number]) || [0, 0, 0, 0]
                            : [0, 0, 0, 0] // Empty chart for inactive outcomes
                        }
                        size={showMapView ? 35 : 50}
                        tierColors={
                          isActive 
                            ? (strategyChartData[displayName]?.map(tier => tier.color).slice(0, 4) as [string, string, string, string]) ||
                              [
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
                        sx={{
                          color: isActive ? theme.palette.blue.darkest : theme.palette.grey[500],
                          fontWeight: 500,
                          textAlign: "center",
                          fontSize: showMapView ? "0.6rem" : "0.7rem",
                          lineHeight: showMapView ? 1.1 : 1.2,
                        }}
                      >
                        {name}
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

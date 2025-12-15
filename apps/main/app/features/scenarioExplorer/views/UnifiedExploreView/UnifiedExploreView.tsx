"use client"

import React, { useEffect, useMemo, useState } from "react"
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  useTheme,
  CircularProgress,
  ViewListIcon,
  MapIcon,
  CompareArrowsIcon,
} from "@repo/ui/mui"
import { VerticalParallelLinePlot } from "@repo/viz"
import ListView from "../ListView/ListView"
import { learnMapActions } from "../../../../features/map/store"
import { useComparisonData } from "../ComparisonView/useComparisonData"

export type ExploreMode = "list" | "map" | "comparison"

interface UnifiedExploreViewProps {
  /** Current view mode */
  mode: ExploreMode
  /** Callback when mode changes (for parent to track for background color) */
  onModeChange: (mode: ExploreMode) => void
}

/**
 * UnifiedExploreView
 *
 * A single view that combines List, Map, and Comparison modes with smooth transitions.
 *
 * Modes:
 * - list: Full-width scenario list (default)
 * - map: List slides to 50% width, revealing the persistent map on the right
 * - comparison: Comparison chart panel slides in from the right
 *
 * The persistent map is always behind at z-index basement level.
 * Transitions use CSS transforms for smooth 60fps animations.
 */
export default function UnifiedExploreView({
  mode,
  onModeChange,
}: UnifiedExploreViewProps) {
  const theme = useTheme()

  // Comparison data (loaded even when not in comparison mode for smooth transitions)
  const {
    data: comparisonData,
    axes,
    lineColors,
    isLoading: comparisonLoading,
    hasData: hasComparisonData,
  } = useComparisonData()

  // Track highlighted scenario in comparison
  const [highlightedScenario, setHighlightedScenario] = useState<string | null>(
    null,
  )

  // Update comparison data with highlighted state
  const highlightedData = useMemo(() => {
    return comparisonData.map((scenario) => ({
      ...scenario,
      highlighted: scenario.id === highlightedScenario,
    }))
  }, [comparisonData, highlightedScenario])

  const handleScenarioClick = (scenarioId: string) => {
    setHighlightedScenario((prev) => (prev === scenarioId ? null : scenarioId))
  }

  // Set map mode based on current view mode
  useEffect(() => {
    if (mode === "map") {
      learnMapActions.setMapMode("explore")
    } else {
      learnMapActions.setMapMode("hidden")
      learnMapActions.setExploreTierSelection(null)
    }

    return () => {
      learnMapActions.setMapMode("hidden")
      learnMapActions.setExploreTierSelection(null)
    }
  }, [mode])

  const handleTierClick = (strategy: string, outcome: string) => {
    learnMapActions.setExploreTierSelection({ strategy, outcome })
  }

  // Width calculations based on mode
  const listWidth = mode === "list" ? "100%" : "50%"
  const showRightPanel = mode === "map" || mode === "comparison"

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Mode Toggle Toolbar */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: theme.spacing(2),
          py: theme.spacing(1),
          backgroundColor: theme.palette.common.white,
          borderBottom: theme.border.standard,
          borderColor: theme.palette.grey[300],
          flexShrink: 0,
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.grey[600],
            mr: 1,
          }}
        >
          View:
        </Typography>

        <Tooltip title="List view" arrow>
          <IconButton
            size="small"
            onClick={() => onModeChange("list")}
            sx={{
              backgroundColor:
                mode === "list"
                  ? `${theme.palette.blue.bright}1A`
                  : "transparent",
              color:
                mode === "list"
                  ? theme.palette.blue.bright
                  : theme.palette.grey[600],
              "&:hover": {
                backgroundColor: `${theme.palette.blue.bright}1A`,
              },
            }}
          >
            <ViewListIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Map view" arrow>
          <IconButton
            size="small"
            onClick={() => onModeChange("map")}
            sx={{
              backgroundColor:
                mode === "map"
                  ? `${theme.palette.blue.bright}1A`
                  : "transparent",
              color:
                mode === "map"
                  ? theme.palette.blue.bright
                  : theme.palette.grey[600],
              "&:hover": {
                backgroundColor: `${theme.palette.blue.bright}1A`,
              },
            }}
          >
            <MapIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Comparison view" arrow>
          <IconButton
            size="small"
            onClick={() => onModeChange("comparison")}
            sx={{
              backgroundColor:
                mode === "comparison"
                  ? `${theme.palette.blue.bright}1A`
                  : "transparent",
              color:
                mode === "comparison"
                  ? theme.palette.blue.bright
                  : theme.palette.grey[600],
              "&:hover": {
                backgroundColor: `${theme.palette.blue.bright}1A`,
              },
            }}
          >
            <CompareArrowsIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {/* Mode-specific helper text */}
        <Typography
          variant="caption"
          sx={{
            color: theme.palette.grey[500],
            ml: 2,
            fontStyle: "italic",
          }}
        >
          {mode === "list" && "Full scenario list"}
          {mode === "map" && "Click an outcome to see it on the map"}
          {mode === "comparison" &&
            "Compare scenarios across outcomes with brushing"}
        </Typography>
      </Box>

      {/* Main Content Area */}
      <Box
        sx={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          position: "relative",
          // Allow map panning through in map mode
          pointerEvents: mode === "map" ? "none" : "auto",
        }}
      >
        {/* Left Panel: List (animates width) */}
        <Box
          sx={{
            width: listWidth,
            transition: "width 0.3s ease-in-out",
            display: "flex",
            flexDirection: "column",
            borderRight: showRightPanel ? theme.border.standard : "none",
            borderColor: theme.palette.grey[300],
            backgroundColor:
              mode === "list"
                ? theme.palette.grey[100]
                : theme.palette.common.white,
            position: "relative",
            zIndex: theme.zIndex.panels,
            overflow: "hidden",
            pointerEvents: "auto", // Keep list interactive even when parent is "none"
          }}
        >
          <ListView
            compact={mode !== "list"}
            onTierClick={mode === "map" ? handleTierClick : undefined}
          />
        </Box>

        {/* Right Panel: Map or Comparison (slides in) */}
        <Box
          sx={{
            width: showRightPanel ? "50%" : "0%",
            transition: "width 0.3s ease-in-out",
            overflow: "hidden",
            position: "relative",
            backgroundColor:
              mode === "comparison" ? theme.palette.grey[100] : "transparent",
            // Allow map panning through when in map mode
            pointerEvents: mode === "map" ? "none" : "auto",
          }}
        >
          {/* Map Mode Content */}
          {mode === "map" && (
            <Box
              sx={{
                position: "absolute",
                top: theme.spacing(2),
                right: theme.spacing(2),
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                borderRadius: theme.borderRadius.rounded,
                padding: theme.spacing(2),
                boxShadow: theme.boxShadows.subtle,
                maxWidth: theme.spacing(40),
                zIndex: theme.zIndex.mapControls,
                pointerEvents: "auto", // Re-enable for the info overlay
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontSize: theme.typography.compact.subtitle.fontSize,
                  color: theme.palette.text.primary,
                }}
              >
                Click on a scenario outcome in the left panel to see outcomes at
                specific locations.
              </Typography>
            </Box>
          )}

          {/* Comparison Mode Content */}
          {mode === "comparison" && (
            <Box
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {comparisonLoading ? (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                  }}
                >
                  <CircularProgress size={32} />
                  <Typography
                    variant="body2"
                    sx={{ mt: 2, color: theme.palette.grey[600] }}
                  >
                    Loading comparison...
                  </Typography>
                </Box>
              ) : hasComparisonData ? (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    overflow: "hidden",
                  }}
                >
                  {/* Comparison Header */}
                  <Box
                    sx={{
                      px: theme.spacing(2),
                      pt: theme.spacing(2),
                      pb: theme.spacing(1),
                      backgroundColor: theme.palette.common.white,
                      borderBottom: theme.border.standard,
                      borderColor: theme.palette.grey[300],
                      flexShrink: 0,
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: theme.typography.fontWeightMedium,
                        mb: 0.5,
                      }}
                    >
                      Scenario Comparison
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: theme.palette.grey[600] }}
                    >
                      Use draggable arrows on axes to filter scenarios
                    </Typography>

                    {/* Scenario legend */}
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 1,
                        mt: 1,
                      }}
                    >
                      {comparisonData.map((scenario, index) => {
                        const isHighlighted =
                          highlightedScenario === scenario.id
                        return (
                          <Box
                            key={scenario.id}
                            onClick={() => handleScenarioClick(scenario.id)}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                              cursor: "pointer",
                              px: 1,
                              py: 0.25,
                              borderRadius: 0.5,
                              backgroundColor: isHighlighted
                                ? theme.palette.grey[100]
                                : "transparent",
                              "&:hover": {
                                backgroundColor: theme.palette.grey[50],
                              },
                            }}
                          >
                            <Box
                              sx={{
                                width: 16,
                                height: isHighlighted ? 4 : 3,
                                backgroundColor: lineColors[index],
                                borderRadius: 0.5,
                              }}
                            />
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: isHighlighted ? 600 : 400,
                                fontSize: "0.7rem",
                              }}
                            >
                              {scenario.name}
                            </Typography>
                          </Box>
                        )
                      })}
                    </Box>
                  </Box>

                  {/* Chart */}
                  <Box
                    sx={{
                      flex: 1,
                      p: theme.spacing(2),
                      overflow: "auto",
                    }}
                  >
                    <Box
                      sx={{
                        backgroundColor: theme.palette.common.white,
                        borderRadius: theme.borderRadius.rounded,
                        p: 2,
                        boxShadow: theme.boxShadows.subtle,
                        height: "500px",
                      }}
                    >
                      <VerticalParallelLinePlot
                        data={highlightedData}
                        axes={axes}
                        responsive={true}
                        showBaseline={false}
                        colors={{
                          default: theme.palette.grey[600],
                          highlighted: theme.palette.blue.darkest,
                          background: theme.palette.grey[50],
                          axis: theme.palette.grey[500],
                        }}
                        lineColors={lineColors}
                        onLineClick={(scenario) =>
                          handleScenarioClick(scenario.id)
                        }
                      />
                    </Box>
                  </Box>
                </Box>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ color: theme.palette.grey[600] }}
                  >
                    No comparison data available
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}

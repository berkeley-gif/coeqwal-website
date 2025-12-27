"use client"

/**
 * UnifiedExploreView - Combined list and chart exploration view
 *
 * Displays strategies in a list with integrated outcome charts.
 * Used in the Explore tab's unified view mode.
 */

import React, { useEffect, useMemo } from "react"
import { Box, Typography, useTheme, CircularProgress } from "@repo/ui/mui"
import { VerticalParallelLinePlot } from "@repo/viz"
import ListView from "../ListView/ListView"
import {
  mapActions,
  useActiveOutcomeVisualization,
} from "../../../../features/map/store"
import { useComparisonData } from "../ComparisonView/useComparisonData"

export type ExploreMode = "list" | "map" | "comparison"

interface UnifiedExploreViewProps {
  /** Current view mode */
  mode: ExploreMode
  /** Currently highlighted scenario ID (for comparison mode) */
  highlightedScenario?: string | null
  /** Callback when a scenario is clicked in the chart */
  onScenarioClick?: (scenarioId: string) => void
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
  highlightedScenario = null,
  onScenarioClick,
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

  // Update comparison data with highlighted state
  const highlightedData = useMemo(() => {
    return comparisonData.map((scenario) => ({
      ...scenario,
      highlighted: scenario.id === highlightedScenario,
    }))
  }, [comparisonData, highlightedScenario])

  // Get current visualization for toggle behavior
  const currentVisualization = useActiveOutcomeVisualization()

  // Set map mode based on current view mode
  useEffect(() => {
    if (mode === "map") {
      mapActions.setMapMode("explore")
    } else {
      mapActions.setMapMode("hidden")
      mapActions.clearOutcomeVisualization()
    }

    return () => {
      mapActions.setMapMode("hidden")
      mapActions.clearOutcomeVisualization()
    }
  }, [mode])

  // Toggle behavior: if same outcome is already selected, clear it; otherwise set it
  const handleTierClick = (strategy: string, outcome: string) => {
    const isSameSelection =
      currentVisualization?.strategy === strategy &&
      currentVisualization?.outcome === outcome
    
    if (isSameSelection) {
      mapActions.clearOutcomeVisualization()
    } else {
      mapActions.setOutcomeVisualization(outcome, strategy)
    }
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
        // Allow map panning through when in map mode
        pointerEvents: mode === "map" ? "none" : "auto",
      }}
    >
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
            transition: theme.transition.layout,
            display: "flex",
            flexDirection: "column",
            borderRight: showRightPanel ? theme.border.medium : "none",
            backgroundColor:
              mode === "list"
                ? theme.palette.grey[100]
                : theme.palette.common.white,
            position: "relative",
            zIndex: theme.zIndex.pageContent,
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
            transition: theme.transition.layout,
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
                backgroundColor: theme.background.whiteOverlay[95],
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing(2),
                boxShadow: theme.shadow.subtle,
                maxWidth: theme.spacing(40),
                zIndex: theme.zIndex.mapControls,
                pointerEvents: "auto", // Re-enable for the info overlay
              }}
            >
              <Typography
                variant="compactSubtitle"
                sx={{ color: theme.palette.text.primary }}
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
                  {/* Chart - full height since header is now in the row above */}
                  <Box
                    sx={{
                      flex: 1,
                      p: theme.spacing(2),
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        backgroundColor: theme.palette.common.white,
                        borderRadius: theme.borderRadius.md,
                        p: 2,
                        boxShadow: theme.shadow.subtle,
                        height: "100%",
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
                          onScenarioClick?.(scenario.id)
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

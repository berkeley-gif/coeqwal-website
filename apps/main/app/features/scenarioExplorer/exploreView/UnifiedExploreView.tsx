"use client"

/**
 * UnifiedExploreView - Combined list and chart exploration view
 */

import React, { useEffect, useMemo } from "react"
import { Box, Typography, useTheme, CircularProgress } from "@repo/ui/mui"
import { VerticalParallelLinePlot } from "@repo/viz"
import ListView from "./ListView"
import { mapActions, useActiveOutcomeVisualization } from "../../map/store"
import { useComparisonData } from "../hooks/useComparisonData"

export type ExploreMode = "list" | "map" | "comparison"

interface UnifiedExploreViewProps {
  mode: ExploreMode
  highlightedScenario?: string | null
  onScenarioClick?: (scenarioId: string) => void
}

export default function UnifiedExploreView({
  mode,
  highlightedScenario = null,
  onScenarioClick,
}: UnifiedExploreViewProps) {
  const theme = useTheme()

  const {
    data: comparisonData,
    axes,
    lineColors,
    isLoading: comparisonLoading,
    hasData: hasComparisonData,
  } = useComparisonData()

  const highlightedData = useMemo(() => {
    return comparisonData.map((scenario) => ({
      ...scenario,
      highlighted: scenario.id === highlightedScenario,
    }))
  }, [comparisonData, highlightedScenario])

  const currentVisualization = useActiveOutcomeVisualization()

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

  const handleTierClick = (scenarioId: string, outcomeCode: string) => {
    mapActions.clearMapTooltips() // Clear any pinned map tooltips

    const isSameSelection =
      currentVisualization?.scenarioId === scenarioId &&
      currentVisualization?.outcomeCode === outcomeCode

    if (isSameSelection) {
      mapActions.clearOutcomeVisualization()
    } else {
      mapActions.setOutcomeVisualization(outcomeCode, scenarioId)
    }
  }

  const listWidth = mode === "list" ? "100%" : "50%"
  const showRightPanel = mode === "map" || mode === "comparison"

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        pointerEvents: mode === "map" ? "none" : "auto",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          position: "relative",
          pointerEvents: mode === "map" ? "none" : "auto",
        }}
      >
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
                : theme.palette.background.paper,
            position: "relative",
            zIndex: theme.zIndex.pageContent,
            overflow: "hidden",
            pointerEvents: "auto",
          }}
        >
          <ListView
            compact={mode !== "list"}
            onTierClick={mode === "map" ? handleTierClick : undefined}
          />
        </Box>

        <Box
          sx={{
            width: showRightPanel ? "50%" : "0%",
            height: "100%",
            transition: theme.transition.layout,
            overflow: "hidden",
            position: "relative",
            backgroundColor:
              mode === "comparison" ? theme.palette.grey[100] : "transparent",
            pointerEvents: mode === "map" ? "none" : "auto",
          }}
        >
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
                    sx={{
                      mt: theme.space.component.lg,
                      color: theme.palette.grey[600],
                    }}
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
                  <Box
                    sx={{
                      flex: 1,
                      p: theme.space.component.lg,
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        backgroundColor: theme.palette.background.paper,
                        borderRadius: theme.borderRadius.md,
                        p: theme.space.component.lg,
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

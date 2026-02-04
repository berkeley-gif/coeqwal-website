"use client"

/**
 * UnifiedExploreView - Combined list and chart exploration view
 */

import React, { useEffect, useMemo, useState } from "react"
import {
  Box,
  Typography,
  useTheme,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Button,
  icons,
} from "@repo/ui/mui"
import { VerticalParallelLinePlotPeak } from "@repo/viz"
import { MobileModal } from "@repo/ui"
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

  // Toggle states for comparison chart
  const [overlayTiers, setOverlayTiers] = useState(false)
  const [highlightBaseline, setHighlightBaseline] = useState(false)
  const [relativeToBaseline, setRelativeToBaseline] = useState(true)
  const [defineOutcome, setDefineOutcome] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const {
    data: comparisonData,
    axes,
    lineColors,
    baselineScenario,
    isLoading: comparisonLoading,
    hasData: hasComparisonData,
  } = useComparisonData()

  const highlightedData = useMemo(() => {
    return comparisonData.map((scenario) => ({
      ...scenario,
      highlighted: scenario.id === highlightedScenario,
    }))
  }, [comparisonData, highlightedScenario])

  // Transform data to be relative to baseline when toggle is on
  const chartData = useMemo(() => {
    if (!relativeToBaseline || !baselineScenario) return highlightedData
    return highlightedData.map((scenario) => ({
      ...scenario,
      values: Object.fromEntries(
        Object.entries(scenario.values).map(([axis, value]) => [
          axis,
          value - (baselineScenario.values[axis] || 0),
        ]),
      ),
    }))
  }, [highlightedData, relativeToBaseline, baselineScenario])

  // Baseline data for the chart - zeroed when in relative mode
  const baselineDataForChart = useMemo(() => {
    if (!baselineScenario) return undefined
    if (relativeToBaseline) {
      return {
        ...baselineScenario,
        values: Object.fromEntries(
          Object.keys(baselineScenario.values).map((key) => [key, 0]),
        ),
      }
    }
    return baselineScenario
  }, [baselineScenario, relativeToBaseline])

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

  const checkboxSx = {
    padding: 0,
    margin: 0,
    transform: "scale(0.85)",
  }

  const toggleControls = (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 0.5,
      }}
    >
      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={relativeToBaseline}
            onChange={(e) => setRelativeToBaseline(e.target.checked)}
            sx={checkboxSx}
          />
        }
        label={
          <Typography variant="compactCaption" sx={{ ml: 0.5 }}>
            relative to current operations
          </Typography>
        }
        sx={{ mr: 1.5 }}
      />
      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={highlightBaseline}
            onChange={(e) => setHighlightBaseline(e.target.checked)}
            sx={checkboxSx}
          />
        }
        label={
          <Typography variant="compactCaption" sx={{ ml: 0.5 }}>
            highlight current operations
          </Typography>
        }
        sx={{ mr: 1.5 }}
      />
      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={defineOutcome}
            onChange={(e) => setDefineOutcome(e.target.checked)}
            sx={checkboxSx}
          />
        }
        label={
          <Typography variant="compactCaption" sx={{ ml: 0.5 }}>
            define an outcome
          </Typography>
        }
        sx={{ mr: 1.5 }}
      />
      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={overlayTiers}
            onChange={(e) => setOverlayTiers(e.target.checked)}
            sx={checkboxSx}
          />
        }
        label={
          <Typography variant="compactCaption" sx={{ ml: 0.5 }}>
            overlay tiers
          </Typography>
        }
      />
    </Box>
  )

  const chartElement = (
    <VerticalParallelLinePlotPeak
      data={chartData}
      axes={axes}
      responsive={true}
      showBaseline={highlightBaseline}
      baselineData={baselineDataForChart}
      overlayTiers={overlayTiers}
      defineOutcome={defineOutcome}
      colors={{
        default: theme.palette.grey[600],
        highlighted: theme.palette.blue.darkest,
        background: theme.palette.grey[50],
      }}
      lineColors={lineColors}
      onLineClick={(scenario) => onScenarioClick?.(scenario.id)}
    />
  )

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
                  {/* Toggle controls & expand button */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexShrink: 0,
                      px: theme.space.component.lg,
                      pt: theme.space.component.sm,
                    }}
                  >
                    {toggleControls}
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => setIsExpanded(true)}
                      startIcon={
                        <icons.OpenInFull sx={{ fontSize: 16 }} />
                      }
                      sx={{
                        color: theme.palette.grey[400],
                        textTransform: "none",
                        minWidth: "auto",
                        px: theme.space.component.sm,
                        flexShrink: 0,
                        "&:hover": {
                          color: theme.palette.grey[600],
                          backgroundColor: theme.palette.grey[100],
                        },
                      }}
                    >
                      Expand
                    </Button>
                  </Box>

                  {/* Chart */}
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
                      {chartElement}
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

      {/* Expanded comparison modal */}
      <MobileModal
        open={isExpanded}
        onClose={() => setIsExpanded(false)}
        title={
          <Box
            component="span"
            sx={{ ...theme.typography.subtitle2, color: theme.palette.text.primary }}
          >
            Scenario Comparison
          </Box>
        }
        maxWidth="90vw"
        maxHeight="90vh"
        contentAriaLabel="Scenario comparison chart expanded view"
        stickyHeader={toggleControls}
      >
        <Box
          sx={{
            p: theme.space.component.lg,
            height: "70vh",
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
            {chartElement}
          </Box>
        </Box>
      </MobileModal>
    </Box>
  )
}

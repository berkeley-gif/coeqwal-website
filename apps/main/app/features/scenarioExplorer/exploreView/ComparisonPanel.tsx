"use client"

/**
 * ComparisonPanel - Right panel for scenario comparison chart
 *
 * Contains the peak VerticalParallelLinePlot with toggle controls,
 * expand-to-modal support, and baseline-relative data transforms.
 */

import React, { useMemo, useState } from "react"
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
import {
  VerticalParallelLinePlotPeak,
  type VerticalParallelLineData,
} from "@repo/viz"
import { MobileModal } from "@repo/ui"
import { useComparisonData } from "../hooks/useComparisonData"
import { useScenarioExplorerStore } from "../store"

export default function ComparisonPanel() {
  const theme = useTheme()

  // Get state and actions from store
  const {
    highlightedScenario,
    setHighlightedScenario,
    setPinnedScenarioId,
  } = useScenarioExplorerStore()

  // Toggle states (local UI state)
  const [overlayTiers, setOverlayTiers] = useState(false)
  const [highlightBaseline, setHighlightBaseline] = useState(false)
  const [relativeToBaseline, setRelativeToBaseline] = useState(true)
  const [defineOutcome, setDefineOutcome] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  // Hover state for tooltip
  const [hoveredScenario, setHoveredScenario] =
    useState<VerticalParallelLineData | null>(null)

  const {
    data: comparisonData,
    axes,
    lineColors,
    baselineScenario,
    isLoading,
    hasData,
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
          // Keep null values as null (missing data stays missing)
          value === null ? null : value - (baselineScenario.values[axis] || 0),
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

  // Handle scenario click in chart
  const handleScenarioClick = (scenarioId: string) => {
    // Toggle highlight
    setHighlightedScenario(
      highlightedScenario === scenarioId ? null : scenarioId,
    )
    // Bring clicked scenario to top of list
    setPinnedScenarioId(scenarioId)
  }

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
            <br />
            (coming soon)
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
    <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
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
        onLineHover={setHoveredScenario}
        onLineClick={(scenario) => handleScenarioClick(scenario.id)}
      />
      {/* Hover tooltip showing scenario name */}
      {hoveredScenario && (
        <Box
          sx={{
            position: "absolute",
            top: -12,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
            boxShadow: theme.shadows[2],
            pointerEvents: "none",
            zIndex: 10,
            whiteSpace: "nowrap",
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 400 }}>
            {hoveredScenario.name}
          </Typography>
        </Box>
      )}
    </Box>
  )

  if (isLoading) {
    return (
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
    )
  }

  if (!hasData) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
        }}
      >
        <Typography variant="body2" sx={{ color: theme.palette.grey[600] }}>
          No comparison data available
        </Typography>
      </Box>
    )
  }

  return (
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
          startIcon={<icons.OpenInFull sx={{ fontSize: 16 }} />}
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

      {/* Expanded comparison modal */}
      <MobileModal
        open={isExpanded}
        onClose={() => setIsExpanded(false)}
        title={
          <Box
            component="span"
            sx={{
              ...theme.typography.subtitle2,
              color: theme.palette.text.primary,
            }}
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

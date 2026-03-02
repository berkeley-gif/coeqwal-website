"use client"

/**
 * Side-by-side comparison of peak vs current VerticalParallelLinePlot
 * Navigate to /test-vplp to view
 *
 * Left: Peak version (Aug 19, 2025 - commit 023318d8)
 * Right: Current version (HEAD)
 */

import React, { useMemo, useState } from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import {
  VerticalParallelLinePlot,
  VerticalParallelLinePlotPeak,
} from "@repo/viz"
import { useComparisonData } from "../features/scenarioExplorer/hooks/useComparisonData"

export default function TestVplpPage() {
  const theme = useTheme()
  const [highlightedScenario, setHighlightedScenario] = useState<string | null>(
    null,
  )

  const {
    data: comparisonData,
    axes,
    lineColors,
    isLoading,
    hasData,
  } = useComparisonData()

  const highlightedData = useMemo(() => {
    return comparisonData.map((scenario) => ({
      ...scenario,
      highlighted: scenario.id === highlightedScenario,
    }))
  }, [comparisonData, highlightedScenario])

  const handleLineClick = (scenario: { id: string }) => {
    setHighlightedScenario((prev) =>
      prev === scenario.id ? null : scenario.id,
    )
  }

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          color: theme.palette.grey[600],
        }}
      >
        <Typography variant="body1">Loading comparison data...</Typography>
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
          height: "100vh",
          color: theme.palette.grey[600],
        }}
      >
        <Typography variant="body1">
          No comparison data. Make sure scenarios are selected in the scenario
          explorer first.
        </Typography>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          gap: 4,
          p: 2,
          borderBottom: theme.border.light,
          backgroundColor: theme.palette.background.paper,
          flexShrink: 0,
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{ flex: 1, textAlign: "center", color: theme.palette.grey[700] }}
        >
          Peak Version (Aug 19, 2025)
        </Typography>
        <Box sx={{ width: 1, backgroundColor: theme.palette.grey[300] }} />
        <Typography
          variant="subtitle2"
          sx={{ flex: 1, textAlign: "center", color: theme.palette.grey[700] }}
        >
          Current Version (HEAD)
        </Typography>
      </Box>

      {/* Side-by-side charts */}
      <Box
        sx={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
        }}
      >
        {/* Peak version */}
        <Box
          sx={{
            flex: 1,
            p: theme.space.component.lg,
            borderRight: `1px solid ${theme.palette.grey[300]}`,
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
            <VerticalParallelLinePlotPeak
              data={highlightedData}
              axes={axes}
              responsive={true}
              showBaseline={false}
              overlayTiers={true}
              colors={{
                default: theme.palette.grey[600],
                highlighted: theme.palette.blue.darkest,
                background: theme.palette.grey[50],
              }}
              lineColors={lineColors}
              onLineClick={handleLineClick}
            />
          </Box>
        </Box>

        {/* Current version */}
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
              overlayTiers={true}
              colors={{
                default: theme.palette.grey[600],
                highlighted: theme.palette.blue.darkest,
                background: theme.palette.grey[50],
                axis: theme.palette.grey[500],
              }}
              lineColors={lineColors}
              onLineClick={handleLineClick}
            />
          </Box>
        </Box>
      </Box>

      {/* Legend */}
      <Box
        sx={{
          p: 1.5,
          borderTop: theme.border.light,
          backgroundColor: theme.palette.background.paper,
          display: "flex",
          justifyContent: "center",
          gap: 3,
          flexShrink: 0,
        }}
      >
        <Typography
          variant="compactCaption"
          sx={{ color: theme.palette.grey[500] }}
        >
          Click a line to highlight it in both charts. Both have overlayTiers
          enabled.
        </Typography>
        {highlightedScenario && (
          <Typography
            variant="compactCaption"
            sx={{ color: theme.palette.blue.darkest, fontWeight: 600 }}
          >
            Highlighted: {highlightedScenario}
          </Typography>
        )}
      </Box>
    </Box>
  )
}

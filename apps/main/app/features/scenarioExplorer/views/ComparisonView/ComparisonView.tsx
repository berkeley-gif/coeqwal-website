"use client"

import React from "react"
import { Box, Typography, useTheme, Button } from "@repo/ui/mui"
import { VerticalParallelLinePlot } from "@repo/viz"
import { useScenarioExplorerStore } from "@repo/state"
import SearchSortBar from "../../components/SearchSortBar"

/**
 * ComparisonView: Visual comparison matrix of scenarios
 * Uses VerticalParallelLinePlot to compare selected scenarios across outcomes
 * Shows relative performance with interactive parallel coordinates
 */
export default function ComparisonView() {
  const theme = useTheme()
  const { selectedScenarios, resetAll } = useScenarioExplorerStore()

  // TODO: Fetch actual data for selected scenarios
  const hasData = selectedScenarios.length > 0

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: theme.palette.grey[100],
      }}
    >
      {/* Search and sort */}
      <SearchSortBar
        placeholder="Search outcomes..."
        sortOptions={[
          { value: "name-asc", label: "Outcome (A-Z)" },
          { value: "name-desc", label: "Outcome (Z-A)" },
          { value: "outcome-best-first", label: "Highest Variation" },
          { value: "outcome-worst-first", label: "Lowest Variation" },
        ]}
      />

      {/* Main content */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          p: theme.spacing(theme.cards.spacing.standard),
          overflowY: "auto",
        }}
      >
        {!hasData ? (
          // Empty state
          <Box
            sx={{
              textAlign: "center",
              maxWidth: theme.spacing(60),
            }}
          >
            <Typography
              variant="h5"
              sx={{
                mb: theme.spacing(2),
                color: theme.palette.text.primary,
              }}
            >
              Select scenarios to compare
            </Typography>
            <Typography
              variant="body1"
              sx={{
                mb: theme.spacing(3),
                color: theme.palette.grey[600],
              }}
            >
              (Visual comparison of scenario outcomes using parallel
              line plot).
            </Typography>
          </Box>
        ) : (
          // Comparison chart
          <Box
            sx={{
              width: "100%",
              height: "100%",
              backgroundColor: theme.palette.common.white,
              borderRadius: theme.borderRadius.rounded,
              padding: theme.spacing(theme.cards.spacing.standard),
              boxShadow: theme.shadow.subtle,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: theme.spacing(2),
              }}
            >
              <Typography variant="h6">
                Comparing {selectedScenarios.length} scenario
                {selectedScenarios.length !== 1 ? "s" : ""}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={resetAll}
                sx={{ textTransform: "none" }}
              >
                Clear selection
              </Button>
            </Box>

            {/* Parallel Coordinates Plot */}
            <Box sx={{ width: "100%", height: "calc(100% - 60px)" }}>
              <VerticalParallelLinePlot
                data={[]} // TODO: Transform scenario data for plot
                width={800}
                height={600}
              />
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  )
}


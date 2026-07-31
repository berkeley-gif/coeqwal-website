"use client"

/**
 * ExplorerView - the "Explorer" mode of the Data-in-Depth tool.
 *
 * A by-variable explorer: pick a variable from the sector rail, choose a view
 * and a single comparison axis, and read one interpretive chart at a time.
 * Composes the rail, breadcrumb, comparison controls, view bar, chart card,
 * and metric explainers. Runs on the deterministic sample-data engine (labeled
 * "Sample data"); live data and per-member tier badges arrive with the
 * live-data widening PR.
 */

import React from "react"
import { Box, Chip, Typography, useTheme } from "@repo/ui/mui"
import { useDataSlice } from "../../../../store"
import { getSector, getVariable } from "../config/variableRegistry"
import SectorRail from "./SectorRail"
import CompareControls from "./CompareControls"
import ViewBar from "./ViewBar"
import WytFilterChips from "./WytFilterChips"
import ChartCard from "./ChartCard"
import MetricExplainers from "./MetricExplainers"

export default function ExplorerView() {
  const theme = useTheme()
  const selectedVariableId = useDataSlice((s) => s.selectedVariableId)
  const variable = getVariable(selectedVariableId)
  const sector = variable ? getSector(variable.sectorId) : undefined

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        gap: 2,
        height: "100%",
        alignItems: "stretch",
      }}
    >
      <SectorRail />

      {/* Right padding lives inside the scroller so the scrollbar hugs the
          tool's right edge instead of floating at the padding boundary. */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          overflowY: "auto",
          pb: 3,
          pr: { xs: 2, md: 4 },
        }}
      >
        {variable && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1,
              mb: 0.5,
            }}
          >
            <Typography variant="body2" sx={{ color: theme.palette.grey[600] }}>
              <strong style={{ color: theme.palette.text.primary }}>
                {sector?.name}
              </strong>{" "}
              › {variable.name}
            </Typography>
            {variable.tierOutcomeName && (
              <Chip
                size="small"
                variant="outlined"
                label={`feeds tier: ${variable.tierOutcomeName}`}
                sx={{
                  fontSize: "0.72rem",
                  color: theme.palette.grey[600],
                  borderColor: theme.palette.divider,
                }}
              />
            )}
          </Box>
        )}

        <CompareControls />
        <ViewBar />
        <WytFilterChips />
        <Box sx={{ mt: 2 }}>
          <ChartCard />
        </Box>
        <MetricExplainers />
      </Box>
    </Box>
  )
}

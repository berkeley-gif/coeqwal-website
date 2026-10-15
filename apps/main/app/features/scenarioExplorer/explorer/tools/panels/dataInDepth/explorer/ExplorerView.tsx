"use client"

/**
 * ExplorerView - the "Explorer" mode of the Data-in-Depth tool.
 *
 * A by-variable explorer: pick a variable from the sector rail, choose a view
 * and a single comparison axis, and read one interpretive chart at a time.
 * Composes the rail, breadcrumb, comparison controls, view bar, chart card,
 * and metric explainers. It draws model results only, for exactly the
 * scenarios selected in the sidebar; with none selected it shows the
 * select-a-scenario prompt in place of the controls and chart.
 */

import React from "react"
import { Box, Chip, Typography, useTheme } from "@repo/ui/mui"
import { useDataSlice, useWorkspaceSlice } from "../../../../store"
import SelectScenarioPrompt from "../../../components/SelectScenarioPrompt"
import {
  needsScenarioPrompt,
  SCENARIO_PROMPT_TEXT,
} from "../../../components/scenarioPrompt"
import {
  getSector,
  getVariable,
  keyOutcomeChipText,
} from "../config/variableRegistry"
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
  const chipText = variable ? keyOutcomeChipText(variable) : null
  const selectedScenarioCount = useWorkspaceSlice(
    (s) => s.selectedScenarios.length,
  )
  const tourActive = useWorkspaceSlice((s) => s.tour.tool === "data")
  // With nothing selected the tool asks for a selection, as every other
  // tool does; the variable rail stays so a variable can still be picked.
  const showSelectPrompt = needsScenarioPrompt({
    mode: "data",
    selectedScenarioCount,
    showAll: false,
    equityFocusScenario: null,
    tourActive,
  })

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
            {chipText && (
              <Chip
                size="small"
                variant="outlined"
                label={chipText}
                sx={{
                  fontSize: "0.72rem",
                  color: theme.palette.grey[600],
                  borderColor: theme.palette.divider,
                }}
              />
            )}
          </Box>
        )}

        {showSelectPrompt ? (
          <Box sx={{ mt: 2, minHeight: 240 }}>
            <SelectScenarioPrompt message={SCENARIO_PROMPT_TEXT.data} />
          </Box>
        ) : (
          <>
            <CompareControls />
            <ViewBar />
            <WytFilterChips />
            <Box sx={{ mt: 2 }}>
              <ChartCard />
            </Box>
            <MetricExplainers />
          </>
        )}
      </Box>
    </Box>
  )
}

"use client"

/**
 * EquityPanel - Equity analysis view
 *
 * Layout:
 *   [ScenarioSelectionSidebar 240px] | [HydroclimateChooser + equity tool content]
 *
 * The map is displayed behind/alongside via the map store (activated on mount).
 * All scenario selection tools are in the shared sidebar, wired to the store.
 */

import React, { useEffect } from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { HydroclimateChooser } from "../../scenarios/components"
import ScenarioSelectionSidebar from "../components/ScenarioSelectionSidebar"
import { useScenarioExplorerStore } from "../store"
import { mapActions } from "../../map/store"

export default function EquityPanel() {
  const theme = useTheme()

  const { hydroclimatePeriod, setHydroclimatePeriod } =
    useScenarioExplorerStore()

  // Activate map when this panel is mounted
  useEffect(() => {
    mapActions.setExplorePanelWidth(66.67)
    mapActions.setMapMode("explore")

    return () => {
      mapActions.setMapMode("hidden")
      mapActions.clearOutcomeVisualization()
      mapActions.setExplorePanelWidth(50)
    }
  }, [])

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* ── Left: shared scenario selection sidebar ─────────────────────────── */}
      <ScenarioSelectionSidebar />

      {/* ── Right: hydroclimate chooser + equity tool ───────────────────────── */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Hydroclimate chooser */}
        <Box
          sx={{
            flexShrink: 0,
            px: theme.space.component.lg,
            pt: theme.space.component.sm,
            pb: theme.space.component.lg,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <HydroclimateChooser
            layout="horizontal"
            showTitle={true}
            showLabels={false}
            value={hydroclimatePeriod}
            onChange={setHydroclimatePeriod}
          />
        </Box>

        {/* Equity tool content */}
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            px: theme.space.component.lg,
            py: theme.space.component.lg,
            backgroundColor: theme.palette.grey[100],
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: theme.palette.grey[500],
              mb: theme.space.component.md,
            }}
          >
            Equity tool
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.grey[400] }}>
            Awesome tool stuff will go here.
            <br />
            Map should be on the right.
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

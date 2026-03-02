"use client"

/**
 * ResiliencePanel - Resilience analysis view
 *
 * Layout:
 *   [ScenarioSelectionSidebar 240px] | [HydroclimateChooser + resilience tool content]
 *
 * All scenario selection tools are in the shared sidebar, wired to the store.
 * Resilience tool content is a placeholder pending future implementation.
 */

import { Box, Typography, useTheme } from "@repo/ui/mui"
import { HydroclimateChooser } from "../../scenarios/components"
import ScenarioSelectionSidebar from "../components/ScenarioSelectionSidebar"
import { useScenarioExplorerStore } from "../store"

export default function ResiliencePanel() {
  const theme = useTheme()

  const { hydroclimatePeriod, setHydroclimatePeriod } =
    useScenarioExplorerStore()

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

      {/* ── Right: hydroclimate chooser + resilience tool ───────────────────── */}
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

        {/* Resilience tool content (placeholder) */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            overflow: "auto",
            px: theme.space.component.lg,
            py: theme.space.component.lg,
            backgroundColor: theme.palette.grey[100],
            gap: 2,
          }}
        >
          <Typography
            variant="h5"
            component="h2"
            sx={{ color: theme.palette.text.primary }}
          >
            Resilience view
          </Typography>
          <Typography
            variant="body2"
            sx={{
              maxWidth: "40ch",
              textAlign: "center",
              color: theme.palette.text.secondary,
              opacity: 0.7,
            }}
          >
            Resilience analysis tools are coming soon. This panel will help you
            explore how scenarios perform under climate uncertainty and stress
            conditions.
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

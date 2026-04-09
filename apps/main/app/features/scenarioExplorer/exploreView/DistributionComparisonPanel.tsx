"use client"

/**
 * DistributionComparisonPanel - Distribution comparison tool content.
 *
 * Sidebar, hydroclimate chooser, and map are handled by the persistent
 * UnifiedToolLayout chrome. This component renders the tool-specific
 * content area. Chart content will be filled in by another developer.
 */

import { Box, Typography, useTheme } from "@repo/ui/mui"
import { useScenarioExplorerStore } from "../store"

interface DistributionComparisonPanelProps {
  highlightedIds?: Set<string> | null
  onScenarioHover?: (scenarioId: string | null) => void
}

export default function DistributionComparisonPanel({
  highlightedIds: _highlightedIds = null,
  onScenarioHover: _onScenarioHover,
}: DistributionComparisonPanelProps) {
  const theme = useTheme()
  const { selectedScenarios } = useScenarioExplorerStore()

  const hasScenarios = selectedScenarios.length > 0

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        backgroundColor: theme.palette.grey[100],
      }}
    >
      {!hasScenarios ? (
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            px: theme.space.component.lg,
            py: theme.space.component.lg,
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.secondary }}
          >
            Select scenarios to compare distributions.
          </Typography>
        </Box>
      ) : (
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
          }}
        >
          <Typography
            variant="h5"
            component="h2"
            sx={{ color: theme.palette.text.primary }}
          >
            Distribution comparison
          </Typography>
          <Typography
            variant="body2"
            sx={{
              maxWidth: "48ch",
              textAlign: "center",
              color: theme.palette.text.secondary,
              mt: 2,
            }}
          >
            Comparing {selectedScenarios.length} scenario
            {selectedScenarios.length !== 1 ? "s" : ""}.
          </Typography>
        </Box>
      )}
    </Box>
  )
}

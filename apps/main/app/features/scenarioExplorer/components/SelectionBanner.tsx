/**
 * SelectionBanner - Scenario selection summary bar
 *
 * Displays selected scenarios with compare button.
 * Appears when scenarios are selected for comparison.
 */

import { Box, Typography, Button, useTheme } from "@repo/ui/mui"
import { useScenarioExplorerStore } from "../store"

// Scenario ID to display name mapping
const getScenarioDisplayName = (scenarioId: string): string => {
  const names: Record<string, string> = {
    s0020: "Current operations",
    s0021: "Current ops without TUCPs",
    s0011: "Current ops with historical ag",
  }
  return names[scenarioId] || scenarioId
}

/**
 * SelectionBanner: Shows selected scenarios with clear all option
 */
export default function SelectionBanner() {
  const theme = useTheme()
  const { selectedScenarios, clearScenarios } = useScenarioExplorerStore()

  // Don't render if no scenarios selected
  if (selectedScenarios.length === 0) {
    return null
  }

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.common.white,
        borderBottom: theme.border.light,
        px: theme.spacingTokens.page.x,
        py: theme.spacingTokens.component.md,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: theme.spacingTokens.gap.lg,
        }}
      >
        {/* Left: Eyebrow + Pills */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: theme.spacingTokens.gap.lg,
            flexWrap: "wrap",
            flex: 1,
          }}
        >
          <Typography
            variant="compactCaption"
            sx={{
              fontWeight: theme.typography.fontWeightMedium,
              letterSpacing: "0.15rem",
              textTransform: "uppercase",
              color: theme.palette.grey[500],
              flexShrink: 0,
            }}
          >
            {selectedScenarios.length} Selected
          </Typography>

          {/* Scenario pills */}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: theme.spacingTokens.gap.sm }}>
            {selectedScenarios.map((scenarioId) => (
              <Typography
                key={scenarioId}
                variant="caption"
                sx={{
                  px: 1.5,
                  py: 0.5,
                  backgroundColor: theme.palette.grey[100],
                  borderRadius: 1,
                  color: theme.palette.blue.darkest,
                  fontWeight: theme.typography.fontWeightMedium,
                }}
              >
                {getScenarioDisplayName(scenarioId)}
              </Typography>
            ))}
          </Box>
        </Box>

        {/* Right: Clear button */}
        <Button
          variant="text"
          size="small"
          onClick={clearScenarios}
          sx={{
            ...theme.typography.compact.caption,
            color: theme.palette.grey[500],
            textTransform: "none",
            fontWeight: theme.typography.fontWeightMedium,
            minWidth: "auto",
            px: 1,
            "&:hover": {
              color: theme.palette.grey[700],
              backgroundColor: theme.palette.grey[100],
            },
          }}
        >
          Clear
        </Button>
      </Box>
    </Box>
  )
}

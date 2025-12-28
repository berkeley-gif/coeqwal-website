/**
 * SelectionBanner - Scenario selection summary bar
 *
 * Displays selected scenarios with compare button.
 * Appears when scenarios are selected for comparison.
 */

import { Box, Typography, Button, useTheme } from "@repo/ui/mui"
import { useScenarioExplorerStore } from "../store"
import { useScenarioList } from "../../scenarios/hooks"

/**
 * SelectionBanner: Shows selected scenarios with clear all option
 */
export default function SelectionBanner() {
  const theme = useTheme()
  const { selectedScenarios, clearScenarios } = useScenarioExplorerStore()
  const { getDisplayName } = useScenarioList()

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
        {/* Left: eyebrow + pills */}
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
            variant="overline"
            sx={{ color: theme.palette.grey[500], flexShrink: 0 }}
          >
            {selectedScenarios.length} Selected
          </Typography>

          {/* Scenario pills */}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: theme.spacingTokens.gap.sm }}>
            {selectedScenarios.map((scenarioId) => (
              <Typography
                key={scenarioId}
                variant="compactTitle"
                sx={{
                  px: 1.5,
                  py: 0.5,
                  backgroundColor: theme.palette.grey[100],
                  borderRadius: 1,
                  color: theme.palette.blue.darkest,
                }}
              >
                {getDisplayName(scenarioId)}
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
            color: theme.palette.grey[500],
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

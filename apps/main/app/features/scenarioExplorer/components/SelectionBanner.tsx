/**
 * SelectionBanner - Scenario selection summary bar
 *
 * Displays selected scenarios with compare button.
 * Appears when scenarios are selected for comparison.
 */

import { Box, Typography, Button, Chip, useTheme } from "@repo/ui/mui"
import { useScenarioExplorerStore } from "../store"
import { useScenarioList } from "../../scenarios/hooks"

/**
 * SelectionBanner: Shows selected scenarios with clear all option
 */
export default function SelectionBanner() {
  const theme = useTheme()
  const { selectedScenarios, clearScenarios, toggleScenario } = useScenarioExplorerStore()
  const { getDisplayName } = useScenarioList()

  // Don't render if no scenarios selected
  if (selectedScenarios.length === 0) {
    return null
  }

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.paper,
        borderBottom: theme.border.light,
        px: theme.space.page.x,
        py: theme.space.component.md,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: theme.space.gap.lg,
        }}
      >
        {/* Left: eyebrow + pills */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: theme.space.gap.lg,
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

          {/* Scenario chips with close buttons */}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: theme.space.gap.sm }}>
            {selectedScenarios.map((scenarioId) => (
              <Chip
                key={scenarioId}
                label={getDisplayName(scenarioId)}
                onDelete={() => toggleScenario(scenarioId)}
                size="small"
                sx={{
                  backgroundColor: theme.palette.grey[100],
                  color: theme.palette.blue.darkest,
                  fontWeight: theme.typography.fontWeightMedium,
                  "& .MuiChip-deleteIcon": {
                    color: theme.palette.grey[400],
                    fontSize: "1rem",
                    "&:hover": {
                      color: theme.palette.grey[600],
                    },
                  },
                }}
              />
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
            px: theme.space.component.sm,
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

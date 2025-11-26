import { Box, Typography, Button, useTheme } from "@repo/ui/mui"
import { useScenarioExplorerStore } from "@repo/state"

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
 * SelectionBanner: Shows count of selected scenarios with clear all button
 * and list of selected scenarios
 * Displayed under tabs in Scenario Explorer views
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
        backgroundColor: theme.palette.blue.darkest,
        color: theme.palette.common.white,
      }}
    >
      {/* Count row with Clear all button */}
      <Box
        sx={{
          px: theme.spacing(theme.cards.spacing.standard),
          pt: theme.spacing(1.5),
          pb: theme.spacing(1),
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography
          variant="body2"
          sx={{ fontWeight: theme.typography.fontWeightMedium }}
        >
          {selectedScenarios.length} scenario
          {selectedScenarios.length !== 1 ? "s" : ""} selected
        </Typography>
        <Button
          variant="text"
          size="small"
          onClick={clearScenarios}
          sx={{
            color: theme.palette.common.white,
            textTransform: "none",
            fontSize: theme.typography.compact.subtitle.fontSize,
            minWidth: "auto",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.1)",
            },
          }}
        >
          Clear all
        </Button>
      </Box>

      {/* List of selected scenarios */}
      <Box
        sx={{
          px: theme.spacing(theme.cards.spacing.standard),
          pb: theme.spacing(1.5),
          display: "flex",
          flexWrap: "wrap",
          gap: theme.spacing(1),
        }}
      >
        {selectedScenarios.map((scenarioId) => (
          <Typography
            key={scenarioId}
            variant="body2"
            sx={{
              px: theme.spacing(1.5),
              py: theme.spacing(0.5),
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              borderRadius: theme.borderRadius.pill,
              fontSize: theme.typography.compact.subtitle.fontSize,
            }}
          >
            {getScenarioDisplayName(scenarioId)}
          </Typography>
        ))}
      </Box>
    </Box>
  )
}

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
        px: { xs: 3, md: 6 },
        py: 1.5,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        {/* Left: Eyebrow + Pills */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
            flex: 1,
          }}
        >
          <Typography
            sx={{
              fontSize: theme.typography.compact.caption.fontSize,
              fontWeight: 500,
              letterSpacing: "0.15rem",
              textTransform: "uppercase",
              color: theme.palette.grey[500],
              flexShrink: 0,
            }}
          >
            {selectedScenarios.length} Selected
          </Typography>

          {/* Scenario pills */}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
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
                  fontWeight: 500,
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
            color: theme.palette.grey[500],
            textTransform: "none",
            fontSize: theme.typography.compact.caption.fontSize,
            fontWeight: 500,
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

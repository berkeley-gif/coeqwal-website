"use client"

/**
 * KeyOperationsPanel - Shows key operations icons and hydroclimate chooser
 *
 * Used in the Learn section scrollytelling.
 * Uses shared OperationsIconGroup component.
 */

import { Box, Typography, useTheme } from "@repo/ui/mui"
import { useScenarioList } from "../../../scenarios/hooks/useScenarioList"
import { HydroclimateChooser } from "../../../scenarios/components"
import { OperationsIconGroup } from "../../../scenarios/components/shared"
import { getLearnPanelBaseStyles } from "./learnPanelStyles"
import { getScenarioPanelTitleStyles } from "../../../scenarios/components/shared"

interface KeyOperationsPanelProps {
  scenarioId?: string
  onTitleClick?: () => void
}

export function KeyOperationsPanel({
  scenarioId = "s0020",
  onTitleClick,
}: KeyOperationsPanelProps) {
  const theme = useTheme()
  const { getScenario, isLoading } = useScenarioList()
  const scenario = getScenario(scenarioId)

  if (isLoading) {
    return (
      <Box
        sx={{ ...getLearnPanelBaseStyles(theme), boxShadow: theme.shadow.sm }}
      >
        <Typography variant="body2">Loading...</Typography>
      </Box>
    )
  }

  if (!scenario) {
    console.warn(`Scenario "${scenarioId}" not found`)
    return null
  }

  return (
    <Box
      sx={{
        ...getLearnPanelBaseStyles(theme),
        boxShadow: theme.shadow.sm,
        width: "fit-content",
        maxWidth: "100%",
      }}
    >
      {/* Row with Key Operations and Hydroclimate */}
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: theme.space.gap.xl,
          flexWrap: "nowrap",
        }}
      >
        {/* Key Operations section */}
        <Box>
          <Typography
            variant="subtitle2"
            onClick={onTitleClick}
            sx={{
              ...getScenarioPanelTitleStyles(theme),
              mb: theme.space.component.sm,
            }}
          >
            Key operations
          </Typography>

          <OperationsIconGroup
            scenarioId={scenarioId}
            theme={scenario.theme}
            size="md"
            layout="horizontal"
          />
        </Box>

        {/* Divider */}
        <Box
          sx={{
            width: "1px",
            alignSelf: "stretch",
            backgroundColor: theme.palette.grey[300],
            minHeight: 50,
          }}
        />

        {/* Hydroclimate section */}
        <Box>
          <HydroclimateChooser
            layout="horizontal"
            size="default"
            showTitle={true}
            showLabels={false}
          />
        </Box>
      </Box>
    </Box>
  )
}

export default KeyOperationsPanel

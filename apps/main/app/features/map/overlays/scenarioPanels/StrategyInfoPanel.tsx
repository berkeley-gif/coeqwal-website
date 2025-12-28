"use client"

/**
 * StrategyInfoPanel - Shows scenario title and description
 *
 * Used in the Learn section scrollytelling.
 * Uses shared StrategyHeader component.
 */

import { Box, Typography, useTheme } from "@repo/ui/mui"
import { useScenarioList } from "../../../scenarios/hooks/useScenarioList"
import { StrategyHeader } from "../../../scenarios/components/shared"
import { getLearnPanelBaseStyles, learnPanelMaxWidth } from "./learnPanelStyles"

interface StrategyInfoPanelProps {
  scenarioId?: string
  onTitleClick?: () => void
}

export function StrategyInfoPanel({
  scenarioId = "s0020",
  onTitleClick,
}: StrategyInfoPanelProps) {
  const theme = useTheme()
  const { getScenario, isLoading } = useScenarioList()
  const scenario = getScenario(scenarioId)

  if (isLoading) {
    return (
      <Box sx={{ ...getLearnPanelBaseStyles(theme), boxShadow: theme.shadow.sm }}>
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
        width: "100%",
        maxWidth: learnPanelMaxWidth,
      }}
    >
      <StrategyHeader
        strategy={scenario}
        showDescription={true}
        titleVariant="subtitle1"
        onTitleClick={onTitleClick}
      />
    </Box>
  )
}

export default StrategyInfoPanel

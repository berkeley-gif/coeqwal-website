"use client"

/**
 * StrategyInfoPanel - Shows strategy title and description
 *
 * Used in the Learn section scrollytelling.
 * Uses shared StrategyHeader component.
 */

import { Box, useTheme } from "@repo/ui/mui"
import { getStrategy } from "../../../../content/scenarios"
import { StrategyHeader } from "../../../scenarios/components/shared"
import { getLearnPanelBaseStyles, learnPanelMaxWidth } from "./learnPanelStyles"

interface StrategyInfoPanelProps {
  strategyValue?: string
  onTitleClick?: () => void
}

export function StrategyInfoPanel({
  strategyValue = "current-ops",
  onTitleClick,
}: StrategyInfoPanelProps) {
  const theme = useTheme()
  const strategy = getStrategy(strategyValue)

  if (!strategy) {
    console.warn(`Strategy "${strategyValue}" not found`)
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
        strategy={strategy}
        showDescription={true}
        titleVariant="subtitle1"
        onTitleClick={onTitleClick}
      />
    </Box>
  )
}

export default StrategyInfoPanel


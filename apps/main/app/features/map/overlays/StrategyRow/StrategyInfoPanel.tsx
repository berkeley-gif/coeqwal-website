"use client"

/**
 * StrategyInfoPanel - Shows strategy title and description
 *
 * Used in the Learn section scrollytelling.
 * Uses shared StrategyHeader component.
 */

import { Box, useTheme } from "@repo/ui/mui"
import { strategies } from "../../../../content/scenarios"
import { StrategyHeader } from "../../../scenarios/components/shared"
import type { StrategyInfoPanelProps } from "./types"
import { panelBaseStyles, panelMaxWidth } from "./styles"

export function StrategyInfoPanel({
  strategyValue = "current-ops",
  onTitleClick,
}: StrategyInfoPanelProps) {
  const theme = useTheme()

  const strategy = strategies.find((s) => s.value === strategyValue)

  if (!strategy) {
    console.warn(`Strategy "${strategyValue}" not found`)
    return null
  }

  return (
    <Box
      sx={{
        ...panelBaseStyles,
        boxShadow: theme.shadow.sm,
        width: "100%",
        maxWidth: panelMaxWidth,
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

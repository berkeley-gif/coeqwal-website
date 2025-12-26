"use client"

/**
 * StrategyRow and related components
 *
 * Components for displaying strategy information in the Learn section.
 * Uses shared components from scenarios/components/shared.
 *
 * Panel components have been extracted to StrategyRow/ folder for better organization.
 */

import { Box, useTheme } from "@repo/ui/mui"
import { strategies } from "../../../content/scenarios"
import {
  StrategyHeader,
  OperationsIconGroup,
} from "../../scenarios/components/shared"
import type { StrategyRowProps } from "./StrategyRow/types"
import { panelBaseStyles, panelMaxWidth } from "./StrategyRow/styles"

// Re-export panel components for backward compatibility
export { StrategyInfoPanel } from "./StrategyRow/StrategyInfoPanel"
export { KeyOperationsPanel } from "./StrategyRow/KeyOperationsPanel"
export { KeyOutcomesPanel } from "./StrategyRow/KeyOutcomesPanel"

/**
 * StrategyRow - Combined view showing strategy info, operations, and outcomes
 *
 * This component combines elements from all three panels into a single row layout.
 * Used for compact display of strategy information.
 */
export function StrategyRow({
  strategyValue = "current-ops",
  showDescription = true,
}: StrategyRowProps) {
  const theme = useTheme()

  // Look up strategy data from shared source
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
      {/* Strategy info */}
      <Box sx={{ mb: showDescription ? 2 : 0 }}>
        <StrategyHeader
          strategy={strategy}
          showDescription={showDescription}
          titleVariant="subtitle1"
        />
      </Box>

      {/* Operations icons */}
      <OperationsIconGroup
        strategyValue={strategyValue}
        theme={strategy.theme}
        size="md"
      />
    </Box>
  )
}

export default StrategyRow

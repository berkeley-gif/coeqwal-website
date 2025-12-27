"use client"

/**
 * KeyOperationsPanel - Shows key operations icons and hydroclimate chooser
 *
 * Used in the Learn section scrollytelling.
 * Uses shared OperationsIconGroup component.
 */

import { Box, Typography, useTheme } from "@repo/ui/mui"
import { strategies } from "../../../../content/scenarios"
import { HydroclimateChooser } from "../../../scenarios/components"
import { OperationsIconGroup } from "../../../scenarios/components/shared"
import type { KeyOperationsPanelProps } from "./types"
import { panelBaseStyles, getTitleStyles } from "./styles"

export function KeyOperationsPanel({
  strategyValue = "current-ops",
  onTitleClick,
}: KeyOperationsPanelProps) {
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
        width: "fit-content",
        maxWidth: "100%",
      }}
    >
      {/* Row with Key Operations and Hydroclimate */}
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: 3,
          flexWrap: "nowrap",
        }}
      >
        {/* Key Operations section */}
        <Box>
          <Typography
            variant="subtitle2"
            onClick={onTitleClick}
            sx={{
              ...getTitleStyles(theme, !!onTitleClick),
              mb: 1,
            }}
          >
            Key operations
          </Typography>

          <OperationsIconGroup
            strategyValue={strategyValue}
            theme={strategy.theme}
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

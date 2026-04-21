"use client"

/**
 * KeyOperationsPanel - Shows key operations icons and hydroclimate chooser
 *
 * Used in the Learn section scrollytelling.
 * Uses shared OperationsIconGroup component.
 */

import { RefObject } from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { useScenarioList } from "../../../scenarios/hooks/useScenarioList"
import { HydroclimateChooser } from "../../../scenarios/components"
import { OperationsIconGroup } from "../../../scenarios/components/shared"
import { useScenarioExplorerStore } from "../../../scenarioExplorer/store"

interface KeyOperationsPanelProps {
  scenarioId?: string
  onTitleClick?: () => void
  hydroclimateRef?: RefObject<HTMLDivElement | null>
}

export function KeyOperationsPanel({
  scenarioId = "s0020",
  onTitleClick,
  hydroclimateRef,
}: KeyOperationsPanelProps) {
  const theme = useTheme()
  const { getScenario, isLoading } = useScenarioList()
  const scenario = getScenario(scenarioId)
  const { hydroclimate, setHydroclimate } = useScenarioExplorerStore()

  if (isLoading) {
    return (
      <Box
        sx={{ ...theme.scenarios.learnPanel.base, boxShadow: theme.shadow.sm }}
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
        ...theme.scenarios.learnPanel.base,
        boxShadow: theme.shadow.sm,
        width: "100%",
        maxWidth: theme.scenarios.learnPanel.maxWidth,
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
              ...theme.scenarios.panelTitle,
              mb: theme.space.component.xs,
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
        <Box ref={hydroclimateRef}>
          <HydroclimateChooser
            layout="horizontal"
            showTitle={true}
            showLabels={false}
            value={hydroclimate}
            onChange={setHydroclimate}
          />
        </Box>
      </Box>
    </Box>
  )
}

export default KeyOperationsPanel

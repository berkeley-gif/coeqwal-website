"use client"

/**
 * GridControls - Toggle controls for StrategyGrid
 *
 * Contains the toggle pairs for showing chosen/all strategies and definitions.
 */

import React from "react"
import { Box, useTheme } from "@repo/ui/mui"
import {
  InfoTooltip,
  DocumentListIcon,
  DocumentCheckedIcon,
  CurrentOpsIcon,
  CurrentOpsMultipleIcon,
} from "@repo/ui"
import TogglePair from "../components/TogglePair"

interface GridControlsProps {
  /** Whether to show only chosen strategies */
  showOnlyChosen: boolean
  /** Whether to show strategy definitions */
  showDefinitions: boolean
  /** Called when showOnlyChosen changes */
  onShowOnlyChosenChange: (value: boolean) => void
  /** Called when showDefinitions changes */
  onShowDefinitionsChange: (value: boolean) => void
  /** Icon size (default 40) */
  iconSize?: number
}

export function GridControls({
  showOnlyChosen,
  showDefinitions,
  onShowOnlyChosenChange,
  onShowDefinitionsChange,
  iconSize = 36, // trying slightly smaller
}: GridControlsProps) {
  const theme = useTheme()
  return (
    <Box
      sx={{
        display: "flex",
        gap: theme.space.gap.md,
        alignItems: "center",
      }}
    >
      <InfoTooltip description="Show all strategies or only chosen ones">
        <Box>
          <TogglePair
            leftIcon={
              <DocumentListIcon active={!showOnlyChosen} size={iconSize} />
            }
            rightIcon={
              <DocumentCheckedIcon active={showOnlyChosen} size={iconSize} />
            }
            onLeftClick={() => onShowOnlyChosenChange(false)}
            onRightClick={() => onShowOnlyChosenChange(true)}
            gap={0}
          />
        </Box>
      </InfoTooltip>

      {/* Vertical divider */}
      <Box
        sx={{
          width: "1px",
          height: "20px",
          backgroundColor: theme.palette.grey[200],
        }}
      />

      <InfoTooltip description="Show current baseline or show all baseline variations">
        <Box>
          <TogglePair
            leftIcon={
              <CurrentOpsIcon
                active={!showDefinitions}
                size={Math.round(iconSize * 0.78)}
              />
            }
            rightIcon={
              <CurrentOpsMultipleIcon
                active={showDefinitions}
                size={Math.round(iconSize * 0.78)}
              />
            }
            onLeftClick={() => onShowDefinitionsChange(false)}
            onRightClick={() => onShowDefinitionsChange(true)}
            gap={0.5}
          />
        </Box>
      </InfoTooltip>
    </Box>
  )
}

export default GridControls

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
  DocumentExpandedIcon,
  DocumentCollapsedIcon,
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
  iconSize = 40,
}: GridControlsProps) {
  const theme = useTheme()
  return (
    <Box sx={{ display: "flex", gap: theme.spacingTokens.gap.sm, alignItems: "center" }}>
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
            gap={-0.5}
          />
        </Box>
      </InfoTooltip>
      <InfoTooltip description="Show or hide strategy details">
        <Box>
          <TogglePair
            leftIcon={
              <DocumentExpandedIcon active={showDefinitions} size={iconSize} />
            }
            rightIcon={
              <DocumentCollapsedIcon
                active={!showDefinitions}
                size={iconSize}
              />
            }
            onLeftClick={() => onShowDefinitionsChange(true)}
            onRightClick={() => onShowDefinitionsChange(false)}
            gap={-0.5}
          />
        </Box>
      </InfoTooltip>
    </Box>
  )
}

export default GridControls



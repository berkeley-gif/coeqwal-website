/**
 * StrategyInfoPanel - Shows strategy title and description
 *
 * Used in the Learn section scrollytelling.
 */

import { Box, Typography, useTheme } from "@repo/ui/mui"
import { InfoIconButton } from "@repo/ui"
import { strategies } from "../../../../content/scenarios"
import type { StrategyInfoPanelProps } from "./types"
import {
  panelBaseStyles,
  panelMaxWidth,
  getTitleStyles,
  getDescriptionStyles,
} from "./styles"

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
      <Typography
        variant="subtitle1"
        onClick={onTitleClick}
        sx={{
          ...getTitleStyles(theme, !!onTitleClick),
          mb: 0.5,
        }}
      >
        {strategy.label} strategy
      </Typography>

      <Typography variant="body2" sx={getDescriptionStyles(theme)}>
        {strategy.description.split(/(\bTUCPs?\b)/g).map((part, index) => {
          if (part.match(/\bTUCPs?\b/)) {
            return (
              <span key={index}>
                {part}
                <InfoIconButton
                  variant="inline"
                  tooltipContent={
                    <>
                      <Box component="span" sx={{ fontWeight: 600 }}>
                        Temporary Urgent Change Petitions (TUCPs)
                      </Box>{" "}
                      permit changes during droughts to meet human health and
                      safety needs and protect endangered species.
                    </>
                  }
                />
              </span>
            )
          }
          return part
        })}
      </Typography>
    </Box>
  )
}

export default StrategyInfoPanel

/**
 * KeyOperationsPanel - Shows key operations icons and hydroclimate chooser
 *
 * Used in the Learn section scrollytelling.
 */

import { Box, Typography, useTheme } from "@repo/ui/mui"
import { HybridTooltip } from "@repo/ui"
import { strategies } from "../../../../content/scenarios"
import { HydroclimateChooser } from "../../../scenarios/components"
import type { KeyOperationsPanelProps } from "./types"
import { getStrategyIcons } from "./utils"
import { panelBaseStyles, getTitleStyles, getIconBoxStyles } from "./styles"

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

  const icons = getStrategyIcons(strategyValue)

  return (
    <Box
      sx={{
        ...panelBaseStyles,
        boxShadow: theme.shadows[2],
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

          <Box
            sx={{
              display: "flex",
              gap: { xs: 0.5, md: 1 },
              alignItems: "flex-start",
              flexDirection: "row",
              justifyContent: "flex-start",
            }}
          >
            {icons.map((icon) => (
              <HybridTooltip
                key={icon.path}
                content={
                  <>
                    <Box
                      component="span"
                      sx={{ fontWeight: 600, display: "block", mb: 0.5 }}
                    >
                      {icon.label.replace(/\n/g, " ")}
                    </Box>
                    {icon.description}
                  </>
                }
              >
                <Box
                  sx={{
                    ...getIconBoxStyles(theme),
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      inset: 0,
                    },
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={icon.path}
                    alt={icon.alt}
                    style={{
                      width: "100%",
                      height: "100%",
                      pointerEvents: "none",
                    }}
                  />
                </Box>
              </HybridTooltip>
            ))}
          </Box>
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

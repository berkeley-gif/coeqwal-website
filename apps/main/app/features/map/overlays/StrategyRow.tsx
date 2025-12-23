"use client"

/**
 * StrategyRow and related components
 *
 * Components for displaying strategy information in the Learn section.
 * Data is pulled from the same sources as StrategyGrid.
 *
 * Panel components have been extracted to StrategyRow/ folder for better organization.
 */

import { Box, Typography, useTheme } from "@repo/ui/mui"
import { InfoIconButton, HybridTooltip } from "@repo/ui"
import { strategies } from "../../../content/scenarios"
import type { StrategyRowProps } from "./StrategyRow/types"
import { getStrategyIcons } from "./StrategyRow/utils"
import {
  panelBaseStyles,
  panelMaxWidth,
  getTitleStyles,
  getDescriptionStyles,
  getIconBoxStyles,
} from "./StrategyRow/styles"

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

  // Get icons based on strategy
  const icons = getStrategyIcons(strategyValue)

  return (
    <Box
      sx={{
        ...panelBaseStyles,
        boxShadow: theme.shadow.sm,
        width: "100%",
        maxWidth: panelMaxWidth,
      }}
    >
      {/* Strategy label */}
      <Typography
        variant="subtitle1"
        sx={{
          ...getTitleStyles(theme),
          mb: showDescription ? 0.5 : 0,
        }}
      >
        {strategy.label} strategy
      </Typography>

      {/* Description - matches StrategyGrid layout (before icons) */}
      {showDescription && (
        <Typography
          variant="body2"
          sx={{
            ...getDescriptionStyles(theme),
            mb: 2,
          }}
        >
          {strategy.description.split(/(\bTUCPs?\b)/g).map((part, index) => {
            if (part.match(/\bTUCPs?\b/)) {
              return (
                <span key={index}>
                  {part}
                  <InfoIconButton
                    variant="inline"
                    tooltipContent={
                      <>
                        <Box component="span" sx={{ fontWeight: theme.typography.fontWeightSemiBold }}>
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
      )}

      {/* Icons row - matches StrategyGrid layout */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 1.5,
          alignItems: "center",
        }}
      >
        {icons.map((icon) => (
          <HybridTooltip
            key={icon.path}
            content={
              <>
                <Box
                  component="span"
                  sx={{ fontWeight: theme.typography.fontWeightSemiBold, display: "block", mb: 0.5 }}
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
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={icon.path}
                alt={icon.alt}
                style={{
                  width: "100%",
                  height: "100%",
                }}
              />
            </Box>
          </HybridTooltip>
        ))}
      </Box>
    </Box>
  )
}

export default StrategyRow

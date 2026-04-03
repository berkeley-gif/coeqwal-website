"use client"

/**
 * OperationsIconGroup - Renders scenario operation icons with tooltips
 *
 * Data-driven component that reads from the icon registry in opsIcons.tsx.
 * Each scenario maps to an ordered list of icons (theme icon first, then operations).
 *
 * Used by StrategyGrid, ScenarioRow, and KeyOperationsPanel.
 */

import React from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { HybridTooltip } from "@repo/ui"
import type { ScenarioTheme } from "../../../../content/scenarios"
import { getIconSize } from "./strategyIcons"
import { getScenarioIconDefs, renderIconDef } from "./opsIcons"

export interface OperationsIconGroupProps {
  /** Scenario ID (e.g., "s0020", "s0025") */
  scenarioId: string
  /** Scenario theme (currently unused.icons are driven by scenario ID) */
  theme?: ScenarioTheme
  /** Icon size variant */
  size?: "sm" | "md" | "lg"
  /** Layout direction */
  layout?: "horizontal" | "vertical"
  /** Called when an icon is clicked.receives the icon ID for cross-scenario selection */
  onIconClick?: (iconId: string) => void
}

export function OperationsIconGroup({
  scenarioId,
  size = "md",
  onIconClick,
}: OperationsIconGroupProps) {
  const theme = useTheme()
  const iconSize = getIconSize(size)
  const fixedIconSize = theme.spacing(iconSize.lg)

  const iconDefs = getScenarioIconDefs(scenarioId)

  if (iconDefs.length === 0) return null

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: `repeat(3, ${fixedIconSize})`,
        gap: theme.space.gap.xs,
        justifyContent: "flex-start",
      }}
    >
      {iconDefs.map((def) => (
        <HybridTooltip
          key={def.id}
          content={
            <>
              <Typography variant="tooltipHeader" sx={{ mb: 0.5 }}>
                {def.label}
              </Typography>
              {def.description}
            </>
          }
        >
          <Box
            tabIndex={0}
            role="button"
            aria-label={`${def.label} - focus or click for details`}
            onClick={
              onIconClick
                ? (e: React.MouseEvent) => {
                    e.stopPropagation()
                    onIconClick(def.id)
                  }
                : undefined
            }
            sx={{
              width: fixedIconSize,
              height: fixedIconSize,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: theme.borderRadius.circle,
              "&:focus-visible": {
                outline: `2px solid ${theme.palette.blue.bright}`,
                outlineOffset: "2px",
              },
            }}
          >
            {renderIconDef(def)}
          </Box>
        </HybridTooltip>
      ))}
    </Box>
  )
}

export default OperationsIconGroup

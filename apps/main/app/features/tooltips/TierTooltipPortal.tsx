"use client"

/**
 * TierTooltipPortal - Renders tier tooltip via Portal
 *
 * Renders the tooltip outside the normal DOM hierarchy to escape stacking context.
 *
 * WCAG 4.1.2: When scenarioScore is provided, displays the scenario's actual
 * tier level alongside tier definitions, making chart data accessible to
 * screen reader users.
 */

import React, { useEffect } from "react"
import { Box, Portal, ClickAwayListener, useTheme } from "@repo/ui/mui"
import { TooltipCloseButton } from "@repo/ui"
import TierTooltipContent from "./TierTooltipContent"
import type { OutcomeScoreData } from "../scenarios/hooks"
import type { TooltipChartDataPoint } from "./useTierTooltipState"

interface TierTooltipPortalProps {
  /** The outcome name to show tooltip for (null = hidden) */
  outcome: string | null
  /** Position for the tooltip */
  position: { top: number; right: number } | null
  /** Called when user clicks away */
  onClose: () => void
  /** Called when user clicks close button */
  onForceClose: () => void
  /** Optional: Current scenario's score data for this outcome (for accessibility) */
  scenarioScore?: OutcomeScoreData | null
  /** Optional: Scenario label for context */
  scenarioLabel?: string
  /** Optional: Chart data for tier distribution display */
  chartData?: TooltipChartDataPoint[]
}

export function TierTooltipPortal({
  outcome,
  position,
  onClose,
  onForceClose,
  scenarioScore,
  scenarioLabel,
  chartData,
}: TierTooltipPortalProps) {
  const theme = useTheme()

  // WCAG 2.1.1: Close tooltip on Escape key
  useEffect(() => {
    if (!outcome) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onForceClose()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [outcome, onForceClose])

  if (!outcome || !position) return null

  return (
    <Portal>
      <ClickAwayListener
        onClickAway={onClose}
        mouseEvent="onMouseUp"
        touchEvent="onTouchEnd"
      >
        <Box
          sx={{
            position: "fixed",
            top: position.top,
            right: position.right,
            zIndex: theme.zIndex.tooltip,
          }}
        >
          <Box
            sx={{
              position: "relative",
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
              border: theme.border.light,
              borderRadius: theme.borderRadius.md,
              boxShadow: theme.shadow.md,
              p: theme.space.component.xl,
              width: "450px",
              ...theme.typography.compactSubtitle,
            }}
          >
            <TooltipCloseButton
              onClick={onForceClose}
              offset={{ top: 8, right: 8 }}
            />

            {/* Arrow pointing right */}
            <Box
              sx={{
                position: "absolute",
                right: -15,
                top: 12,
                width: 0,
                height: 0,
                border: "8px solid transparent",
                borderLeftColor: theme.palette.common.white,
                filter: "drop-shadow(2px 0 2px rgba(0, 0, 0, 0.1))",
              }}
            />
            {/* Arrow border overlay */}
            <Box
              sx={{
                position: "absolute",
                right: -16,
                top: 12,
                width: 0,
                height: 0,
                border: "8px solid transparent",
                borderLeftColor: theme.palette.action.hover,
                zIndex: -1,
              }}
            />

            <TierTooltipContent
              outcome={outcome}
              showTitle={true}
              scenarioScore={scenarioScore}
              scenarioLabel={scenarioLabel}
              chartData={chartData}
            />
          </Box>
        </Box>
      </ClickAwayListener>
    </Portal>
  )
}

export default TierTooltipPortal

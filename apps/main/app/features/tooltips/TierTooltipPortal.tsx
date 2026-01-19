"use client"

/**
 * TierTooltipPortal - Renders tier tooltip via Portal
 *
 * Renders the tooltip outside the normal DOM hierarchy to escape stacking context.
 *
 */

import React from "react"
import { Box, Portal, ClickAwayListener, useTheme } from "@repo/ui/mui"
import { TooltipCloseButton } from "@repo/ui"
import TierTooltipContent from "./TierTooltipContent"

interface TierTooltipPortalProps {
  /** The outcome name to show tooltip for (null = hidden) */
  outcome: string | null
  /** Position for the tooltip */
  position: { top: number; right: number } | null
  /** Called when user clicks away */
  onClose: () => void
  /** Called when user clicks close button */
  onForceClose: () => void
}

export function TierTooltipPortal({
  outcome,
  position,
  onClose,
  onForceClose,
}: TierTooltipPortalProps) {
  const theme = useTheme()

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

            <TierTooltipContent outcome={outcome} showTitle={true} />
          </Box>
        </Box>
      </ClickAwayListener>
    </Portal>
  )
}

export default TierTooltipPortal

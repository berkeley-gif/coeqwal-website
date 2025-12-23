/**
 * TierTooltipPortal - Renders tier tooltip via Portal
 *
 * Extracted from StrategyGrid for better organization.
 * Renders the tooltip outside the normal DOM hierarchy to escape stacking context.
 */

import React from "react"
import { Box, Portal, ClickAwayListener, useTheme } from "@repo/ui/mui"
import TierTooltipContent from "../../../tooltips/TierTooltipContent"

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
              backgroundColor: theme.palette.common.white,
              color: theme.palette.text.primary,
              border: theme.border.light,
              borderRadius: theme.borderRadius.md,
              boxShadow: theme.shadow.md,
              padding: "16px",
              paddingRight: "40px",
              width: theme.spacing(56.25),
            }}
          >
            {/* Close button */}
            <Box
              component="button"
              onClick={onForceClose}
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                width: 24,
                height: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                background: "none",
                cursor: "pointer",
                fontSize: theme.typography.nav.fontSize,
                color: theme.palette.grey[500],
                borderRadius: theme.borderRadius.circle,
                "&:hover": {
                  color: theme.palette.grey[700],
                  backgroundColor: theme.palette.grey[100],
                },
              }}
              aria-label="Close tooltip"
            >
              ✕
            </Box>

            {/* Arrow pointing right */}
            <Box
              sx={{
                position: "absolute",
                right: -16,
                top: 16,
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
                right: -17,
                top: 16,
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

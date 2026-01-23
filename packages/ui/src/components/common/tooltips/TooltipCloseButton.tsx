"use client"

/**
 * TooltipCloseButton - Shared close button for tooltip components
 *
 * Used by HybridTooltip, ClickTooltip, TierTooltipPortal, and other
 * tooltip variants that need a dismissible close button.
 * - WCAG 2.5.5: 44x44px touch target on mobile, 24x24px on desktop
 *
 * ## Usage
 *
 * Import and place inside a tooltip container with position: relative:
 *
 * ```tsx
 * <Box sx={{ position: "relative" }}>
 *   <TooltipCloseButton onClick={handleClose} />
 *   {content}
 * </Box>
 * ```
 */

import React from "react"
import { Box } from "../../.."
import { Theme } from "@mui/material/styles"
import { themeValues } from "../../../themes/theme"

// Close button positioning
const CLOSE_BUTTON_OFFSET = themeValues.spacing.component.sm

export interface TooltipCloseButtonProps {
  onClick: () => void
  /** Custom offset from top-right corner in pixels. Defaults to theme spacing. */
  offset?: { top?: number; right?: number }
}

export function TooltipCloseButton({
  onClick,
  offset,
}: TooltipCloseButtonProps) {
  return (
    <Box
      component="button"
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation()
        onClick()
      }}
      sx={{
        position: "absolute",
        top:
          offset?.top !== undefined
            ? `${offset.top}px`
            : (theme: Theme) => theme.spacing(CLOSE_BUTTON_OFFSET),
        right:
          offset?.right !== undefined
            ? `${offset.right}px`
            : (theme: Theme) => theme.spacing(CLOSE_BUTTON_OFFSET),
        // WCAG 2.5.5: 44px touch target on mobile, 24px on desktop
        width: { xs: "44px", sm: "24px" },
        height: { xs: "44px", sm: "24px" },
        // WCAG 1.4.11: Visible border for touch target
        border: (theme: Theme) => `1px solid ${theme.palette.grey[400]}`,
        // Visible background on mobile for touch target visibility
        background: (theme: Theme) => ({
          xs: `${theme.palette.grey[200]}60`,
          sm: "transparent",
        }),
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: (theme: Theme) => theme.borderRadius.circle,
        color: (theme: Theme) => theme.palette.grey[500],
        "&:hover": {
          color: (theme: Theme) => theme.palette.grey[700],
          background: (theme: Theme) => theme.palette.grey[100],
        },
        // WCAG 2.4.7: Focus visible styles
        "&:focus-visible": {
          outline: (theme: Theme) => `2px solid ${theme.palette.blue.bright}`,
          outlineOffset: "2px",
        },
      }}
      aria-label="Close tooltip"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
        <path d="M11.25 1.8075L10.1925 0.75L6 4.9425L1.8075 0.75L0.75 1.8075L4.9425 6L0.75 10.1925L1.8075 11.25L6 7.0575L10.1925 11.25L11.25 10.1925L7.0575 6L11.25 1.8075Z" />
      </svg>
    </Box>
  )
}

export default TooltipCloseButton

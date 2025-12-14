"use client"

/**
 * HybridTooltip component
 * 
 * @description
 * A tooltip that adapts its interaction based on device type:
 * - Desktop (pointer: fine): Hover to show, auto-closes on mouse leave
 * - Touch (pointer: coarse): Click to show, X button, click-outside to close
 * 
 * Uses MUI's useMediaQuery with `pointer: coarse` to detect touch devices.
 * 
 * @since 12 Dec 2025
 * 
 * ## When to use HybridTooltip vs ClickTooltip
 * 
 * Use **HybridTooltip** when you want device-adaptive behavior: hover on desktop
 * for quick, frictionless access; click on touch devices for explicit control.
 * Best for: simple hints, definitions, icon descriptions, key operation icons,
 * toggle explanations—-anywhere hover feels natural on desktop.
 * 
 * Use **ClickTooltip** when you need consistent click-to-open behavior on ALL
 * devices. The tooltip always shows X button regardless of device type.
 * Best for: tier/outcome tooltips, complex interactive content, or when you
 * want explicit user control over open/close on all platforms.
 * 
 * @see ClickTooltip - For always-click behavior on all devices
 * 
 * ## Variants
 * 
 * ### variant="tooltip" (default)
 * Uses MUI Tooltip with arrow, auto-positioning relative to anchor.
 * Best for: Simple to medium content that should feel like a tooltip.
 * 
 * ### variant="overlay"
 * Uses a custom positioned overlay box, no arrow, centered on screen.
 * Best for: Complex content (charts, interactive elements), full control.
 * 
 * ## Device behavior
 * - Desktop (pointer: fine): Hover interaction, no X button
 * - Touch (pointer: coarse): Click interaction, X button, click-outside to close (default)
 * 
 * ## Usage
 * 
 * ```tsx
 * // Simple tooltip (hover on desktop, click on touch)
 * <HybridTooltip content={<>Tooltip content</>}>
 *   <Button>Hover/Tap me</Button>
 * </HybridTooltip>
 * 
 * // Complex overlay (hover on desktop, click on touch)
 * <HybridTooltip variant="overlay" content={<ChartComponent />}>
 *   <Button>Hover/Tap me</Button>
 * </HybridTooltip>
 * ```
 */

import React, { useState, useRef } from "react"
import { Box, Tooltip, ClickAwayListener, useMediaQuery, useTheme } from "../../.."
import { Theme } from "@mui/material/styles"
import type { TooltipProps } from "@mui/material"

// ============================================================================
// CONFIGURABLE CONSTANTS
// ============================================================================
const DEFAULT_WIDTH = "280px"
const MAX_WIDTH = "400px"
const PADDING_Y = "12px"
const PADDING_X = "16px"

// ============================================================================
// TYPES
// ============================================================================
export interface HybridTooltipProps {
  /** The content to display in the tooltip */
  content: React.ReactNode
  /** The child element that triggers the tooltip */
  children: React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>
  /** "tooltip" uses MUI Tooltip with arrow, "overlay" uses custom positioned box */
  variant?: "tooltip" | "overlay"
  /** Tooltip placement (for tooltip variant) */
  placement?: TooltipProps["placement"]
  /** Custom width override */
  width?: string
  /** Custom max width override */
  maxWidth?: string
  /** Enable click outside to close on touch devices (default: true) */
  clickOutsideToClose?: boolean
}

// ============================================================================
// CLOSE BUTTON COMPONENT
// ============================================================================
function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <Box
      component="button"
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation()
        onClick()
      }}
      sx={{
        position: "absolute",
        top: "8px",
        right: "8px",
        width: "24px",
        height: "24px",
        border: "none",
        background: "transparent",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        color: (theme: Theme) => theme.palette.grey[500],
        "&:hover": {
          color: (theme: Theme) => theme.palette.grey[700],
          background: (theme: Theme) => theme.palette.grey[100],
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

// ============================================================================
// TOOLTIP STYLES (shared)
// ============================================================================
const getTooltipSlotProps = (
  theme: Theme,
  width: string,
  maxWidth: string,
  showCloseButton: boolean,
) => ({
  popper: {
    sx: {
      zIndex: theme.zIndex.tooltip,
    },
  },
  tooltip: {
    sx: {
      backgroundColor: theme.palette.common.white,
      color: theme.palette.text.primary,
      boxShadow: theme.shadows[4],
      width,
      maxWidth,
      padding: `${PADDING_Y} ${PADDING_X}`,
      paddingRight: showCloseButton ? "40px" : PADDING_X,
      fontSize: "0.8125rem",
      lineHeight: 1.5,
    },
  },
  arrow: {
    sx: {
      color: theme.palette.common.white,
    },
  },
})

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export function HybridTooltip({
  content,
  children,
  variant = "tooltip",
  placement = "top",
  width = DEFAULT_WIDTH,
  maxWidth = MAX_WIDTH,
  clickOutsideToClose = true,
}: HybridTooltipProps) {
  const theme = useTheme()
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLSpanElement>(null)
  
  // Detect touch device using pointer: coarse media query
  const isTouchDevice = useMediaQuery("(pointer: coarse)")

  const handleClose = () => setOpen(false)
  const handleToggle = () => setOpen((prev) => !prev)

  // ==========================================================================
  // TOUCH DEVICE MODE (Click to open, X button, click-outside)
  // ==========================================================================
  if (isTouchDevice) {
    const tooltipContent = (
      <Box sx={{ position: "relative" }}>
        <CloseButton onClick={handleClose} />
        <Box sx={{ pr: "28px" }}>{content}</Box>
      </Box>
    )

    // Overlay variant for touch
    if (variant === "overlay") {
      const overlay = open && (
        <Box
          sx={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: theme.zIndex.tooltip,
            backgroundColor: theme.palette.common.white,
            color: theme.palette.text.primary,
            boxShadow: theme.shadows[8],
            borderRadius: "8px",
            width,
            maxWidth,
            padding: `${PADDING_Y} ${PADDING_X}`,
            fontSize: "0.8125rem",
            lineHeight: 1.5,
          }}
        >
          <CloseButton onClick={handleClose} />
          <Box sx={{ pr: "28px" }}>{content}</Box>
        </Box>
      )

      const result = (
        <span ref={anchorRef} style={{ display: "inline-flex" }}>
          {React.cloneElement(children, {
            onClick: (e: React.MouseEvent) => {
              handleToggle()
              children.props.onClick?.(e)
            },
          })}
          {overlay}
        </span>
      )

      if (clickOutsideToClose && open) {
        return (
          <ClickAwayListener onClickAway={handleClose}>
            {result}
          </ClickAwayListener>
        )
      }

      return result
    }

    // Tooltip variant for touch
    const tooltip = (
      <Tooltip
        title={tooltipContent}
        open={open}
        placement={placement}
        arrow
        disableFocusListener
        disableHoverListener
        disableTouchListener
        slotProps={getTooltipSlotProps(theme, width, maxWidth, true)}
      >
        {React.cloneElement(children, {
          onClick: (e: React.MouseEvent) => {
            handleToggle()
            children.props.onClick?.(e)
          },
        })}
      </Tooltip>
    )

    if (clickOutsideToClose) {
      return (
        <ClickAwayListener onClickAway={handleClose}>
          <span style={{ display: "inline-flex" }}>{tooltip}</span>
        </ClickAwayListener>
      )
    }

    return tooltip
  }

  // ==========================================================================
  // DESKTOP MODE (Hover, no X button)
  // ==========================================================================
  
  // Overlay variant for desktop (hover)
  if (variant === "overlay") {
    return (
      <span
        ref={anchorRef}
        style={{ display: "inline-flex" }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        {children}
        {open && (
          <Box
            sx={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: theme.zIndex.tooltip,
              backgroundColor: theme.palette.common.white,
              color: theme.palette.text.primary,
              boxShadow: theme.shadows[8],
              borderRadius: "8px",
              width,
              maxWidth,
              padding: `${PADDING_Y} ${PADDING_X}`,
              fontSize: "0.8125rem",
              lineHeight: 1.5,
              pointerEvents: "auto",
            }}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
          >
            {content}
          </Box>
        )}
      </span>
    )
  }

  // Tooltip variant for desktop (hover)
  return (
    <Tooltip
      title={content}
      placement={placement}
      arrow
      enterDelay={200}
      leaveDelay={100}
      slotProps={getTooltipSlotProps(theme, width, maxWidth, false)}
    >
      {children}
    </Tooltip>
  )
}

export default HybridTooltip


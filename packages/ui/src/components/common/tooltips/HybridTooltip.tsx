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
import {
  Box,
  Tooltip,
  ClickAwayListener,
  useMediaQuery,
  useTheme,
} from "../../.."
import { Theme } from "@mui/material/styles"
import type { TooltipProps } from "@mui/material"
import { themeValues } from "../../../themes/theme"
import { TooltipCloseButton } from "./TooltipCloseButton"

// ============================================================================
// DEFAULTS
// ============================================================================
const DEFAULT_WIDTH = "280px"
const MAX_WIDTH = themeValues.layout.maxWidth.md

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
// TOOLTIP STYLES (shared)
// ============================================================================
const getTooltipSlotProps = (
  theme: Theme,
  width: string,
  maxWidth: string,
) => ({
  popper: {
    sx: {
      zIndex: theme.zIndex.tooltip,
    },
  },
  tooltip: {
    sx: {
      backgroundColor: theme.palette.background.paper,
      color: theme.palette.text.primary,
      boxShadow: theme.shadow.md,
      width,
      maxWidth,
      py: theme.space.component.md,
      px: theme.space.component.lg,
      ...theme.typography.compactSubtitle,
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
        <TooltipCloseButton onClick={handleClose} />
        {content}
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
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            boxShadow: theme.shadow.lg,
            borderRadius: theme.borderRadius.md,
            width,
            maxWidth,
            py: theme.space.component.md,
            px: theme.space.component.lg,
            ...theme.typography.compactSubtitle,
          }}
        >
          <TooltipCloseButton onClick={handleClose} />
          {content}
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
        slotProps={getTooltipSlotProps(theme, width, maxWidth)}
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
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
              boxShadow: theme.shadow.lg,
              borderRadius: theme.borderRadius.md,
              width,
              maxWidth,
              py: theme.space.component.md,
              px: theme.space.component.lg,
              ...theme.typography.compactSubtitle,
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
      slotProps={getTooltipSlotProps(theme, width, maxWidth)}
    >
      {children}
    </Tooltip>
  )
}

export default HybridTooltip

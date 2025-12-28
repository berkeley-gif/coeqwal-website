"use client"

/**
 * ClickTooltip component
 *
 * @description
 * A click-to-open tooltip with X button and optional click outside (default: true ) to close.
 * Supports two variants for different content complexity.
 *
 * ## When to use ClickTooltip vs HybridTooltip
 *
 * Use **ClickTooltip** when you need consistent click-to-open behavior on ALL
 * devices (both desktop and touch). The tooltip always shows X button and
 * supports click-outside to close. Best for: tier/outcome tooltips,
 * interactive content that benefits from explicit open/close control.
 *
 * Use **HybridTooltip** when you want device-adaptive behavior: hover on desktop
 * for quick access, click on touch devices. Best for: simple hints, definitions,
 * icon descriptions where hover feels natural on desktop.
 *
 * @see HybridTooltip - For device-adaptive hover/click behavior
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
 * ## Features
 * - Click to open (not hover)
 * - X button to close
 * - Click outside to close (default: true, can be disabled via clickOutsideToClose={false})
 * - Close on scroll (opt-in via closeOnScroll={true}) - useful for tier/outcome tooltips
 * - Uses theme.zIndex.tooltip for proper layering
 * - Standard dimensions with custom override
 *
 * ## Usage
 *
 * ```tsx
 * // Simple tooltip variant
 * <ClickTooltip
 *   open={open}
 *   onClose={() => setOpen(false)}
 *   content={<>Simple content</>}
 * >
 *   <Button onClick={() => setOpen(true)}>Open</Button>
 * </ClickTooltip>
 *
 * // Complex overlay variant
 * <ClickTooltip
 *   variant="overlay"
 *   open={open}
 *   onClose={() => setOpen(false)}
 *   content={<ChartComponent />}
 * >
 *   <Button onClick={() => setOpen(true)}>Open</Button>
 * </ClickTooltip>
 * ```
 */

import React, { useRef, useEffect } from "react"
import { Box, Tooltip, ClickAwayListener, useTheme } from "../../.."
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
export interface ClickTooltipProps {
  /** Whether the tooltip is open */
  open: boolean
  /** Callback when tooltip should close */
  onClose: () => void
  /** The content to display in the tooltip */
  content: React.ReactNode
  /** The child element that triggers the tooltip */
  children: React.ReactElement
  /** "tooltip" uses MUI Tooltip with arrow, "overlay" uses custom positioned box */
  variant?: "tooltip" | "overlay"
  /** Tooltip placement (for tooltip variant) */
  placement?: TooltipProps["placement"]
  /** Custom width override */
  width?: string
  /** Custom max width override */
  maxWidth?: string
  /** Hide the X close button */
  hideCloseButton?: boolean
  /** Enable click outside to close (default: true) */
  clickOutsideToClose?: boolean
  /** Close tooltip when user scrolls (default: false) */
  closeOnScroll?: boolean
}

// ============================================================================
// TOOLTIP VARIANT (MUI Tooltip with arrow)
// ============================================================================
function TooltipVariant({
  open,
  onClose,
  content,
  children,
  placement,
  width,
  maxWidth,
  hideCloseButton,
  clickOutsideToClose,
}: Omit<ClickTooltipProps, "variant">) {
  const tooltipContent = (
    <Box sx={{ position: "relative" }}>
      {!hideCloseButton && <TooltipCloseButton onClick={onClose} offset={{ top: -8, right: -8 }} />}
      {content}
    </Box>
  )

  const tooltip = (
    <Tooltip
      title={tooltipContent}
      open={open}
      placement={placement}
      arrow
      disableFocusListener
      disableHoverListener
      disableTouchListener
      slotProps={{
        popper: {
          sx: (theme: Theme) => ({
            zIndex: theme.zIndex.tooltip,
          }),
        },
        tooltip: {
          sx: (theme: Theme) => ({
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            boxShadow: theme.shadow.md,
            width,
            maxWidth,
            p: theme.space.component.xl,
            ...theme.typography.compactSubtitle,
          }),
        },
        arrow: {
          sx: (theme: Theme) => ({
            color: theme.palette.common.white,
          }),
        },
      }}
    >
      {children}
    </Tooltip>
  )

  if (clickOutsideToClose) {
    return (
      <ClickAwayListener
        onClickAway={onClose}
        mouseEvent="onMouseUp"
        touchEvent="onTouchEnd"
      >
        <span style={{ display: "inline-flex" }}>{tooltip}</span>
      </ClickAwayListener>
    )
  }

  return tooltip
}

// ============================================================================
// OVERLAY VARIANT (Custom positioned box)
// ============================================================================
function OverlayVariant({
  open,
  onClose,
  content,
  children,
  width,
  maxWidth,
  hideCloseButton,
  clickOutsideToClose,
}: Omit<ClickTooltipProps, "variant" | "placement">) {
  const theme = useTheme()
  const anchorRef = useRef<HTMLSpanElement>(null)

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
        p: theme.space.component.xl,
        ...theme.typography.compactSubtitle,
      }}
      >
      {!hideCloseButton && <TooltipCloseButton onClick={onClose} offset={{ top: -8, right: -8 }} />}
      {content}
    </Box>
  )

  const result = (
    <span ref={anchorRef} style={{ display: "inline-flex" }}>
      {children}
      {overlay}
    </span>
  )

  if (clickOutsideToClose && open) {
    return <ClickAwayListener onClickAway={onClose}>{result}</ClickAwayListener>
  }

  return result
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export function ClickTooltip({
  variant = "tooltip",
  open,
  onClose,
  content,
  children,
  placement = "top",
  width = DEFAULT_WIDTH,
  maxWidth = MAX_WIDTH,
  hideCloseButton = false,
  clickOutsideToClose = true,
  closeOnScroll = false,
}: ClickTooltipProps) {
  // Close on scroll - listens to any scroll event when tooltip is open
  useEffect(() => {
    if (!open || !closeOnScroll) return

    const handleScroll = () => {
      onClose()
    }

    // Use capture phase to catch scroll events on any element
    window.addEventListener("scroll", handleScroll, true)

    return () => {
      window.removeEventListener("scroll", handleScroll, true)
    }
  }, [open, closeOnScroll, onClose])

  if (variant === "overlay") {
    return (
      <OverlayVariant
        open={open}
        onClose={onClose}
        content={content}
        width={width}
        maxWidth={maxWidth}
        hideCloseButton={hideCloseButton}
        clickOutsideToClose={clickOutsideToClose}
      >
        {children}
      </OverlayVariant>
    )
  }

  return (
    <TooltipVariant
      open={open}
      onClose={onClose}
      content={content}
      placement={placement}
      width={width}
      maxWidth={maxWidth}
      hideCloseButton={hideCloseButton}
      clickOutsideToClose={clickOutsideToClose}
    >
      {children}
    </TooltipVariant>
  )
}

export default ClickTooltip

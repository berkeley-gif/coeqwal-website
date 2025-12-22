"use client"

/**
 * ClickTooltip component
 *
 * @description
 * A click-to-open tooltip with X button and optional click outside (default: true ) to close.
 * Supports two variants for different content complexity.
 *
 * @since 12 Dec 2025
 *
 * ## When to use ClickTooltip vs HybridTooltip
 *
 * Use **ClickTooltip** when you need consistent click-to-open behavior on ALL
 * devices (both desktop and touch). The tooltip always shows X button and
 * supports click-outside to close. Best for: tier/outcome tooltips, complex
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
        borderRadius: (theme: Theme) => theme.borderRadius.circle,
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
      {!hideCloseButton && <CloseButton onClick={onClose} />}
      <Box sx={{ pr: hideCloseButton ? 0 : "28px" }}>{content}</Box>
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
            backgroundColor: theme.palette.common.white,
            color: theme.palette.text.primary,
            boxShadow: theme.shadows[4],
            width,
            maxWidth,
            padding: `${PADDING_Y} ${PADDING_X}`,
            fontSize: "0.8125rem",
            lineHeight: 1.5,
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
        backgroundColor: theme.palette.common.white,
        color: theme.palette.text.primary,
        boxShadow: theme.shadows[8],
        borderRadius: theme.borderRadius.md,
        width,
        maxWidth,
        padding: `${PADDING_Y} ${PADDING_X}`,
        fontSize: "0.8125rem",
        lineHeight: 1.5,
      }}
    >
      {!hideCloseButton && <CloseButton onClick={onClose} />}
      <Box sx={{ pr: hideCloseButton ? 0 : "28px" }}>{content}</Box>
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

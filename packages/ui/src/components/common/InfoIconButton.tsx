"use client"

/**
 * InfoIconButton Component
 *
 * @description
 * A clickable info icon (rounded ℹ️) that displays tooltip content.

 *
 * ## Pattern 1: Self-managed (simple case)
 *
 * **When to use:** Text content, formatted definitions, simple info
 *
 * - Component manages open/close state internally
 * - Uses InfoTooltip (standard tooltip styling)
 * - ClickAwayListener handled automatically
 *
 * ```tsx
 * <InfoIconButton
 *   tooltipContent={
 *     <>
 *       <Typography variant="tooltipHeader">Term</Typography>
 *       definition...
 *     </>
 *   }
 * />
 * ```
 *
 * ## Pattern 2: Externally controlled (complex case)
 *
 * **When to use:** Charts, interactive content, coordination with other UI
 *
 * - Parent manages state
 * - Parent renders whatever content it needs (charts, forms, etc.)
 *
 * ```tsx
 * <InfoIconButton onClick={handleClick} isActive={isOpen} />
 * {isOpen && <TierTooltipContent ... />}
 * ```
 *
 * ## Variants
 * - "button" (default): Semi-transparent circle background, 24px touch target
 * - "inline": Minimal styling for use within text, 20px touch target
 *
 * ## Configurable constants
 * - BUTTON_ICON_SIZE: Icon size for "button" variant (default: 1.2rem)
 * - INLINE_ICON_SIZE: Icon size for "inline" variant (default: 1.1rem)
 * - CIRCLE_SIZE: Touch target size for "button" variant (default: 24px)
 * - INLINE_TOUCH_TARGET: Touch target size for "inline" variant (default: 20px)
 */

import React, { useRef, forwardRef } from "react"
import { Box, InfoIcon } from "../.."
import { HybridTooltip } from "./tooltips/HybridTooltip"
import { Theme } from "@mui/material/styles"

// ============================================================================
// CONFIGURABLE CONSTANTS
// ============================================================================
const BUTTON_ICON_SIZE = "1.35rem"
const INLINE_ICON_SIZE = "1.1rem"
// WCAG 2.5.5: 44px minimum touch target on mobile, 24px on desktop
const CIRCLE_SIZE = { xs: "44px", sm: "24px" }
const INLINE_TOUCH_TARGET = { xs: "44px", sm: "20px" }

// ============================================================================
// TYPES
// ============================================================================
export interface InfoIconButtonProps {
  /** Content to display in the tooltip. When provided, component manages its own state. */
  tooltipContent?: React.ReactNode
  /** Click handler for external control. Not needed if tooltipContent is provided. */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  /** MouseDown handler - use to mark clicking before ClickAwayListener fires */
  onMouseDown?: (e: React.MouseEvent<HTMLButtonElement>) => void
  /** Whether tooltip is currently shown. Used for external control and styling. */
  isActive?: boolean
  /** Native title attribute for accessibility */
  title?: string
  /** Additional styles for the icon */
  sx?: object
  /** "button" shows semi-transparent circle, "inline" is minimal for use in text */
  variant?: "button" | "inline"
  /** Tooltip placement relative to the icon */
  placement?: "top" | "bottom" | "left" | "right"
}

// ============================================================================
// STYLES
// ============================================================================
// Note: circleButtonStyles uses theme callback for responsive sizing
const getCircleButtonStyles = (theme: Theme) => ({
  border: "none",
  cursor: "pointer",
  padding: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "50%",
  // WCAG 2.5.5: 44px touch target on mobile, 24px on desktop
  width: CIRCLE_SIZE,
  height: CIRCLE_SIZE,
  minWidth: CIRCLE_SIZE,
  minHeight: CIRCLE_SIZE,
  transition: theme.transition.quick,
})

// Note: inlineButtonStyles uses theme callback for responsive sizing
const getInlineButtonStyles = (theme: Theme) => ({
  border: "none",
  cursor: "pointer",
  padding: 0,
  background: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  verticalAlign: "-3.5px",
  transition: theme.transition.quick,
  // WCAG 2.5.5: 44px touch target on mobile, 20px on desktop
  minWidth: INLINE_TOUCH_TARGET,
  minHeight: INLINE_TOUCH_TARGET,
})

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export const InfoIconButton = forwardRef<
  HTMLButtonElement,
  InfoIconButtonProps
>(function InfoIconButton(
  {
    tooltipContent,
    onClick,
    onMouseDown,
    isActive: externalIsActive,
    title,
    sx = {},
    variant = "button",
    placement = "top",
  },
  ref,
) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Use forwarded ref if provided, otherwise use internal ref
  const actualRef = (ref as React.RefObject<HTMLButtonElement>) || buttonRef

  // Determine if tooltip is self-managed or externally controlled
  const isSelfManaged = tooltipContent !== undefined
  const isActive = externalIsActive ?? false

  const isInline = variant === "inline"
  const iconSize = isInline ? INLINE_ICON_SIZE : BUTTON_ICON_SIZE

  const button = (
    <Box
      component="button"
      ref={actualRef}
      onClick={onClick}
      onMouseDown={onMouseDown}
      aria-label={title || "More information"}
      aria-expanded={isActive}
      sx={(theme: Theme) => ({
        ...(isInline
          ? getInlineButtonStyles(theme)
          : getCircleButtonStyles(theme)),
        // WCAG 1.4.11: Visible background and border for touch target
        background: isInline
          ? "none"
          : isActive
            ? `${theme.palette.blue.bright}25`
            : {
                xs: `${theme.palette.grey[300]}40`,
                sm: `${theme.palette.grey[400]}18`,
              },
        border: isInline ? "none" : `1px solid ${theme.palette.grey[400]}`,
        color: isActive
          ? theme.palette.blue.darkest
          : theme.palette.blue.bright,
        "&:hover": {
          background: isInline ? "none" : `${theme.palette.blue.bright}35`,
          borderColor: theme.palette.blue.bright,
          color: theme.palette.blue.darkest,
        },
        // WCAG 2.4.7: Focus visible styles
        "&:focus-visible": {
          outline: `2px solid ${theme.palette.blue.bright}`,
          outlineOffset: "2px",
        },
      })}
    >
      <InfoIcon sx={{ fontSize: iconSize, ...sx }} />
    </Box>
  )

  // If self-managed, use HybridTooltip (hover on desktop, click on touch)
  if (isSelfManaged) {
    return (
      <HybridTooltip content={tooltipContent} placement={placement}>
        {button}
      </HybridTooltip>
    )
  }

  // External control - just return the button
  return button
})

export default InfoIconButton

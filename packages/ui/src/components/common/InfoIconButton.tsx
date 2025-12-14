"use client"

/**
 * InfoIconButton Component
 * 
 * @description
 * A clickable info icon (rounded ℹ️) that displays tooltip content.
 * 
 * @since 12 Dec 2025
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
 *       <Box component="span" sx={{ fontWeight: 600 }}>Term</Box> definition...
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
const BUTTON_ICON_SIZE = "1.2rem"
const INLINE_ICON_SIZE = "1.1rem"
const CIRCLE_SIZE = "24px"
const INLINE_TOUCH_TARGET = "20px"

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
const circleButtonStyles = {
  border: "none",
  cursor: "pointer",
  padding: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "50%",
  width: CIRCLE_SIZE,
  height: CIRCLE_SIZE,
  minWidth: CIRCLE_SIZE,
  minHeight: CIRCLE_SIZE,
  transition: "all 0.15s ease",
}

const inlineButtonStyles = {
  border: "none",
  cursor: "pointer",
  padding: 0,
  background: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  verticalAlign: "text-top",
  marginLeft: "4px",
  transition: "color 0.15s ease",
  // Touch target sizing
  minWidth: INLINE_TOUCH_TARGET,
  minHeight: INLINE_TOUCH_TARGET,
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export const InfoIconButton = forwardRef<HTMLButtonElement, InfoIconButtonProps>(
  function InfoIconButton(
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
        title={title}
        sx={{
          ...(isInline ? inlineButtonStyles : circleButtonStyles),
          background: isInline
            ? "none"
            : (theme: Theme) =>
                isActive
                  ? `${theme.palette.blue.bright}20`
                  : `${theme.palette.grey[500]}15`,
          color: (theme: Theme) =>
            isActive ? theme.palette.blue.darkest : theme.palette.blue.bright,
    "&:hover": {
            background: isInline
              ? "none"
              : (theme: Theme) => `${theme.palette.blue.bright}30`,
            color: (theme: Theme) => theme.palette.blue.darkest,
          },
        }}
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
  },
)

export default InfoIconButton

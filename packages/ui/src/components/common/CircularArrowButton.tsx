/**
 * CircularArrowButton - Circular button with arrow icon
 *
 * A round button with a rotatable arrow, used for navigation and expansion controls.
 *
 * WCAG 2.0 AA Compliance Notes:
 * - WCAG 2.4.7: Focus-visible outline styles - DO NOT REMOVE
 * - WCAG 4.1.2: aria-label for accessible name (required when interactive)
 */

import React from "react"
import { IconButton, useTheme } from "../../mui-components"
import type { SxProps, Theme } from "@mui/material/styles"
import { RoundedDownArrow } from "../icons/RoundedDownArrow"

interface CircularArrowButtonProps {
  onClick?: () => void
  color?: string
  size?: number
  rotation?: string
  ariaLabel?: string
  sx?: SxProps<Theme>
  /** When true, the button is purely visual (parent handles interaction) */
  decorative?: boolean
}

export const CircularArrowButton: React.FC<CircularArrowButtonProps> = ({
  onClick,
  color,
  size = 90,
  rotation = "0deg",
  ariaLabel = "Navigate",
  sx,
  decorative = false,
}) => {
  const theme = useTheme()
  const buttonColor = color || theme.palette.blue.darkest

  // If decorative, render without interactive semantics
  if (decorative) {
    return (
      <div
        aria-hidden="true"
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: buttonColor,
        }}
      >
        <RoundedDownArrow style={{ transform: `rotate(${rotation})` }} />
      </div>
    )
  }

  return (
    <IconButton
      onClick={onClick}
      aria-label={ariaLabel}
      sx={{
        width: size,
        height: size,
        borderRadius: theme.borderRadius.circle,
        border: "none",
        color: buttonColor,
        // WCAG 2.4.7: Focus visible indicator - DO NOT REMOVE
        "&:focus-visible": {
          outline: `2px solid ${buttonColor}`,
          outlineOffset: 2,
        },
        ...sx,
      }}
    >
      <RoundedDownArrow style={{ transform: `rotate(${rotation})` }} />
    </IconButton>
  )
}

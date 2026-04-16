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
import { IconButton, useTheme, ArrowDownwardIcon } from "../../mui-components"
import type { SxProps, Theme } from "@mui/material/styles"

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

  const arrowStroke = theme.strokeWidth.accent
  const iconStrokeSx = {
    "& path": {
      stroke: "currentColor",
      strokeWidth: `${arrowStroke}px`,
      paintOrder: "stroke fill",
    },
  }

  // If decorative, render without interactive semantics
  if (decorative) {
    return (
      <div
        aria-hidden="true"
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          border: `${arrowStroke}px solid ${buttonColor}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: buttonColor,
        }}
      >
        <ArrowDownwardIcon
          sx={{
            transform: rotation ? `rotate(${rotation})` : undefined,
            ...iconStrokeSx,
          }}
        />
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
        border: `${arrowStroke}px solid ${buttonColor}`,
        color: buttonColor,
        // WCAG 2.4.7: Focus visible indicator - DO NOT REMOVE
        "&:focus-visible": {
          outline: `${arrowStroke}px solid ${buttonColor}`,
          outlineOffset: 2,
        },
        ...sx,
      }}
    >
      <ArrowDownwardIcon
        sx={{
          transform: rotation ? `rotate(${rotation})` : undefined,
          ...iconStrokeSx,
        }}
      />
    </IconButton>
  )
}

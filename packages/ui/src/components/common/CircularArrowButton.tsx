/**
 * CircularArrowButton - Circular button with arrow icon
 *
 * A round button with a rotatable arrow, used for navigation and expansion controls.
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
}

export const CircularArrowButton: React.FC<CircularArrowButtonProps> = ({
  onClick,
  color,
  size = 90,
  rotation = "0deg",
  ariaLabel,
  sx,
}) => {
  const theme = useTheme()
  const buttonColor = color || theme.palette.blue.darkest

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
        ...sx,
      }}
    >
      <RoundedDownArrow style={{ transform: `rotate(${rotation})` }} />
    </IconButton>
  )
}

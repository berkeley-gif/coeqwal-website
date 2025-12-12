"use client"

import React from "react"
import { Box, InfoIcon } from "../.."
import { Theme } from "@mui/material/styles"

// ============================================================================
// CONFIGURABLE CONSTANTS
// ============================================================================
const ICON_SIZE = "1.3rem"
const CIRCLE_SIZE = "24px"

// ============================================================================
// TYPES
// ============================================================================
export interface InfoIconButtonProps {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
  isActive?: boolean
  title?: string
  sx?: object
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

// ============================================================================
// MAIN COMPONENT
// ============================================================================
/**
 * Info icon button that opens a tooltip when clicked.
 */
export function InfoIconButton({
  onClick,
  isActive = false,
  title,
  sx = {},
}: InfoIconButtonProps) {
  return (
    <Box
      component="button"
      onClick={onClick}
      title={title}
      sx={{
        ...circleButtonStyles,
        background: (theme: Theme) =>
          isActive
            ? `${theme.palette.blue.bright}20`
            : `${theme.palette.grey[500]}15`,
        color: (theme: Theme) =>
          isActive ? theme.palette.blue.darkest : theme.palette.blue.bright,
        "&:hover": {
          background: (theme: Theme) => `${theme.palette.blue.bright}30`,
          color: (theme: Theme) => theme.palette.blue.darkest,
        },
      }}
    >
      <InfoIcon sx={{ fontSize: ICON_SIZE, ...sx }} />
    </Box>
  )
}

export default InfoIconButton

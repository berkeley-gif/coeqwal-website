"use client"

import React from "react"
import { Button, Box, Typography } from "../.."
import type { ButtonProps } from "@mui/material/Button"

export interface ActionCardButtonProps extends Omit<ButtonProps, "children"> {
  /** Main title text */
  title: string
  /** Optional subtitle text */
  subtitle?: string
  /** Whether the button is disabled */
  disabled?: boolean
  /** Click handler */
  onClick?: () => void
}

/**
 * Action card button component for primary actions in card interfaces.
 * 
 * Features:
 * - Consistent grey/blue styling with hover effects
 * - Main title with optional subtitle
 * - Full width layout with centered content
 * - Disabled state support
 * - Uses actionCard MUI variant from theme
 */
export function ActionCardButton({
  title,
  subtitle,
  disabled = false,
  onClick,
  sx = {},
  ...props
}: ActionCardButtonProps) {
  return (
    <Button
      variant="actionCard"
      // Don't use MUI's disabled prop, handle manually to preserve hover
      onClick={disabled ? undefined : onClick}
      sx={{ 
        width: "100%",
        // Manual disabled styling that preserves hover
        ...(disabled && {
          cursor: "not-allowed",
        }),
        // Ensure all text turns white on hover
        "&:hover": {
          backgroundColor: (theme) => theme.palette.blue.bright,
          color: (theme) => theme.palette.common.white,
          "& .MuiTypography-root": {
            color: (theme) => theme.palette.common.white,
          },
          "& .ActionCardButton-subtitle": {
            color: (theme) => theme.palette.common.white,
          },
        },
        ...sx 
      }}
      {...props}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography variant="body1" sx={{ fontWeight: 500, mb: subtitle ? 0.5 : 0 }}>
          {title}
        </Typography>
        {subtitle && (
          <Box
            className="ActionCardButton-subtitle"
            sx={{
              fontSize: "0.75rem",
              opacity: disabled ? 0.7 : 0.9,
            }}
          >
            {subtitle}
          </Box>
        )}
      </Box>
    </Button>
  )
}

export default ActionCardButton

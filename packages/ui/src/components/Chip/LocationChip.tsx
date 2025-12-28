"use client"

/**
 * LocationChip - A clickable chip for location tags
 *
 * Used to display location names with optional click-to-zoom behavior.
 * Features hover effects with blue highlight.
 */

import { Chip, useTheme } from "@mui/material"

export interface LocationChipProps {
  /** The location name */
  label: string
  /** Click handler (e.g., for zooming to location) */
  onClick?: () => void
  /** Color variant: "default" for darker text, "muted" for lighter */
  variant?: "default" | "muted"
  /** Whether to use compact sizing */
  compact?: boolean
}

export function LocationChip({
  label,
  onClick,
  variant = "default",
  compact = false,
}: LocationChipProps) {
  const theme = useTheme()

  const textColor =
    variant === "muted" ? theme.palette.grey[600] : theme.palette.grey[700]

  return (
    <Chip
      size="small"
      label={label}
      onClick={onClick}
      sx={{
        ...theme.typography.compactMicro,
        cursor: onClick ? "pointer" : "default",
        backgroundColor: "transparent",
        color: textColor,
        border: `1px solid ${theme.palette.grey[300]}`,
        height: compact ? 18 : 22,
        ...(onClick && {
          "&:hover": {
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.common.white,
            borderColor: theme.palette.primary.main,
          },
        }),
        "& .MuiChip-label": { px: compact ? 0.5 : 0.75 },
      }}
    />
  )
}

export default LocationChip

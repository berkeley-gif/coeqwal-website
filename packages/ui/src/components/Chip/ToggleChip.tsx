"use client"

/**
 * ToggleChip - A chip that toggles between active/inactive states
 *
 * Provides consistent filled/outlined toggle styling across the app.
 */

import { Chip } from "@mui/material"

export interface ToggleChipProps {
  /** The label text */
  label: string
  /** Whether the chip is in active state */
  active: boolean
  /** Click handler for toggling */
  onClick: () => void
  /** Whether to take full width of container */
  fullWidth?: boolean
}

export function ToggleChip({
  label,
  active,
  onClick,
  fullWidth = false,
}: ToggleChipProps) {
  return (
    <Chip
      label={label}
      onClick={onClick}
      color={active ? "primary" : "default"}
      variant={active ? "filled" : "outlined"}
      sx={{
        cursor: "pointer",
        ...(fullWidth && { width: "100%" }),
      }}
    />
  )
}

export default ToggleChip

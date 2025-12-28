"use client"

/**
 * TierChip - A colored chip for displaying tier breakdowns
 *
 * Used to show tier counts (e.g., "Optimal: 5", "Critical: 2").
 * Color is passed as a prop to keep this component generic.
 */

import { Chip, useTheme } from "@mui/material"

export interface TierChipProps {
  /** The label text (e.g., "Optimal: 5") */
  label: string
  /** The tier color */
  color: string
  /** Whether to use compact sizing */
  compact?: boolean
}

export function TierChip({ label, color, compact = false }: TierChipProps) {
  const theme = useTheme()

  return (
    <Chip
      size="small"
      label={label}
      sx={{
        ...theme.typography.compactMicro,
        backgroundColor: `${color}15`,
        color: color,
        borderColor: `${color}40`,
        border: "1px solid",
        height: compact ? 18 : 22,
        "& .MuiChip-label": { px: compact ? 0.5 : 1 },
      }}
    />
  )
}

export default TierChip

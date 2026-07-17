"use client"

import { type ReactNode } from "react"
import { Box, useTheme, type SxProps, type Theme } from "@mui/material"

export interface InfoCardGridProps {
  /** Number of equal-width columns (CSS grid `repeat(columns, 1fr)`). */
  columns: number
  children: ReactNode
  /** Horizontal gap between columns. Defaults to `theme.space.section.sm`. */
  columnGap?: string | number
  /** Vertical gap between rows. Defaults to `theme.space.component.lg`. */
  rowGap?: string | number
  sx?: SxProps<Theme>
}

/** Equal-column grid wrapper for `InfoCard` rows. Centralizes the grid
 *  layout shared by the get-started and intro card sections. */
export function InfoCardGrid({
  columns,
  children,
  columnGap,
  rowGap,
  sx,
}: InfoCardGridProps) {
  const theme = useTheme()
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        alignItems: "stretch",
        columnGap: columnGap ?? theme.space.section.sm,
        rowGap: rowGap ?? theme.space.component.lg,
        ...((sx as object) ?? {}),
      }}
    >
      {children}
    </Box>
  )
}

export default InfoCardGrid

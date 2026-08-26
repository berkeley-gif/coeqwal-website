"use client"

import { type ReactNode } from "react"
import { Box, useTheme, type SxProps, type Theme } from "@mui/material"

export interface InfoCardGridProps {
  /** Number of equal-width columns (CSS grid `repeat(columns, 1fr)`).
   *  Pass a plain number for a fixed column count, or a breakpoint map
   *  (e.g. `{ xs: 2, sm: 3, md: 5 }`) for a count that changes per MUI
   *  breakpoint - same up-to-that-width-and-beyond behavior as any other
   *  MUI `sx` breakpoint object. */
  columns: number | Partial<Record<"xs" | "sm" | "md" | "lg" | "xl", number>>
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
  const gridTemplateColumns =
    typeof columns === "number"
      ? `repeat(${columns}, 1fr)`
      : Object.fromEntries(
          Object.entries(columns).map(([breakpoint, count]) => [
            breakpoint,
            `repeat(${count}, 1fr)`,
          ]),
        )
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns,
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

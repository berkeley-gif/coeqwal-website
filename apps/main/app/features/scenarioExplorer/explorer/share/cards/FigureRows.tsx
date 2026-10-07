"use client"

/**
 * FigureRows - the label/value table of a figure template (VARIABLE,
 * LOCATION, STRATEGY, ...). Shared by the share card and the map caption so
 * both read the same way.
 */

import React from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import type { FigureTemplateRow } from "../figureTemplate"

export interface FigureRowsProps {
  rows: FigureTemplateRow[]
  /** Smaller type for the map overlay */
  compact?: boolean
}

export default function FigureRows({ rows, compact = false }: FigureRowsProps) {
  const theme = useTheme()
  if (rows.length === 0) return null
  return (
    <Box
      component="dl"
      data-share-figure-rows=""
      sx={{
        display: "grid",
        gridTemplateColumns: "max-content 1fr",
        columnGap: 1.5,
        rowGap: 0.25,
        m: 0,
      }}
    >
      {rows.map((row) => (
        <React.Fragment key={row.key}>
          <Typography
            component="dt"
            sx={{
              fontSize: "0.625rem",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: theme.palette.grey[700],
              alignSelf: "center",
            }}
          >
            {row.label}
          </Typography>
          <Typography
            component="dd"
            sx={{
              m: 0,
              fontSize: compact ? "0.75rem" : "0.8125rem",
              fontWeight: 700,
              lineHeight: 1.3,
              color: theme.palette.blue.darkest,
            }}
          >
            {row.value}
          </Typography>
        </React.Fragment>
      ))}
    </Box>
  )
}

"use client"

/**
 * WytFilterChips - the water-year-type filter row for the explorer. Five
 * toggleable chips (Sacramento index classes, wettest to driest) plus an
 * "All years" clear chip; an empty selection means all years. Hidden for
 * single-value views, which have no annual series to filter.
 */

import React from "react"
import { Box, Chip, Typography, useTheme } from "@repo/ui/mui"
import { useDataSlice } from "../../../../store"
import { WYT_CLASSES, WYT_LABELS } from "../config/wytFilter"

export default function WytFilterChips() {
  const theme = useTheme()
  const {
    view,
    selectedWaterYearTypes,
    toggleWaterYearType,
    clearWaterYearTypes,
  } = useDataSlice()

  if (view === "value") return null

  const anySelected = selectedWaterYearTypes.length > 0

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 1,
        py: 1,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Typography
        variant="caption"
        sx={{ color: theme.palette.grey[600], mr: 0.5 }}
      >
        Water year types
      </Typography>
      {WYT_CLASSES.map((wyt) => {
        const selected = selectedWaterYearTypes.includes(wyt)
        return (
          <Chip
            key={wyt}
            size="small"
            clickable
            label={WYT_LABELS[wyt]}
            color={selected ? "primary" : "default"}
            variant={selected ? "filled" : "outlined"}
            aria-pressed={selected}
            onClick={() => toggleWaterYearType(wyt)}
          />
        )
      })}
      {anySelected && (
        <Chip
          size="small"
          clickable
          variant="outlined"
          label="All years"
          onClick={clearWaterYearTypes}
        />
      )}
    </Box>
  )
}

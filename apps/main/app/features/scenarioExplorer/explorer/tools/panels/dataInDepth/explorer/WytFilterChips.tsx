"use client"

/**
 * WytFilterChips - the water-year-type filter row for the explorer. An
 * "All years" chip (the default, selected whenever no class filter is
 * active) followed by five class chips (Sacramento index classes, wettest
 * to driest). The filter is single-select: picking a class replaces the
 * selection, picking it again (or picking "All years") returns to all
 * years. Hidden for single-value views, which have no annual series to
 * filter.
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
      <Chip
        size="small"
        clickable
        label="All years"
        color={anySelected ? "default" : "primary"}
        variant={anySelected ? "outlined" : "filled"}
        aria-pressed={!anySelected}
        onClick={clearWaterYearTypes}
      />
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
    </Box>
  )
}

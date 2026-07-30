"use client"

/**
 * ViewBar - view tabs plus the distribution-style toggle for the explorer.
 *
 * Offers the current variable's available views (the monthly-pattern view is
 * out of the explorer's first version), and, for the annual-distribution views
 * (annual distribution / percent of capacity), a secondary toggle between the
 * exceedance curve and the box plot.
 */

import React from "react"
import { Box, ToggleButton, ToggleButtonGroup, useTheme } from "@repo/ui/mui"
import { useDataSlice } from "../../../../store"
import type { DataDistKind } from "../../../../store"
import {
  getVariable,
  VIEW_LABELS,
  type VariableView,
} from "../config/variableRegistry"

const DIST_OPTIONS: { value: DataDistKind; label: string }[] = [
  { value: "exceedance", label: "Exceedance" },
  { value: "box", label: "Box plot" },
]

export default function ViewBar() {
  const theme = useTheme()
  const { selectedVariableId, view, distKind, setView, setDistKind } =
    useDataSlice()

  const variable = getVariable(selectedVariableId)
  if (!variable) return null

  const views = variable.views.filter((v) => v !== "monthly")
  const showDistToggle = view === "dist" || view === "pct" || view === "level"

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 1.5,
        py: 1,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <ToggleButtonGroup
        exclusive
        size="small"
        value={view}
        onChange={(_, next: VariableView | null) => {
          if (next) setView(next)
        }}
        aria-label="Data view"
      >
        {views.map((v) => (
          <ToggleButton
            key={v}
            value={v}
            sx={{ textTransform: "none", px: 1.5 }}
          >
            {variable.viewLabels?.[v] ?? VIEW_LABELS[v]}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {showDistToggle && (
        <ToggleButtonGroup
          exclusive
          size="small"
          value={distKind}
          onChange={(_, next: DataDistKind | null) => {
            if (next) setDistKind(next)
          }}
          aria-label="Distribution chart style"
        >
          {DIST_OPTIONS.map((opt) => (
            <ToggleButton
              key={opt.value}
              value={opt.value}
              sx={{ textTransform: "none", px: 1.5 }}
            >
              {opt.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      )}
    </Box>
  )
}

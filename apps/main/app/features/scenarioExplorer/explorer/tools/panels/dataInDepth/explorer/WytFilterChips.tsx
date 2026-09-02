"use client"

/**
 * WytFilterChips - the water-year-type filter row for the explorer. An
 * "All years" chip (the default, selected whenever no class filter is
 * active) followed by five class chips (Sacramento index classes, wettest
 * to driest). The filter is single-select: picking a class replaces the
 * selection, picking it again (or picking "All years") returns to all
 * years. Hidden for single-value views, which have no annual series to
 * filter. For variables the filter cannot apply to (registry
 * `wytApplicable: false`: salmon population metrics and welfare loss, which
 * do not decompose by water-year type, plus the CWS series, which are
 * aggregated by calendar year upstream) the row renders disabled with a
 * not-applicable note; the stored selection stays inert rather than
 * cleared, so it revives on variables the filter applies to.
 */

import React from "react"
import { Box, Chip, Typography, useTheme } from "@repo/ui/mui"
import { useDataSlice } from "../../../../store"
import { useTourAnchor } from "../../../tour"
import { WYT_CLASSES, WYT_LABELS } from "../config/wytFilter"
import { getVariable } from "../config/variableRegistry"

export default function WytFilterChips() {
  const theme = useTheme()
  const wytAnchorRef = useTourAnchor("data.wyt")
  const {
    view,
    selectedVariableId,
    selectedWaterYearTypes,
    toggleWaterYearType,
    clearWaterYearTypes,
  } = useDataSlice()

  if (view === "value") return null

  const wytApplicable = getVariable(selectedVariableId)?.wytApplicable !== false
  const anySelected = wytApplicable && selectedWaterYearTypes.length > 0

  return (
    <Box
      ref={wytAnchorRef}
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
        clickable={wytApplicable}
        disabled={!wytApplicable}
        label="All years"
        color={!wytApplicable || anySelected ? "default" : "primary"}
        variant={!wytApplicable || anySelected ? "outlined" : "filled"}
        aria-pressed={wytApplicable ? !anySelected : undefined}
        onClick={wytApplicable ? clearWaterYearTypes : undefined}
      />
      {WYT_CLASSES.map((wyt) => {
        const selected = wytApplicable && selectedWaterYearTypes.includes(wyt)
        return (
          <Chip
            key={wyt}
            size="small"
            clickable={wytApplicable}
            disabled={!wytApplicable}
            label={WYT_LABELS[wyt]}
            color={selected ? "primary" : "default"}
            variant={selected ? "filled" : "outlined"}
            aria-pressed={selected}
            onClick={wytApplicable ? () => toggleWaterYearType(wyt) : undefined}
          />
        )
      })}
      {!wytApplicable && (
        <Typography
          variant="caption"
          sx={{ color: theme.palette.grey[600], fontStyle: "italic" }}
        >
          Not applicable to this variable
        </Typography>
      )}
    </Box>
  )
}

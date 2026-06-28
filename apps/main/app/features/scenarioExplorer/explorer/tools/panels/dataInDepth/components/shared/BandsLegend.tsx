"use client"

/**
 * BandsLegend - shared percentile-band legend for Data in depth sections.
 *
 * The CWS, AG, refuge, and env flow sections all render the same swatch
 * legend (min/max range, 10-90th, 30-70th, median). This module owns the
 * legend component so the sections stay visually consistent. The band colors
 * themselves live in config/bandColors.
 */

import React from "react"
import { Box } from "@repo/ui/mui"
import type { BandColors } from "../../config/bandColors"

export type { BandColors }

export interface BandLegendLabels {
  range: string
  outer: string
  inner: string
  median: string
}

/** Full labels used by the delivery / shortage sections. */
export const FULL_BAND_LABELS: BandLegendLabels = {
  range: "Minimum to maximum range",
  outer: "10–90th percentile",
  inner: "30–70th percentile",
  median: "Median",
}

/** Compact labels used by the env flow section where space is tight. */
export const COMPACT_BAND_LABELS: BandLegendLabels = {
  range: "Min–max",
  outer: "10–90th pct",
  inner: "30–70th pct",
  median: "Median",
}

function LegendSwatch({
  color,
  isLine,
  dashed,
  label,
  first,
}: {
  color: string
  isLine?: boolean
  /** Render as a dashed reference line (used for the min/max range). */
  dashed?: boolean
  label: string
  first?: boolean
}) {
  return (
    <>
      <Box
        component="span"
        sx={{
          width: 14,
          ...(dashed
            ? { height: 0, borderTop: `2px dashed ${color}` }
            : {
                height: isLine ? 3 : 14,
                backgroundColor: color,
                borderRadius: isLine ? "1px" : "2px",
              }),
          ...(first ? {} : { ml: 0.75 }),
        }}
      />
      <Box component="span" sx={{ typography: "dashboard", color: "grey.500" }}>
        {label}
      </Box>
    </>
  )
}

/**
 * Renders the four-swatch percentile-band legend. Pass the band `colors`
 * for the metric being shown and optionally a `labels` set (defaults to the
 * full labels). Intended to be placed inside a flex row container.
 */
export function BandLegend({
  colors,
  labels = FULL_BAND_LABELS,
}: {
  colors: BandColors
  labels?: BandLegendLabels
}) {
  return (
    <>
      <LegendSwatch color={colors.range} label={labels.range} dashed first />
      <LegendSwatch color={colors.outer} label={labels.outer} />
      <LegendSwatch color={colors.inner} label={labels.inner} />
      <LegendSwatch color={colors.median} label={labels.median} isLine />
    </>
  )
}

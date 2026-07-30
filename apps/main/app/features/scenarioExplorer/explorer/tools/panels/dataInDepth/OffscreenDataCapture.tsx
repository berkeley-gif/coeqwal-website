"use client"

/**
 * Off-screen capture for the Data-in-Depth explorer chart. Purely
 * declarative (radar-style): the caller passes the exact members, colors,
 * and view state the live ChartCard rendered, and this adapter re-renders
 * the matching @repo/viz snapshot inside OffscreenCaptureHost. It never
 * reads the live chart or the store, so the exported SVG always matches
 * what the user saw.
 *
 * Returns the members payload alongside the SVG and PNG so the share item
 * can persist `cachedChartData` for the data-download (CSV) button.
 */

import React from "react"
import {
  BoxPlotSnapshot,
  CategoricalBarChartSnapshot,
  ExceedanceChartSnapshot,
} from "@repo/viz"
import { type Theme } from "@repo/ui/mui"
import { offscreenCapture } from "../../../share/capture/OffscreenCaptureHost"
import { CAPTURE_DIMENSIONS } from "../../../share/capture/dimensions"
import type { DataChartDataShape } from "../../../share/export/csv/dataCsv"
import { formatValue } from "./hooks/interpretiveText"
import {
  toBars,
  toBoxes,
  toSeries,
  type MarkMember,
} from "./explorer/chartMarks"

export interface CaptureDataInDepthInput {
  theme: Theme
  /** View at capture time, e.g. "dist" | "pct" | "level" | "value" */
  view: string
  /** "exceedance" | "box"; only read for the dist-like views */
  distKind: string
  /** Members exactly as the live card rendered them */
  members: MarkMember[]
  /** Sticky per-member colors, index-aligned with members */
  memberColors: string[]
  /** Value unit for axis label and formatting ("" for cv) */
  unit: string
  /** Human labels for the persisted CSV payload */
  variableName: string
  viewLabel: string
  compareByLabel: string
  unitLabel: string
  source: "live" | "mock"
  /** Active water-year-type filter, e.g. "Dry; Critical" (absent = all years) */
  waterYearTypesLabel?: string
}

export interface CaptureDataInDepthResult {
  svg: string
  dataUrl: string
  chartData: DataChartDataShape
}

export async function captureDataInDepthOffscreen(
  input: CaptureDataInDepthInput,
): Promise<CaptureDataInDepthResult> {
  const { width, height } = CAPTURE_DIMENSIONS.data
  const fmt = (v: number) => formatValue(v, input.unit)
  const yLabel = input.view === "cv" ? "CV" : input.unit

  const { svg, dataUrl } = await offscreenCapture({
    theme: input.theme,
    width,
    height,
    captureKind: "data:offscreen",
    render: (onReady) => {
      if (input.view === "cv" || input.view === "value") {
        return (
          <CategoricalBarChartSnapshot
            bars={toBars(input.members, input.memberColors)}
            yAxisLabel={yLabel}
            formatValue={fmt}
            width={width}
            height={height}
            onReady={onReady}
          />
        )
      }
      if (input.distKind === "box") {
        return (
          <BoxPlotSnapshot
            boxes={toBoxes(input.members, input.memberColors)}
            whiskers="p10p90"
            yAxisLabel={yLabel}
            formatValue={fmt}
            width={width}
            height={height}
            onReady={onReady}
          />
        )
      }
      return (
        <ExceedanceChartSnapshot
          series={toSeries(input.members, input.memberColors)}
          yAxisLabel={yLabel}
          formatValue={fmt}
          width={width}
          height={height}
          onReady={onReady}
        />
      )
    },
  })

  const chartData: DataChartDataShape = {
    kind: "data",
    variableName: input.variableName,
    viewLabel: input.viewLabel,
    compareByLabel: input.compareByLabel,
    unitLabel: input.unitLabel,
    source: input.source,
    waterYearTypesLabel: input.waterYearTypesLabel,
    members: input.members.map((m) => ({
      label: m.label,
      series: m.series,
      waterYears: m.waterYears,
      isLive: m.isLive,
      stats: m.stats,
      value: m.value,
    })),
  }

  return { svg, dataUrl, chartData }
}

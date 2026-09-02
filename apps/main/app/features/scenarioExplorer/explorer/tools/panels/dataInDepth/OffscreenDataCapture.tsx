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

import React, { useEffect, useRef } from "react"
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
  buildStatsPanels,
  toBars,
  toBoxes,
  toSeries,
  type MarkMember,
  type StatsPanelSpec,
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
  source: "live" | "mock" | "mixed"
  /** Active water-year-type filter, e.g. "Dry; Critical" (absent = all years) */
  waterYearTypesLabel?: string
  /** Standardized figure title; persisted with the chart data so the share
   *  card heading and the CSV provenance block carry it */
  figureTitle: string
  /** Y-axis label as drawn on screen ("thousand acre feet (TAF)"); the
   *  bare unit is the fallback. */
  axisLabel?: string
  /** Year basis of the series; calendar-year series label their rows so. */
  yearBasis?: "water" | "calendar"
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
  const yLabel = input.view === "cv" ? "CV" : (input.axisLabel ?? input.unit)

  // Same rule the live card applies: a member whose scenario is not modeled
  // for this variable is recorded but never drawn, so the exported image can
  // never carry a fabricated curve the on-screen chart refused to draw.
  const plotted = input.members
    .map((m, i) => ({ member: m, color: input.memberColors[i] ?? "" }))
    .filter((p) => !p.member.liveDataMissing)
  const drawnMembers = plotted.map((p) => p.member)
  const drawnColors = plotted.map((p) => p.color)

  // The Stats style is a row of bar panels, not a single chart, so it
  // captures through the host's compose mode (the same path the resilience
  // small-multiples grid uses) and stitches every panel into one SVG.
  const isStatsComposite =
    input.distKind === "stats" && input.view !== "cv" && input.view !== "value"

  const { svg, dataUrl } = isStatsComposite
    ? await offscreenCapture({
        theme: input.theme,
        width,
        height,
        captureKind: "data:offscreen-stats",
        mode: "compose",
        backgroundColor: "#ffffff",
        render: (onReady) => (
          <StatsCompositeHost
            panels={buildStatsPanels(
              input.view,
              input.unit,
              input.axisLabel ?? input.unit,
            )}
            members={drawnMembers}
            memberColors={drawnColors}
            width={width}
            height={height}
            onReadyAll={onReady}
          />
        ),
      })
    : await offscreenCapture({
        theme: input.theme,
        width,
        height,
        captureKind: "data:offscreen",
        render: (onReady) => {
          if (input.view === "cv" || input.view === "value") {
            return (
              <CategoricalBarChartSnapshot
                bars={toBars(drawnMembers, drawnColors)}
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
                boxes={toBoxes(drawnMembers, drawnColors)}
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
              series={toSeries(drawnMembers, drawnColors)}
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
    figureTitle: input.figureTitle,
    yearBasis: input.yearBasis,
    // A member with no served data exports as a LABELED, EMPTY column, never
    // as the sample series the engine produced to fill the gap. Its water
    // years stay an empty array (not undefined) so the other members keep
    // their year-labeled rows instead of falling back to an index axis.
    members: input.members.map((m) => ({
      label: m.label,
      series: m.liveDataMissing ? [] : m.series,
      waterYears: m.liveDataMissing ? [] : m.waterYears,
      isLive: m.isLive,
      liveDataMissing: m.liveDataMissing,
      stats: m.stats,
      value: m.value,
    })),
  }

  return { svg, dataUrl, chartData }
}

interface StatsCompositeHostProps {
  panels: StatsPanelSpec[]
  members: MarkMember[]
  memberColors: string[]
  width: number
  height: number
  onReadyAll: () => void
}

const STATS_PANEL_GAP = 16

/**
 * Fixed-size row of one bar chart per Stats panel. Fires `onReadyAll` a
 * frame after EVERY panel has committed its first draw, so compose-mode
 * capture never serializes a half-painted row. Each panel labels its y-axis
 * with the panel caption, which is what the on-screen card shows above it,
 * so the stitched figure reads on its own.
 */
function StatsCompositeHost({
  panels,
  members,
  memberColors,
  width,
  height,
  onReadyAll,
}: StatsCompositeHostProps) {
  const readyCount = useRef(0)
  const fired = useRef(false)
  const panelCount = panels.length

  useEffect(() => {
    // A panel with no bars still mounts, draws its "no data" text and fires
    // its own ready callback, so an empty member list needs no special
    // handling. An empty PANEL list would render no children at all and
    // therefore never signal: resolve directly so the host cannot hang on a
    // capture that has nothing to wait for.
    if (panelCount > 0) return
    if (fired.current) return
    fired.current = true
    const id = requestAnimationFrame(() => onReadyAll())
    return () => cancelAnimationFrame(id)
  }, [panelCount, onReadyAll])

  const handlePanelReady = () => {
    readyCount.current += 1
    if (fired.current || readyCount.current < panelCount) return
    fired.current = true
    requestAnimationFrame(() => onReadyAll())
  }

  const panelWidth = Math.floor(
    (width - STATS_PANEL_GAP * (panelCount - 1)) / Math.max(panelCount, 1),
  )

  return (
    <div style={{ display: "flex", gap: STATS_PANEL_GAP, width, height }}>
      {panels.map((panel) => (
        <CategoricalBarChartSnapshot
          key={panel.key}
          bars={members.map((m, i) => ({
            id: m.id,
            label: m.label,
            value: panel.valueOf(m),
            color: memberColors[i] ?? "",
          }))}
          yAxisLabel={panel.title}
          formatValue={panel.format}
          width={panelWidth}
          height={height}
          onReady={handlePanelReady}
        />
      ))}
    </div>
  )
}

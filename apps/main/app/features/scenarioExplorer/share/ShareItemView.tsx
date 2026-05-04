"use client"

/**
 * ShareItemView
 *
 * Single dispatcher that maps a ShareItem variant to its presentation
 * card.
 *
 * Renders one of:
 *   barChart   -> ShareScenarioCard
 *   radar      -> ShareRadarCard (with optional live fallback)
 *   equity     -> ShareSnapshotCard
 *   resilience -> ResilienceShareCard
 *
 * The radar live fallback is built here from the supplied
 * radarLiveByHydro bundle so callers do not need to know how to wire
 * filtered data, axis display names, or per-scenario line colors.
 */

import React from "react"
import { useTheme } from "@repo/ui/mui"
import type { ShareItem } from "../store"
import type { ChartDataPoint } from "../../scenarios/components/shared/types"
import type { VerticalParallelLineData } from "@repo/viz"
import {
  OUTCOME_NAMES,
  getOutcomeName,
  type OutcomeCode,
} from "../../../content/outcomes"
import ShareScenarioCard from "./cards/ShareScenarioCard"
import ShareRadarCard from "./cards/ShareRadarCard"
import ShareSnapshotCard from "./cards/ShareSnapshotCard"
import ResilienceShareCard from "./cards/ResilienceShareCard"
import ShareRadarLiveChart from "./live/ShareRadarLiveChart"
import {
  normalizeShareRadarHydro,
  type ShareRadarHydroKey,
  type ShareRadarLiveDataFields,
} from "./utils/shareRadarLiveData"

export interface ShareItemScenarioInfo {
  name: string
  description: string
  definition: string
  shortLabel: string
}

export interface ShareItemViewProps {
  item: ShareItem
  outcomeNames: { shortCode: string; displayName: string }[]
  scenarioLookup: Map<string, ShareItemScenarioInfo>
  allChartData: Record<string, Record<string, unknown> | undefined>
  radarLiveByHydro: Record<ShareRadarHydroKey, ShareRadarLiveDataFields>
  onNoteChange?: (id: string, note: string) => void
  onRemove?: (id: string) => void
}

function outcomeCodesToLabels(codes: string[]): string[] {
  return codes.map((code) => OUTCOME_NAMES[code as OutcomeCode] ?? code)
}

/**
 * Build the live-radar fallback node when the share item has no
 * cached PNG. Filters the shared parallel-plot data down to the
 * item's scenarios, converts outcome codes back to display names,
 * and selects line colors from the item's captured palette
 * (preferred) or the current theme assignment.
 */
function renderRadarLiveChart(
  item: Extract<ShareItem, { type: "radar" }>,
  liveData: ShareRadarLiveDataFields,
  fallbackLineColor: string,
): React.ReactNode {
  const idSet = new Set(item.scenarioIds)
  const filtered = liveData.radarPlotData.filter((d) => idSet.has(d.id))
  if (filtered.length === 0) return null

  const orderedFiltered = item.scenarioIds
    .map((id) => filtered.find((d) => d.id === id))
    .filter((d): d is VerticalParallelLineData => !!d)

  const axesDisplay = item.axes.map((code) => getOutcomeName(code))

  const lineColors = orderedFiltered.map((d, i) => {
    const captured = item.scenarioColors?.[i]
    if (captured) return captured
    return (
      liveData.radarLineColorByScenario.get(d.id) ?? fallbackLineColor
    )
  })

  return (
    <ShareRadarLiveChart
      data={orderedFiltered}
      axes={axesDisplay}
      lineColors={lineColors}
      baselineData={liveData.radarBaseline}
      axisRange={liveData.radarAxisRange}
      showRadarRange={item.showRange}
      showTierZones={item.showTierZones !== false}
      highlightBaseline={item.highlightBaseline}
      showDotsOnly={item.showDotsOnly}
      morphGeneration={liveData.morphGeneration}
    />
  )
}

export default function ShareItemView({
  item,
  outcomeNames,
  scenarioLookup,
  allChartData,
  radarLiveByHydro,
  onNoteChange,
  onRemove,
}: ShareItemViewProps): React.ReactNode {
  const theme = useTheme()
  const noteHandler = onNoteChange
    ? (note: string) => onNoteChange(item.id, note)
    : undefined

  if (item.type === "barChart") {
    const info = scenarioLookup.get(item.scenarioId)
    const viewLabel =
      item.viewMode === "average"
        ? "Key outcomes average"
        : item.viewMode === "distribution"
          ? "Key outcomes distribution"
          : "Key outcomes bar chart"
    const chartData =
      (item.cachedChartData as Record<string, ChartDataPoint[]> | undefined) ??
      (allChartData[item.scenarioId] as
        | Record<string, ChartDataPoint[]>
        | undefined)
    return (
      <ShareScenarioCard
        scenarioId={item.id}
        name={info?.description ?? info?.name ?? item.scenarioId}
        scenarioDefinition={info?.definition}
        description={viewLabel}
        hydroclimate={item.hydroclimate}
        chartData={chartData}
        outcomeNames={outcomeNames}
        viewMode={item.viewMode}
        note={item.note}
        onNoteChange={noteHandler}
        onRemove={onRemove ? () => onRemove(item.id) : undefined}
      />
    )
  }

  if (item.type === "radar") {
    const names = item.scenarioIds.map(
      (id) =>
        scenarioLookup.get(id)?.description ??
        scenarioLookup.get(id)?.name ??
        id,
    )
    const definitions = item.scenarioIds.map(
      (id) => scenarioLookup.get(id)?.definition ?? "",
    )
    const radarLive =
      radarLiveByHydro[normalizeShareRadarHydro(item.hydroclimate)]
    const hasVisualCache = !!item.cachedSvg || !!item.cachedImageDataUrl
    const liveChart = hasVisualCache
      ? undefined
      : renderRadarLiveChart(item, radarLive, theme.palette.grey[600])
    return (
      <ShareRadarCard
        scenarioNames={names}
        scenarioDefinitions={definitions}
        scenarioColors={item.scenarioColors}
        hydroclimate={item.hydroclimate}
        showRange={item.showRange}
        showTierZones={item.showTierZones !== false}
        highlightBaseline={item.highlightBaseline}
        showDotsOnly={item.showDotsOnly}
        cachedSvg={item.cachedSvg}
        cachedImageDataUrl={item.cachedImageDataUrl}
        liveChart={liveChart}
        note={item.note}
        onNoteChange={noteHandler}
        onRemove={onRemove ? () => onRemove(item.id) : undefined}
      />
    )
  }

  if (item.type === "equity") {
    const info = scenarioLookup.get(item.scenarioId)
    return (
      <ShareSnapshotCard
        id={item.id}
        toolLabel="Distribution"
        title={info?.description ?? info?.name ?? item.scenarioId}
        subtitle={
          item.compareToBaseline
            ? "Compared to today's operations"
            : "Single scenario view"
        }
        chips={outcomeCodesToLabels(item.outcomeCodes)}
        hydroclimate={item.hydroclimate}
        cachedSvg={item.cachedSvg}
        cachedImageDataUrl={item.cachedImageDataUrl}
        note={item.note}
        onNoteChange={noteHandler}
        onRemove={onRemove}
      />
    )
  }

  if (item.type === "resilience") {
    return (
      <ResilienceShareCard
        item={item}
        scenarioLookup={scenarioLookup}
        onNoteChange={noteHandler}
        onRemove={onRemove}
      />
    )
  }

  return null
}

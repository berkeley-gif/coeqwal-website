"use client"

/**
 * useDataShareCapture - stages the Data-in-Depth explorer chart as a share
 * item (off-screen SVG/PNG capture + underlying-data payload for CSV).
 *
 * Called from ChartCard with the exact VariableData and sticky colors the
 * card rendered, so the capture is guaranteed to match the visible chart.
 * Side effects: appends one item to the workspace share store per call.
 */

import { axisLabelFor } from "../explorer/chartMarks"
import { useCallback, useMemo } from "react"
import { useTheme } from "@repo/ui/mui"
import { stageShareItem } from "../../../../share/stage"
import { useDataSlice, useWorkspaceSlice } from "../../../../store"
import { VIEW_LABELS, type VariableView } from "../config/variableRegistry"
import { WYT_LABELS } from "../config/wytFilter"
import { dataFigureTitle } from "./interpretiveText"
import { captureDataInDepthOffscreen } from "../OffscreenDataCapture"
import type { VariableData } from "./useVariableData"

const COMPARE_LABELS: Record<string, string> = {
  scenarios: "Scenarios",
  climates: "Climates",
  locations: "Locations",
}

export interface DataShareCapture {
  onSaveSnapshot: () => void
  canSnapshot: boolean
}

export function useDataShareCapture(
  data: VariableData,
  memberColors: string[],
): DataShareCapture {
  const theme = useTheme()
  const { addShareItem, hydroclimate } = useWorkspaceSlice()
  const {
    selectedVariableId,
    compareBy,
    distKind,
    pinnedClimate,
    selectedWaterYearTypes,
  } = useDataSlice()

  // Every chart style can be captured: the Stats style stitches its bar
  // panels into one composed SVG (see OffscreenDataCapture). The capture
  // needs at least one DRAWN member: when every compared scenario is
  // unmodeled for the variable the card shows a no-data message instead of a
  // chart, and capturing then would export panels the card never drew.
  const canSnapshot =
    data.members.some((m) => !m.liveDataMissing) &&
    !data.isLoading &&
    !data.unavailableReason

  const saveSnapshot = useCallback(async () => {
    if (data.members.length === 0) return
    const variableName = data.variable?.name ?? selectedVariableId
    // Same standardized title the on-screen card shows above the chart.
    const figureTitle = dataFigureTitle({
      variableName,
      figureTitleHead: data.variable?.figureTitleHead,
      compareBy,
      memberCount: data.members.length,
      firstMemberLabel: data.members[0]?.label,
      locationTitleName: data.locationTitleName,
      climateName: data.climateName,
      scenarioName: data.scenarioName,
      waterYearTypeLabels: data.wytApplicable
        ? selectedWaterYearTypes.map((c) => WYT_LABELS[c] ?? String(c))
        : null,
    })
    const viewLabel =
      data.variable?.viewLabels?.[data.view as VariableView] ??
      VIEW_LABELS[data.view as VariableView] ??
      data.view
    // Record the climate the chart was actually generated under: the pinned
    // (held) climate when one is set, except on the climates axis where the
    // members themselves are climates and the workspace value stands.
    const capturedHydroclimate =
      compareBy === "climates" ? hydroclimate : (pinnedClimate ?? hydroclimate)
    const waterYearTypesLabel = !data.wytApplicable
      ? "Not applicable"
      : selectedWaterYearTypes.length > 0
        ? selectedWaterYearTypes.map((c) => WYT_LABELS[c] ?? c).join("; ")
        : undefined
    await stageShareItem({
      capture: () =>
        captureDataInDepthOffscreen({
          theme,
          view: data.view,
          distKind,
          members: data.members,
          memberColors,
          unit: data.unit,
          variableName,
          viewLabel,
          compareByLabel: COMPARE_LABELS[compareBy] ?? compareBy,
          unitLabel: data.unitLabel,
          // A figure whose series do not share one provenance must not claim
          // one; the per-member Source column carries the detail.
          source: data.mixedSource ? "mixed" : data.source,
          waterYearTypesLabel,
          figureTitle,
          axisLabel: axisLabelFor(data.variable, data.view, data.unit),
          yearBasis: data.variable?.yearBasis,
        }),
      buildItem: (captured) => ({
        id: `data-${selectedVariableId}-${crypto.randomUUID()}`,
        type: "data",
        variableId: selectedVariableId,
        view: data.view,
        distKind,
        compareBy,
        memberIds: data.members.map((m) => m.id),
        memberLabels: data.members.map((m) => m.label),
        source: data.mixedSource ? "mixed" : data.source,
        hydroclimate: capturedHydroclimate,
        cachedSvg: captured?.svg,
        cachedImageDataUrl: captured?.dataUrl,
        cachedChartData: captured?.chartData as
          | Record<string, unknown>
          | undefined,
      }),
      addItem: addShareItem,
      errorLabel: "useDataShareCapture.captureDataInDepthOffscreen",
    })
  }, [
    data,
    memberColors,
    theme,
    selectedVariableId,
    compareBy,
    distKind,
    pinnedClimate,
    selectedWaterYearTypes,
    hydroclimate,
    addShareItem,
  ])

  return useMemo(
    (): DataShareCapture => ({
      onSaveSnapshot: () => void saveSnapshot(),
      canSnapshot,
    }),
    [saveSnapshot, canSnapshot],
  )
}

"use client"

/**
 * ResilienceControls store facade: READ + WRITE wiring.
 *
 * Subscribes to flat `resilience*` fields, builds a controls snapshot (READ),
 * and exposes writeControlsChange (WRITE). Pivot planning lives in
 * controls/planPivotChange.ts and is used directly by ResilienceControls.
 */

import { useMemo } from "react"
import { useExplorerStore } from "../../../store"
import { readControlsSnapshot, writeControlsChange } from "./controls"

export function useResilienceControlsWriter() {
  const view = useExplorerStore((s) => s.resilienceView)
  const cellEncoding = useExplorerStore((s) => s.resilienceCellEncoding)
  const deltaMode = useExplorerStore((s) => s.resilienceDeltaMode)
  const deltaBaselineScenarioId = useExplorerStore(
    (s) => s.resilienceDeltaBaselineScenarioId,
  )
  const aggregateScope = useExplorerStore((s) => s.resilienceAggregateScope)
  const reorderBySimilarity = useExplorerStore(
    (s) => s.resilienceReorderBySimilarity,
  )
  const showMarginals = useExplorerStore((s) => s.resilienceShowMarginals)
  const showAllScenarios = useExplorerStore((s) => s.resilienceShowAllScenarios)
  const selectedHydroclimates = useExplorerStore(
    (s) => s.resilienceSelectedHydroclimates,
  )
  const showCellNumbers = useExplorerStore((s) => s.resilienceShowCellNumbers)
  const primaryOutcomeCode = useExplorerStore(
    (s) => s.resiliencePrimaryOutcomeCode,
  )
  const compareOutcomeCodes = useExplorerStore(
    (s) => s.resilienceCompareOutcomeCodes,
  )
  const expandedRegionalOutcomes = useExplorerStore(
    (s) => s.resilienceExpandedRegionalOutcomes,
  )
  const transposed = useExplorerStore((s) => s.resilienceTransposed)
  const aggregateOver = useExplorerStore((s) => s.resilienceAggregateOver)

  /** READ: current controls as one object (for presets and planPivotPatch) */
  const controlsSnapshot = useMemo(
    () =>
      readControlsSnapshot({
        resilienceView: view,
        resilienceCellEncoding: cellEncoding,
        resilienceDeltaMode: deltaMode,
        resilienceDeltaBaselineScenarioId: deltaBaselineScenarioId,
        resilienceAggregateScope: aggregateScope,
        resilienceReorderBySimilarity: reorderBySimilarity,
        resilienceShowMarginals: showMarginals,
        resilienceShowAllScenarios: showAllScenarios,
        resilienceSelectedHydroclimates: selectedHydroclimates,
        resilienceShowCellNumbers: showCellNumbers,
        resiliencePrimaryOutcomeCode: primaryOutcomeCode,
        resilienceCompareOutcomeCodes: compareOutcomeCodes,
        resilienceExpandedRegionalOutcomes: expandedRegionalOutcomes,
        resilienceTransposed: transposed,
        resilienceAggregateOver: aggregateOver,
      }),
    [
      view,
      cellEncoding,
      deltaMode,
      deltaBaselineScenarioId,
      aggregateScope,
      reorderBySimilarity,
      showMarginals,
      showAllScenarios,
      selectedHydroclimates,
      showCellNumbers,
      primaryOutcomeCode,
      compareOutcomeCodes,
      expandedRegionalOutcomes,
      transposed,
      aggregateOver,
    ],
  )

  return {
    view,
    cellEncoding,
    deltaMode,
    selectedHydroclimates,
    primaryOutcomeCode,
    compareOutcomeCodes,
    aggregateOver,
    transposed,
    reorderBySimilarity,
    showCellNumbers,
    controlsSnapshot,
    writeChange: writeControlsChange,
  }
}

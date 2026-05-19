"use client"

/**
 * ResilienceControls store facade: READ + WRITE wiring.
 *
 * Subscribes to flat `resilience*` fields, builds a controls snapshot (READ),
 * and exposes writeControlsChange (WRITE). Pivot planning lives in
 * controls/planPivotChange.ts and is used directly by ResilienceControls.
 */

import { useMemo } from "react"
import { useResilienceSlice } from "../../../store"
import { readControlsSnapshot, writeControlsChange } from "./controls"

export function useResilienceControlsWriter() {
  const {
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
  } = useResilienceSlice()

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

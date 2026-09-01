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
    resilienceShowAllScenarios: showAllScenarios,
    resilienceSelectedHydroclimates: selectedHydroclimates,
    resilienceShowCellNumbers: showCellNumbers,
    resiliencePrimaryOutcomeCode: primaryOutcomeCode,
    resilienceCompareOutcomeCodes: compareOutcomeCodes,
    resilienceTransposed: transposed,
  } = useResilienceSlice()

  /** READ: current controls as one object (for presets and planPivotPatch) */
  const controlsSnapshot = useMemo(
    () =>
      readControlsSnapshot({
        resilienceView: view,
        resilienceCellEncoding: cellEncoding,
        resilienceDeltaMode: deltaMode,
        resilienceDeltaBaselineScenarioId: deltaBaselineScenarioId,
        resilienceShowAllScenarios: showAllScenarios,
        resilienceSelectedHydroclimates: selectedHydroclimates,
        resilienceShowCellNumbers: showCellNumbers,
        resiliencePrimaryOutcomeCode: primaryOutcomeCode,
        resilienceCompareOutcomeCodes: compareOutcomeCodes,
        resilienceTransposed: transposed,
      }),
    [
      view,
      cellEncoding,
      deltaMode,
      deltaBaselineScenarioId,
      showAllScenarios,
      selectedHydroclimates,
      showCellNumbers,
      primaryOutcomeCode,
      compareOutcomeCodes,
      transposed,
    ],
  )

  return {
    view,
    cellEncoding,
    deltaMode,
    selectedHydroclimates,
    primaryOutcomeCode,
    compareOutcomeCodes,
    transposed,
    showCellNumbers,
    controlsSnapshot,
    writeChange: writeControlsChange,
  }
}

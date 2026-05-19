/**
 * Resilience slice - Resilience heatmap tool session state
 *
 * So many settings! This tool needs clarity and simplification.
 */

import { OUTCOME_CODE_ORDER } from "../../../../content/outcomes"
import { PRIMARY_SCENARIO_BASELINE_ID } from "../../utils/scenarioIdSort"
import {
  RESILIENCE_HYDROCLIMATES,
  type ResilienceHydroclimate,
} from "../tools/panels/resilience/useResilienceMatrix"
import type { ResilienceControlsState } from "./resilienceTypes"

export type { ResilienceControlsState } from "./resilienceTypes"
export type {
  ResilienceView,
  AggregateOver,
  CellEncoding,
  DeltaMode,
  AggregateScope,
} from "./resilienceTypes"

/** Default resilience chart controls (flat store fields use these values on mount) */
export const DEFAULT_RESILIENCE_CONTROLS: ResilienceControlsState = {
  view: "aggregate",
  cellEncoding: "tier",
  deltaMode: "none",
  deltaBaselineScenarioId: PRIMARY_SCENARIO_BASELINE_ID,
  aggregateScope: "all",
  reorderBySimilarity: false,
  showMarginals: false,
  showAllScenarios: false,
  selectedHydroclimates: new Set(RESILIENCE_HYDROCLIMATES),
  showCellNumbers: false,
  primaryOutcomeCode: null,
  compareOutcomeCodes: [],
  expandedRegionalOutcomes: [],
  transposed: false,
  aggregateOver: "scenarios",
}

export interface ResilienceState {
  showResilienceOutcomeSelector: boolean
  resilienceVisibleOutcomes: string[]
  resilienceDistributionMode: "scenario" | "location"

  resilienceView: ResilienceControlsState["view"]
  resilienceCellEncoding: ResilienceControlsState["cellEncoding"]
  resilienceDeltaMode: ResilienceControlsState["deltaMode"]
  resilienceDeltaBaselineScenarioId: string
  resilienceAggregateScope: ResilienceControlsState["aggregateScope"]
  resilienceReorderBySimilarity: boolean
  resilienceShowMarginals: boolean
  resilienceShowAllScenarios: boolean
  resilienceSelectedHydroclimates: ReadonlySet<ResilienceHydroclimate>
  resilienceShowCellNumbers: boolean
  resiliencePrimaryOutcomeCode: string | null
  resilienceCompareOutcomeCodes: string[]
  resilienceExpandedRegionalOutcomes: string[]
  resilienceTransposed: boolean
  resilienceAggregateOver: ResilienceControlsState["aggregateOver"]
}

export interface ResilienceActions {
  setShowResilienceOutcomeSelector: (show: boolean) => void
  toggleResilienceOutcome: (code: string) => void
  setResilienceVisibleOutcomes: (codes: string[]) => void
  setResilienceDistributionMode: (mode: "scenario" | "location") => void

  setResilienceView: (view: ResilienceControlsState["view"]) => void
  setResilienceCellEncoding: (
    encoding: ResilienceControlsState["cellEncoding"],
  ) => void
  setResilienceDeltaMode: (mode: ResilienceControlsState["deltaMode"]) => void
  setResilienceDeltaBaselineScenarioId: (scenarioId: string) => void
  setResilienceAggregateScope: (
    scope: ResilienceControlsState["aggregateScope"],
  ) => void
  setResilienceReorderBySimilarity: (value: boolean) => void
  setResilienceShowMarginals: (show: boolean) => void
  setResilienceShowAllScenarios: (show: boolean) => void
  setResilienceSelectedHydroclimates: (
    climates: ReadonlySet<ResilienceHydroclimate>,
  ) => void
  setResilienceShowCellNumbers: (show: boolean) => void
  setResiliencePrimaryOutcomeCode: (code: string | null) => void
  setResilienceCompareOutcomeCodes: (codes: string[]) => void
  setResilienceExpandedRegionalOutcomes: (codes: string[]) => void
  setResilienceTransposed: (transposed: boolean) => void
  setResilienceAggregateOver: (
    aggregateOver: ResilienceControlsState["aggregateOver"],
  ) => void
}

export type ResilienceSlice = ResilienceState & ResilienceActions

export const resilienceInitialState: ResilienceState = {
  showResilienceOutcomeSelector: false,
  resilienceVisibleOutcomes: [...OUTCOME_CODE_ORDER],
  resilienceDistributionMode: "scenario",
  resilienceView: DEFAULT_RESILIENCE_CONTROLS.view,
  resilienceCellEncoding: DEFAULT_RESILIENCE_CONTROLS.cellEncoding,
  resilienceDeltaMode: DEFAULT_RESILIENCE_CONTROLS.deltaMode,
  resilienceDeltaBaselineScenarioId:
    DEFAULT_RESILIENCE_CONTROLS.deltaBaselineScenarioId,
  resilienceAggregateScope: DEFAULT_RESILIENCE_CONTROLS.aggregateScope,
  resilienceReorderBySimilarity:
    DEFAULT_RESILIENCE_CONTROLS.reorderBySimilarity,
  resilienceShowMarginals: DEFAULT_RESILIENCE_CONTROLS.showMarginals,
  resilienceShowAllScenarios: DEFAULT_RESILIENCE_CONTROLS.showAllScenarios,
  resilienceSelectedHydroclimates: new Set(
    DEFAULT_RESILIENCE_CONTROLS.selectedHydroclimates,
  ),
  resilienceShowCellNumbers: DEFAULT_RESILIENCE_CONTROLS.showCellNumbers,
  resiliencePrimaryOutcomeCode: DEFAULT_RESILIENCE_CONTROLS.primaryOutcomeCode,
  resilienceCompareOutcomeCodes: [
    ...DEFAULT_RESILIENCE_CONTROLS.compareOutcomeCodes,
  ],
  resilienceExpandedRegionalOutcomes: [
    ...DEFAULT_RESILIENCE_CONTROLS.expandedRegionalOutcomes,
  ],
  resilienceTransposed: DEFAULT_RESILIENCE_CONTROLS.transposed,
  resilienceAggregateOver: DEFAULT_RESILIENCE_CONTROLS.aggregateOver,
}

export type ResilienceControlFields = Pick<
  ResilienceState,
  | "resilienceView"
  | "resilienceCellEncoding"
  | "resilienceDeltaMode"
  | "resilienceDeltaBaselineScenarioId"
  | "resilienceAggregateScope"
  | "resilienceReorderBySimilarity"
  | "resilienceShowMarginals"
  | "resilienceShowAllScenarios"
  | "resilienceSelectedHydroclimates"
  | "resilienceShowCellNumbers"
  | "resiliencePrimaryOutcomeCode"
  | "resilienceCompareOutcomeCodes"
  | "resilienceExpandedRegionalOutcomes"
  | "resilienceTransposed"
  | "resilienceAggregateOver"
>

/** One-shot assembly for share callbacks (`getState()`). Do not use as a selector */
export function selectResilienceControls(
  state: ResilienceControlFields,
): ResilienceControlsState {
  return {
    view: state.resilienceView,
    cellEncoding: state.resilienceCellEncoding,
    deltaMode: state.resilienceDeltaMode,
    deltaBaselineScenarioId: state.resilienceDeltaBaselineScenarioId,
    aggregateScope: state.resilienceAggregateScope,
    reorderBySimilarity: state.resilienceReorderBySimilarity,
    showMarginals: state.resilienceShowMarginals,
    showAllScenarios: state.resilienceShowAllScenarios,
    selectedHydroclimates: state.resilienceSelectedHydroclimates,
    showCellNumbers: state.resilienceShowCellNumbers,
    primaryOutcomeCode: state.resiliencePrimaryOutcomeCode,
    compareOutcomeCodes: state.resilienceCompareOutcomeCodes,
    expandedRegionalOutcomes: state.resilienceExpandedRegionalOutcomes,
    transposed: state.resilienceTransposed,
    aggregateOver: state.resilienceAggregateOver,
  }
}

/** Used by ResilienceControls partial-update helper, not the primary store API */
export function applyResilienceControlsPatch(
  state: ResilienceState,
  patch: Partial<ResilienceControlsState>,
): void {
  if (patch.view !== undefined) state.resilienceView = patch.view
  if (patch.cellEncoding !== undefined) {
    state.resilienceCellEncoding = patch.cellEncoding
  }
  if (patch.deltaMode !== undefined) state.resilienceDeltaMode = patch.deltaMode
  if (patch.deltaBaselineScenarioId !== undefined) {
    state.resilienceDeltaBaselineScenarioId = patch.deltaBaselineScenarioId
  }
  if (patch.aggregateScope !== undefined) {
    state.resilienceAggregateScope = patch.aggregateScope
  }
  if (patch.reorderBySimilarity !== undefined) {
    state.resilienceReorderBySimilarity = patch.reorderBySimilarity
  }
  if (patch.showMarginals !== undefined) {
    state.resilienceShowMarginals = patch.showMarginals
  }
  if (patch.showAllScenarios !== undefined) {
    state.resilienceShowAllScenarios = patch.showAllScenarios
  }
  if (patch.selectedHydroclimates !== undefined) {
    state.resilienceSelectedHydroclimates = patch.selectedHydroclimates
  }
  if (patch.showCellNumbers !== undefined) {
    state.resilienceShowCellNumbers = patch.showCellNumbers
  }
  if (patch.primaryOutcomeCode !== undefined) {
    state.resiliencePrimaryOutcomeCode = patch.primaryOutcomeCode
  }
  if (patch.compareOutcomeCodes !== undefined) {
    state.resilienceCompareOutcomeCodes = patch.compareOutcomeCodes
  }
  if (patch.expandedRegionalOutcomes !== undefined) {
    state.resilienceExpandedRegionalOutcomes = patch.expandedRegionalOutcomes
  }
  if (patch.transposed !== undefined) {
    state.resilienceTransposed = patch.transposed
  }
  if (patch.aggregateOver !== undefined) {
    state.resilienceAggregateOver = patch.aggregateOver
  }
}

type ImmerSet = (fn: (state: ResilienceSlice) => void) => void

export function createResilienceSlice(set: ImmerSet): ResilienceSlice {
  return {
    ...resilienceInitialState,

    setShowResilienceOutcomeSelector: (show) =>
      set((state) => {
        state.showResilienceOutcomeSelector = show
      }),

    toggleResilienceOutcome: (code) =>
      set((state) => {
        const idx = state.resilienceVisibleOutcomes.indexOf(code)
        if (idx >= 0) {
          state.resilienceVisibleOutcomes.splice(idx, 1)
        } else {
          state.resilienceVisibleOutcomes.push(code)
        }
      }),

    setResilienceVisibleOutcomes: (codes) =>
      set((state) => {
        state.resilienceVisibleOutcomes = codes
      }),

    setResilienceDistributionMode: (mode) =>
      set((state) => {
        state.resilienceDistributionMode = mode
      }),

    setResilienceView: (view) =>
      set((state) => {
        state.resilienceView = view
      }),

    setResilienceCellEncoding: (encoding) =>
      set((state) => {
        state.resilienceCellEncoding = encoding
      }),

    setResilienceDeltaMode: (mode) =>
      set((state) => {
        state.resilienceDeltaMode = mode
      }),

    setResilienceDeltaBaselineScenarioId: (scenarioId) =>
      set((state) => {
        state.resilienceDeltaBaselineScenarioId = scenarioId
      }),

    setResilienceAggregateScope: (scope) =>
      set((state) => {
        state.resilienceAggregateScope = scope
      }),

    setResilienceReorderBySimilarity: (value) =>
      set((state) => {
        state.resilienceReorderBySimilarity = value
      }),

    setResilienceShowMarginals: (show) =>
      set((state) => {
        state.resilienceShowMarginals = show
      }),

    setResilienceShowAllScenarios: (show) =>
      set((state) => {
        state.resilienceShowAllScenarios = show
      }),

    setResilienceSelectedHydroclimates: (climates) =>
      set((state) => {
        state.resilienceSelectedHydroclimates = climates
      }),

    setResilienceShowCellNumbers: (show) =>
      set((state) => {
        state.resilienceShowCellNumbers = show
      }),

    setResiliencePrimaryOutcomeCode: (code) =>
      set((state) => {
        state.resiliencePrimaryOutcomeCode = code
      }),

    setResilienceCompareOutcomeCodes: (codes) =>
      set((state) => {
        state.resilienceCompareOutcomeCodes = codes
      }),

    setResilienceExpandedRegionalOutcomes: (codes) =>
      set((state) => {
        state.resilienceExpandedRegionalOutcomes = codes
      }),

    setResilienceTransposed: (transposed) =>
      set((state) => {
        state.resilienceTransposed = transposed
      }),

    setResilienceAggregateOver: (aggregateOver) =>
      set((state) => {
        state.resilienceAggregateOver = aggregateOver
      }),
  }
}

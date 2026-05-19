import type { ResilienceHydroclimate } from "../tools/panels/resilience/resilienceHydroclimates"

export type ResilienceView =
  | "scenario"
  | "outcome"
  | "hydroclimate"
  | "aggregate"

export type AggregateOver = "scenarios" | "outcomes" | "hydroclimates"

export type CellEncoding =
  | "tier"
  | "delta"
  | "density_opp"
  | "glyph"
  | "distribution"
  | "leverage"

export type DeltaMode = "none" | "vs_historical" | "vs_baseline"

export type AggregateScope = "all" | "selected"

export interface ResilienceControlsState {
  view: ResilienceView
  cellEncoding: CellEncoding
  deltaMode: DeltaMode
  deltaBaselineScenarioId: string
  aggregateScope: AggregateScope
  reorderBySimilarity: boolean
  showMarginals: boolean
  showAllScenarios: boolean
  selectedHydroclimates: ReadonlySet<ResilienceHydroclimate>
  showCellNumbers: boolean
  primaryOutcomeCode: string | null
  compareOutcomeCodes: string[]
  expandedRegionalOutcomes: string[]
  transposed: boolean
  aggregateOver: AggregateOver
}

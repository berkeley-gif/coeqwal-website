// Scenario domain hooks
export {
  useScenarioTiers,
  useMultipleScenarioTiers,
  useOutcomeDefinitions,
  useOutcomeTierData,
  type OutcomeScoreData,
} from "./useTierData"

// Re-export outcome constants for convenience
export { OUTCOME_CODE_ORDER, getOutcomeName } from "../../../content/outcomes"

export {
  useScenarioSummary,
  useMultipleScenarioSummaries,
  type ScenarioSummaryData,
  type UseScenarioSummaryReturn,
} from "./useScenarioSummary"

export { useScenarioList, type ScenarioListItem } from "./useScenarioList"

export {
  useResolvedIdMapping,
  useResolvedIdMappings,
  type ResolvedIdMapping,
} from "./useResolvedIdMapping"

export {
  useHydroclimateAvailability,
  type HydroclimateAvailability,
} from "./useHydroclimateAvailability"

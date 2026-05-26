/**
 * COEQWAL React hooks
 *
 * Atomic hooks for fetching COEQWAL API data with SWR caching.
 *
 * @example
 * ```typescript
 * import { useTiers, useScenarios, useScenarioTiers } from "@repo/data/coeqwal/hooks"
 *
 * function MyComponent() {
 *   const { tiers, isLoading: tiersLoading } = useTiers()
 *   const { scenarios } = useScenarios()
 *   const { data: tierData } = useScenarioTiers("s0020")
 *   // ...
 * }
 * ```
 */

export { useTiers } from "./useTiers"
export { useTierMapping, mapShortCodeToDisplayName } from "./useTierMapping"
export { useScenarios } from "./useScenarios"
export { useScenarioTiers } from "./useScenarioTiers"
export {
  useAllReservoirsList,
  useReservoirPercentiles,
  useAllReservoirPercentiles,
  useGroupedReservoirPercentiles,
  useSpillMonthly,
  useMultipleReservoirPercentiles,
} from "./useReservoirPercentiles"
export {
  useMiContractorsMonthly,
  useMiContractorsPeriod,
  useDemandUnitsList,
  useDemandUnitsMonthly,
  useDemandUnitsShortageMonthly,
  useDemandUnitsPeriod,
} from "./useCwsStatistics"
export {
  useAgDemandUnitsList,
  useAgDemandUnitsDeliveryMonthly,
  useAgDemandUnitsShortageMonthly,
  useAgDemandUnitsPeriod,
} from "./useAgStatistics"
export {
  useBatchStatistics,
  getStorageForScenario,
  getCwsForScenario,
  getAgForScenario,
  getEnvFlowForScenario,
} from "./useBatchStatistics"
export {
  useRefugeDemandUnitsList,
  useRefugeDusDeliveryMonthly,
  useRefugeDusShortageMonthly,
  useRefugeDusPeriod,
} from "./useRefugeStatistics"
export { useChannelsList } from "./useEnvFlowStatistics"
export { useDeltaMonthly } from "./useDeltaStatistics"
export { useTierLocationAssignments } from "./useTierLocationAssignments"
export { useTierLocationAssignmentsBatch } from "./useTierLocationAssignmentsBatch"

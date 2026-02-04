/**
 * COEQWAL API utilities
 *
 * This module provides everything needed to interact with the COEQWAL API:
 * - Type definitions for API responses
 * - Fetch functions for direct API calls
 * - React hooks with SWR caching
 *
 * ## Usage
 *
 * ```typescript
 * // Types
 * import type { TierListItem, ScenarioTiersResponse } from "@repo/data/coeqwal"
 *
 * // Fetch functions (for server components or non-React code)
 * import { fetchTierList, fetchScenarioTiers } from "@repo/data/coeqwal"
 *
 * // React hooks (for client components)
 * import { useTiers, useTierMapping, useScenarios } from "@repo/data/coeqwal/hooks"
 * ```
 */

// Types
export type {
  TierListItem,
  MultiValueTierData,
  MultiValueTier,
  TierScores,
  TierInfo,
  ScenarioTiersResponse,
  ScenarioListItem,
  TierMapping,
  TierFeature,
  TierLocationResponse,
  // Statistics types
  ReservoirInfo,
  AllReservoirInfo,
  StatisticsScenarioInfo,
  PercentileValues,
  MonthlyPercentiles,
  ReservoirPercentiles,
  AllReservoirPercentilesResponse,
  GroupedReservoirData,
  GroupedReservoirPercentilesResponse,
  ReservoirListResponse,
  AllReservoirsListResponse,
  StatisticsScenariosResponse,
  // Storage monthly types (dual-unit)
  StorageMonthlyReservoirData,
  StorageMonthlyResponse,
  // Spill monthly types
  SpillMonthlyStats,
  MonthlySpillData,
  SpillMonthlyReservoirData,
  SpillMonthlyResponse,
  // CWS Aggregate types (M&I delivery/shortage)
  CwsAggregate,
  CwsAggregatesListResponse,
  CwsDeliveryMonthlyStats,
  CwsShortageMonthlyStats,
  CwsAggregateData,
  CwsAggregateMonthlyResponse,
  CwsAggregatePeriodSummary,
  CwsAggregatePeriodResponse,
  // M&I Contractors types
  MiContractor,
  MiContractorsListResponse,
  MiContractorData,
  MiContractorMonthlyResponse,
  MiContractorPeriodSummary,
  MiContractorPeriodResponse,
  // Urban Demand Units types
  DemandUnit,
  DemandUnitsListResponse,
  DemandUnitsGroupedResponse,
  DemandUnitData,
  DemandUnitMonthlyResponse,
  DemandUnitPeriodSummary,
  DemandUnitPeriodResponse,
  DemandUnitMonthlyStats,
  DemandUnitStatisticsResponse,
} from "./types"

// API constants
export { DEFAULT_API_BASE, ENDPOINTS } from "./api"

// Fetch functions
export {
  fetchTierList,
  fetchScenarioTiers,
  fetchScenarioList,
  fetchAllScenarioTiers,
  fetchTierLocationData,
  // Statistics fetchers
  fetchReservoirList,
  fetchAllReservoirsList,
  fetchScenariosWithPercentiles,
  fetchReservoirPercentiles,
  fetchAllReservoirPercentiles,
  fetchGroupedReservoirPercentiles,
  fetchStorageMonthly,
  fetchSpillMonthly,
  // CWS Aggregate fetchers
  fetchCwsAggregatesList,
  fetchCwsAggregatesMonthly,
  fetchCwsAggregatesPeriod,
  // M&I Contractors fetchers
  fetchMiContractorsList,
  fetchMiContractorsMonthly,
  fetchMiContractorsPeriod,
  // Urban Demand Units fetchers
  fetchDemandUnitsList,
  fetchDemandUnitsGroups,
  fetchDemandUnitStatistics,
  fetchDemandUnitsMonthly,
  fetchDemandUnitsPeriod,
} from "./fetchers"

// Re-export hooks for convenience
export * from "./hooks"

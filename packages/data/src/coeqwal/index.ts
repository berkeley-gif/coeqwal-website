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
  TierLocationAssignment,
  TierLocationAssignmentsResponse,
  TierLocationAssignmentsBatchResponse,
  // Statistics types
  AllReservoirInfo,
  PercentileValues,
  MonthlyPercentiles,
  ReservoirPercentiles,
  AllReservoirPercentilesResponse,
  GroupedReservoirData,
  GroupedReservoirPercentilesResponse,
  AllReservoirsListResponse,
  // Spill monthly types
  SpillMonthlyStats,
  MonthlySpillData,
  SpillMonthlyReservoirData,
  SpillMonthlyResponse,
  // CWS Aggregate types (M&I delivery/shortage, served via batch endpoint)
  CwsDeliveryMonthlyStats,
  CwsShortageMonthlyStats,
  CwsAggregateData,
  CwsAggregateMonthlyResponse,
  CwsAggregatePeriodSummary,
  CwsAggregatePeriodResponse,
  // M&I Contractors types
  MiContractorData,
  MiContractorMonthlyResponse,
  MiContractorPeriodSummary,
  MiContractorPeriodResponse,
  // Urban Demand Units types
  DemandUnit,
  DemandUnitsListResponse,
  DemandUnitData,
  DemandUnitMonthlyResponse,
  DemandUnitShortageData,
  DemandUnitShortageMonthlyResponse,
  DemandUnitPeriodSummary,
  DemandUnitPeriodResponse,
  DemandUnitMonthlyStats,
  // AG Aggregate types (served via batch endpoint)
  AgAggregateData,
  AgAggregateMonthlyResponse,
  AgAggregatePeriodSummary,
  AgAggregatePeriodResponse,
  // AG Demand Unit types
  AgDemandUnitListItem,
  AgDemandUnitsListResponse,
  AgDemandUnitDeliveryData,
  AgDemandUnitDeliveryMonthlyResponse,
  AgDemandUnitShortageMonthlyStats,
  AgDemandUnitShortageData,
  AgDemandUnitShortageMonthlyResponse,
  AgDemandUnitPeriodSummary,
  AgDemandUnitPeriodResponse,
  // Batch statistics types
  BatchStorageData,
  BatchCwsData,
  BatchAgData,
  BatchEnvFlowData,
  BatchStatisticsResponse,
  // Wildlife Refuge types
  RefugeDemandUnitData,
  RefugeDemandUnitsListResponse,
  RefugeDeliveryMonthlyStats,
  RefugeDeliveryMonthlyResponse,
  RefugeShortageMonthlyStats,
  RefugeShortageMonthlyResponse,
  RefugePeriodSummary,
  RefugePeriodResponse,
  // Environmental flow types
  ChannelEntity,
  ChannelsListResponse,
  ChannelMonthlyStats,
  ChannelsMonthlyResponse,
  ChannelSeasonalStats,
  ChannelsSeasonalResponse,
  ChannelPeriodSummary,
  ChannelsPeriodSummaryResponse,
  // Delta statistics types
  DeltaMonthlyStats,
  DeltaMonthlyResponse,
} from "./types"

// API constants
export { DEFAULT_API_BASE, ENDPOINTS } from "./api"

// Fetch functions
export {
  fetchTierList,
  fetchScenarioTiers,
  fetchScenarioList,
  fetchAllScenarioTiers,
  fetchTierLocationAssignments,
  fetchTierLocationAssignmentsBatch,
  // Statistics fetchers
  fetchAllReservoirsList,
  fetchReservoirPercentiles,
  fetchAllReservoirPercentiles,
  fetchGroupedReservoirPercentiles,
  fetchSpillMonthly,
  // M&I Contractors fetchers
  fetchMiContractorsMonthly,
  fetchMiContractorsPeriod,
  // Urban Demand Units fetchers
  fetchDemandUnitsList,
  fetchDemandUnitsMonthly,
  fetchDemandUnitsShortageMonthly,
  fetchDemandUnitsPeriod,
  // AG fetchers
  fetchAgDemandUnitsList,
  fetchAgDemandUnitsDeliveryMonthly,
  fetchAgDemandUnitsShortageMonthly,
  fetchAgDemandUnitsPeriod,
  // Batch statistics fetcher
  fetchBatchStatistics,
  // Environmental flow fetcher
  fetchChannelsList,
  // Delta fetchers
  fetchDeltaMonthly,
} from "./fetchers"

// Re-export hooks for convenience
export * from "./hooks"

// Regional tier means (NOD / SOD) sourced from the dashboard dataset.
export {
  getRegionalTierMean,
  hasRegionalCoverage,
  getRegionalTierMeansData,
} from "./regional"
export type {
  RegionalHydroclimate,
  RegionalOutcomeCode,
  RegionalTierMeans,
} from "./regional"

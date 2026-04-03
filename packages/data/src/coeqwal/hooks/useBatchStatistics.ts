"use client"

/**
 * Hook for batch-fetching statistics data for multiple scenarios
 *
 * This hook dramatically improves Data Explorer load time by fetching
 * storage, CWS, and AG data in a single request instead of N×M requests.
 */

import useSWR from "swr"
import { CACHE_KEYS } from "../../cache/keys"
import { fetchBatchStatistics } from "../fetchers"
import type {
  BatchStatisticsResponse,
  BatchStorageData,
  BatchCwsData,
  BatchAgData,
} from "../types"

export type DataType = "storage" | "cws" | "ag"

interface UseBatchStatisticsOptions {
  /** Data types to fetch (default: all) */
  types?: DataType[]
  /** Whether to fetch data (default: true) */
  enabled?: boolean
}

interface UseBatchStatisticsReturn {
  /** Raw batch response data */
  data: BatchStatisticsResponse | undefined
  /** Storage data by scenario ID */
  storage: Record<string, BatchStorageData> | undefined
  /** CWS data by scenario ID */
  cws: Record<string, BatchCwsData> | undefined
  /** AG data by scenario ID */
  ag: Record<string, BatchAgData> | undefined
  /** Whether data is loading */
  isLoading: boolean
  /** Whether any data has been fetched */
  isValidating: boolean
  /** Error message if fetch failed */
  error: string | null
  /** Refetch the data */
  mutate: () => void
}

/**
 * Fetch batch statistics for multiple scenarios
 *
 * This hook combines storage, CWS, and AG data into a single request,
 * dramatically improving Data Explorer performance.
 *
 * @param scenarios - Array of scenario IDs to fetch
 * @param options - Optional configuration
 * @returns Batch statistics with loading/error states
 *
 * @example
 * ```typescript
 * function DataExplorer({ selectedScenarios }) {
 *   const { storage, cws, ag, isLoading, error } = useBatchStatistics(selectedScenarios)
 *
 *   if (isLoading) return <Loading />
 *   if (error) return <Error message={error} />
 *
 *   // Access storage data for scenario s0020
 *   const storageData = storage?.["s0020"]
 *
 *   // Access CWS monthly data for scenario s0020
 *   const cwsMonthly = cws?.["s0020"]?.monthly
 * }
 * ```
 */
export function useBatchStatistics(
  scenarios: string[],
  options: UseBatchStatisticsOptions = {},
): UseBatchStatisticsReturn {
  const { types = ["storage", "cws", "ag"], enabled = true } = options

  // Only fetch if we have scenarios and enabled
  const shouldFetch = enabled && scenarios.length > 0

  // Create a stable cache key
  const cacheKey = shouldFetch
    ? CACHE_KEYS.batchStatistics(scenarios, types)
    : null

  const {
    data,
    error: swrError,
    isLoading,
    isValidating,
    mutate,
  } = useSWR<BatchStatisticsResponse>(
    cacheKey,
    () => fetchBatchStatistics(scenarios, types),
    {
      revalidateOnFocus: false,
      // When scenarios change the cache key changes, so fresh data is fetched
      // automatically.no need to suppress deduplication.
      revalidateOnReconnect: true,
    },
  )

  const error = swrError ? String(swrError.message || swrError) : null

  return {
    data,
    storage: data?.storage,
    cws: data?.cws,
    ag: data?.ag,
    isLoading,
    isValidating,
    error,
    mutate,
  }
}

/**
 * Helper to extract storage data for a specific scenario from batch response
 */
export function getStorageForScenario(
  batchData: BatchStatisticsResponse | undefined,
  scenarioId: string,
): BatchStorageData | undefined {
  return batchData?.storage?.[scenarioId]
}

/**
 * Helper to extract CWS data for a specific scenario from batch response
 */
export function getCwsForScenario(
  batchData: BatchStatisticsResponse | undefined,
  scenarioId: string,
): BatchCwsData | undefined {
  return batchData?.cws?.[scenarioId]
}

/**
 * Helper to extract AG data for a specific scenario from batch response
 */
export function getAgForScenario(
  batchData: BatchStatisticsResponse | undefined,
  scenarioId: string,
): BatchAgData | undefined {
  return batchData?.ag?.[scenarioId]
}

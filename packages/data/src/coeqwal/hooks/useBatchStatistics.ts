"use client"

/**
 * Hook for batch-fetching statistics data for multiple scenarios
 *
 * Powers the Data Explorer's "Data in Depth" tab: storage, CWS, AG, and
 * env_flow data for N scenarios arrive in one request instead of dozens.
 */

import useSWR from "swr"
import { CACHE_KEYS } from "../../cache/keys"
import { fetchBatchStatistics } from "../fetchers"
import type {
  BatchStatisticsResponse,
  BatchStorageData,
  BatchCwsData,
  BatchAgData,
  BatchEnvFlowData,
} from "../types"

export type DataType = "storage" | "cws" | "ag" | "env_flow"

interface UseBatchStatisticsOptions {
  /** Data types to fetch (default: all four) */
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
  /** Environmental flow data by scenario ID */
  envFlow: Record<string, BatchEnvFlowData> | undefined
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
  const { types = ["storage", "cws", "ag", "env_flow"], enabled = true } =
    options

  const shouldFetch = enabled && scenarios.length > 0

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
      // automatically. No need to suppress deduplication.
      revalidateOnReconnect: true,
    },
  )

  const error = swrError ? String(swrError.message || swrError) : null

  return {
    data,
    storage: data?.storage,
    cws: data?.cws,
    ag: data?.ag,
    envFlow: data?.env_flow,
    isLoading,
    isValidating,
    error,
    mutate,
  }
}

/** Per-scenario lookup helpers for the batch response */
export function getStorageForScenario(
  batchData: BatchStatisticsResponse | undefined,
  scenarioId: string,
): BatchStorageData | undefined {
  return batchData?.storage?.[scenarioId]
}

export function getCwsForScenario(
  batchData: BatchStatisticsResponse | undefined,
  scenarioId: string,
): BatchCwsData | undefined {
  return batchData?.cws?.[scenarioId]
}

export function getAgForScenario(
  batchData: BatchStatisticsResponse | undefined,
  scenarioId: string,
): BatchAgData | undefined {
  return batchData?.ag?.[scenarioId]
}

export function getEnvFlowForScenario(
  batchData: BatchStatisticsResponse | undefined,
  scenarioId: string,
): BatchEnvFlowData | undefined {
  return batchData?.env_flow?.[scenarioId]
}

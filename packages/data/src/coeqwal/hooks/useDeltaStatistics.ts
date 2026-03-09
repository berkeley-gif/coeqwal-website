"use client"

/**
 * Hook for fetching Delta statistics (X2, salinity, outflow)
 *
 * 8 variables × 12 water months = 96 rows per scenario.
 */

import useSWR from "swr"
import { CACHE_KEYS } from "../../cache/keys"
import { fetchDeltaMonthly } from "../fetchers"
import type { DeltaMonthlyResponse } from "../types"

/**
 * Fetch monthly Delta statistics for a scenario
 *
 * @param scenarioId - Scenario ID (e.g., "s0020") or null to suspend
 * @param category - Optional: 'x2', 'salinity_compliance', 'salinity_pumps', 'outflow'
 */
export function useDeltaMonthly(scenarioId: string | null, category?: string) {
  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<DeltaMonthlyResponse>(
    scenarioId ? CACHE_KEYS.deltaMonthly(scenarioId, category) : null,
    () => fetchDeltaMonthly(scenarioId!, category),
    { revalidateOnFocus: false },
  )

  const error = swrError ? String(swrError.message || swrError) : null

  return {
    data,
    scenarioId: data?.scenario_id,
    rows: data?.data ?? [],
    count: data?.count ?? 0,
    isLoading,
    error,
    hasData: !!data && (data.count ?? 0) > 0,
  }
}

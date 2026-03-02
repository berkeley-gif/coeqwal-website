"use client"

/**
 * Hooks for fetching wildlife refuge demand unit statistics
 *
 * Used for refuge delivery, shortage, and reliability charts in the Data Explorer.
 * 18 demand units × 12 water months = 216 rows per scenario per table.
 */

import useSWR from "swr"
import { CACHE_KEYS } from "../../cache/keys"
import {
  fetchRefugeDemandUnitsList,
  fetchRefugeDusDeliveryMonthly,
  fetchRefugeDusShortageMonthly,
  fetchRefugeDusPeriod,
} from "../fetchers"
import type {
  RefugeDemandUnitsListResponse,
  RefugeDeliveryMonthlyResponse,
  RefugeShortageMonthlyResponse,
  RefugePeriodResponse,
} from "../types"

/**
 * Fetch list of wildlife refuge demand unit entities
 *
 * @returns All 18 refuge demand units with metadata
 */
export function useRefugeDemandUnitsList() {
  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<RefugeDemandUnitsListResponse>(
    CACHE_KEYS.REFUGE_DUS_LIST,
    () => fetchRefugeDemandUnitsList(),
    { revalidateOnFocus: false },
  )

  const error = swrError ? String(swrError.message || swrError) : null

  return {
    data,
    demandUnits: data?.demand_units ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    hasData: !!data && (data.total ?? 0) > 0,
  }
}

/**
 * Fetch monthly surface water delivery statistics for refuge demand units
 *
 * @param scenarioId - Scenario ID (e.g., "s0020") or null to suspend
 * @returns Monthly delivery percentile bands for 18 refuge DUs
 */
export function useRefugeDusDeliveryMonthly(scenarioId: string | null) {
  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<RefugeDeliveryMonthlyResponse>(
    scenarioId ? CACHE_KEYS.refugeDusDeliveryMonthly(scenarioId) : null,
    () => fetchRefugeDusDeliveryMonthly(scenarioId!),
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

/**
 * Fetch monthly shortage statistics for refuge demand units
 *
 * @param scenarioId - Scenario ID (e.g., "s0020") or null to suspend
 * @returns Monthly shortage percentile bands for 18 refuge DUs
 */
export function useRefugeDusShortageMonthly(scenarioId: string | null) {
  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<RefugeShortageMonthlyResponse>(
    scenarioId ? CACHE_KEYS.refugeDusShortageMonthly(scenarioId) : null,
    () => fetchRefugeDusShortageMonthly(scenarioId!),
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

/**
 * Fetch period-of-record summary for refuge demand units
 *
 * @param scenarioId - Scenario ID (e.g., "s0020") or null to suspend
 * @returns Annual stats + reliability_pct_95 for 18 refuge DUs
 */
export function useRefugeDusPeriod(scenarioId: string | null) {
  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<RefugePeriodResponse>(
    scenarioId ? CACHE_KEYS.refugeDusPeriod(scenarioId) : null,
    () => fetchRefugeDusPeriod(scenarioId!),
    { revalidateOnFocus: false },
  )

  const error = swrError ? String(swrError.message || swrError) : null

  return {
    data,
    scenarioId: data?.scenario_id,
    summaries: data?.data ?? [],
    count: data?.count ?? 0,
    isLoading,
    error,
    hasData: !!data && (data.count ?? 0) > 0,
  }
}

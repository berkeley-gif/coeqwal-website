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
  RefugeMonthlyResponse,
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
    count: data?.count ?? 0,
    isLoading,
    error,
    hasData: !!data && (data.count ?? 0) > 0,
  }
}

/**
 * Fetch monthly delivery + shortage statistics for refuge demand units.
 * Reads `monthly_delivery` off each DU entry. Companion hook
 * `useRefugeDusShortageMonthly` hits the same merged URL and reads
 * `monthly_shortage` instead
 *
 * @param scenarioId - Scenario ID (e.g., "s0020") or null to suspend
 * @returns Per-DU monthly percentile bands keyed by du_id
 */
export function useRefugeDusDeliveryMonthly(scenarioId: string | null) {
  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<RefugeMonthlyResponse>(
    scenarioId ? CACHE_KEYS.refugeDusDeliveryMonthly(scenarioId) : null,
    () => fetchRefugeDusDeliveryMonthly(scenarioId!),
    { revalidateOnFocus: false },
  )

  const error = swrError ? String(swrError.message || swrError) : null

  return {
    data,
    scenarioId: data?.scenario_id,
    demandUnits: data?.demand_units ?? {},
    count: data?.count ?? 0,
    isLoading,
    error,
    hasData: !!data && Object.keys(data.demand_units).length > 0,
  }
}

/**
 * Fetch monthly shortage statistics for refuge demand units. Hits the same
 * merged `/monthly` URL as `useRefugeDusDeliveryMonthly`. SWR dedupes the
 * underlying fetch. Read `monthly_shortage` off each DU entry
 *
 * @param scenarioId - Scenario ID (e.g., "s0020") or null to suspend
 * @returns Per-DU monthly percentile bands keyed by du_id
 */
export function useRefugeDusShortageMonthly(scenarioId: string | null) {
  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<RefugeMonthlyResponse>(
    scenarioId ? CACHE_KEYS.refugeDusShortageMonthly(scenarioId) : null,
    () => fetchRefugeDusShortageMonthly(scenarioId!),
    { revalidateOnFocus: false },
  )

  const error = swrError ? String(swrError.message || swrError) : null

  return {
    data,
    scenarioId: data?.scenario_id,
    demandUnits: data?.demand_units ?? {},
    count: data?.count ?? 0,
    isLoading,
    error,
    hasData: !!data && Object.keys(data.demand_units).length > 0,
  }
}

/**
 * Fetch period-of-record summary for refuge demand units
 *
 * @param scenarioId - Scenario ID (e.g., "s0020") or null to suspend
 * @returns Annual stats + reliability_pct_95 keyed by du_id
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
    demandUnits: data?.demand_units ?? {},
    count: data?.count ?? 0,
    isLoading,
    error,
    hasData: !!data && Object.keys(data.demand_units).length > 0,
  }
}

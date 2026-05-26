"use client"

/**
 * Hooks for fetching AG demand unit statistics
 *
 * Used for agricultural delivery and shortage charts in the Data Explorer.
 * AG aggregate data is served through the batch endpoint.
 */

import useSWR from "swr"
import { CACHE_KEYS } from "../../cache/keys"
import {
  fetchAgDemandUnitsList,
  fetchAgDemandUnitsDeliveryMonthly,
  fetchAgDemandUnitsPeriod,
} from "../fetchers"
import type {
  AgDemandUnitsListResponse,
  AgDemandUnitDeliveryMonthlyResponse,
  AgDemandUnitPeriodResponse,
} from "../types"

/**
 * Fetch the list of AG demand-unit entities, optionally filtered.
 * Used to populate the "Add a demand unit" dropdown in AgSection.
 *
 * @param filters - Optional region / cs3_type / provider filters
 * @returns The demand-unit list, count, plus loading and error state
 */
export function useAgDemandUnitsList(filters?: {
  region?: string
  cs3_type?: string
  provider?: string
}) {
  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<AgDemandUnitsListResponse>(
    CACHE_KEYS.agDemandUnitsList(filters),
    () => fetchAgDemandUnitsList(filters),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    },
  )

  const error = swrError ? String(swrError.message || swrError) : null

  return {
    data,
    demandUnits: data?.demand_units ?? [],
    total: data?.count ?? 0,
    isLoading,
    error,
    hasData: !!data && (data.count ?? 0) > 0,
  }
}

/**
 * Fetch monthly surface-water delivery statistics for AG demand units.
 *
 * Only fetches when both `scenarioId` and `duIds` are provided. Pass the
 * specific demand units the UI cares about so the backend filters the
 * response with its `du_id` query param rather than returning all 150
 *
 * @param scenarioId - Scenario ID (e.g., "s0020"), or null to suspend
 * @param duIds - Demand unit IDs to fetch. Empty suspends the fetch
 * @returns Monthly delivery for the requested AG demand units
 */
export function useAgDemandUnitsDeliveryMonthly(
  scenarioId: string | null,
  duIds: string[] = [],
) {
  const shouldFetch = scenarioId !== null && duIds.length > 0
  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<AgDemandUnitDeliveryMonthlyResponse>(
    shouldFetch
      ? CACHE_KEYS.agDemandUnitsDeliveryMonthly(scenarioId!, duIds)
      : null,
    () => fetchAgDemandUnitsDeliveryMonthly(scenarioId!, duIds),
    {
      revalidateOnFocus: false,
    },
  )

  const error = swrError ? String(swrError.message || swrError) : null

  return {
    data,
    scenarioId: data?.scenario_id,
    demandUnits: data?.demand_units ?? {},
    isLoading,
    error,
    hasData: !!data && Object.keys(data.demand_units).length > 0,
  }
}

/**
 * Fetch period-of-record summary for AG demand units.
 *
 * Only fetches when both `scenarioId` and `duIds` are provided. Pass the
 * specific demand units the UI cares about so the backend filters the
 * response rather than returning all 150
 *
 * @param scenarioId - Scenario ID (e.g., "s0020"), or null to suspend
 * @param duIds - Demand unit IDs to fetch. Empty suspends the fetch
 * @returns Period summary for the requested AG demand units
 */
export function useAgDemandUnitsPeriod(
  scenarioId: string | null,
  duIds: string[] = [],
) {
  const shouldFetch = scenarioId !== null && duIds.length > 0
  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<AgDemandUnitPeriodResponse>(
    shouldFetch ? CACHE_KEYS.agDemandUnitsPeriod(scenarioId!, duIds) : null,
    () => fetchAgDemandUnitsPeriod(scenarioId!, duIds),
    {
      revalidateOnFocus: false,
    },
  )

  const error = swrError ? String(swrError.message || swrError) : null

  return {
    data,
    scenarioId: data?.scenario_id,
    demandUnits: data?.demand_units ?? {},
    isLoading,
    error,
    hasData: !!data && Object.keys(data.demand_units).length > 0,
  }
}

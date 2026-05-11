"use client"

/**
 * Hooks for fetching AG aggregate and demand unit statistics data
 *
 * Used for agricultural delivery and shortage charts in the Data Explorer.
 */

import useSWR from "swr"
import { CACHE_KEYS } from "../../cache/keys"
import {
  fetchAgAggregatesMonthly,
  fetchAgAggregatesPeriod,
  fetchAgDemandUnitsList,
  fetchAgDemandUnitsDeliveryMonthly,
  fetchAgDemandUnitsShortageMonthly,
  fetchAgDemandUnitsPeriod,
} from "../fetchers"
import type {
  AgAggregateMonthlyResponse,
  AgAggregatePeriodResponse,
  AgDemandUnitsListResponse,
  AgDemandUnitDeliveryMonthlyResponse,
  AgDemandUnitShortageMonthlyResponse,
  AgDemandUnitPeriodResponse,
} from "../types"

/**
 * Fetch monthly delivery statistics for AG aggregates
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @returns Monthly statistics for 5 AG project aggregates
 */
export function useAgAggregatesMonthly(scenarioId: string | null) {
  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<AgAggregateMonthlyResponse>(
    scenarioId ? CACHE_KEYS.agAggregatesMonthly(scenarioId) : null,
    () => fetchAgAggregatesMonthly(scenarioId!),
    {
      revalidateOnFocus: false,
    },
  )

  const error = swrError ? String(swrError.message || swrError) : null

  return {
    data,
    scenarioId: data?.scenario_id,
    aggregates: data?.aggregates ?? {},
    isLoading,
    error,
    hasData: !!data && Object.keys(data.aggregates).length > 0,
  }
}

/**
 * Fetch period-of-record summary for AG aggregates
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @returns Period summary with annual averages and delivery exceedance
 */
export function useAgAggregatesPeriod(scenarioId: string | null) {
  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<AgAggregatePeriodResponse>(
    scenarioId ? CACHE_KEYS.agAggregatesPeriod(scenarioId) : null,
    () => fetchAgAggregatesPeriod(scenarioId!),
    {
      revalidateOnFocus: false,
    },
  )

  const error = swrError ? String(swrError.message || swrError) : null

  return {
    data,
    scenarioId: data?.scenario_id,
    aggregates: data?.aggregates ?? {},
    isLoading,
    error,
    hasData: !!data && Object.keys(data.aggregates).length > 0,
  }
}

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
 * Fetch monthly delivery statistics for AG demand units
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @returns Monthly delivery for 150 AG demand units
 */
export function useAgDemandUnitsDeliveryMonthly(scenarioId: string | null) {
  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<AgDemandUnitDeliveryMonthlyResponse>(
    scenarioId ? CACHE_KEYS.agDemandUnitsDeliveryMonthly(scenarioId) : null,
    () => fetchAgDemandUnitsDeliveryMonthly(scenarioId!),
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
 * Fetch monthly shortage statistics for AG demand units
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @returns Monthly shortage for AG demand units with shortage data
 */
export function useAgDemandUnitsShortageMonthly(scenarioId: string | null) {
  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<AgDemandUnitShortageMonthlyResponse>(
    scenarioId ? CACHE_KEYS.agDemandUnitsShortageMonthly(scenarioId) : null,
    () => fetchAgDemandUnitsShortageMonthly(scenarioId!),
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
 * Fetch period-of-record summary for AG demand units
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @returns Period summary with delivery exceedance for 150 AG demand units
 */
export function useAgDemandUnitsPeriod(scenarioId: string | null) {
  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<AgDemandUnitPeriodResponse>(
    scenarioId ? CACHE_KEYS.agDemandUnitsPeriod(scenarioId) : null,
    () => fetchAgDemandUnitsPeriod(scenarioId!),
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

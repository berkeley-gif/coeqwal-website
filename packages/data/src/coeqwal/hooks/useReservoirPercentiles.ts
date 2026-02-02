"use client"

/**
 * Hooks for fetching reservoir percentile data
 *
 * Used for reservoir storage charts in the Data Explorer.
 */

import useSWR from "swr"
import { CACHE_KEYS } from "../../cache/keys"
import {
  fetchReservoirList,
  fetchScenariosWithPercentiles,
  fetchReservoirPercentiles,
  fetchAllReservoirPercentiles,
  fetchGroupedReservoirPercentiles,
  fetchStorageMonthly,
} from "../fetchers"
import type {
  ReservoirListResponse,
  StatisticsScenariosResponse,
  ReservoirPercentiles,
  AllReservoirPercentilesResponse,
  GroupedReservoirPercentilesResponse,
  StorageMonthlyResponse,
} from "../types"

/**
 * Fetch and cache the list of reservoirs with percentile data
 *
 * @returns Reservoir list with loading and error states
 *
 * @example
 * ```typescript
 * function ReservoirSelector() {
 *   const { reservoirs, isLoading } = useReservoirList()
 *
 *   if (isLoading) return <Spinner />
 *
 *   return (
 *     <ul>
 *       {reservoirs?.map(r => (
 *         <li key={r.reservoir_id}>{r.reservoir_name}</li>
 *       ))}
 *     </ul>
 *   )
 * }
 * ```
 */
export function useReservoirList() {
  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<ReservoirListResponse>(
    CACHE_KEYS.STATISTICS_RESERVOIRS,
    fetchReservoirList,
    {
      // Static data - don't revalidate frequently
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  )

  const error = swrError ? String(swrError.message || swrError) : null

  return {
    reservoirs: data?.reservoirs ?? [],
    isLoading,
    error,
  }
}

/**
 * Fetch and cache scenarios that have percentile data
 *
 * @returns Scenarios with loading and error states
 *
 * @example
 * ```typescript
 * function ScenarioSelector() {
 *   const { scenarios, isLoading } = useScenariosWithPercentiles()
 *
 *   return (
 *     <Select>
 *       {scenarios?.map(s => (
 *         <Option key={s.scenario_id}>{s.scenario_id}</Option>
 *       ))}
 *     </Select>
 *   )
 * }
 * ```
 */
export function useScenariosWithPercentiles() {
  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<StatisticsScenariosResponse>(
    CACHE_KEYS.STATISTICS_SCENARIOS,
    fetchScenariosWithPercentiles,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  )

  const error = swrError ? String(swrError.message || swrError) : null

  return {
    scenarios: data?.scenarios ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
  }
}

/**
 * Fetch percentile data for a single reservoir in a scenario
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @param reservoirId - Reservoir ID (e.g., "S_SHSTA")
 * @returns Reservoir percentile data with loading and error states
 *
 * @example
 * ```typescript
 * function ReservoirChart({ scenarioId, reservoirId }) {
 *   const { data, isLoading } = useReservoirPercentiles(scenarioId, reservoirId)
 *
 *   if (isLoading) return <Spinner />
 *   if (!data) return <EmptyState />
 *
 *   return <PercentileBandChart data={data.monthly_percentiles} />
 * }
 * ```
 */
export function useReservoirPercentiles(
  scenarioId: string | null,
  reservoirId: string | null,
) {
  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<ReservoirPercentiles>(
    scenarioId && reservoirId
      ? CACHE_KEYS.reservoirPercentiles(scenarioId, reservoirId)
      : null,
    () =>
      scenarioId && reservoirId
        ? fetchReservoirPercentiles(scenarioId, reservoirId)
        : Promise.reject(new Error("Missing parameters")),
    {
      revalidateOnFocus: false,
    },
  )

  const error = swrError ? String(swrError.message || swrError) : null

  return {
    data,
    isLoading,
    error,
    hasData: !!data,
  }
}

/**
 * Fetch percentile data for all reservoirs in a scenario
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @returns All reservoir percentile data with loading and error states
 *
 * @example
 * ```typescript
 * function ReservoirGrid({ scenarioId }) {
 *   const { data, isLoading } = useAllReservoirPercentiles(scenarioId)
 *
 *   if (isLoading) return <Spinner />
 *
 *   return (
 *     <Grid>
 *       {Object.entries(data?.reservoirs ?? {}).map(([id, reservoir]) => (
 *         <ReservoirCard key={id} reservoir={reservoir} />
 *       ))}
 *     </Grid>
 *   )
 * }
 * ```
 */
export function useAllReservoirPercentiles(scenarioId: string | null) {
  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<AllReservoirPercentilesResponse>(
    scenarioId ? CACHE_KEYS.allReservoirPercentiles(scenarioId) : null,
    () =>
      scenarioId
        ? fetchAllReservoirPercentiles(scenarioId)
        : Promise.reject(new Error("Missing scenario ID")),
    {
      revalidateOnFocus: false,
    },
  )

  const error = swrError ? String(swrError.message || swrError) : null

  return {
    data,
    scenarioId: data?.scenario_id,
    reservoirs: data?.reservoirs ?? {},
    isLoading,
    error,
    hasData: !!data && Object.keys(data.reservoirs).length > 0,
  }
}

/**
 * Fetch percentile data for a group of reservoirs in a scenario
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @param group - Reservoir group (e.g., "major")
 * @returns Grouped reservoir percentile data with loading and error states
 *
 * @example
 * ```typescript
 * function MajorReservoirGrid({ scenarioId }) {
 *   const { data, isLoading } = useGroupedReservoirPercentiles(scenarioId, "major")
 *
 *   if (isLoading) return <Spinner />
 *
 *   return (
 *     <Grid>
 *       {Object.entries(data?.reservoirs ?? {}).map(([id, reservoir]) => (
 *         <ReservoirCard key={id} name={reservoir.name} percentiles={reservoir.monthly_percentiles} />
 *       ))}
 *     </Grid>
 *   )
 * }
 * ```
 */
export function useGroupedReservoirPercentiles(
  scenarioId: string | null,
  group: string | null,
) {
  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<GroupedReservoirPercentilesResponse>(
    scenarioId && group
      ? CACHE_KEYS.groupedReservoirPercentiles(scenarioId, group)
      : null,
    () =>
      scenarioId && group
        ? fetchGroupedReservoirPercentiles(scenarioId, group)
        : Promise.reject(new Error("Missing parameters")),
    {
      revalidateOnFocus: false,
    },
  )

  const error = swrError ? String(swrError.message || swrError) : null

  return {
    data,
    scenarioId: data?.scenario_id,
    group: data?.group,
    reservoirs: data?.reservoirs ?? {},
    isLoading,
    error,
    hasData: !!data && Object.keys(data.reservoirs).length > 0,
  }
}

/**
 * Fetch monthly storage data with both percentage and TAF values
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @param group - Reservoir group (e.g., "major")
 * @returns Storage data with monthly_percent and monthly_taf for each reservoir
 *
 * @example
 * ```typescript
 * function StorageChart({ scenarioId, displayMode }) {
 *   const { reservoirs, isLoading } = useStorageMonthly(scenarioId, "major")
 *
 *   if (isLoading) return <Spinner />
 *
 *   return (
 *     <Grid>
 *       {Object.entries(reservoirs).map(([id, data]) => (
 *         <PercentileChart
 *           key={id}
 *           name={data.name}
 *           percentiles={displayMode === "taf" ? data.monthly_taf : data.monthly_percent}
 *         />
 *       ))}
 *     </Grid>
 *   )
 * }
 * ```
 */
export function useStorageMonthly(
  scenarioId: string | null,
  group: string | null,
) {
  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<StorageMonthlyResponse>(
    scenarioId && group ? CACHE_KEYS.storageMonthly(scenarioId, group) : null,
    () =>
      scenarioId && group
        ? fetchStorageMonthly(scenarioId, group)
        : Promise.reject(new Error("Missing parameters")),
    {
      revalidateOnFocus: false,
    },
  )

  const error = swrError ? String(swrError.message || swrError) : null

  return {
    data,
    scenarioId: data?.scenario_id,
    group: data?.group,
    reservoirs: data?.reservoirs ?? {},
    isLoading,
    error,
    hasData: !!data && Object.keys(data.reservoirs).length > 0,
  }
}

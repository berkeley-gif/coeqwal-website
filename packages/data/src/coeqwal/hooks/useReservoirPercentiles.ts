"use client"

/**
 * useReservoirPercentiles.ts - Hooks for fetching reservoir percentile data
 *
 * Used for reservoir storage charts in the Data Explorer.
 */

import useSWR from "swr"
import { CACHE_KEYS } from "../../cache/keys"
import {
  fetchAllReservoirsList,
  fetchReservoirPercentiles,
  fetchReservoirPercentilesByIds,
  fetchAllReservoirPercentiles,
  fetchGroupedReservoirPercentiles,
  fetchSpillMonthly,
} from "../fetchers"
import type {
  AllReservoirsListResponse,
  ReservoirPercentiles,
  AllReservoirPercentilesResponse,
  GroupedReservoirPercentilesResponse,
  SpillMonthlyResponse,
} from "../types"

/**
 * Fetch and cache the list of ALL reservoirs with statistics data
 * Use this for the "add reservoir" dropdown to show all available options
 *
 * @returns All reservoirs with loading and error states
 *
 * @example
 * ```typescript
 * function ReservoirDropdown() {
 *   const { reservoirs, isLoading } = useAllReservoirsList()
 *
 *   if (isLoading) return <Spinner />
 *
 *   return (
 *     <Select>
 *       {reservoirs?.map(r => (
 *         <Option key={r.reservoir_id} value={r.reservoir_id}>
 *           {r.reservoir_name}
 *         </Option>
 *       ))}
 *     </Select>
 *   )
 * }
 * ```
 */
export function useAllReservoirsList() {
  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<AllReservoirsListResponse>(
    CACHE_KEYS.STATISTICS_RESERVOIRS_ALL,
    fetchAllReservoirsList,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    },
  )

  const error = swrError ? String(swrError.message || swrError) : null

  // Transform to include reservoir_name for consistency with other hooks
  const reservoirs = (data?.all ?? []).map((r) => ({
    reservoir_id: r.reservoir_id,
    reservoir_name: r.name,
    capacity_taf: r.capacity_taf,
  }))

  return {
    reservoirs,
    majorReservoirIds: data?.major ?? [],
    count: data?.count ?? 0,
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
      ? CACHE_KEYS.reservoirPercentilesFiltered(scenarioId, [reservoirId])
      : null,
    () => fetchReservoirPercentiles(scenarioId!, reservoirId!),
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
 * Fetch percentile data for a list of reservoirs in a single scenario.
 *
 * One request per scenario (the endpoint accepts an id list), so multi-scenario
 * callers fan out per scenario via `useMultiScenarioSlots`. Returns the
 * reservoirs map keyed by the requested reservoir ids.
 *
 * @param scenarioId - Scenario ID (e.g., "s0020"), or null to skip
 * @param reservoirIds - Reservoir IDs to fetch (empty skips the request)
 */
export function useReservoirPercentilesByIds(
  scenarioId: string | null,
  reservoirIds: string[],
) {
  const sortedIds = [...reservoirIds].sort()
  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<GroupedReservoirPercentilesResponse>(
    scenarioId && sortedIds.length > 0
      ? CACHE_KEYS.reservoirPercentilesFiltered(scenarioId, sortedIds)
      : null,
    () => fetchReservoirPercentilesByIds(scenarioId!, sortedIds),
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
    () => fetchAllReservoirPercentiles(scenarioId!),
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
    () => fetchGroupedReservoirPercentiles(scenarioId!, group!),
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
 * Fetch monthly spill statistics for reservoirs
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @param group - Reservoir group (e.g., "major")
 * @returns Spill data with monthly percentiles and frequency for each reservoir
 *
 * @example
 * ```typescript
 * function SpillChart({ scenarioId }) {
 *   const { reservoirs, isLoading } = useSpillMonthly(scenarioId, "major")
 *
 *   if (isLoading) return <Spinner />
 *
 *   return (
 *     <Grid>
 *       {Object.entries(reservoirs).map(([id, data]) => (
 *         <SpillCard
 *           key={id}
 *           name={data.name}
 *           spillFrequency={data.spill_frequency}
 *           monthlySpill={data.monthly_taf}
 *         />
 *       ))}
 *     </Grid>
 *   )
 * }
 * ```
 */
export function useSpillMonthly(
  scenarioId: string | null,
  group: string | null,
) {
  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<SpillMonthlyResponse>(
    scenarioId && group ? CACHE_KEYS.spillMonthly(scenarioId, group) : null,
    () => fetchSpillMonthly(scenarioId!, group!),
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


"use client"

/**
 * useDataInDepth.ts - hooks for the /api/data-in-depth/* endpoints.
 *
 * A generic surface over the `data_in_depth_*` tables: SQL fetches raw rows and
 * the API computes every derived value live, so stats stay correct under WYT
 * filtering. Retrieval is multi-scenario (compute stays per single scenario).
 *
 * Sibling endpoints for other domains will be added here as they land; they
 * share the Did* facet types in ../types.
 */

import useSWR from "swr"
import { ENDPOINTS } from "../api"
import {
  fetchReservoirStorageDataInDepth,
  fetchRiverFlowsDataInDepth,
  fetchDeltaSalinityDataInDepth,
} from "../fetchers"
import type {
  ReservoirStorageDidResponse,
  ReservoirStorageDidOptions,
  RiverFlowsDidResponse,
  RiverFlowsDidOptions,
  DeltaSalinityDidResponse,
  DeltaSalinityDidOptions,
} from "../types"

/**
 * April/September reservoir storage — raw per-year values plus live-computed
 * stats (values, exceedance, Tukey box, summary stats), for one or many
 * scenarios.
 *
 * @param scenarios - scenario short_codes. In the Explorer, pass
 *   hydroclimate-resolved ids (`useResolvedIdMapping().resolvedIds`), not the
 *   raw sibling-group selection.
 * @param options - subjects / periods / units / include / wyt filters. Use
 *   `include` to trim the payload to the facets a view actually renders.
 *
 * The fully-normalized endpoint path is used directly as the SWR cache key, so
 * requests dedupe regardless of caller ordering. An empty `scenarios` array
 * defers the fetch (null key).
 *
 * @example
 * ```typescript
 * const { scenarios, isLoading } = useReservoirStorageDataInDepth(resolvedIds, {
 *   subjects: ["SHSTA", "NOD"],
 *   include: ["box", "statistics"],
 * })
 * ```
 */
export function useReservoirStorageDataInDepth(
  scenarios: string[],
  options: ReservoirStorageDidOptions = {},
) {
  const enabled = scenarios.length > 0
  const key = enabled
    ? ENDPOINTS.reservoirStorageDataInDepth(scenarios, options)
    : null

  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<ReservoirStorageDidResponse>(
    key,
    () => fetchReservoirStorageDataInDepth(scenarios, options),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    },
  )

  const error = swrError ? String(swrError.message || swrError) : null

  return {
    data,
    scenarios: data?.scenarios ?? [],
    wytFilter: data?.wyt_filter ?? null,
    isLoading,
    error,
    hasData: !!data,
  }
}

/**
 * Annual water-year river flow — raw per-year TAF plus live-computed stats
 * (values, exceedance, Tukey box, summary stats), for one or many scenarios.
 * Annual + TAF only; per-scenario subjects are returned under `rivers`.
 *
 * @param scenarios - scenario short_codes. In the Explorer, pass
 *   hydroclimate-resolved ids (`useResolvedIdMapping().resolvedIds`).
 * @param options - subjects / include / wyt filters (`include` trims payload).
 *
 * Same conventions as {@link useReservoirStorageDataInDepth}: normalized
 * endpoint path as SWR cache key, empty `scenarios` defers the fetch.
 */
export function useRiverFlowsDataInDepth(
  scenarios: string[],
  options: RiverFlowsDidOptions = {},
) {
  const enabled = scenarios.length > 0
  const key = enabled
    ? ENDPOINTS.riverFlowsDataInDepth(scenarios, options)
    : null

  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<RiverFlowsDidResponse>(
    key,
    () => fetchRiverFlowsDataInDepth(scenarios, options),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    },
  )

  const error = swrError ? String(swrError.message || swrError) : null

  return {
    data,
    scenarios: data?.scenarios ?? [],
    wytFilter: data?.wyt_filter ?? null,
    isLoading,
    error,
    hasData: !!data,
  }
}

/**
 * April/September Delta X2 position — raw per-year km plus live-computed stats
 * (values, exceedance, Tukey box, summary stats), for one or many scenarios.
 * april/sept periods, km unit only; per-scenario subjects under `subjects`
 * (currently just X2).
 *
 * @param scenarios - scenario short_codes. In the Explorer, pass
 *   hydroclimate-resolved ids (`useResolvedIdMapping().resolvedIds`).
 * @param options - subjects / periods / include / wyt filters.
 *
 * Same conventions as the sibling data-in-depth hooks: normalized endpoint path
 * as SWR cache key, empty `scenarios` defers the fetch.
 */
export function useDeltaSalinityDataInDepth(
  scenarios: string[],
  options: DeltaSalinityDidOptions = {},
) {
  const enabled = scenarios.length > 0
  const key = enabled
    ? ENDPOINTS.deltaSalinityDataInDepth(scenarios, options)
    : null

  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<DeltaSalinityDidResponse>(
    key,
    () => fetchDeltaSalinityDataInDepth(scenarios, options),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    },
  )

  const error = swrError ? String(swrError.message || swrError) : null

  return {
    data,
    scenarios: data?.scenarios ?? [],
    wytFilter: data?.wyt_filter ?? null,
    isLoading,
    error,
    hasData: !!data,
  }
}

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
  fetchCwsDataInDepth,
  fetchSalmonDataInDepth,
  fetchSystemDeliveriesDataInDepth,
  fetchAgDataInDepth,
  fetchGroundwaterStorageDataInDepth,
} from "../fetchers"
import type {
  ReservoirStorageDidResponse,
  ReservoirStorageDidOptions,
  RiverFlowsDidResponse,
  RiverFlowsDidOptions,
  DeltaSalinityDidResponse,
  DeltaSalinityDidOptions,
  CwsDataInDepthResponse,
  CwsDataInDepthOptions,
  SalmonDidResponse,
  SalmonDidOptions,
  SystemDeliveriesDidResponse,
  SystemDeliveriesDidOptions,
  AgDataInDepthResponse,
  AgDataInDepthOptions,
  GroundwaterStorageDidResponse,
  GroundwaterStorageDidOptions,
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

/**
 * Annual CWS delivery + percent-demand-met + welfare-outcome series with
 * live-computed stats. All five measures — including
 * `welfare_loss`/`shortage_total`/`shortage_pct` — are available at every
 * subject, including the NOD_CWS/SOD_CWS aggregates (summed/demand-weighted
 * as appropriate; see `DidCwsMeasure`). `welfare_loss`'s `exceedance` facet
 * is unconditionally suppressed regardless of `include`.
 */
export function useCwsDataInDepth(
  scenarios: string[],
  options: CwsDataInDepthOptions = {},
) {
  const enabled = scenarios.length > 0
  const key = enabled ? ENDPOINTS.cwsDataInDepth(scenarios, options) : null

  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<CwsDataInDepthResponse>(
    key,
    () => fetchCwsDataInDepth(scenarios, options),
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
 * Annual groundwater storage volume + water-table level series with
 * live-computed stats. `level` is never aggregated — it returns an empty
 * series for the NOD_GroundwaterStorage/SOD_GroundwaterStorage subjects.
 */
export function useGroundwaterStorageDataInDepth(
  scenarios: string[],
  options: GroundwaterStorageDidOptions = {},
) {
  const enabled = scenarios.length > 0
  const key = enabled
    ? ENDPOINTS.groundwaterStorageDataInDepth(scenarios, options)
    : null

  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<GroundwaterStorageDidResponse>(
    key,
    () => fetchGroundwaterStorageDataInDepth(scenarios, options),
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

/** Annual salmon abundance (calendar-year) with live-computed stats. WYT filtering is not exposed in the client contract because the source uses calendar year, not water year. */
export function useSalmonDataInDepth(
  scenarios: string[],
  options: SalmonDidOptions = {},
) {
  const enabled = scenarios.length > 0
  const key = enabled ? ENDPOINTS.salmonDataInDepth(scenarios, options) : null

  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<SalmonDidResponse>(
    key,
    () => fetchSalmonDataInDepth(scenarios, options),
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

/** Annual system-delivery totals with live-computed stats. */
export function useSystemDeliveriesDataInDepth(
  scenarios: string[],
  options: SystemDeliveriesDidOptions = {},
) {
  const enabled = scenarios.length > 0
  const key = enabled
    ? ENDPOINTS.systemDeliveriesDataInDepth(scenarios, options)
    : null

  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<SystemDeliveriesDidResponse>(
    key,
    () => fetchSystemDeliveriesDataInDepth(scenarios, options),
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

/** Annual AG net diversion + GW pumping + shortage + revenue series with live-computed stats. */
export function useAgDataInDepth(
  scenarios: string[],
  options: AgDataInDepthOptions = {},
) {
  const enabled = scenarios.length > 0
  const key = enabled ? ENDPOINTS.agDataInDepth(scenarios, options) : null

  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<AgDataInDepthResponse>(
    key,
    () => fetchAgDataInDepth(scenarios, options),
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

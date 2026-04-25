"use client"

/**
 * Hooks for fetching environmental river flow statistics
 *
 * Three metrics across 59 CalSim channel reaches:
 *   Metric 1.Monthly and seasonal % of natural unimpaired flow
 *   Metric 2.Seasonal % of functional flow (EFLOWS) targets (~17 reaches)
 *   Metric 3.Pearson r flow alteration index (period of record)
 *
 * Water months: 1=October ... 12=September
 * CFS: cubic feet per second (raw flow)
 */

import useSWR from "swr"
import { CACHE_KEYS } from "../../cache/keys"
import {
  fetchChannelsList,
  fetchEnvFlowSeasons,
  fetchChannelsMonthly,
  fetchChannelsSeasonal,
  fetchChannelsPeriodSummary,
} from "../fetchers"
import type {
  ChannelsListResponse,
  EnvFlowSeasonsResponse,
  ChannelsMonthlyResponse,
  ChannelsSeasonalResponse,
  ChannelsPeriodSummaryResponse,
} from "../types"

/**
 * Fetch all 59 channel reach entities with watershed and capability attributes.
 *
 * This is a static list.it rarely changes between ETL runs.
 * Use to populate channel selectors and decorate channel rows with metadata.
 *
 * @param channelClass - Optional filter: 'stream', 'canal', or 'reservoir_release'
 * @param watershed - Optional filter by watershed short_code (e.g. 'SAC_LOWER')
 */
export function useChannelsList(channelClass?: string, watershed?: string) {
  const cacheKey =
    channelClass || watershed
      ? `/api/statistics/channels?${[channelClass && `channel_class=${channelClass}`, watershed && `watershed=${watershed}`].filter(Boolean).join("&")}`
      : CACHE_KEYS.CHANNELS_LIST

  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<ChannelsListResponse>(
    cacheKey,
    () => fetchChannelsList(channelClass, watershed),
    { revalidateOnFocus: false },
  )

  const error = swrError ? String(swrError.message || swrError) : null

  return {
    data,
    channels: data?.channels ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    hasData: !!data && (data.total ?? 0) > 0,
  }
}

/**
 * Fetch the 5 CEFF seasonal definitions (static lookup).
 *
 * seasons: wet_peak, wet_base, spring_recession, dry, fall_pulse
 * Each season includes calendar_months and wy_months for display and grouping.
 */
export function useEnvFlowSeasons() {
  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<EnvFlowSeasonsResponse>(
    CACHE_KEYS.ENV_FLOW_SEASONS,
    () => fetchEnvFlowSeasons(),
    { revalidateOnFocus: false },
  )

  const error = swrError ? String(swrError.message || swrError) : null

  return {
    data,
    seasons: data?.seasons ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    hasData: !!data && (data.total ?? 0) > 0,
  }
}

/**
 * Fetch monthly % unimpaired flow statistics for all channels in a scenario (Metric 1).
 *
 * Returns 59 channels × 12 water months = 708 rows as a flat array.
 * q* and exc_p* columns are percentile bands of pct_unimpaired across years.
 * NULL where no unimpaired reference exists (Mokelumne, some canals).
 *
 * @param scenarioId - Scenario ID (e.g., "s0020") or null to suspend
 * @param channelId - Optional single channel filter (e.g., "C_SAC049")
 */
export function useChannelsMonthly(
  scenarioId: string | null,
  channelId?: string,
) {
  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<ChannelsMonthlyResponse>(
    scenarioId ? CACHE_KEYS.channelsMonthly(scenarioId, channelId) : null,
    () => fetchChannelsMonthly(scenarioId!, channelId),
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
 * Fetch seasonal flow volumes + % unimpaired + % functional flow (Metrics 1+2).
 *
 * Returns 59 channels × 5 CEFF seasons = 295 rows as a flat array.
 * flow_* columns: all 59 channels (for seasonal flow pulse diagrams).
 * pct_unimpaired_* columns: 57 channels (NULL for Mokelumne).
 * pct_ff_* and ff_* columns: ~17 EFLOWS channels (NULL otherwise).
 *
 * @param scenarioId - Scenario ID (e.g., "s0020") or null to suspend
 * @param channelId - Optional single channel filter
 */
export function useChannelsSeasonal(
  scenarioId: string | null,
  channelId?: string,
) {
  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<ChannelsSeasonalResponse>(
    scenarioId ? CACHE_KEYS.channelsSeasonal(scenarioId, channelId) : null,
    () => fetchChannelsSeasonal(scenarioId!, channelId),
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
 * Fetch period-of-record Pearson r flow alteration index and full-period aggregates (Metric 3).
 *
 * Returns one row per channel reach (59 rows).
 * pearson_r: correlation between monthly simulated and unimpaired flow over the full
 * 1,200-month period (WY 1922-2021). r ≈ +1 = natural timing preserved; r ≈ 0 = altered.
 * mif_met_pct: fraction of months where flow >= binding MIF (NULL if has_mif = false).
 *
 * @param scenarioId - Scenario ID (e.g., "s0020") or null to suspend
 * @param channelId - Optional single channel filter
 */
export function useChannelsPeriodSummary(
  scenarioId: string | null,
  channelId?: string,
) {
  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<ChannelsPeriodSummaryResponse>(
    scenarioId ? CACHE_KEYS.channelsPeriodSummary(scenarioId, channelId) : null,
    () => fetchChannelsPeriodSummary(scenarioId!, channelId),
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

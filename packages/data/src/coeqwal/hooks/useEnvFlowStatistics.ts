"use client"

/**
 * Hooks for fetching environmental river flow channel metadata
 *
 * Channel-level scenario data is served through the batch endpoint.
 *
 * Water months: 1=October ... 12=September
 * CFS: cubic feet per second (raw flow)
 */

import useSWR from "swr"
import { CACHE_KEYS } from "../../cache/keys"
import { fetchChannelsList } from "../fetchers"
import type { ChannelsListResponse } from "../types"

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

"use client"

/**
 * SWR-based hook for fetching local JSON/GeoJSON files
 *
 * Provides caching, loading states, and automatic deduplication via SWR.
 * 
 * ## For local static files
 * The browser's HTTP cache already handles caching for local files.
 * This hook adds React-level convenience (loading states, deduplication)
 * but is not strictly necessary for static data.
 *
 * ## When to use this hook
 * - Loading static JSON/GeoJSON
 * - When you need built-in `isLoading` and `error` states
 * - When multiple components need the same data (SWR deduplicates requests)
 *
 */

import useSWR from "swr"
import { useMemo } from "react"
import type { DataHookResult } from "./types"

/**
 * Options for useLocalData hook
 */
export interface UseLocalDataOptions<T, R = T> {
  /** Transform raw data after fetching */
  transform?: (data: T) => R
  /** Custom cache key (defaults to URL) */
  cacheKey?: string
  /** Skip fetching (useful for conditional fetching) */
  skip?: boolean
}

/**
 * Fetcher function for local JSON files
 */
async function localFetcher<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`)
  }
  return response.json() as Promise<T>
}

/**
 * Hook for fetching local JSON/GeoJSON files with SWR caching
 *
 * This hook provides:
 * - Automatic caching and deduplication
 * - Loading and error states
 * - Optional data transformation
 * - No revalidation (local files don't change)
 *
 * @param url - URL to the local JSON file (e.g., "/data/markers.json")
 * @param options - Configuration options
 * @returns Data hook result with data, error, and loading state
 *
 * @example
 * ```typescript
 * // Simple usage
 * const { data, isLoading, error } = useLocalData<MarkerData[]>("/data/markers.json")
 *
 * // With transformation
 * const { data } = useLocalData<RawData, ProcessedData>(
 *   "/data/raw.json",
 *   { transform: (raw) => processData(raw) }
 * )
 *
 * // Conditional fetching
 * const { data } = useLocalData<Config>(
 *   "/data/config.json",
 *   { skip: !isReady }
 * )
 * ```
 */
export function useLocalData<T, R = T>(
  url: string | null,
  options: UseLocalDataOptions<T, R> = {},
): DataHookResult<R> {
  const { transform, cacheKey, skip = false } = options

  // Determine the SWR key - null skips fetching
  const swrKey = skip || !url ? null : (cacheKey ?? url)

  const {
    data: rawData,
    error: swrError,
    isLoading,
  } = useSWR<T>(swrKey, () => localFetcher<T>(url!), {
    // Local files don't change, so disable revalidation
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
    // Don't retry on error (file either exists or doesn't)
    shouldRetryOnError: false,
  })

  // Apply transformation if provided
  const data = useMemo(() => {
    if (rawData === undefined) return undefined
    if (transform) {
      return transform(rawData)
    }
    return rawData as unknown as R
  }, [rawData, transform])

  // Convert SWR error to string
  const error = swrError ? String(swrError.message || swrError) : null

  return {
    data,
    error,
    isLoading,
  }
}

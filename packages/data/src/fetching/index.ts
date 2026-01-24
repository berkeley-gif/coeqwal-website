/**
 * @repo/data/fetching - Universal data fetching utilities
 *
 * Provides standardized fetching patterns for all COEQWAL apps.
 */

// Types
export { FetchError, type FetchOptions, type DataHookResult } from "./types"

// Fetcher
export { apiFetcher } from "./fetcher"

// Hooks
export { useLocalData, type UseLocalDataOptions } from "./useLocalData"

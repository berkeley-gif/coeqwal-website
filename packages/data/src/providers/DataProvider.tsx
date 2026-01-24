"use client"

/**
 * DataProvider - Global SWR configuration for COEQWAL apps
 *
 * Wraps the application with SWRConfig to provide consistent
 * caching behavior across all data fetching hooks.
 */

import { SWRConfig } from "swr"
import type { ReactNode } from "react"
import { apiFetcher } from "../fetching/fetcher"
import { DEFAULT_API_BASE } from "../coeqwal/api"

/**
 * Default SWR options optimized for static/semi-static data
 */
const DEFAULT_SWR_OPTIONS = {
  /** Deduplication window - prevents duplicate requests within this time */
  dedupingInterval: 60000, // 1 minute

  /** Don't refetch when window regains focus (data is static) */
  revalidateOnFocus: false,

  /** Do refetch when network reconnects (might have stale data) */
  revalidateOnReconnect: true,

  /** Number of retry attempts on error */
  errorRetryCount: 2,

  /** Retry on error (for transient failures) */
  shouldRetryOnError: true,
}

/**
 * Props for DataProvider component
 */
export interface DataProviderProps {
  children: ReactNode

  /**
   * Base URL for API requests
   * @example "https://api.coeqwal.org/api"
   */
  apiBaseUrl?: string

  /**
   * Override default SWR options
   */
  swrOptions?: {
    dedupingInterval?: number
    revalidateOnFocus?: boolean
    revalidateOnReconnect?: boolean
    errorRetryCount?: number
    shouldRetryOnError?: boolean
  }
}

/**
 * Global data provider for COEQWAL applications
 *
 * Provides consistent SWR configuration across the entire app:
 * - Long deduplication interval for static data
 * - Disabled revalidation on focus (data doesn't change)
 * - Automatic retry on transient errors
 *
 * @example
 * ```tsx
 * // In app/layout.tsx
 * import { DataProvider } from "@repo/data/providers"
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <DataProvider>
 *           {children}
 *         </DataProvider>
 *       </body>
 *     </html>
 *   )
 * }
 * ```
 */
export function DataProvider({
  children,
  apiBaseUrl = DEFAULT_API_BASE,
  swrOptions = {},
}: DataProviderProps) {
  const mergedOptions = {
    ...DEFAULT_SWR_OPTIONS,
    ...swrOptions,
  }

  // Create a global fetcher with the API base URL baked in
  const globalFetcher = (key: string) => {
    // Only prepend baseUrl for relative API paths
    // Absolute URLs (http://) and local paths (/data/) are fetched as-is
    const isRelativeApiPath =
      key.startsWith("/api/") || key.startsWith("/tiers/")
    const url = isRelativeApiPath ? `${apiBaseUrl}${key}` : key
    return apiFetcher(url)
  }

  return (
    <SWRConfig
      value={{
        ...mergedOptions,
        fetcher: globalFetcher,
      }}
    >
      {children}
    </SWRConfig>
  )
}

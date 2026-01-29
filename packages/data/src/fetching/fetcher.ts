/**
 * Universal fetch wrapper with retry logic and error handling
 *
 * **Note:** This is a low-level utility for internal use.
 * React component developers should use hooks from `@repo/data/coeqwal/hooks`:
 * - `useTierList()` - fetch tier definitions
 * - `useScenarios()` - fetch scenario list
 * - `useTierMapping()` - get short_code -> name mapping
 *
 * This function is used internally by fetchers in `fetchers.ts`.
 */

import { FetchError, type FetchOptions } from "./types"

const DEFAULT_TIMEOUT = 10000
const DEFAULT_RETRIES = 2

/**
 * Delay helper for retry
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Determines if an error is retryable based on status code
 */
function isRetryableStatus(status: number): boolean {
  // Retry on server errors (5xx) and rate limiting (429)
  return status >= 500 || status === 429
}

/**
 * Universal fetch wrapper with timeout, retries, and error handling
 * Documentation for maintainers adding to fetchers
 * Developers would use the hooks that use this
 *
 * @param endpoint - API endpoint (will be appended to baseUrl if provided)
 * @param options - Fetch configuration options
 * @returns Parsed JSON response
 * @throws FetchError on failure
 *
 * @example
 * ```typescript
 * import { DEFAULT_API_BASE, ENDPOINTS } from "../coeqwal/api"
 * import type { TierListItem, ScenarioTiersResponse } from "../coeqwal/types"
 *
 * // Fetch list of all tiers/outcomes
 * const tiers = await apiFetcher<TierListItem[]>(ENDPOINTS.TIER_LIST, {
 *  baseUrl: DEFAULT_API_BASE,
 * })
 * // [{ short_code: "AG_REV", name: "Agricultural revenue", ... }, ...]
 *
 * // Fetch tier data for a specific scenario
 * const scenarioData = await apiFetcher<ScenarioTiersResponse>(
 *   ENDPOINTS.scenarioTiers("s0020"),
 *  { baseUrl: DEFAULT_API_BASE }
 * )
 * // { scenario: "s0020", tiers: { AG_REV: {...}, ENV_FLOW: {...} } }
 * ```
 */

export async function apiFetcher<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const {
    baseUrl = "",
    timeout = DEFAULT_TIMEOUT,
    retries = DEFAULT_RETRIES,
    headers = {},
  } = options

  const url = baseUrl ? `${baseUrl}${endpoint}` : endpoint
  let lastError: FetchError | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const retryable = isRetryableStatus(response.status)
        throw new FetchError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          endpoint,
          retryable,
        )
      }

      return response.json() as Promise<T>
    } catch (error) {
      // Handle abort (timeout)
      if (error instanceof DOMException && error.name === "AbortError") {
        lastError = new FetchError(
          `Request timeout after ${timeout}ms`,
          0,
          endpoint,
          true,
        )
      }
      // Handle FetchError (from response.ok check)
      else if (error instanceof FetchError) {
        lastError = error
      }
      // Handle network errors
      else if (error instanceof Error) {
        lastError = new FetchError(error.message, 0, endpoint, true)
      }
      // Unknown error
      else {
        lastError = new FetchError("Unknown fetch error", 0, endpoint, false)
      }

      // Retry if we have attempts left and error is retryable
      if (attempt < retries && lastError.retryable) {
        // Exponential backoff: 1s, 2s, 4s...
        await delay(1000 * Math.pow(2, attempt))
        continue
      }

      break
    }
  }

  throw lastError
}

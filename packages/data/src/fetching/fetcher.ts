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
import { isPerfEnabled, pushPerfRecord } from "../perf/perfLog"

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
  // Retry only on transient errors: rate limiting (429) and gateway/availability
  // errors (502, 503, 504). A 500 Internal Server Error is a definitive failure
  // on the backend and should not be retried.
  return status === 429 || status === 502 || status === 503 || status === 504
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
 * // { scenario: "s0020", tiers: { AG_REV: {...}, ENV_FLOWS: {...} } }
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

  // Dev-only timing (NEXT_PUBLIC_PERF_LOG=1): one PerfApiRecord per call,
  // covering all attempts including backoff sleeps. Flag off: zero overhead
  // beyond a boolean check, and the response.json() path is untouched.
  const perfOn = isPerfEnabled()
  const clock = () =>
    typeof performance !== "undefined" ? performance.now() : Date.now()
  const tFirst = perfOn ? clock() : 0
  let attempts = 0
  let timedOut = false

  for (let attempt = 0; attempt <= retries; attempt++) {
    attempts = attempt + 1
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)
      const tAttempt = perfOn ? clock() : 0

      const response = await fetch(url, {
        signal: controller.signal,
        // No default Content-Type: these are bodyless GETs, and a
        // non-safelisted Content-Type (application/json) forces a CORS
        // preflight (OPTIONS) before every request. On a cold load that
        // doubles the request count and intermittently drops requests,
        // which the browser mislabels as a CORS failure. Callers that send
        // a body can still pass their own Content-Type via `headers`.
        headers: { ...headers },
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

      if (perfOn) {
        // Read text then parse so body-download and parse are separable.
        const text = await response.text()
        const tBodyDone = clock()
        const data = JSON.parse(text) as T
        const tParsed = clock()
        const contentLength = response.headers.get("content-length")
        pushPerfRecord({
          kind: "api",
          url,
          status: response.status,
          attempts,
          timedOut,
          totalMs: tParsed - tFirst,
          netMs: tBodyDone - tAttempt,
          parseMs: tParsed - tBodyDone,
          transferBytes: contentLength ? Number(contentLength) : null,
          decodedChars: text.length,
          t: tFirst,
        })
        return data
      }

      return response.json() as Promise<T>
    } catch (error) {
      // Handle abort (timeout)
      if (error instanceof DOMException && error.name === "AbortError") {
        timedOut = true
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

  if (perfOn && lastError) {
    pushPerfRecord({
      kind: "api",
      url,
      status: lastError.status,
      attempts,
      timedOut,
      totalMs: clock() - tFirst,
      netMs: null,
      parseMs: null,
      transferBytes: null,
      decodedChars: null,
      t: tFirst,
    })
  }

  throw lastError
}

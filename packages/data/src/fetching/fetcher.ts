/**
 * Universal fetch wrapper with retry logic and error handling
 */

import { FetchError, type FetchOptions } from "./types"

const DEFAULT_TIMEOUT = 10000
const DEFAULT_RETRIES = 2

/**
 * Delay helper for retry backoff
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
 *
 * @param endpoint - API endpoint (will be appended to baseUrl if provided)
 * @param options - Fetch configuration options
 * @returns Parsed JSON response
 * @throws FetchError on failure
 *
 * @example
 * ```typescript
 * const data = await apiFetcher<UserData>("/users/123", {
 *   baseUrl: "https://api.example.com",
 *   timeout: 5000,
 * })
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

/**
 * Shared types for data fetching utilities
 */

/**
 * Options for the universal fetcher
 */
export interface FetchOptions {
  /** Base URL to prepend to endpoints */
  baseUrl?: string
  /** Request timeout in milliseconds (default: 10000) */
  timeout?: number
  /** Number of retry attempts on failure (default: 2) */
  retries?: number
  /** Additional headers to include in requests */
  headers?: Record<string, string>
}

/**
 * Custom error class for fetch failures with additional context
 */
export class FetchError extends Error {
  /** HTTP status code (0 if network error) */
  public readonly status: number
  /** The endpoint that was requested */
  public readonly endpoint: string
  /** Whether the error is retryable */
  public readonly retryable: boolean

  constructor(
    message: string,
    status: number,
    endpoint: string,
    retryable = false,
  ) {
    super(message)
    this.name = "FetchError"
    this.status = status
    this.endpoint = endpoint
    this.retryable = retryable
  }
}

/**
 * Standard response shape for data hooks
 */
export interface DataHookResult<T> {
  /** The fetched data, or undefined if loading/error */
  data: T | undefined
  /** Error message if fetch failed */
  error: string | null
  /** Whether the data is currently loading */
  isLoading: boolean
}

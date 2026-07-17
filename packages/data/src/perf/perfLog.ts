/**
 * perfLog.ts - dev-only latency instrumentation core
 *
 * Purpose: a bounded in-memory buffer of timing records plus tiny helpers
 * (perfMark, perfTime) used by the fetch layer, SWR middleware, store
 * subscription, and panel paint marks. All entry points are no-ops unless
 * the build/dev server runs with NEXT_PUBLIC_PERF_LOG=1.
 *
 * Exports NO React hooks on purpose: store files import this module and
 * store slice files must never import React hook modules.
 *
 * Side effects: registerPerfGlobal() attaches window.__coeqwalPerf (browser
 * only, flag on) so an external driver (Playwright) can harvest records.
 * No network writes, no console output, no persistent storage.
 */

/** Primitive detail bag attached to marks and measures */
export type PerfDetail = Record<string, string | number | boolean | null>

export interface PerfApiRecord {
  kind: "api"
  /** Full request URL as passed to fetch */
  url: string
  /** HTTP status of the final attempt (0 = network error or timeout) */
  status: number
  /** Attempts made (1 = no retry) */
  attempts: number
  /** Whether any attempt hit the abort timeout */
  timedOut: boolean
  /** ms from first attempt start to settled, including retries and backoff */
  totalMs: number
  /** ms of the final attempt's network span (headers + body), null on error */
  netMs: number | null
  /** ms spent in JSON.parse of the final body, null on error */
  parseMs: number | null
  /** Content-Length response header when present (cross-origin safelisted) */
  transferBytes: number | null
  /** Decoded body length in characters (about bytes for ASCII JSON) */
  decodedChars: number | null
  /** perf-clock timestamp at first attempt start */
  t: number
}

export interface PerfMarkRecord {
  kind: "mark" | "measure"
  name: string
  /** perf-clock timestamp (mark) or span start (measure) */
  t: number
  /** Span duration, measures only */
  durMs?: number
  detail?: PerfDetail
}

export type PerfRecord = PerfApiRecord | PerfMarkRecord

const MAX_RECORDS = 5000

const records: PerfRecord[] = []

/** Monotonic ms clock that works in both browser and node contexts */
function now(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now()
}

/** True when running with NEXT_PUBLIC_PERF_LOG=1 (build-time inlined in app builds) */
export function isPerfEnabled(): boolean {
  return process.env.NEXT_PUBLIC_PERF_LOG === "1"
}

/** Append to the bounded buffer. No-op when the flag is off. */
export function pushPerfRecord(record: PerfRecord): void {
  if (!isPerfEnabled()) return
  if (records.length >= MAX_RECORDS) records.shift()
  records.push(record)
}

/** Snapshot copy of the buffer (safe to serialize) */
export function getPerfRecords(): PerfRecord[] {
  return [...records]
}

/** Empty the buffer (between driver runs) */
export function clearPerfRecords(): void {
  records.length = 0
}

/**
 * Record a named instant. Also emits a native performance.mark so the
 * timeline is visible in DevTools during manual runs.
 */
export function perfMark(name: string, detail?: PerfDetail): void {
  if (!isPerfEnabled()) return
  if (
    typeof performance !== "undefined" &&
    typeof performance.mark === "function"
  ) {
    performance.mark(name)
  }
  pushPerfRecord({ kind: "mark", name, t: now(), detail })
}

/** Time a synchronous fn; returns its result. Records a measure when the flag is on. */
export function perfTime<T>(name: string, fn: () => T): T {
  if (!isPerfEnabled()) return fn()
  const t0 = now()
  const out = fn()
  pushPerfRecord({ kind: "measure", name, t: t0, durMs: now() - t0 })
  return out
}

/**
 * Driver-facing action signature. Deliberately loose: actions are dev-only
 * escape hatches invoked from Playwright page.evaluate, never from app code.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PerfAction = (...args: any[]) => unknown

interface PerfGlobal {
  records: () => PerfRecord[]
  clear: () => void
  dump: () => string
  actions: Record<string, PerfAction>
  bench?: (iterations?: number) => unknown
}

declare global {
  interface Window {
    __coeqwalPerf?: PerfGlobal
  }
}

/**
 * Attach the harvest surface to window (browser only, flag on, idempotent).
 * Side effect: defines window.__coeqwalPerf.
 */
export function registerPerfGlobal(): void {
  if (!isPerfEnabled() || typeof window === "undefined") return
  if (window.__coeqwalPerf) return
  window.__coeqwalPerf = {
    records: getPerfRecords,
    clear: clearPerfRecords,
    dump: () => JSON.stringify(getPerfRecords()),
    actions: {},
  }
}

/**
 * Expose a dev-only action (for example a store selection setter) so the
 * Playwright driver can trigger app flows without brittle UI selectors.
 * No-op unless the flag is on and window exists.
 */
export function registerPerfAction(name: string, fn: PerfAction): void {
  if (!isPerfEnabled() || typeof window === "undefined") return
  registerPerfGlobal()
  if (window.__coeqwalPerf) window.__coeqwalPerf.actions[name] = fn
}

/**
 * @repo/data/perf - dev-only latency instrumentation (flag-gated)
 *
 * Everything here is a no-op unless NEXT_PUBLIC_PERF_LOG=1.
 */

export {
  isPerfEnabled,
  pushPerfRecord,
  getPerfRecords,
  clearPerfRecords,
  perfMark,
  perfTime,
  registerPerfGlobal,
  registerPerfAction,
} from "./perfLog"

export { swrTimingMiddleware } from "./swrTiming"

export type {
  PerfApiRecord,
  PerfMarkRecord,
  PerfRecord,
  PerfDetail,
  PerfAction,
} from "./perfLog"

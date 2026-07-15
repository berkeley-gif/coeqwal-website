/**
 * computeBench.ts - dev-only front-end quantile compute benchmark
 *
 * Times the panel's real quantile functions (mockDataEngine.seriesStats,
 * which calls quantileSorted) over synthetic 100-point series (one value
 * per simulated water year), at three scales:
 *   x1  - one variable, whole-record quantile set
 *   x6  - one variable, record + 5 water-year-type subsets
 *   x6 across 20 variables and 6 scenarios (720 stat sets, worst case)
 * These bound the front-end cost of computing box-plot/exceedance stats
 * client-side instead of fetching pre-computed percentiles.
 *
 * Pure and synchronous; invoked via window.__coeqwalPerf.bench(iterations).
 */

import { seriesStats } from "../config/mockDataEngine"

export interface ComputeBenchResult {
  label: string
  iterations: number
  medianMs: number
  minMs: number
  maxMs: number
}

function makeSeries(length: number, seed: number): number[] {
  // Deterministic pseudo-random values; the cost of seriesStats depends on
  // length, not values, but avoid pathological all-equal input.
  const out: number[] = []
  let x = seed
  for (let i = 0; i < length; i++) {
    x = (x * 1103515245 + 12345) % 2147483648
    out.push(x / 2147483.648)
  }
  return out
}

function median(sortedValues: number[]): number {
  const mid = Math.floor(sortedValues.length / 2)
  return sortedValues.length % 2
    ? (sortedValues[mid] as number)
    : ((sortedValues[mid - 1] as number) + (sortedValues[mid] as number)) / 2
}

function runCase(
  label: string,
  iterations: number,
  fn: () => void,
): ComputeBenchResult {
  const times: number[] = []
  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now()
    fn()
    times.push(performance.now() - t0)
  }
  times.sort((a, b) => a - b)
  return {
    label,
    iterations,
    medianMs: median(times),
    minMs: times[0] as number,
    maxMs: times[times.length - 1] as number,
  }
}

export function runComputeBench(iterations = 10): ComputeBenchResult[] {
  const record = makeSeries(100, 42)
  // Five water-year-type subsets of 20 years each
  const wytSubsets = [0, 1, 2, 3, 4].map((k) =>
    record.slice(k * 20, k * 20 + 20),
  )

  const statsX1 = () => {
    seriesStats(record)
  }
  const statsX6 = () => {
    seriesStats(record)
    for (const subset of wytSubsets) seriesStats(subset)
  }

  return [
    runCase("fe-quantiles x1 (1 var, record)", iterations, statsX1),
    runCase("fe-quantiles x6 (1 var, record + 5 WYT)", iterations, statsX6),
    runCase("fe-quantiles x6 x 20 vars x 6 scenarios", iterations, () => {
      for (let v = 0; v < 20; v++) {
        for (let s = 0; s < 6; s++) statsX6()
      }
    }),
  ]
}

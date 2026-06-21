"use client"

/**
 * useEnvFlowData - data layer for the Environmental River Flows section.
 *
 * Shapes the batched `env_flow` response into the matrices and per-cell
 * stats the `PercentileMatrix` renderer consumes. A single monthly fetch
 * powers both chart modes (flow volume and % unimpaired), so both matrices
 * are derived together.
 *
 * Kept separate from `EnvFlowSection.tsx` so the section component stays a
 * thin orchestrator: it owns the dropdown UI state and wires the matrices
 * into the renderer, while all data transforms live here.
 */

import { useMemo } from "react"
import type { MonthlyPercentiles, CellStatsMap } from "@repo/viz"
import type {
  ChannelMonthlyStats,
  ChannelPeriodSummary,
  BatchEnvFlowData,
} from "@repo/data/coeqwal"

/** Matrix data structure for monthly percentiles (entityId to scenarioId to bands) */
type MatrixDataType = Record<
  string,
  Record<string, MonthlyPercentiles | undefined>
>

/** Flow volume unit toggle. */
export type FlowUnit = "taf" | "cfs"

/**
 * Flow volume percentile bands (CFS or TAF) from migration-28 columns.
 * Skips months where the median is null/undefined (missing or old API).
 */
function rowsToVolumePercentiles(
  rows: ChannelMonthlyStats[],
  unit: FlowUnit,
): MonthlyPercentiles {
  const monthly: MonthlyPercentiles = {}
  for (const row of rows) {
    if (unit === "taf") {
      if (row.flow_q50_taf == null) continue
      monthly[String(row.water_month)] = {
        q0: row.flow_q0_taf ?? 0,
        q10: row.flow_q10_taf ?? 0,
        q30: row.flow_q30_taf ?? 0,
        q50: row.flow_q50_taf,
        q70: row.flow_q70_taf ?? 0,
        q90: row.flow_q90_taf ?? 0,
        q100: row.flow_q100_taf ?? 0,
        mean: row.flow_avg_taf ?? 0,
      }
    } else {
      if (row.flow_q50_cfs == null) continue
      monthly[String(row.water_month)] = {
        q0: row.flow_q0_cfs ?? 0,
        q10: row.flow_q10_cfs ?? 0,
        q30: row.flow_q30_cfs ?? 0,
        q50: row.flow_q50_cfs,
        q70: row.flow_q70_cfs ?? 0,
        q90: row.flow_q90_cfs ?? 0,
        q100: row.flow_q100_cfs ?? 0,
        mean: row.flow_avg_cfs ?? 0,
      }
    }
  }
  return monthly
}

/**
 * % Unimpaired percentile bands from the q0-q100 / pct_unimpaired columns.
 * NULL where no unimpaired reference exists (Mokelumne, some canals).
 * Values are percentages (0-infinity). Highly regulated reaches can exceed 100%.
 */
function rowsToPctUnimpairedPercentiles(
  rows: ChannelMonthlyStats[],
): MonthlyPercentiles {
  const monthly: MonthlyPercentiles = {}
  for (const row of rows) {
    if (row.q50 == null) continue
    monthly[String(row.water_month)] = {
      q0: row.q0 ?? 0,
      q10: row.q10 ?? 0,
      q30: row.q30 ?? 0,
      q50: row.q50,
      q70: row.q70 ?? 0,
      q90: row.q90 ?? 0,
      q100: row.q100 ?? 0,
      mean: row.pct_unimpaired_avg ?? 0,
    }
  }
  return monthly
}

/**
 * Annual average flow in TAF/yr = sum of 12 monthly flow_avg_taf values.
 * Returns null if any monthly value is missing (no data for that channel).
 */
function computeAnnualAvgTaf(rows: ChannelMonthlyStats[]): number | null {
  if (!rows.length) return null
  let total = 0
  let count = 0
  for (const row of rows) {
    if (row.flow_avg_taf != null) {
      total += row.flow_avg_taf
      count++
    }
  }
  return count === 12 ? total : count > 0 ? total * (12 / count) : null
}

/**
 * Annual average flow in CFS = mean of 12 monthly flow_avg_cfs values.
 */
function computeAnnualAvgCfs(rows: ChannelMonthlyStats[]): number | null {
  const vals = rows
    .map((r) => r.flow_avg_cfs)
    .filter((v): v is number => v != null)
  return vals.length === 12 ? vals.reduce((a, b) => a + b, 0) / 12 : null
}

/**
 * Build the monthly volume / % unimpaired matrices and annual per-cell
 * stats from the batched env_flow response.
 */
function buildMonthlyMatrices(
  scenarios: string[],
  envFlowBatch: Record<string, BatchEnvFlowData> | undefined,
  unit: FlowUnit,
) {
  const volumeMatrix: MatrixDataType = {}
  const pctMatrix: MatrixDataType = {}
  const annualCellStats: CellStatsMap = {}

  scenarios.forEach((scenarioId) => {
    const rows = envFlowBatch?.[scenarioId]?.monthly?.data
    if (!rows?.length) return

    const byChannel = new Map<string, ChannelMonthlyStats[]>()
    for (const row of rows) {
      if (!byChannel.has(row.network_arc_id))
        byChannel.set(row.network_arc_id, [])
      byChannel.get(row.network_arc_id)!.push(row)
    }

    for (const [arcId, arcRows] of byChannel.entries()) {
      if (!volumeMatrix[arcId]) volumeMatrix[arcId] = {}
      volumeMatrix[arcId][scenarioId] = rowsToVolumePercentiles(arcRows, unit)

      if (!pctMatrix[arcId]) pctMatrix[arcId] = {}
      pctMatrix[arcId][scenarioId] = rowsToPctUnimpairedPercentiles(arcRows)

      // Annual avg flow for per-cell stats. PercentileMatrix has two slots,
      // so we show TAF/yr in the primary slot when unit is taf, otherwise
      // CFS avg.
      const annualTaf = computeAnnualAvgTaf(arcRows)
      const annualCfs = computeAnnualAvgCfs(arcRows)
      if (!annualCellStats[arcId]) annualCellStats[arcId] = {}
      annualCellStats[arcId]![scenarioId] = {
        annualAvgTaf:
          unit === "taf" ? (annualTaf ?? undefined) : (annualCfs ?? undefined),
      }
    }
  })

  return { volumeMatrix, pctMatrix, annualCellStats }
}

/** MIF compliance % from period-of-record summaries in the batch response. */
function buildMifStats(
  scenarios: string[],
  envFlowBatch: Record<string, BatchEnvFlowData> | undefined,
): CellStatsMap {
  const mifStats: CellStatsMap = {}
  scenarios.forEach((scenarioId) => {
    const summaries = envFlowBatch?.[scenarioId]?.period?.data
    if (!summaries?.length) return
    for (const summary of summaries as ChannelPeriodSummary[]) {
      if (!mifStats[summary.network_arc_id])
        mifStats[summary.network_arc_id] = {}
      mifStats[summary.network_arc_id]![scenarioId] = {
        reliabilityPct: summary.mif_met_pct ?? undefined,
      }
    }
  })
  return mifStats
}

/**
 * Derives both chart-mode matrices and the merged per-cell stats from the
 * batched env_flow response.
 *
 * Returns:
 * - `volumeMatrix` - monthly flow volume percentiles (TAF or CFS per `unit`)
 * - `pctMatrix` - monthly % unimpaired percentiles
 * - `cellStats` - per-cell annual avg flow + MIF compliance %
 * - `isLoading` / `loadingScenarios` - mirror the batch fetch state
 */
export function useEnvFlowData(
  scenarios: string[],
  envFlowBatch: Record<string, BatchEnvFlowData> | undefined,
  unit: FlowUnit,
  isBatchLoading: boolean,
) {
  const { volumeMatrix, pctMatrix, annualCellStats } = useMemo(
    () => buildMonthlyMatrices(scenarios, envFlowBatch, unit),
    [scenarios, envFlowBatch, unit],
  )

  const mifStats = useMemo(
    () => buildMifStats(scenarios, envFlowBatch),
    [scenarios, envFlowBatch],
  )

  // Merge annual avg flow + MIF compliance into one CellStatsMap
  const cellStats = useMemo<CellStatsMap>(() => {
    const merged: CellStatsMap = {}
    const arcIds = new Set([
      ...Object.keys(annualCellStats),
      ...Object.keys(mifStats),
    ])
    for (const arcId of arcIds) {
      merged[arcId] = {}
      for (const scenarioId of scenarios) {
        merged[arcId]![scenarioId] = {
          annualAvgTaf: annualCellStats[arcId]?.[scenarioId]?.annualAvgTaf,
          reliabilityPct: mifStats[arcId]?.[scenarioId]?.reliabilityPct,
        }
      }
    }
    return merged
  }, [annualCellStats, mifStats, scenarios])

  return {
    volumeMatrix,
    pctMatrix,
    cellStats,
    isLoading: isBatchLoading,
    loadingScenarios: isBatchLoading ? scenarios : [],
  }
}

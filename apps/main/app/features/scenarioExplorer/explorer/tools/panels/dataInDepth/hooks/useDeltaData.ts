"use client"

/**
 * useDeltaData - data layer for the Delta section.
 *
 * The Delta section draws from two sources:
 *   - the per-scenario `delta/monthly` endpoint (X2, salinity, outflow), fanned
 *     out across scenarios via `useMultiScenarioSlots`
 *   - the batched `env_flow` response (inflow / export channel flows)
 *
 * This module owns the fetch fan-out and the pure matrix builders that shape
 * those rows into the `PercentileMatrix` format. The section component keeps
 * the chart-group config (which variables / channels belong to each card) and
 * the entity-label builders, so it stays a thin orchestrator.
 */

import { useMemo } from "react"
import type { MonthlyPercentiles } from "@repo/viz"
import { useMultiScenarioSlots } from "./useMultiScenarioSlots"
import { useResolvedIdMapping } from "../../../../../../scenarios/hooks"
import { useDeltaMonthly } from "@repo/data/coeqwal/hooks"
import type {
  DeltaMonthlyStats,
  ChannelMonthlyStats,
  BatchEnvFlowData,
} from "@repo/data/coeqwal"

/** Matrix data structure for monthly percentiles (entityId to scenarioId to bands) */
export type MatrixDataType = Record<
  string,
  Record<string, MonthlyPercentiles | undefined>
>

function rowsToMonthlyPercentiles(
  rows: DeltaMonthlyStats[],
): MonthlyPercentiles {
  const monthly: MonthlyPercentiles = {}
  for (const row of rows) {
    // Skip months whose ETL row is missing percentile data. Zero-filling
    // would draw a misleading floor on the band chart, so leave a gap
    // instead and let the viz layer omit that month.
    if (
      row.q0 == null ||
      row.q10 == null ||
      row.q30 == null ||
      row.q50 == null ||
      row.q70 == null ||
      row.q90 == null ||
      row.q100 == null ||
      row.avg == null
    ) {
      continue
    }
    monthly[String(row.water_month)] = {
      q0: row.q0,
      q10: row.q10,
      q30: row.q30,
      q50: row.q50,
      q70: row.q70,
      q90: row.q90,
      q100: row.q100,
      mean: row.avg,
    }
  }
  return monthly
}

function channelRowsToPercentiles(
  rows: ChannelMonthlyStats[],
): MonthlyPercentiles {
  const monthly: MonthlyPercentiles = {}
  for (const row of rows) {
    // Same rationale as `rowsToMonthlyPercentiles`. Skip months with any
    // missing TAF percentile rather than zero-filling, to avoid a fake
    // floor at the band chart baseline.
    if (
      row.flow_q0_taf == null ||
      row.flow_q10_taf == null ||
      row.flow_q30_taf == null ||
      row.flow_q50_taf == null ||
      row.flow_q70_taf == null ||
      row.flow_q90_taf == null ||
      row.flow_q100_taf == null ||
      row.flow_avg_taf == null
    ) {
      continue
    }
    monthly[String(row.water_month)] = {
      q0: row.flow_q0_taf,
      q10: row.flow_q10_taf,
      q30: row.flow_q30_taf,
      q50: row.flow_q50_taf,
      q70: row.flow_q70_taf,
      q90: row.flow_q90_taf,
      q100: row.flow_q100_taf,
      mean: row.flow_avg_taf,
    }
  }
  return monthly
}

/**
 * Build a percentile matrix for the given Delta variable codes (e.g. the
 * salinity compliance points or the outflow variable) from fanned-out
 * `delta/monthly` rows.
 */
export function buildMatrixForVariables(
  allData: Record<string, DeltaMonthlyStats[]>,
  variableCodes: string[],
): MatrixDataType {
  const matrix: MatrixDataType = {}
  for (const varCode of variableCodes) {
    matrix[varCode] = {}
  }

  for (const [scenarioId, rows] of Object.entries(allData)) {
    const byVar = new Map<string, DeltaMonthlyStats[]>()
    for (const row of rows) {
      if (!variableCodes.includes(row.variable_code)) continue
      if (!byVar.has(row.variable_code)) byVar.set(row.variable_code, [])
      byVar.get(row.variable_code)!.push(row)
    }
    for (const [varCode, varRows] of byVar.entries()) {
      if (!matrix[varCode]) matrix[varCode] = {}
      matrix[varCode][scenarioId] = rowsToMonthlyPercentiles(varRows)
    }
  }

  return matrix
}

/**
 * Build a percentile matrix for the given channel ids (Delta inflows /
 * exports) from the batched env_flow channel rows.
 */
export function buildChannelMatrix(
  allData: Record<string, ChannelMonthlyStats[]>,
  channelIds: readonly string[],
): MatrixDataType {
  const matrix: MatrixDataType = {}
  for (const id of channelIds) {
    matrix[id] = {}
  }

  for (const [scenarioId, rows] of Object.entries(allData)) {
    const byChannel = new Map<string, ChannelMonthlyStats[]>()
    for (const row of rows) {
      if (!channelIds.includes(row.network_arc_id)) continue
      if (!byChannel.has(row.network_arc_id))
        byChannel.set(row.network_arc_id, [])
      byChannel.get(row.network_arc_id)!.push(row)
    }
    for (const [channelId, channelRows] of byChannel.entries()) {
      if (!matrix[channelId]) matrix[channelId] = {}
      matrix[channelId][scenarioId] = channelRowsToPercentiles(channelRows)
    }
  }

  return matrix
}

/**
 * Fetch the Delta section's two data sources for all scenarios.
 *
 * Returns:
 * - `deltaData` - per-scenario `delta/monthly` rows (X2, salinity, outflow)
 * - `channelData` - per-scenario env_flow channel rows (inflow / export flows)
 *   plus matching `isLoading` / `loadingScenarios` for each source
 */
export function useDeltaData(
  scenarios: string[],
  envFlowBatch: Record<string, BatchEnvFlowData> | undefined,
  isBatchLoading: boolean,
) {
  const { idMapping } = useResolvedIdMapping()
  const fetchIds = useMemo(
    () => scenarios.map((id) => idMapping[id] ?? null),
    [scenarios, idMapping],
  )
  const results = useMultiScenarioSlots(fetchIds, useDeltaMonthly)

  const deltaLoading = results.some((r) => r.isLoading)
  const deltaLoadingScenarios = scenarios.filter(
    (_, i) => results[i]?.isLoading ?? false,
  )

  const deltaData = useMemo(() => {
    const out: Record<string, DeltaMonthlyStats[]> = {}
    results.forEach((result, index) => {
      const scenarioId = scenarios[index]
      if (!scenarioId || !result.rows.length) return
      out[scenarioId] = result.rows
    })
    return out
    // `results` is rebuilt each render by the fan-out helper, so key on its rows
  }, [results, scenarios])

  const channelData = useMemo(() => {
    const out: Record<string, ChannelMonthlyStats[]> = {}
    scenarios.forEach((scenarioId) => {
      const rows = envFlowBatch?.[scenarioId]?.monthly?.data
      if (!rows?.length) return
      out[scenarioId] = rows
    })
    return out
  }, [scenarios, envFlowBatch])

  return {
    deltaData,
    deltaLoading,
    deltaLoadingScenarios,
    channelData,
    channelsLoading: isBatchLoading,
    channelLoadingScenarios: isBatchLoading ? scenarios : [],
  }
}

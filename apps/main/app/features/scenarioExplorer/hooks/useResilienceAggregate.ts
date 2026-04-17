"use client"

/**
 * useResilienceAggregate
 *
 * Reduces the per-(scenario, outcome, hydroclimate) matrix from
 * useResilienceMatrix down to a per-(outcome, hydroclimate) grid
 * aggregated over a chosen scenario-id set.
 *
 * For each aggregate cell, we emit:
 *   - mean:              arithmetic mean of continuousValue across available scenarios.
 *   - riskDensity:       fraction of scenarios with tierLevel >= 3 (among available).
 *   - opportunityDensity: fraction with tierLevel <= 2 (among available).
 *   - distribution:      one entry per input scenario (preserves order);
 *                        unavailable cells carry tierLevel=null.
 *   - count / availableCount: cardinalities, so the viz can detect sparse cells.
 *
 * No network: everything feeds from the already-resolved matrix.
 */

import { useMemo } from "react"
import {
  useResilienceMatrix,
  type ResilienceHydroclimate,
  type ResilienceCell,
  type UseResilienceMatrixResult,
} from "./useResilienceMatrix"

export interface AggregateDistributionEntry {
  scenarioId: string
  tierLevel: number | null
  continuousValue: number | null
  available: boolean
}

export interface ResilienceAggregateCell {
  outcomeCode: string
  hydroclimate: ResilienceHydroclimate
  mean: number | null
  riskDensity: number
  opportunityDensity: number
  distribution: AggregateDistributionEntry[]
  count: number
  availableCount: number
}

export interface UseResilienceAggregateResult {
  /** Scenario IDs actually aggregated (after scope filter). */
  scenarioIds: string[]
  /** Human-readable subject label, e.g. "All 24 scenarios" or "12 selected scenarios". */
  subjectLabel: string
  /** Pre-pivoted aggregate cells: cells[outcomeCode][hc]. */
  cells: Record<
    string,
    Record<ResilienceHydroclimate, ResilienceAggregateCell>
  >
  /** Lookup helper: returns null if outcome/hc is unknown. */
  getCell: (
    outcomeCode: string,
    hydroclimate: ResilienceHydroclimate,
  ) => ResilienceAggregateCell | null
  /** Underlying matrix result (re-exposed for convenience). */
  matrix: UseResilienceMatrixResult
  isLoading: boolean
  error: string | null
}

export interface UseResilienceAggregateOptions {
  /** Row order to aggregate over (defaults to matrix.rowOrder). */
  outcomeCodes?: readonly string[]
  /** Scenario subset to aggregate over. When empty, scenarios = all. */
  scenarioIds?: readonly string[]
  /** Short copy to describe the scope in UI labels. */
  subjectLabel?: string
}

export function useResilienceAggregate(
  options: UseResilienceAggregateOptions = {},
): UseResilienceAggregateResult {
  const matrix = useResilienceMatrix()
  const { cells: matrixCells, hydroclimates, rowOrder, isLoading, error } =
    matrix

  const effectiveScenarioIds = useMemo(() => {
    const list =
      options.scenarioIds && options.scenarioIds.length > 0
        ? Array.from(options.scenarioIds)
        : matrix.scenarioIds
    return list
  }, [options.scenarioIds, matrix.scenarioIds])

  const effectiveOutcomeCodes = useMemo(
    () => options.outcomeCodes ?? rowOrder,
    [options.outcomeCodes, rowOrder],
  )

  const defaultSubjectLabel = useMemo(() => {
    const n = effectiveScenarioIds.length
    const all = matrix.scenarioIds.length
    if (n === all) return `All ${n} scenarios`
    if (n === 1) return "1 selected scenario"
    return `${n} selected scenarios`
  }, [effectiveScenarioIds.length, matrix.scenarioIds.length])

  const subjectLabel = options.subjectLabel ?? defaultSubjectLabel

  const cells = useMemo(() => {
    const out: Record<
      string,
      Record<ResilienceHydroclimate, ResilienceAggregateCell>
    > = {}

    for (const outcomeCode of effectiveOutcomeCodes) {
      const perHc = {} as Record<
        ResilienceHydroclimate,
        ResilienceAggregateCell
      >

      for (const hc of hydroclimates) {
        const distribution: AggregateDistributionEntry[] = []
        let sum = 0
        let availableCount = 0
        let riskCount = 0
        let oppCount = 0

        for (const scenarioId of effectiveScenarioIds) {
          const cell: ResilienceCell | undefined =
            matrixCells[scenarioId]?.[outcomeCode]?.[hc]
          if (!cell) {
            distribution.push({
              scenarioId,
              tierLevel: null,
              continuousValue: null,
              available: false,
            })
            continue
          }

          distribution.push({
            scenarioId,
            tierLevel: cell.tierLevel,
            continuousValue: cell.continuousValue,
            available: cell.available,
          })

          if (cell.available && cell.continuousValue != null) {
            sum += cell.continuousValue
            availableCount += 1
            if (cell.tierLevel != null) {
              if (cell.tierLevel >= 3) riskCount += 1
              if (cell.tierLevel <= 2) oppCount += 1
            }
          }
        }

        const mean = availableCount > 0 ? sum / availableCount : null
        const riskDensity =
          availableCount > 0 ? riskCount / availableCount : 0
        const opportunityDensity =
          availableCount > 0 ? oppCount / availableCount : 0

        perHc[hc] = {
          outcomeCode,
          hydroclimate: hc,
          mean,
          riskDensity,
          opportunityDensity,
          distribution,
          count: effectiveScenarioIds.length,
          availableCount,
        }
      }

      out[outcomeCode] = perHc
    }

    return out
  }, [
    effectiveOutcomeCodes,
    effectiveScenarioIds,
    hydroclimates,
    matrixCells,
  ])

  const getCell = useMemo(() => {
    return (
      outcomeCode: string,
      hydroclimate: ResilienceHydroclimate,
    ): ResilienceAggregateCell | null => {
      return cells[outcomeCode]?.[hydroclimate] ?? null
    }
  }, [cells])

  return {
    scenarioIds: effectiveScenarioIds,
    subjectLabel,
    cells,
    getCell,
    matrix,
    isLoading,
    error,
  }
}

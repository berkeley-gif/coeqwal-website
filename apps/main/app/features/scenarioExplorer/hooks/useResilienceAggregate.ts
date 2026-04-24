"use client"

/**
 * useResilienceAggregate
 *
 * Reduces the 3D (scenario × outcome × hydroclimate) matrix from
 * useResilienceMatrix down to a 2D grid aggregated over one of its
 * axes. The `groupBy` option selects which axis is collapsed:
 *
 *   - `groupBy: "scenarios"`   (default, legacy behavior)
 *       rows = outcomes, cols = hydroclimates
 *       each cell aggregates across the scenario scope
 *   - `groupBy: "outcomes"`
 *       rows = scenarios, cols = hydroclimates
 *       each cell aggregates across the outcome scope
 *   - `groupBy: "hydroclimates"`
 *       rows = outcomes, cols = scenarios
 *       each cell aggregates across hydroclimates
 *
 * For each aggregate cell, we emit:
 *   - mean:              arithmetic mean of continuousValue across available members.
 *   - riskDensity:       fraction of members with tierLevel >= 3 (among available).
 *   - opportunityDensity: fraction with tierLevel <= 2 (among available).
 *   - distribution:      one entry per reduced-axis member (preserves order);
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

export type AggregateAxis = "scenarios" | "outcomes" | "hydroclimates"

/**
 * A single entry in an aggregate cell's distribution. The `memberId`
 * is the id of the reduced-axis member (scenarioId, outcomeCode, or
 * hydroclimate). `scenarioId` remains populated when it is meaningful
 * (groupBy=scenarios or when the reduced axis keeps scenario identity)
 * so existing distribution-glyph consumers keep working unchanged.
 */
export interface AggregateDistributionEntry {
  memberId: string
  memberKind: "scenario" | "outcome" | "hydroclimate"
  /**
   * Convenience alias: populated only when the member is a scenario
   * (groupBy="scenarios"). Kept so existing viz code that reads
   * `entry.scenarioId` doesn't have to branch on groupBy.
   */
  scenarioId?: string
  tierLevel: number | null
  continuousValue: number | null
  available: boolean
}

export interface ResilienceAggregateCell {
  /**
   * Key of the row axis (outcomeCode or scenarioId depending on groupBy).
   */
  rowKey: string
  /**
   * Key of the column axis (hydroclimate or scenarioId depending on groupBy).
   */
  colKey: string
  /** Legacy alias: rowKey when the row axis is outcomes, else undefined. */
  outcomeCode?: string
  /** Legacy alias: colKey when the col axis is hydroclimates, else undefined. */
  hydroclimate?: ResilienceHydroclimate
  mean: number | null
  riskDensity: number
  opportunityDensity: number
  distribution: AggregateDistributionEntry[]
  count: number
  availableCount: number
}

export interface UseResilienceAggregateResult {
  /** Scenario IDs in the current scope (post scenarioIds filter). */
  scenarioIds: string[]
  /** Human-readable subject label, e.g. "All 24 scenarios". */
  subjectLabel: string
  /** Axis reduced over. */
  groupBy: AggregateAxis
  /** Pre-pivoted aggregate cells: cells[rowKey][colKey]. */
  cells: Record<string, Record<string, ResilienceAggregateCell>>
  /** Lookup helper: returns null if row/col is unknown. */
  getCell: (rowKey: string, colKey: string) => ResilienceAggregateCell | null
  /** Underlying matrix result (re-exposed for convenience). */
  matrix: UseResilienceMatrixResult
  isLoading: boolean
  error: string | null
}

export interface UseResilienceAggregateOptions {
  /** Which axis to reduce over. Defaults to "scenarios" (legacy). */
  groupBy?: AggregateAxis
  /** Outcome codes in scope. Defaults to the matrix rowOrder. */
  outcomeCodes?: readonly string[]
  /** Scenario subset to aggregate over. When empty, scenarios = all. */
  scenarioIds?: readonly string[]
  /** Hydroclimate subset to aggregate over. When empty, HCs = all. */
  hydroclimates?: readonly ResilienceHydroclimate[]
  /** Short copy to describe the scope in UI labels. */
  subjectLabel?: string
}

interface RowColAxes {
  rowKeys: readonly string[]
  colKeys: readonly string[]
  reduceKeys: readonly string[]
  rowKind: "scenario" | "outcome" | "hydroclimate"
  colKind: "scenario" | "outcome" | "hydroclimate"
  reduceKind: "scenario" | "outcome" | "hydroclimate"
}

function resolveAxes(
  groupBy: AggregateAxis,
  scenarioScope: readonly string[],
  outcomeScope: readonly string[],
  hydroclimateScope: readonly ResilienceHydroclimate[],
): RowColAxes {
  if (groupBy === "scenarios") {
    return {
      rowKeys: outcomeScope,
      colKeys: hydroclimateScope,
      reduceKeys: scenarioScope,
      rowKind: "outcome",
      colKind: "hydroclimate",
      reduceKind: "scenario",
    }
  }
  if (groupBy === "outcomes") {
    return {
      rowKeys: scenarioScope,
      colKeys: hydroclimateScope,
      reduceKeys: outcomeScope,
      rowKind: "scenario",
      colKind: "hydroclimate",
      reduceKind: "outcome",
    }
  }
  // groupBy === "hydroclimates"
  return {
    rowKeys: outcomeScope,
    colKeys: scenarioScope,
    reduceKeys: hydroclimateScope,
    rowKind: "outcome",
    colKind: "scenario",
    reduceKind: "hydroclimate",
  }
}

function pickCell(
  matrixCells: Record<
    string,
    Record<string, Record<string, ResilienceCell | undefined> | undefined>
  >,
  rowKind: RowColAxes["rowKind"],
  colKind: RowColAxes["colKind"],
  reduceKind: RowColAxes["reduceKind"],
  rowKey: string,
  colKey: string,
  reduceKey: string,
): ResilienceCell | undefined {
  let scenarioId: string | undefined
  let outcomeCode: string | undefined
  let hydroclimate: string | undefined
  const assign = (kind: "scenario" | "outcome" | "hydroclimate", v: string) => {
    if (kind === "scenario") scenarioId = v
    else if (kind === "outcome") outcomeCode = v
    else hydroclimate = v
  }
  assign(rowKind, rowKey)
  assign(colKind, colKey)
  assign(reduceKind, reduceKey)
  if (!scenarioId || !outcomeCode || !hydroclimate) return undefined
  return matrixCells[scenarioId]?.[outcomeCode]?.[hydroclimate]
}

export function useResilienceAggregate(
  options: UseResilienceAggregateOptions = {},
): UseResilienceAggregateResult {
  const matrix = useResilienceMatrix()
  const {
    cells: matrixCells,
    hydroclimates,
    rowOrder,
    isLoading,
    error,
  } = matrix

  const groupBy: AggregateAxis = options.groupBy ?? "scenarios"

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

  const effectiveHydroclimates = useMemo<readonly ResilienceHydroclimate[]>(
    () =>
      options.hydroclimates && options.hydroclimates.length > 0
        ? options.hydroclimates
        : hydroclimates,
    [options.hydroclimates, hydroclimates],
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
    const axes = resolveAxes(
      groupBy,
      effectiveScenarioIds,
      effectiveOutcomeCodes,
      effectiveHydroclimates,
    )
    const out: Record<string, Record<string, ResilienceAggregateCell>> = {}

    for (const rowKey of axes.rowKeys) {
      const perCol: Record<string, ResilienceAggregateCell> = {}

      for (const colKey of axes.colKeys) {
        const distribution: AggregateDistributionEntry[] = []
        let sum = 0
        let availableCount = 0
        let riskCount = 0
        let oppCount = 0

        for (const reduceKey of axes.reduceKeys) {
          const cell = pickCell(
            matrixCells as Record<
              string,
              Record<
                string,
                Record<string, ResilienceCell | undefined> | undefined
              >
            >,
            axes.rowKind,
            axes.colKind,
            axes.reduceKind,
            rowKey,
            colKey,
            reduceKey,
          )
          const entry: AggregateDistributionEntry = {
            memberId: reduceKey,
            memberKind: axes.reduceKind,
            scenarioId: axes.reduceKind === "scenario" ? reduceKey : undefined,
            tierLevel: cell?.tierLevel ?? null,
            continuousValue: cell?.continuousValue ?? null,
            available: Boolean(cell?.available),
          }
          distribution.push(entry)

          if (cell?.available && cell.continuousValue != null) {
            sum += cell.continuousValue
            availableCount += 1
            if (cell.tierLevel != null) {
              if (cell.tierLevel >= 3) riskCount += 1
              if (cell.tierLevel <= 2) oppCount += 1
            }
          }
        }

        const mean = availableCount > 0 ? sum / availableCount : null
        const riskDensity = availableCount > 0 ? riskCount / availableCount : 0
        const opportunityDensity =
          availableCount > 0 ? oppCount / availableCount : 0

        perCol[colKey] = {
          rowKey,
          colKey,
          outcomeCode: axes.rowKind === "outcome" ? rowKey : undefined,
          hydroclimate:
            axes.colKind === "hydroclimate"
              ? (colKey as ResilienceHydroclimate)
              : undefined,
          mean,
          riskDensity,
          opportunityDensity,
          distribution,
          count: axes.reduceKeys.length,
          availableCount,
        }
      }

      out[rowKey] = perCol
    }

    return out
  }, [
    groupBy,
    effectiveScenarioIds,
    effectiveOutcomeCodes,
    effectiveHydroclimates,
    matrixCells,
  ])

  const getCell = useMemo(() => {
    return (rowKey: string, colKey: string): ResilienceAggregateCell | null => {
      return cells[rowKey]?.[colKey] ?? null
    }
  }, [cells])

  return {
    scenarioIds: effectiveScenarioIds,
    subjectLabel,
    groupBy,
    cells,
    getCell,
    matrix,
    isLoading,
    error,
  }
}

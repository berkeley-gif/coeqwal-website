"use client"

/**
 * useResilienceMatrix
 *
 * Composite hook for the resilience heatmap. Reads pre-cached tier data
 * for available hydroclimates via useMultipleScenarioTiers
 * These calls hit the SWR cache populated
 * by usePrefetchTiers(), so no extra network traffic.
 *
 * Produces a flat matrix of per-(scenario, outcome, hydroclimate) cells:
 *   - Aggregate outcomes use the API's weighted_score (multi-value) or
 *     level (single-value). The continuous value is the arithmetic mean
 *     of LOI tier levels, matching V3's tiers_df[cols].mean(axis=1).
 *   - NOD/SOD rows use the locally-committed nod-sod-tiers.json, which
 *     mirrors V3's tier_df.csv. Only the historical hydroclimate has
 *     precomputed means today; the other two HCs emit `available: false`.
 *
 * Panels build their scenario-view / outcome-view pivots from this matrix.
 */

import { useMemo } from "react"
import {
  useScenarioList,
  type Scenario,
} from "../../scenarios/hooks/useScenarioList"
import { useMultipleScenarioTiers } from "../../scenarios/hooks/useTierData"
import type { ScenarioTiersResponse } from "@repo/data/coeqwal"
import type { OutcomeScoreData } from "../../scenarios/hooks/useTierData"
import nodSodTiers from "../data/nod-sod-tiers.json"
import {
  OUTCOME_CODE_ORDER,
  NOD_SOD_OUTCOME_CODES,
  OUTCOME_REGIONAL_VARIANTS,
  type OutcomeCode,
  type NodSodCode,
} from "../../../content/outcomes"

const HC_HISTORICAL = "historical"
const HC_CC50 = "cc50"
const HC_CC95 = "cc95"

export const RESILIENCE_HYDROCLIMATES = [
  HC_HISTORICAL,
  HC_CC50,
  HC_CC95,
] as const

export type ResilienceHydroclimate = (typeof RESILIENCE_HYDROCLIMATES)[number]

const nodSodData = nodSodTiers as Record<string, Record<string, number | null>>

/**
 * Rows shown in scenario view (Y axis): 9 aggregate outcomes interleaved
 * with their NOD/SOD variants, matching the radar axis order so the UI
 * reads top-down as: aggregate → North → South → next aggregate.
 */
export const RESILIENCE_ROW_ORDER: string[] = OUTCOME_CODE_ORDER.flatMap(
  (code) => {
    const variants = OUTCOME_REGIONAL_VARIANTS[code as OutcomeCode]
    return variants ? [code, variants[0], variants[1]] : [code]
  },
)

export type ResilienceCellType = "single_value" | "multi_value" | "nod_sod"

export interface ResilienceCell {
  scenarioId: string
  outcomeCode: string
  hydroclimate: ResilienceHydroclimate
  /** Whether we have a tier value for this (scenario, outcome, HC). */
  available: boolean
  /** Short copy shown in the tooltip when `available` is false. */
  unavailableReason?: string
  /** Arithmetic mean of LOI tier levels (e.g. 2.3), or the tier level for single-value outcomes. */
  continuousValue: number | null
  /** Rounded tier level used for color fill (1-4). */
  tierLevel: number | null
  /** Distinguishes aggregate outcome cells from NOD/SOD-derived cells. */
  type?: ResilienceCellType
}

function clampTier(value: number): number {
  return Math.min(4, Math.max(1, Math.round(value)))
}

function buildAggregateCell(
  scenarioId: string,
  outcomeCode: string,
  hydroclimate: ResilienceHydroclimate,
  scores: Record<string, OutcomeScoreData> | undefined,
  raw: ScenarioTiersResponse | undefined,
): ResilienceCell {
  const score = scores?.[outcomeCode]
  const tierInfo = raw?.tiers?.[outcomeCode]

  if (!score) {
    return {
      scenarioId,
      outcomeCode,
      hydroclimate,
      available: false,
      unavailableReason: "No data for this outcome",
      continuousValue: null,
      tierLevel: null,
    }
  }

  if (tierInfo?.type === "single_value" && tierInfo.level) {
    return {
      scenarioId,
      outcomeCode,
      hydroclimate,
      available: true,
      continuousValue: tierInfo.level,
      tierLevel: tierInfo.level,
      type: "single_value",
    }
  }

  return {
    scenarioId,
    outcomeCode,
    hydroclimate,
    available: true,
    continuousValue: score.weighted_score,
    tierLevel: clampTier(score.weighted_score),
    type: "multi_value",
  }
}

function buildNodSodCell(
  scenarioId: string,
  outcomeCode: NodSodCode,
  hydroclimate: ResilienceHydroclimate,
): ResilienceCell {
  if (hydroclimate !== HC_HISTORICAL) {
    return {
      scenarioId,
      outcomeCode,
      hydroclimate,
      available: false,
      unavailableReason:
        "NOD/SOD tier means are only available for the historical hydroclimate",
      continuousValue: null,
      tierLevel: null,
      type: "nod_sod",
    }
  }

  const raw = nodSodData[scenarioId]?.[outcomeCode]
  if (raw == null) {
    return {
      scenarioId,
      outcomeCode,
      hydroclimate,
      available: false,
      unavailableReason: "No NOD/SOD data for this scenario",
      continuousValue: null,
      tierLevel: null,
      type: "nod_sod",
    }
  }

  return {
    scenarioId,
    outcomeCode,
    hydroclimate,
    available: true,
    continuousValue: raw,
    tierLevel: clampTier(raw),
    type: "nod_sod",
  }
}

export interface UseResilienceMatrixResult {
  /** 24 sibling-group scenario IDs (same across HCs). */
  scenarioIds: string[]
  /** Scenario metadata (for display names, themes). */
  scenarios: Scenario[]
  /** All 19 row codes in display order (aggregate + NOD/SOD interleaved). */
  rowOrder: string[]
  /** 9 aggregate outcome codes only. */
  aggregateOutcomeCodes: readonly OutcomeCode[]
  /** 10 NOD/SOD outcome codes only. */
  nodSodOutcomeCodes: readonly NodSodCode[]
  /** Set of NOD/SOD codes for quick membership tests. */
  isNodSodCode: (code: string) => boolean
  /** All three hydroclimate values in display order. */
  hydroclimates: readonly ResilienceHydroclimate[]
  /** Get a single cell; returns null if scenario/outcome is unknown. */
  getCell: (
    scenarioId: string,
    outcomeCode: string,
    hydroclimate: ResilienceHydroclimate,
  ) => ResilienceCell | null
  /** Pre-pivoted: cells[scenarioId][outcomeCode][hc]. Useful for heavy iteration. */
  cells: Record<
    string,
    Record<string, Record<ResilienceHydroclimate, ResilienceCell>>
  >
  /** Scenario display name helper (short label fallback). */
  getDisplayName: (scenarioId: string) => string
  isLoading: boolean
  error: string | null
}

const NOD_SOD_SET = new Set<string>(NOD_SOD_OUTCOME_CODES)

/**
 * Composite hook that assembles a 3D (scenario × outcome × hydroclimate)
 * tier matrix for the resilience heatmap.
 */
export function useResilienceMatrix(): UseResilienceMatrixResult {
  const {
    buildIdMapping,
    siblingGroups,
    getDisplayName,
    isLoading: scenariosLoading,
    error: scenariosError,
  } = useScenarioList()

  const historicalMapping = useMemo(
    () => buildIdMapping(HC_HISTORICAL),
    [buildIdMapping],
  )
  const cc50Mapping = useMemo(() => buildIdMapping(HC_CC50), [buildIdMapping])
  const cc95Mapping = useMemo(() => buildIdMapping(HC_CC95), [buildIdMapping])

  const historicalTiers = useMultipleScenarioTiers(historicalMapping)
  const cc50Tiers = useMultipleScenarioTiers(cc50Mapping)
  const cc95Tiers = useMultipleScenarioTiers(cc95Mapping)

  const scenarioIds = useMemo(
    () => siblingGroups.map((s) => s.scenarioId),
    [siblingGroups],
  )

  const cells = useMemo<
    Record<
      string,
      Record<string, Record<ResilienceHydroclimate, ResilienceCell>>
    >
  >(() => {
    const result: Record<
      string,
      Record<string, Record<ResilienceHydroclimate, ResilienceCell>>
    > = {}

    const hcSources: Record<
      ResilienceHydroclimate,
      {
        scores: Record<string, Record<string, OutcomeScoreData>> | undefined
        raw: Record<string, ScenarioTiersResponse> | undefined
      }
    > = {
      [HC_HISTORICAL]: {
        scores: historicalTiers.allScoreData,
        raw: historicalTiers.allScenariosData,
      },
      [HC_CC50]: {
        scores: cc50Tiers.allScoreData,
        raw: cc50Tiers.allScenariosData,
      },
      [HC_CC95]: {
        scores: cc95Tiers.allScoreData,
        raw: cc95Tiers.allScenariosData,
      },
    }

    for (const scenarioId of scenarioIds) {
      const perOutcome: Record<
        string,
        Record<ResilienceHydroclimate, ResilienceCell>
      > = {}

      for (const outcomeCode of RESILIENCE_ROW_ORDER) {
        const isNodSod = NOD_SOD_SET.has(outcomeCode)
        const perHc = {} as Record<ResilienceHydroclimate, ResilienceCell>

        for (const hc of RESILIENCE_HYDROCLIMATES) {
          if (isNodSod) {
            perHc[hc] = buildNodSodCell(
              scenarioId,
              outcomeCode as NodSodCode,
              hc,
            )
          } else {
            const { scores, raw } = hcSources[hc]
            perHc[hc] = buildAggregateCell(
              scenarioId,
              outcomeCode,
              hc,
              scores?.[scenarioId],
              raw?.[scenarioId],
            )
          }
        }
        perOutcome[outcomeCode] = perHc
      }
      result[scenarioId] = perOutcome
    }
    return result
  }, [
    scenarioIds,
    historicalTiers.allScoreData,
    historicalTiers.allScenariosData,
    cc50Tiers.allScoreData,
    cc50Tiers.allScenariosData,
    cc95Tiers.allScoreData,
    cc95Tiers.allScenariosData,
  ])

  const getCell = useMemo(() => {
    return (
      scenarioId: string,
      outcomeCode: string,
      hydroclimate: ResilienceHydroclimate,
    ): ResilienceCell | null => {
      return cells[scenarioId]?.[outcomeCode]?.[hydroclimate] ?? null
    }
  }, [cells])

  const isLoading =
    scenariosLoading ||
    historicalTiers.isLoading ||
    cc50Tiers.isLoading ||
    cc95Tiers.isLoading

  const error = useMemo(() => {
    return (
      scenariosError ??
      historicalTiers.error ??
      cc50Tiers.error ??
      cc95Tiers.error ??
      null
    )
  }, [scenariosError, historicalTiers.error, cc50Tiers.error, cc95Tiers.error])

  return {
    scenarioIds,
    scenarios: siblingGroups,
    rowOrder: RESILIENCE_ROW_ORDER,
    aggregateOutcomeCodes: OUTCOME_CODE_ORDER as readonly OutcomeCode[],
    nodSodOutcomeCodes: NOD_SOD_OUTCOME_CODES,
    isNodSodCode: (code: string) => NOD_SOD_SET.has(code),
    hydroclimates: RESILIENCE_HYDROCLIMATES,
    getCell,
    cells,
    getDisplayName,
    isLoading,
    error,
  }
}

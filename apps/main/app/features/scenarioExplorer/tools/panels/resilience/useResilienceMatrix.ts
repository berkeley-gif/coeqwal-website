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
 *   - NOD/SOD rows read the dashboard-derived regional tier means from
 *     @repo/data/coeqwal. Coverage spans all three website hydroclimates
 *     (historical, cc50, cc95). Cells fall back to `available: false`
 *     only when the dataset lacks a specific (scenario, outcome, HC).
 *
 * Panels build their scenario-view / outcome-view pivots from this matrix.
 */

import { useMemo } from "react"
import {
  useScenarioList,
  type Scenario,
} from "../../../../scenarios/hooks/useScenarioList"
import { useResolvedIdMappings } from "../../../../scenarios/hooks/useResolvedIdMapping"
import { useMultipleScenarioTiers } from "../../../../scenarios/hooks/useTierData"
import type { ScenarioTiersResponse } from "@repo/data/coeqwal"
import type { OutcomeScoreData } from "../../../../scenarios/hooks/useTierData"
import {
  getRegionalTierMean,
  type RegionalHydroclimate,
  type RegionalOutcomeCode,
} from "@repo/data/coeqwal"
import {
  OUTCOME_CODE_ORDER,
  NOD_SOD_OUTCOME_CODES,
  OUTCOME_REGIONAL_VARIANTS,
  type OutcomeCode,
  type NodSodCode,
} from "../../../../../content/outcomes"
import { HYDROCLIMATE_LABELS_BY_VALUE } from "../../../../../content/scenarios"

const HC_HISTORICAL = "historical"
const HC_CC50 = "cc50"
const HC_CC95 = "cc95"

export const RESILIENCE_HYDROCLIMATES = [
  HC_HISTORICAL,
  HC_CC50,
  HC_CC95,
] as const

export type ResilienceHydroclimate = (typeof RESILIENCE_HYDROCLIMATES)[number]

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
  const raw = getRegionalTierMean(
    scenarioId,
    outcomeCode as RegionalOutcomeCode,
    hydroclimate as RegionalHydroclimate,
  )
  if (raw == null) {
    return {
      scenarioId,
      outcomeCode,
      hydroclimate,
      available: false,
      unavailableReason: "No regional data for this scenario and climate",
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
    siblingGroups,
    getDisplayName,
    isLoading: scenariosLoading,
    error: scenariosError,
  } = useScenarioList()

  const mappings = useResolvedIdMappings()

  const historicalTiers = useMultipleScenarioTiers(
    mappings[HC_HISTORICAL]?.idMapping,
  )
  const cc50Tiers = useMultipleScenarioTiers(mappings[HC_CC50]?.idMapping)
  const cc95Tiers = useMultipleScenarioTiers(mappings[HC_CC95]?.idMapping)

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

    // Per-hc set of scenarios with no variant for that hydroclimate.
    // Used to mark aggregate cells with a specific tooltip reason so the
    // hatch pattern doesn't read as a generic "no data" gap.
    // NOD/SOD cells are sourced from a separate dataset and have their
    // own availability path.
    const missingByHc: Record<ResilienceHydroclimate, Set<string>> = {
      [HC_HISTORICAL]: new Set(mappings[HC_HISTORICAL]?.missingScenarioIds),
      [HC_CC50]: new Set(mappings[HC_CC50]?.missingScenarioIds),
      [HC_CC95]: new Set(mappings[HC_CC95]?.missingScenarioIds),
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
          } else if (missingByHc[hc].has(scenarioId)) {
            const hcLabel = HYDROCLIMATE_LABELS_BY_VALUE[hc] ?? hc
            perHc[hc] = {
              scenarioId,
              outcomeCode,
              hydroclimate: hc,
              available: false,
              unavailableReason: `${scenarioId} has not been run with the ${hcLabel} hydroclimate`,
              continuousValue: null,
              tierLevel: null,
            }
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
    mappings,
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

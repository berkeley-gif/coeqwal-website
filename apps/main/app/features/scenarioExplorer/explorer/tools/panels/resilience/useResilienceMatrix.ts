"use client"

/**
 * useResilienceMatrix
 *
 * Composite hook for the resilience heatmap. Fetches tier data for every
 * active scenario in one batch via useMultipleScenarioTiers,
 * then derives each hydroclimate's view by re-keying that shared dataset
 * through the climate's idMapping. This hits the SWR cache warmed by
 * usePrefetchTiers(), so no extra network traffic.
 *
 * Produces a flat matrix of per-(scenario, outcome, hydroclimate) cells:
 *   - Aggregate outcomes use the API's weighted_score (multi-value) or
 *     level (single-value).
 *   - NOD/SOD rows read the WAM team dashboard-derived regional tier means.
 *
 */

import { useMemo } from "react"
import {
  useScenarioList,
  type Scenario,
} from "../../../../../scenarios/hooks/useScenarioList"
import { useResolvedIdMappings } from "../../../../../scenarios/hooks/useResolvedIdMapping"
import { useMultipleScenarioTiers } from "../../../../../scenarios/hooks/useTierData"
import { clampTier } from "@repo/viz"
import type { ScenarioTiersResponse } from "@repo/data/coeqwal"
import type { OutcomeScoreData } from "../../../../../scenarios/hooks/useTierData"
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
} from "../../../../../../content/outcomes"
import { HYDROCLIMATE_LABELS_BY_VALUE } from "../../../../../../content/scenarios"
export {
  RESILIENCE_HYDROCLIMATES,
  type ResilienceHydroclimate,
} from "./resilienceHydroclimates"
import {
  RESILIENCE_HYDROCLIMATES,
  type ResilienceHydroclimate,
} from "./resilienceHydroclimates"

/**
 * Rows shown in scenario view (Y axis): 9 aggregate outcomes interleaved
 * with their NOD/SOD variants
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

/**
 * Re-key the shared short_code-keyed tier dataset back to sibling-group
 * ids for one hydroclimate, using that climate's idMapping
 * (groupId to short_code). This reproduces what a per-climate
 * useMultipleScenarioTiers(idMapping) call returned, but from the single
 * all-scenario fetch, so the matrix needs no per-climate hooks.
 */
function rekeyByGroup(
  scores: Record<string, Record<string, OutcomeScoreData>> | undefined,
  raw: Record<string, ScenarioTiersResponse> | undefined,
  idMapping: Record<string, string | null>,
): {
  scores: Record<string, Record<string, OutcomeScoreData>>
  raw: Record<string, ScenarioTiersResponse>
} {
  const s: Record<string, Record<string, OutcomeScoreData>> = {}
  const r: Record<string, ScenarioTiersResponse> = {}
  for (const [groupId, shortCode] of Object.entries(idMapping)) {
    if (!shortCode) continue
    const sc = scores?.[shortCode]
    if (sc) s[groupId] = sc
    const rw = raw?.[shortCode]
    if (rw) r[groupId] = rw
  }
  return { scores: s, raw: r }
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

  if (tierInfo?.type === "single_value" && tierInfo.level != null) {
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

  // `weighted_score` is nullable (no tier row or degenerate distribution).
  // Treat that as unavailable so the heatmap cell renders the empty state
  // instead of color-filling at tier 1.
  if (score.weighted_score == null) {
    return {
      scenarioId,
      outcomeCode,
      hydroclimate,
      available: false,
      unavailableReason: "No data for this outcome",
      continuousValue: null,
      tierLevel: null,
      type: "multi_value",
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

  // One fetch for every active scenario across all climates, keyed by
  // variant short_code. Each climate's view is derived below.
  const allTiers = useMultipleScenarioTiers()

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

    // Derive each climate's tier data from the single shared fetch, and
    // its set of scenarios with no variant for that climate. Looping the
    // list keeps both maps complete as HYDROCLIMATES grows.
    // NOD/SOD cells are currently sourced from a separate dataset and have their
    // own path.
    const hcSources = {} as Record<
      ResilienceHydroclimate,
      {
        scores: Record<string, Record<string, OutcomeScoreData>>
        raw: Record<string, ScenarioTiersResponse>
      }
    >
    const missingByHc = {} as Record<ResilienceHydroclimate, Set<string>>
    for (const hc of RESILIENCE_HYDROCLIMATES) {
      hcSources[hc] = rekeyByGroup(
        allTiers.allScoreData,
        allTiers.allScenariosData,
        mappings[hc]?.idMapping ?? {},
      )
      missingByHc[hc] = new Set(mappings[hc]?.missingScenarioIds)
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
  }, [scenarioIds, mappings, allTiers.allScoreData, allTiers.allScenariosData])

  const getCell = useMemo(() => {
    return (
      scenarioId: string,
      outcomeCode: string,
      hydroclimate: ResilienceHydroclimate,
    ): ResilienceCell | null => {
      return cells[scenarioId]?.[outcomeCode]?.[hydroclimate] ?? null
    }
  }, [cells])

  const isLoading = scenariosLoading || allTiers.isLoading

  const error = useMemo(() => {
    return scenariosError ?? allTiers.error ?? null
  }, [scenariosError, allTiers.error])

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

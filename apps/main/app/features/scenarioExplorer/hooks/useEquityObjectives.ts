"use client"

/**
 * Resolves the per-scenario tier-location data the Distribution
 * (equity) panel renders into TierGrid `objectives` and `categories`.
 * Lives in its own hook so the live panel and the off-screen capture
 * mount can call it with different scenarioIds without duplicating
 * the hook composition or the objective-building loop.
 *
 * `ready` becomes true when every required tier query has data. The
 * baseline queries are only awaited when `compareToBaseline` is true.
 */

import { useMemo } from "react"
import { useTierLocationAssignments } from "@repo/data/coeqwal/hooks"
import type { TierLocationAssignmentsResponse } from "@repo/data/coeqwal"
import type { TierGridProps } from "@repo/viz"
import { useResolvedScenarioTiers } from "./useResolvedScenarioTiers"

export interface UseEquityObjectivesInput {
  /** Logical scenario id (the user-facing alias, e.g. "s0020"). Null while no scenario is in focus. */
  scenarioId: string | null
  /** When true, baseline tier data is also loaded and used to populate `baselineTier` on each objective. */
  compareToBaseline: boolean
}

export interface UseEquityObjectivesResult {
  objectives: TierGridProps["objectives"]
  categories: string[]
  outcomeNames: { shortCode: string; displayName: string }[]
  ready: boolean
}

const BASELINE_SCENARIO = "s0020"

export function useEquityObjectives({
  scenarioId,
  compareToBaseline,
}: UseEquityObjectivesInput): UseEquityObjectivesResult {
  const { outcomeNames, idMapping } = useResolvedScenarioTiers()

  const baselineScenario = idMapping[BASELINE_SCENARIO] || BASELINE_SCENARIO
  const currentScenario = scenarioId
    ? idMapping[scenarioId] || scenarioId
    : baselineScenario

  // Per-outcome tier queries. SWR shares cached responses across the
  // live panel and any concurrently-mounted capture component, so the
  // common case (capture for the focused scenario) hits warm data.
  const cwsDel = useTierLocationAssignments(currentScenario, "CWS_DEL")
  const agRev = useTierLocationAssignments(currentScenario, "AG_REV")
  const envFlows = useTierLocationAssignments(currentScenario, "ENV_FLOWS")
  const resStor = useTierLocationAssignments(currentScenario, "RES_STOR")
  const gwStor = useTierLocationAssignments(currentScenario, "GW_STOR")
  const deltaEco = useTierLocationAssignments(currentScenario, "DELTA_ECO")
  const fwExp = useTierLocationAssignments(currentScenario, "FW_EXP")
  const fwDeltaUses = useTierLocationAssignments(currentScenario, "FW_DELTA_USES")
  const wrcSalmonAb = useTierLocationAssignments(currentScenario, "WRC_SALMON_AB")

  const baselineTarget = compareToBaseline ? baselineScenario : null
  const baselineCwsDel = useTierLocationAssignments(baselineTarget, "CWS_DEL")
  const baselineAgRev = useTierLocationAssignments(baselineTarget, "AG_REV")
  const baselineEnvFlows = useTierLocationAssignments(baselineTarget, "ENV_FLOWS")
  const baselineResStor = useTierLocationAssignments(baselineTarget, "RES_STOR")
  const baselineGwStor = useTierLocationAssignments(baselineTarget, "GW_STOR")
  const baselineDeltaEco = useTierLocationAssignments(baselineTarget, "DELTA_ECO")
  const baselineFwExp = useTierLocationAssignments(baselineTarget, "FW_EXP")
  const baselineFwDeltaUses = useTierLocationAssignments(
    baselineTarget,
    "FW_DELTA_USES",
  )
  const baselineWrcSalmonAb = useTierLocationAssignments(
    baselineTarget,
    "WRC_SALMON_AB",
  )

  const tierDataByCode: Record<
    string,
    TierLocationAssignmentsResponse | undefined
  > = useMemo(
    () => ({
      CWS_DEL: cwsDel.data,
      AG_REV: agRev.data,
      ENV_FLOWS: envFlows.data,
      RES_STOR: resStor.data,
      GW_STOR: gwStor.data,
      DELTA_ECO: deltaEco.data,
      FW_EXP: fwExp.data,
      FW_DELTA_USES: fwDeltaUses.data,
      WRC_SALMON_AB: wrcSalmonAb.data,
    }),
    [
      cwsDel.data,
      agRev.data,
      envFlows.data,
      resStor.data,
      gwStor.data,
      deltaEco.data,
      fwExp.data,
      fwDeltaUses.data,
      wrcSalmonAb.data,
    ],
  )

  const baselineTierDataByCode: Record<
    string,
    TierLocationAssignmentsResponse | undefined
  > = useMemo(
    () => ({
      CWS_DEL: baselineCwsDel.data,
      AG_REV: baselineAgRev.data,
      ENV_FLOWS: baselineEnvFlows.data,
      RES_STOR: baselineResStor.data,
      GW_STOR: baselineGwStor.data,
      DELTA_ECO: baselineDeltaEco.data,
      FW_EXP: baselineFwExp.data,
      FW_DELTA_USES: baselineFwDeltaUses.data,
      WRC_SALMON_AB: baselineWrcSalmonAb.data,
    }),
    [
      baselineCwsDel.data,
      baselineAgRev.data,
      baselineEnvFlows.data,
      baselineResStor.data,
      baselineGwStor.data,
      baselineDeltaEco.data,
      baselineFwExp.data,
      baselineFwDeltaUses.data,
      baselineWrcSalmonAb.data,
    ],
  )

  const { objectives, categories } = useMemo(() => {
    if (outcomeNames.length === 0) {
      return {
        objectives: [] as TierGridProps["objectives"],
        categories: [] as string[],
      }
    }

    const result: TierGridProps["objectives"] = []
    const categorySet = new Set<string>()
    let globalId = 0

    const baselineTierMap = new Map<string, number>()
    if (compareToBaseline) {
      outcomeNames.forEach((outcome) => {
        const baselineData = baselineTierDataByCode[outcome.shortCode]
        if (baselineData) {
          baselineData.locations.forEach((location) => {
            baselineTierMap.set(
              `${outcome.shortCode},${location.location_id}`,
              location.tier_level,
            )
          })
        }
      })
    }

    outcomeNames.forEach((outcome) => {
      const tierCode = outcome.shortCode
      const currentData = tierDataByCode[tierCode]
      if (!currentData) return

      const categoryName = outcome.displayName
      categorySet.add(categoryName)

      currentData.locations.forEach((location) => {
        const currentTierLevel = location.tier_level
        const baselineTierLevel = compareToBaseline
          ? (baselineTierMap.get(
              `${outcome.shortCode},${location.location_id}`,
            ) ?? currentTierLevel)
          : currentTierLevel

        result.push({
          id: globalId++,
          tier: `Tier ${currentTierLevel}`,
          baselineTier: `Tier ${baselineTierLevel}`,
          category: categoryName,
          locationId: location.location_id,
          locationName: location.location_name,
          tierLevel: currentTierLevel,
          baselineTierLevel, // Added for share functionality
          tierCode,
        })
      })
    })

    return {
      objectives: result,
      categories: Array.from(categorySet),
    }
  }, [outcomeNames, tierDataByCode, baselineTierDataByCode, compareToBaseline])

  // `ready` only requires the live tier queries; baseline data is
  // optional even when comparison is on so a partial baseline does not
  // block render. The objectives builder already falls back to the
  // current tier when a baseline entry is missing.
  const ready =
    outcomeNames.length > 0 &&
    outcomeNames.every((o) => tierDataByCode[o.shortCode] !== undefined)

  return { objectives, categories, outcomeNames, ready }
}

"use client"

import { useTierLocationAssignmentsBatch } from "@repo/data/coeqwal/hooks"

export const storylineScenarioIds = [
  "s0020",
  "s0035",
  "s0027",
  "s0031",
  "s0042",
] as const

export type StorylineScenarioId = (typeof storylineScenarioIds)[number]

export const distributionOutcomeCodes = ["CWS_DEL", "AG_REV"] as const

const outcomeCodes = [...distributionOutcomeCodes]

/**
 * Loads the same location-level tier assignments used by the main
 * Distribution viewer for every scenario featured in the equity storyline.
 * Each scenario is one batched request covering all Distribution outcomes.
 */
export function useStorylineTierAssignments() {
  const s0020 = useTierLocationAssignmentsBatch("s0020", outcomeCodes)
  const s0035 = useTierLocationAssignmentsBatch("s0035", outcomeCodes)
  const s0027 = useTierLocationAssignmentsBatch("s0027", outcomeCodes)
  const s0031 = useTierLocationAssignmentsBatch("s0031", outcomeCodes)
  const s0042 = useTierLocationAssignmentsBatch("s0042", outcomeCodes)

  const byScenario = { s0020, s0035, s0027, s0031, s0042 } as const

  return {
    byScenario,
    isLoading: Object.values(byScenario).some((query) => query.isLoading),
    isValidating: Object.values(byScenario).some((query) => query.isValidating),
    errors: Object.fromEntries(
      Object.entries(byScenario)
        .filter(([, query]) => query.error)
        .map(([scenarioId, query]) => [scenarioId, query.error]),
    ) as Partial<Record<StorylineScenarioId, string>>,
  }
}

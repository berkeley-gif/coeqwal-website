/**
 * Hydroclimate availability for multi-scenario tools
 *
 * Splits a list of sibling-group ids into `available` (ones with a
 * variant for the active hydroclimate) and `missing` (ones without).
 * Use this for tools that plot multiple scenarios at once, like radar,
 * or resilience.
 *
 * Filter your traces by `available`, then render a
 * `HydroclimateUnavailablePlaceholder` (variant `"block"`) at the panel
 * level when `allMissing` is true.
 *
 * For single-scenario panels and per-row lists, prefer the
 * `<HydroclimateGate>` wrapper component instead.
 *
 * @example
 * ```ts
 * const { available, allMissing, hydroclimate } =
 *   useHydroclimateAvailability(selectedScenarioIds)
 *
 * if (allMissing) {
 *   return (
 *     <HydroclimateUnavailablePlaceholder
 *       hydroclimate={hydroclimate}
 *       variant="block"
 *     />
 *   )
 * }
 * // plot only `available`
 * ```
 */

import { useMemo } from "react"
import { useResolvedIdMapping } from "./useResolvedIdMapping"

export interface HydroclimateAvailability {
  /** Sibling-group ids with a variant for the active hydroclimate */
  available: string[]
  /** Sibling-group ids with no variant for the active hydroclimate */
  missing: string[]
  /** True when every input id is missing a variant */
  allMissing: boolean
  /** Active hydroclimate, ready to pass to the placeholder */
  hydroclimate: string
}

export function useHydroclimateAvailability(
  scenarioIds: readonly string[],
): HydroclimateAvailability {
  const { missingScenarioIds, hydroclimate } = useResolvedIdMapping()

  return useMemo(() => {
    const missingSet = new Set(missingScenarioIds)
    const available: string[] = []
    const missing: string[] = []
    for (const id of scenarioIds) {
      if (missingSet.has(id)) {
        missing.push(id)
      } else {
        available.push(id)
      }
    }
    return {
      available,
      missing,
      allMissing: scenarioIds.length > 0 && available.length === 0,
      hydroclimate,
    }
  }, [scenarioIds, missingScenarioIds, hydroclimate])
}

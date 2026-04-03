import { useMemo } from "react"
import { useScenarioList } from "../../scenarios/hooks/useScenarioList"
import { useMultipleScenarioTiers } from "../../scenarios/hooks/useTierData"
import { useScenarioExplorerStore } from "../store"

/**
 * Convenience hook that resolves the active hydroclimate period and fetches
 * tier data in a single call.
 *
 * Internally reads `hydroclimatePeriod` from the store, builds the sibling
 * group and resolved scenario ID mapping, and passes it to
 * `useMultipleScenarioTiers`. Returns everything that hook returns, plus
 * the resolved `idMapping` and common scenario-list helpers.
 *
 * Use this in any tool panel that needs tier data for the currently selected
 * hydroclimate.
 */
export function useResolvedScenarioTiers() {
  const { hydroclimatePeriod } = useScenarioExplorerStore()
  const {
    buildIdMapping,
    getDisplayName,
    getThemeForScenario,
    siblingGroups,
    siblingGroupMap,
  } = useScenarioList()

  const idMapping = useMemo(
    () => buildIdMapping(hydroclimatePeriod),
    [buildIdMapping, hydroclimatePeriod],
  )

  const tierData = useMultipleScenarioTiers(idMapping)

  return {
    ...tierData,
    idMapping,
    siblingGroups,
    siblingGroupMap,
    getDisplayName,
    getThemeForScenario,
  }
}

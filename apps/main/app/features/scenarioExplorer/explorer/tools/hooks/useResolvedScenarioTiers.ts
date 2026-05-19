import { useResolvedIdMapping, useScenarioList } from "../../../../scenarios/hooks"
import { useMultipleScenarioTiers } from "../../../../scenarios/hooks/useTierData"

/**
 * Convenience hook that resolves the active hydroclimate and fetches
 * tier data in a single call.
 *
 * Composes {@link useResolvedIdMapping} with `useMultipleScenarioTiers` so
 * tool panels can drop in a single hook call. Use this in any tool panel
 * that needs tier data for the currently selected hydroclimate.
 */
export function useResolvedScenarioTiers() {
  const { idMapping, missingScenarioIds } = useResolvedIdMapping()
  const {
    getDisplayName,
    getThemeForScenario,
    siblingGroups,
    siblingGroupMap,
  } = useScenarioList()

  const tierData = useMultipleScenarioTiers(idMapping)

  return {
    ...tierData,
    idMapping,
    missingScenarioIds,
    siblingGroups,
    siblingGroupMap,
    getDisplayName,
    getThemeForScenario,
  }
}

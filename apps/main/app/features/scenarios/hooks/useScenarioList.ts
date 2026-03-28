import { useMemo, useCallback } from "react"
import { useScenarios } from "@repo/data/coeqwal/hooks"
import {
  getScenarioMetadata,
  HYDROCLIMATE_ID_MAP,
  type ScenarioTheme,
  type Scenario,
} from "../../../content/scenarios"

export type { Scenario, ScenarioTheme }

const HISTORICAL_HC_ID = 2

/**
 * Hook to fetch and manage the list of available scenarios from the API.
 *
 * Labels and descriptions come directly from the API. Theme and icon are
 * resolved via the scenario's sibling_group (the historical variant's
 * short_code), which maps into the local scenarioMetadata table.
 *
 * Exposes two views of the data:
 * - `scenarios` — all 72+ individual scenarios (for raw access)
 * - `siblingGroups` — 24 representative Scenario objects (historical variants),
 *   one per unique strategy. The UI renders these; the hydroclimate chooser
 *   determines which variant's tier data is fetched.
 */
export function useScenarioList() {
  const { scenarios: rawScenarios, isLoading, error } = useScenarios()

  const scenarios = useMemo<Scenario[]>(() => {
    if (!rawScenarios) return []
    const enriched = rawScenarios.map((apiScenario) => {
      const metadata = getScenarioMetadata(apiScenario.sibling_group)
      return {
        scenarioId: apiScenario.short_code,
        shortCode: apiScenario.short_code,
        isActive: apiScenario.is_active,
        label: apiScenario.name,
        description: apiScenario.description,
        shortLabel: metadata.shortLabel ?? apiScenario.name,
        theme: metadata.theme,
        iconPath: metadata.iconPath,
        runName: apiScenario.run_name,
        hydroclimateId: apiScenario.hydroclimate_id,
        baselineScenario: apiScenario.baseline_scenario,
        siblingGroup: apiScenario.sibling_group,
      }
    })
    return enriched.sort((a, b) => {
      if (a.scenarioId === "s0020") return -1
      if (b.scenarioId === "s0020") return 1
      return 0
    })
  }, [rawScenarios])

  /** Variant map: sibling_group -> { hydroclimate_id -> short_code } */
  const variantMap = useMemo(() => {
    const map = new Map<string, Record<number, string>>()
    if (!rawScenarios) return map
    rawScenarios.forEach((api) => {
      const existing = map.get(api.sibling_group)
      if (existing) {
        existing[api.hydroclimate_id] = api.short_code
      } else {
        map.set(api.sibling_group, { [api.hydroclimate_id]: api.short_code })
      }
    })
    return map
  }, [rawScenarios])

  /**
   * 24 representative scenarios — the historical variant for each sibling group.
   * These are the rows shown in the sidebar and list views.
   */
  const siblingGroups = useMemo<Scenario[]>(() => {
    return scenarios.filter(
      (s) => s.isActive && s.hydroclimateId === HISTORICAL_HC_ID,
    )
  }, [scenarios])

  const siblingGroupIds = useMemo(
    () => siblingGroups.map((s) => s.scenarioId),
    [siblingGroups],
  )

  /**
   * Build an ID mapping from sibling group IDs to the resolved short_code
   * for a given hydroclimate period string (e.g., "historical", "warmer-wetter").
   * Falls back to the historical variant if the requested hydroclimate is missing.
   */
  const buildIdMapping = useCallback(
    (hydroclimatePeriod: string): Record<string, string> => {
      const hcId = HYDROCLIMATE_ID_MAP[hydroclimatePeriod] ?? HISTORICAL_HC_ID
      const mapping: Record<string, string> = {}
      siblingGroups.forEach((group) => {
        const variants = variantMap.get(group.siblingGroup)
        if (variants) {
          mapping[group.scenarioId] =
            variants[hcId] ?? variants[HISTORICAL_HC_ID] ?? group.scenarioId
        }
      })
      return mapping
    },
    [siblingGroups, variantMap],
  )

  const scenarioIds = useMemo(
    () => scenarios.filter((s) => s.isActive).map((s) => s.scenarioId),
    [scenarios],
  )

  const scenarioMap = useMemo(() => {
    return new Map(scenarios.map((s) => [s.scenarioId, s]))
  }, [scenarios])

  /** Sibling-group-keyed map (for display name/theme lookups by group ID) */
  const siblingGroupMap = useMemo(() => {
    return new Map(siblingGroups.map((s) => [s.scenarioId, s]))
  }, [siblingGroups])

  const getScenario = (scenarioId: string): Scenario | undefined => {
    return scenarioMap.get(scenarioId)
  }

  /** Display name for a scenario — works with both individual IDs and sibling group IDs */
  const getDisplayName = useCallback(
    (scenarioId: string): string => {
      return (
        siblingGroupMap.get(scenarioId)?.label ??
        scenarioMap.get(scenarioId)?.label ??
        scenarioId
      )
    },
    [siblingGroupMap, scenarioMap],
  )

  /**
   * Get theme for any scenario ID (resolves through the enriched scenario map).
   * Prefers sibling group map so it works with group IDs even when the
   * individual variant isn't in the current filtered set.
   */
  const getThemeForScenario = useCallback(
    (scenarioId: string): ScenarioTheme => {
      return (
        siblingGroupMap.get(scenarioId)?.theme ??
        scenarioMap.get(scenarioId)?.theme ??
        "unthemed"
      )
    },
    [siblingGroupMap, scenarioMap],
  )

  return {
    scenarios,
    scenarioIds,
    scenarioMap,
    siblingGroups,
    siblingGroupIds,
    siblingGroupMap,
    variantMap,
    buildIdMapping,
    getScenario,
    getDisplayName,
    getThemeForScenario,
    isLoading,
    error,
  }
}

export type { ScenarioListItem } from "@repo/data/coeqwal"

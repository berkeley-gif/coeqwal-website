import { useMemo } from "react"
import useSWR from "swr"
import { fetchScenarioList } from "../../../lib/api/tierApi"
import {
  getScenarioMetadata,
  type ScenarioTheme,
  type Scenario,
} from "../../../content/scenarios"

/**
 * Re-export types for convenience
 */
export type { Scenario, ScenarioTheme }

/**
 * Hook to fetch and manage the list of available scenarios from the API
 * Provides scenario metadata enriched with local UI data (themes, icons, labels)
 *
 * Note: The API provides technical details (scenario IDs, short codes, technical names).
 * User-friendly labels and descriptions come from local metadata in content/scenarios.ts
 */
export function useScenarioList() {
  const { data, error, isLoading } = useSWR("/api/scenarios", fetchScenarioList)

  // Enrich API data with local metadata (user-friendly labels, descriptions, themes, icons)
  const scenarios = useMemo<Scenario[]>(() => {
    if (!data) return []
    return data.map((apiScenario) => {
      const metadata = getScenarioMetadata(apiScenario.scenario_id)
      return {
        // Identity
        scenarioId: apiScenario.scenario_id,
        shortCode: apiScenario.short_code,
        isActive: apiScenario.is_active,
        // User-friendly content (from local metadata)
        label: metadata.label,
        description: metadata.description,
        shortLabel: metadata.shortLabel ?? metadata.label,
        theme: metadata.theme,
        iconPath: metadata.iconPath,
        // Technical content (from API, for reference)
        apiName: apiScenario.name,
        apiShortTitle: apiScenario.short_title,
        apiDescription: apiScenario.description,
      }
    })
  }, [data])

  // Extract just the scenario IDs for active scenarios
  const scenarioIds = useMemo(
    () => scenarios.filter((s) => s.isActive).map((s) => s.scenarioId),
    [scenarios],
  )

  // Create a lookup map for quick access by scenario_id
  const scenarioMap = useMemo(() => {
    return new Map(scenarios.map((s) => [s.scenarioId, s]))
  }, [scenarios])

  // Helper to get a scenario by ID
  const getScenario = (scenarioId: string): Scenario | undefined => {
    return scenarioMap.get(scenarioId)
  }

  // Helper to get display name for a scenario
  const getDisplayName = (scenarioId: string): string => {
    return scenarioMap.get(scenarioId)?.label ?? scenarioId
  }

  return {
    // Enriched scenarios (API + local metadata)
    scenarios,
    // Active scenario IDs
    scenarioIds,
    // Lookup map by scenario_id
    scenarioMap,
    // Helper functions
    getScenario,
    getDisplayName,
    // Loading state
    isLoading,
    error,
  }
}

// Re-export the API type for reference
export type { ScenarioListItem } from "../../../lib/api/tierApi"

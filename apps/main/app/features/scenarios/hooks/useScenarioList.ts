import { useMemo } from "react"
import { useScenarios } from "@repo/data/coeqwal/hooks"
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
 * Uses useScenarios from @repo/data for the raw API data, then enriches
 * with local metadata (themes, icons, user-friendly labels) from content/scenarios.ts
 */
export function useScenarioList() {
  // Get raw scenario data from the data package
  const { scenarios: rawScenarios, isLoading, error } = useScenarios()

  // Enrich API data with local metadata (user-friendly labels, descriptions, themes, icons).
  // s0020 (Current Operations) is sorted to the front of the list so it appears first
  // in all views that consume this hook (list view, sidebar, etc.).
  const scenarios = useMemo<Scenario[]>(() => {
    if (!rawScenarios) return []
    const enriched = rawScenarios.map((apiScenario) => {
      const metadata = getScenarioMetadata(apiScenario.short_code)
      return {
        // Identity
        scenarioId: apiScenario.short_code,
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
        apiShortTitle: apiScenario.name,
        apiDescription: apiScenario.description,
      }
    })
    // Current Operations (s0020) is the canonical reference scenario and always appears first.
    return enriched.sort((a, b) => {
      if (a.scenarioId === "s0020") return -1
      if (b.scenarioId === "s0020") return 1
      return 0
    })
  }, [rawScenarios])

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
export type { ScenarioListItem } from "@repo/data/coeqwal"

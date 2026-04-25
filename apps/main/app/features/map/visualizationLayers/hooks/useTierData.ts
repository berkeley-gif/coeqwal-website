"use client"

/**
 * useTierData - Fetch and transform tier data for visualization
 *
 * Returns tierColorMap (featureId -> hex color) ready for use with layer components.
 * Handles caching, loading states, and color computation internally.
 *
 * Single-value outcomes (Salmon, Delta) share SWR cache with glyphs via
 * CACHE_KEYS.scenarioTiers. Multi-value outcomes share cache with every
 * other consumer of useTierLocationAssignments / useTierLocationAssignmentsBatch
 * via CACHE_KEYS.tierLocations. There is no module-level Map cache or
 * bespoke in-flight dedupe layer: SWR handles both.
 *
 * Usage:
 * ```tsx
 * const { tierColorMap, isLoading, error } = useTierData("RES_STOR", "s0020")
 *
 * <OutcomePolygonLayer tierColorMap={tierColorMap} ... />
 * ```
 */

import { useMemo } from "react"
import { useTheme } from "@repo/ui/mui"
import useSWR from "swr"
import {
  getTierColorsFromTheme,
  type TierLevel,
} from "../../../../content/tiers"
import {
  fetchScenarioTiers,
  fetchTierLocationAssignments,
  type ScenarioTiersResponse,
  type TierLocationAssignmentsResponse,
} from "@repo/data/coeqwal"
import { CACHE_KEYS } from "@repo/data/cache"
import { getOutcomeConfig } from "../../config/outcomeLayerRegistry"
import { getOutcomeName } from "../../../../content/outcomes"
import type {
  TierColorMap,
  TierLevelMap,
  TierLocation,
  TierLocationsResponse,
} from "../types"

// Re-export for consumers that still need the fetcher outside the hook
// (e.g. SummaryPanel, useMapVisualizationAction prefetch paths). Shape-pads
// the batch-style response back into the legacy TierLocationsResponse so
// existing callers that read `.locations` keep working with no changes.
export async function fetchTierLocations(
  scenarioId: string,
  tierCode: string,
): Promise<TierLocationsResponse> {
  try {
    const data = await fetchTierLocationAssignments(scenarioId, tierCode)
    return adaptAssignmentsToLegacyShape(data, scenarioId, tierCode)
  } catch {
    return {
      scenario: scenarioId,
      tier_code: tierCode,
      tier_name: tierCode,
      tier_type: "multi_value",
      locations: [],
      metadata: {
        total_locations: 0,
        location_types: [],
        tier_counts: {},
      },
    }
  }
}

function adaptAssignmentsToLegacyShape(
  data: TierLocationAssignmentsResponse,
  scenarioId: string,
  tierCode: string,
): TierLocationsResponse {
  const location_types = Array.from(
    new Set(data.locations.map((l) => l.location_type)),
  )
  return {
    scenario: scenarioId,
    tier_code: data.tier_code ?? tierCode,
    tier_name: tierCode,
    tier_type: "multi_value",
    locations: data.locations.map((l) => ({
      location_id: l.location_id,
      location_name: l.location_name,
      location_type: l.location_type,
      tier_level: l.tier_level,
      tier_value: l.tier_value,
      display_order: l.display_order,
    })),
    metadata: {
      total_locations: data.metadata.total_locations,
      location_types,
      tier_counts: data.metadata.tier_counts,
    },
  }
}

function convertScenarioTierToLocations(
  scenarioData: ScenarioTiersResponse,
  outcomeCode: string,
): TierLocationsResponse | null {
  const tierInfo = scenarioData.tiers[outcomeCode]

  if (
    !tierInfo ||
    tierInfo.type !== "single_value" ||
    tierInfo.level === undefined
  ) {
    return null
  }

  const location: TierLocation = {
    location_id: outcomeCode,
    location_name: getOutcomeName(outcomeCode),
    location_type: "single_value",
    tier_level: tierInfo.level,
    tier_value: null,
    display_order: 0,
  }

  return {
    scenario: scenarioData.scenario,
    tier_code: outcomeCode,
    tier_name: tierInfo.name,
    tier_type: "single_value",
    locations: [location],
    metadata: {
      total_locations: 1,
      location_types: ["single_value"],
      tier_counts: { [tierInfo.level]: 1 },
    },
  }
}

export interface UseTierDataResult {
  tierColorMap: TierColorMap
  tierLevelMap: TierLevelMap
  locationData: Record<string, TierLocation>
  featureIds: string[]
  featureCount: number
  isLoading: boolean
  error: string | null
}

/**
 * Hook to fetch tier data and compute colors
 *
 * Single-value outcomes share the SWR cache key `scenarioTiers(id)` with
 * the glyph panel. Multi-value outcomes share `tierLocations(id, code)`
 * with every other assignments consumer (single hook, batch hook,
 * prefetch). `keepPreviousData` keeps the previous render up while a new
 * scenario / outcome is being loaded so the map never blinks empty.
 */
export function useTierData(
  outcomeCode: string | null,
  scenarioId: string,
): UseTierDataResult {
  const theme = useTheme()
  const tierColors = useMemo(() => getTierColorsFromTheme(theme), [theme])

  const config = useMemo(
    () => (outcomeCode ? getOutcomeConfig(outcomeCode) : null),
    [outcomeCode],
  )

  const isSingleValue = config ? !config.requiresIdMatching : false

  // Single-value outcomes: same cache key as glyphs.
  const {
    data: scenarioTiersData,
    error: singleValueErr,
    isLoading: singleValueLoading,
  } = useSWR<ScenarioTiersResponse>(
    isSingleValue && scenarioId ? CACHE_KEYS.scenarioTiers(scenarioId) : null,
    () => fetchScenarioTiers(scenarioId),
    { keepPreviousData: true },
  )

  // Multi-value outcomes: same cache key as useTierLocationAssignments
  // (and warmed by useTierLocationAssignmentsBatch / prefetch).
  const {
    data: assignments,
    error: multiValueErr,
    isLoading: multiValueLoading,
  } = useSWR<TierLocationAssignmentsResponse>(
    !isSingleValue && scenarioId && config
      ? CACHE_KEYS.tierLocations(scenarioId, config.tierCode)
      : null,
    () => fetchTierLocationAssignments(scenarioId, config!.tierCode),
    { keepPreviousData: true },
  )

  const response: TierLocationsResponse | null = useMemo(() => {
    if (isSingleValue) {
      if (!scenarioTiersData || !outcomeCode) return null
      return convertScenarioTierToLocations(scenarioTiersData, outcomeCode)
    }
    if (!assignments || !config) return null
    return adaptAssignmentsToLegacyShape(
      assignments,
      scenarioId,
      config.tierCode,
    )
  }, [
    isSingleValue,
    scenarioTiersData,
    outcomeCode,
    assignments,
    config,
    scenarioId,
  ])

  const derived = useMemo(() => {
    if (!response) {
      return {
        tierLevelMap: {} as TierLevelMap,
        locationData: {} as Record<string, TierLocation>,
        featureIds: [] as string[],
      }
    }
    const tierLevelMap: TierLevelMap = {}
    const locationData: Record<string, TierLocation> = {}
    for (const loc of response.locations) {
      tierLevelMap[loc.location_id] = loc.tier_level as TierLevel
      locationData[loc.location_id] = loc
    }
    return {
      tierLevelMap,
      locationData,
      featureIds: Object.keys(tierLevelMap),
    }
  }, [response])

  const tierColorMap = useMemo(() => {
    const colorMap: TierColorMap = {}
    for (const [featureId, tierLevel] of Object.entries(derived.tierLevelMap)) {
      colorMap[featureId] = tierColors[tierLevel] || "#888888"
    }
    return colorMap
  }, [tierColors, derived.tierLevelMap])

  const isLoading = isSingleValue ? singleValueLoading : multiValueLoading
  const swrErr = isSingleValue ? singleValueErr : multiValueErr
  const missingSingleValue =
    isSingleValue && !!scenarioTiersData && response === null
  const error = swrErr
    ? swrErr.message
    : missingSingleValue
      ? `No tier data for ${config?.tierCode}`
      : null

  return {
    tierColorMap,
    tierLevelMap: derived.tierLevelMap,
    locationData: derived.locationData,
    featureIds: derived.featureIds,
    featureCount: derived.featureIds.length,
    isLoading,
    error,
  }
}

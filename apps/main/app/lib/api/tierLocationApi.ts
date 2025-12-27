/**
 * API functions for fetching tier location data for map visualization
 */

import {
  STRATEGY_TO_SCENARIO_ID,
  getShortCodeFromDisplayName,
} from "../constants/outcomeMappings"
import { API_BASE } from "../constants/api"

// Type definitions for GeoJSON response
export interface TierFeature {
  type: "Feature"
  geometry: {
    type: "Point" | "Polygon" | "MultiPolygon"
    coordinates: number[] | number[][][] | number[][][][]
  }
  properties: {
    location_id: string
    location_name: string
    location_type: string
    location_type_display: string
    tier_level: number // 1-4
    tier_value: number
    display_order: number
    tier_color_class: string
  }
}

export interface TierLocationResponse {
  type: "FeatureCollection"
  features: TierFeature[]
  metadata: {
    scenario: string
    tier_code: string
    tier_name: string
    tier_type: "multi_value" | "single_value"
    feature_count: number
    location_types: string[]
  }
}

/**
 * Fetch tier location data for a specific scenario and outcome
 * Returns GeoJSON FeatureCollection
 */
export async function fetchTierLocationData(
  strategyValue: string,
  outcomeDisplayName: string,
): Promise<TierLocationResponse> {
  // Map strategy to scenario ID
  const scenarioId = STRATEGY_TO_SCENARIO_ID[strategyValue]

  if (!scenarioId) {
    console.error(`No scenario ID mapping for strategy: ${strategyValue}`)
    throw new Error(`Unknown strategy: ${strategyValue}`)
  }

  // Map outcome to tier code (handles both API names and UI display names)
  const tierCode = getShortCodeFromDisplayName(outcomeDisplayName)

  if (!tierCode || tierCode === outcomeDisplayName) {
    // If no mapping found, tierCode will equal outcomeDisplayName (fallback behavior)
    console.error(`No tier code mapping for: ${outcomeDisplayName}`)
    throw new Error(`Unknown outcome: ${outcomeDisplayName}`)
  }

  // Correct endpoint: /api/tier-map/{scenario}/{tier}
  const url = `${API_BASE}/tier-map/${scenarioId}/${tierCode}`

  const response = await fetch(url)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.detail || `Failed to fetch tier locations: ${response.status}`,
    )
  }

  return response.json()
}

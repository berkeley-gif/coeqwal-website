/**
 * API functions for fetching tier location data for map visualization
 */

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

// Map strategy values to scenario IDs
const STRATEGY_TO_SCENARIO_MAP: Record<string, string> = {
  "current-ops": "s0020",
  "current-ops-wo-tucp": "s0021",
  "current-ops-historical-ag": "s0011",
  // Add other mappings as needed
}

// Map display names to API tier codes
const OUTCOME_CODE_MAP: Record<string, string> = {
  "Agricultural revenue": "AG_REV",
  "Community deliveries": "CWS_DEL",
  "Delta ecology": "DELTA_ECO",
  "Environmental flows": "ENV_FLOWS",
  "Freshwater for in-Delta uses": "FW_DELTA_USES",
  "Freshwater for Delta exports": "FW_EXP",
  "Groundwater storage": "GW_STOR",
  "Reservoir storage": "RES_STOR",
  "Salmon abundance": "WRC_SALMON_AB",
}

const API_BASE = "https://api.coeqwal.org/api"

/**
 * Fetch tier location data for a specific scenario and outcome
 * Returns GeoJSON FeatureCollection
 */
export async function fetchTierLocationData(
  strategyValue: string,
  outcomeDisplayName: string,
): Promise<TierLocationResponse> {
  // Map strategy to scenario ID
  const scenarioId = STRATEGY_TO_SCENARIO_MAP[strategyValue]

  if (!scenarioId) {
    console.error(`No scenario ID mapping for strategy: ${strategyValue}`)
    throw new Error(`Unknown strategy: ${strategyValue}`)
  }

  // Map outcome to tier code
  const tierCode = OUTCOME_CODE_MAP[outcomeDisplayName]

  if (!tierCode) {
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

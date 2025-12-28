/**
 * API functions for fetching tier data from COEQWAL API
 */

import { API_SHORT_CODE_TO_DISPLAY_NAME } from "../constants/outcomeMappings"
import { API_BASE } from "../constants/api"

// Type definitions
export interface TierListItem {
  short_code: string
  name: string
  description: string
  tier_type: "single_value" | "multi_value"
  tier_count: number
  is_active: boolean
}

export interface MultiValueTierData {
  tier: "tier1" | "tier2" | "tier3" | "tier4"
  value: number
  normalized: number
}

export interface MultiValueTier {
  name: string
  type: "multi_value"
  data: MultiValueTierData[]
  total: number
}

/**
 * Calculated score fields returned by the API for each tier
 * These enable sorting, parallel plot visualization, and equity analysis
 */
export interface TierScores {
  /** Weighted average tier score (1.0-4.0, lower = better). Use for sorting. */
  weighted_score: number
  /** Normalized score (0.0-1.0, higher = better). Use for parallel plot Y-axis. */
  normalized_score: number
  /** Gini coefficient (0.0-1.0, lower = more equitable). Use for equity indicator. */
  gini: number
  /** Spread band top edge (0.0-1.0). Where best locations are. */
  band_upper: number
  /** Spread band bottom edge (0.0-1.0). Where worst locations are. */
  band_lower: number
}

export interface TierInfo extends TierScores {
  name: string
  type: "single_value" | "multi_value"
  level?: number // For single_value
  data?: MultiValueTierData[] // For multi_value
  total?: number // For multi_value
}

export interface ScenarioTiersResponse {
  scenario: string
  tiers: {
    [tierCode: string]: TierInfo
  }
}

/**
 * Scenario metadata from /api/scenarios endpoint
 */
export interface ScenarioListItem {
  scenario_id: string
  short_code: string
  name: string
  short_title: string
  description: string
  is_active: boolean
}

// Helpers
async function apiFetch<T>(endpoint: string, errorMessage: string): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`)
  if (!response.ok) {
    throw new Error(`${errorMessage}: ${response.statusText}`)
  }
  return response.json()
}

// API functions
export async function fetchTierList(): Promise<TierListItem[]> {
  return apiFetch("/tiers/list", "Failed to fetch tier list")
}

export async function fetchScenarioTiers(
  scenarioId: string,
): Promise<ScenarioTiersResponse> {
  return apiFetch(
    `/tiers/scenarios/${scenarioId}/tiers`,
    "Failed to fetch scenario tiers",
  )
}

/**
 * Fetch list of all scenarios with metadata
 */
export async function fetchScenarioList(): Promise<ScenarioListItem[]> {
  return apiFetch("/scenarios", "Failed to fetch scenario list")
}

/**
 * Fetch tier data for multiple scenarios in parallel
 * Returns a map of scenarioId -> ScenarioTiersResponse
 */
export async function fetchAllScenarioTiers(
  scenarioIds: string[],
): Promise<Record<string, ScenarioTiersResponse>> {
  const results = await Promise.all(
    scenarioIds.map((id) => fetchScenarioTiers(id)),
  )
  const record: Record<string, ScenarioTiersResponse> = {}
  scenarioIds.forEach((id, i) => {
    // Safe: results array has same length as scenarioIds
    record[id] = results[i]!
  })
  return record
}

// Mapping from API
let _tierMappingCache: Record<string, string> | null = null

export async function getTierMapping(): Promise<Record<string, string>> {
  if (_tierMappingCache) {
    return _tierMappingCache
  }

  try {
    const tierList = await fetchTierList()
    _tierMappingCache = tierList.reduce(
      (acc, tier) => {
        acc[tier.short_code] = tier.name
        return acc
      },
      {} as Record<string, string>,
    )
    return _tierMappingCache
  } catch (error) {
    console.error("Failed to fetch tier mapping, using fallback:", error)
    // Fallback to centralized mapping if API fails
    return API_SHORT_CODE_TO_DISPLAY_NAME
  }
}

// Utility function to convert API short codes to display names
export function mapShortCodeToDisplayName(
  shortCode: string,
  mapping: Record<string, string>,
): string {
  return mapping[shortCode] || shortCode
}

// TierColors type - imported from content/tiers.ts (single source of truth)
// Colors should come from theme.palette.tiers - use getThemeColorsForApi() from content/tiers.ts
import type { TierColors } from "../../content/tiers"
export type { TierColors }

type ChartDataPoint = {
  label: string
  color: string
  value: number
  tierType?: "single_value" | "multi_value"
}

// Helpers
const formatTierLabel = (tier: string) =>
  tier.charAt(0).toUpperCase() + tier.slice(1)

// Utility functions
/**
 * Convert multi-value tier data to chart format
 * @param tierData - Tier data from API
 * @param tierColors - Colors from theme (use getTierColorsFromTheme from content/tiers.ts)
 */
export function convertMultiValueToChartData(
  tierData: MultiValueTier,
  tierColors: TierColors,
): ChartDataPoint[] {
  return tierData.data.map((item) => ({
    label: formatTierLabel(item.tier),
    color: tierColors[item.tier],
    value: item.normalized,
    tierType: "multi_value" as const,
  }))
}

/**
 * Convert single-value tier level to chart format
 * @param tierLevel - Tier level (1-4)
 * @param tierColors - Colors from theme (use getTierColorsFromTheme from content/tiers.ts)
 */
export function convertSingleValueToChartData(
  tierLevel: number,
  tierColors: TierColors,
): ChartDataPoint[] {
  return [
    {
      label: "Tier 1",
      color: tierColors.tier1,
      value: tierLevel === 1 ? 1 : 0,
      tierType: "single_value" as const,
    },
    {
      label: "Tier 2",
      color: tierColors.tier2,
      value: tierLevel === 2 ? 1 : 0,
      tierType: "single_value" as const,
    },
    {
      label: "Tier 3",
      color: tierColors.tier3,
      value: tierLevel === 3 ? 1 : 0,
      tierType: "single_value" as const,
    },
    {
      label: "Tier 4",
      color: tierColors.tier4,
      value: tierLevel === 4 ? 1 : 0,
      tierType: "single_value" as const,
    },
  ]
}

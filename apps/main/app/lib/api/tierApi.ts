/**
 * API functions for fetching tier data from COEQWAL API
 * Data is fetched, but default backups are listed here
 */

import { API_SHORT_CODE_TO_DISPLAY_NAME } from "../constants/outcomeMappings"
import { API_BASE } from "../constants/api"

// Type definitions
export interface TierDefinitions {
  [key: string]: string // e.g., "AG_REV": "Impact on agricultural production and revenue"
}

export interface TierListItem {
  short_code: string
  name: string
  description: string
  tier_type: "single_value" | "multi_value"
  tier_count: number
  is_active: boolean
}

export interface SingleValueTier {
  scenario: string
  tier_code: string
  name: string
  tier_type: "single_value"
  single_tier_level: number // 1-4
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

// Helpers
async function apiFetch<T>(endpoint: string, errorMessage: string): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`)
  if (!response.ok) {
    throw new Error(`${errorMessage}: ${response.statusText}`)
  }
  return response.json()
}

// API functions
export async function fetchTierDefinitions(): Promise<TierDefinitions> {
  return apiFetch("/tiers/definitions", "Failed to fetch tier definitions")
}

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

export async function fetchSingleTier(
  scenarioId: string,
  tierCode: string,
): Promise<SingleValueTier> {
  return apiFetch(
    `/tiers/scenarios/${scenarioId}/tiers/${tierCode}`,
    "Failed to fetch single tier",
  )
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

// Constants
const DEFAULT_TIER_COLORS = {
  tier1: "#7b9d3f", // green
  tier2: "#60aacb", // blue
  tier3: "#FFB347", // orange
  tier4: "#CD5C5C", // red
} as const

type TierColors = { tier1: string; tier2: string; tier3: string; tier4: string }
type ChartDataPoint = {
  label: string
  color: string
  value: number
  tierType?: "single_value" | "multi_value"
}

// Helpers
const getTierColors = (themeColors?: TierColors) =>
  themeColors || DEFAULT_TIER_COLORS

const formatTierLabel = (tier: string) =>
  tier.charAt(0).toUpperCase() + tier.slice(1)

// Utility functions
export function convertMultiValueToChartData(
  tierData: MultiValueTier,
  themeColors?: TierColors,
): ChartDataPoint[] {
  const tierColors = getTierColors(themeColors)

  return tierData.data.map((item) => ({
    label: formatTierLabel(item.tier),
    color: tierColors[item.tier],
    value: item.normalized,
    tierType: "multi_value" as const,
  }))
}

export function convertSingleValueToChartData(
  tierLevel: number,
  themeColors?: TierColors,
): ChartDataPoint[] {
  const tierColors = getTierColors(themeColors)

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

// ============================================================================
// Equity & Spread Helpers
// ============================================================================

export type EquityLevel = "high" | "moderate" | "low"

export interface EquityInfo {
  level: EquityLevel
  label: string
  description: string
}

/**
 * Interpret Gini coefficient as equity level
 * @param gini - Gini coefficient (0.0-1.0, lower = more equitable)
 */
export function getEquityInfo(gini: number): EquityInfo {
  if (gini < 0.2) {
    return {
      level: "high",
      label: "Highly equitable",
      description:
        "Outcomes are distributed fairly evenly across all locations",
    }
  } else if (gini < 0.4) {
    return {
      level: "moderate",
      label: "Moderately equitable",
      description: "Some variation in outcomes across locations",
    }
  } else {
    return {
      level: "low",
      label: "Unequal distribution",
      description: "Significant variation in outcomes across locations",
    }
  }
}

/**
 * Get spread band width (0-1, wider = more spread)
 * Useful for determining if outcomes are concentrated or dispersed
 */
export function getSpreadWidth(bandUpper: number, bandLower: number): number {
  return bandUpper - bandLower
}

/**
 * Check if outcomes are concentrated (narrow spread)
 */
export function isConcentrated(bandUpper: number, bandLower: number): boolean {
  return getSpreadWidth(bandUpper, bandLower) < 0.33
}

/**
 * Get performance level description based on normalized score
 */
export function getPerformanceLevel(normalizedScore: number): string {
  if (normalizedScore >= 0.75) return "Excellent"
  if (normalizedScore >= 0.5) return "Good"
  if (normalizedScore >= 0.25) return "Fair"
  return "Poor"
}

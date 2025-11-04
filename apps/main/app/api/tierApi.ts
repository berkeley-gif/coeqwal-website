/**
 * API functions for fetching tier data from COEQWAL API
 * Data is fetched, but default backups are listed here
 */

// API base URL
const API_BASE = "https://api.coeqwal.org/api"

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

export interface ScenarioTiersResponse {
  scenario: string
  tiers: {
    [tierCode: string]: {
      name: string
      type: "single_value" | "multi_value"
      level?: number // For single_value
      data?: MultiValueTierData[] // For multi_value
      total?: number // For multi_value
    }
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
    // Fallback to hardcoded mapping if API fails
    return {
      AG_REV: "Agricultural revenue",
      CWS_DEL: "Community deliveries",
      DELTA_ECO: "Delta estuary ecology",
      ENV_FLOWS: "Environmental flows",
      FW_DELTA_USES: "Freshwater for in-Delta uses",
      FW_EXP: "Freshwater for Delta exports",
      GW_STOR: "Groundwater storage",
      RES_STOR: "Reservoir storage",
      WRC_SALMON_AB: "Salmon abundance",
    }
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

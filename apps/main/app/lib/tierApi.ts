/**
 * API functions for fetching tier data from COEQWAL API
 * Data is fetched, but default backups are listed here
 */

// API base URL
const API_BASE = 'https://api.coeqwal.org/api'

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

// API functions
export async function fetchTierDefinitions(): Promise<TierDefinitions> {
  const response = await fetch(`${API_BASE}/tiers/definitions`)
  if (!response.ok) {
    throw new Error(`Failed to fetch tier definitions: ${response.statusText}`)
  }
  return response.json()
}

export async function fetchTierList(): Promise<TierListItem[]> {
  const response = await fetch(`${API_BASE}/tiers/list`)
  if (!response.ok) {
    throw new Error(`Failed to fetch tier list: ${response.statusText}`)
  }
  return response.json()
}

export async function fetchScenarioTiers(scenarioId: string): Promise<ScenarioTiersResponse> {
  const response = await fetch(`${API_BASE}/tiers/scenarios/${scenarioId}/tiers`)
  if (!response.ok) {
    throw new Error(`Failed to fetch scenario tiers: ${response.statusText}`)
  }
  return response.json()
}

export async function fetchSingleTier(
  scenarioId: string, 
  tierCode: string
): Promise<SingleValueTier> {
  const response = await fetch(`${API_BASE}/tiers/scenarios/${scenarioId}/tiers/${tierCode}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch single tier: ${response.statusText}`)
  }
  return response.json()
}

// Mapping from API
let _tierMappingCache: Record<string, string> | null = null

export async function getTierMapping(): Promise<Record<string, string>> {
  if (_tierMappingCache) {
    return _tierMappingCache
  }
  
  try {
    const tierList = await fetchTierList()
    _tierMappingCache = tierList.reduce((acc, tier) => {
      acc[tier.short_code] = tier.name
      return acc
    }, {} as Record<string, string>)
    return _tierMappingCache
  } catch (error) {
    console.error('Failed to fetch tier mapping, using fallback:', error)
    // Fallback to hardcoded mapping if API fails
    return {
      'AG_REV': 'Agricultural revenue',
      'CWS_DEL': 'Community deliveries', 
      'DELTA_ECO': 'Delta ecology',
      'ENV_FLOWS': 'Environmental flows',
      'FW_DELTA_USES': 'Freshwater for in-Delta uses',
      'FW_EXP': 'Freshwater for Delta exports',
      'GW_STOR': 'Groundwater storage',
      'RES_STOR': 'Reservoir storage',
      'WRC_SALMON_AB': 'Salmon abundance',
    }
  }
}

// Utility function to convert API short codes to display names
export function mapShortCodeToDisplayName(shortCode: string, mapping: Record<string, string>): string {
  return mapping[shortCode] || shortCode
}

// Utility function to convert multi_value API data to chart format
// Note: Colors come from theme, with hard-coded defaults
export function convertMultiValueToChartData(
  tierData: MultiValueTier,
  themeColors?: { tier1: string; tier2: string; tier3: string; tier4: string }
): Array<{
  label: string
  color: string
  value: number
}> {
  // Use theme colors if provided, otherwise fallback to defaults
  const tierColors = themeColors || {
    tier1: "#7b9d3f", // green (from theme)
    tier2: "#60aacb", // blue (from theme)
    tier3: "#FFB347", // orange (from theme)
    tier4: "#CD5C5C", // red (from theme)
  }

  return tierData.data.map(item => ({
    label: item.tier.charAt(0).toUpperCase() + item.tier.slice(1), // "tier1" -> "Tier1"
    color: tierColors[item.tier],
    value: item.normalized // Use normalized value (0-1)
  }))
}

// Utility to convert single_value tier to chart format
export function convertSingleValueToChartData(
  tierLevel: number,
  themeColors?: { tier1: string; tier2: string; tier3: string; tier4: string }
): Array<{
  label: string
  color: string
  value: number
}> {
  const tierColors = themeColors || {
    tier1: "#7b9d3f",
    tier2: "#60aacb", 
    tier3: "#FFB347",
    tier4: "#CD5C5C",
  }

  // Create array where only the active tier has value 1 (full width), others have 0
  return [
    { label: "Tier 1", color: tierColors.tier1, value: tierLevel === 1 ? 1 : 0 },
    { label: "Tier 2", color: tierColors.tier2, value: tierLevel === 2 ? 1 : 0 },
    { label: "Tier 3", color: tierColors.tier3, value: tierLevel === 3 ? 1 : 0 },
    { label: "Tier 4", color: tierColors.tier4, value: tierLevel === 4 ? 1 : 0 },
  ]
}

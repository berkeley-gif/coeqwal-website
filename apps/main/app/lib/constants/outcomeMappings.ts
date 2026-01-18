/**
 * Naming translations for tier and outcome mappings
 *
 * This file consolidates all mappings between:
 * - API short codes (e.g., "DELTA_ECO")
 * - Display names (e.g., "Delta estuary ecology")
 * - Metric IDs (e.g., "env-delta-ecology-tier")
 *
 * Strategy/scenario mappings are now in content/scenarios.ts
 *
 * TODO: Improve API name synchronization between frontend and backend
 * The current approach requires manual updates when API names change.
 * Todo improvements:
 * 1. Fetch tier names directly from /api/tiers/list at build time
 * 2. Generate TypeScript types from API response
 * 3. Use API names as source of truth, with UI_DISPLAY_NAME_OVERRIDES for customization only
 * 4. Add validation tests to compare constants with live API responses
 * 5. Consider creating a more formal shared schema between backend and frontend
 */

// Re-export the canonical list from scenarios feature for convenience
export { OUTCOME_DISPLAY_ORDER } from "../../features/scenarios/hooks"

/**
 * Map API short codes to display names
 * Used as fallback when API is unavailable
 * NOTE: These must match what the API actually returns
 */
export const API_SHORT_CODE_TO_DISPLAY_NAME: Record<string, string> = {
  AG_REV: "Agricultural revenue",
  CWS_DEL: "Community deliveries",
  DELTA_ECO: "Delta ecology", // API returns this
  ENV_FLOWS: "Environmental flows",
  FW_DELTA_USES: "Freshwater for in-Delta uses",
  FW_EXP: "Freshwater for Delta exports",
  GW_STOR: "Groundwater storage",
  RES_STOR: "Reservoir storage",
  WRC_SALMON_AB: "Salmon abundance",
} as const

/**
 * UI Display Name Overrides
 * Maps API names to preferred UI display names
 * Keys are lowercase for case-insensitive matching
 */
export const UI_DISPLAY_NAME_OVERRIDES: Record<string, string> = {
  // API name -> UI display name
  "delta ecology": "Delta estuary ecology",
  delta_eco: "Delta estuary ecology",
  "community water system deliveries": "Community deliveries",
  "cws deliveries": "Community deliveries",
  cws_del: "Community deliveries",
} as const

/**
 * Map display names to API short codes
 * Useful for reverse lookups (e.g., when calling tier location API)
 * NOTE: These must match what the API actually returns
 */
export const DISPLAY_NAME_TO_API_SHORT_CODE: Record<string, string> = {
  "Agricultural revenue": "AG_REV",
  "Community deliveries": "CWS_DEL",
  "Community water system deliveries": "CWS_DEL", // Alternative name
  "Delta ecology": "DELTA_ECO",
  "Delta estuary ecology": "DELTA_ECO", // UI display name
  "Environmental flows": "ENV_FLOWS",
  "Freshwater for in-Delta uses": "FW_DELTA_USES",
  "Freshwater for Delta exports": "FW_EXP",
  "Groundwater storage": "GW_STOR",
  "Reservoir storage": "RES_STOR",
  "Salmon abundance": "WRC_SALMON_AB",
} as const

/**
 * Map Data Explorer metric IDs to tier display names
 * Used in Data Explorer views to map metric selections to tier data
 * NOTE: Uses API names - will be converted to UI display names when needed
 */
export const METRIC_ID_TO_DISPLAY_NAME: Record<string, string> = {
  "cws-delivery-tier": "Community deliveries",
  "ag-revenue-tier": "Agricultural revenue",
  "env-flow-tier": "Environmental flows",
  "env-delta-ecology-tier": "Delta ecology", // API name
  "salinity-in-delta-tier": "Freshwater for in-Delta uses",
  "salinity-exports-tier": "Freshwater for Delta exports",
  "reservoir-storage-tier": "Reservoir storage",
  "gw-storage-tier": "Groundwater storage",
  "salmon-tier": "Salmon abundance",
} as const

/**
 * Apply UI display name overrides
 * Converts API names to preferred UI display names
 * Case-insensitive lookup
 */
export function applyUIDisplayOverride(apiName: string): string {
  return UI_DISPLAY_NAME_OVERRIDES[apiName.toLowerCase()] || apiName
}

/**
 * Reverse UI display name overrides
 * Converts UI display names back to API names
 */
export function reverseUIDisplayOverride(uiName: string): string {
  const entry = Object.entries(UI_DISPLAY_NAME_OVERRIDES).find(
    ([, ui]) => ui === uiName,
  )
  return entry ? entry[0] : uiName
}

/**
 * Helper function to get display name from API short code
 * Applies UI display name overrides
 */
export function getDisplayNameFromShortCode(shortCode: string): string {
  const apiName = API_SHORT_CODE_TO_DISPLAY_NAME[shortCode] || shortCode
  return applyUIDisplayOverride(apiName)
}

/**
 * Helper function to get API short code from display name
 * Handles both API names and UI display names
 */
export function getShortCodeFromDisplayName(displayName: string): string {
  // Try as UI name first, convert to API name if needed
  const apiName = reverseUIDisplayOverride(displayName)
  return DISPLAY_NAME_TO_API_SHORT_CODE[apiName] || displayName
}

/**
 * Helper function to get display name from metric ID
 * Applies UI display name overrides
 */
export function getDisplayNameFromMetricId(metricId: string): string {
  const apiName = METRIC_ID_TO_DISPLAY_NAME[metricId] || metricId
  return applyUIDisplayOverride(apiName)
}

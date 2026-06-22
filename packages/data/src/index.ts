/**
 * @repo/data - Shared data package for COEQWAL applications
 *
 * This package provides:
 * - Static GIS data (GeoJSON files)
 * - Data fetching utilities (fetcher, hooks)
 * - Cache key management
 * - React providers (DataProvider)
 * - COEQWAL API types, fetchers, and hooks
 *
 * ## Usage
 *
 * ```typescript
 * // GIS data
 * import { centralValleyBasins } from "@repo/data"
 *
 * // Fetching utilities
 * import { useLocalData, apiFetcher } from "@repo/data/fetching"
 *
 * // Cache keys
 * import { CACHE_KEYS } from "@repo/data/cache"
 *
 * // Providers
 * import { DataProvider } from "@repo/data/providers"
 *
 * // COEQWAL API (types, fetchers)
 * import { fetchTierList, fetchScenarioTiers } from "@repo/data/coeqwal"
 * import type { TierListItem, ScenarioTiersResponse } from "@repo/data/coeqwal"
 *
 * // COEQWAL hooks (for React components)
 * import { useTiers, useTierMapping, useScenarios } from "@repo/data/coeqwal/hooks"
 * ```
 */

// Export GIS data
export { default as centralValleyBasins } from "./gis/central_valley_basins_4326.geojson"
export { default as dams } from "./gis/dams.geojson"
export { default as sacramentoRiverHeadwaters } from "./gis/sacramento_river_headwaters.geojson"
export { default as sacramentoRiverMainstem } from "./gis/sacramento_river_mainstem.geojson"
export { default as sanJoaquinRiverMainstem } from "./gis/san_joaquin_river_mainstem.geojson"
export { default as mcCloudRiver } from "./gis/mccloud_river.geojson"
export { default as centralValleyBoundary } from "./gis/central_valley_boundary.geojson"
export { default as deltaLegalBoundary } from "./gis/delta_legal_boundary.geojson"
export { default as flowDrinkingRivers } from "./gis/owens_toulumne_colorado_rivers.geojson"
export { default as flowDrinkingAqueducts } from "./gis/hetchy_la_colorado_aqueducts.geojson"

// Re-export commonly used utilities for convenience
// (Full exports available via subpath imports)
export { CACHE_KEYS } from "./cache"
export { DataProvider } from "./providers"
export { useLocalData, apiFetcher, FetchError } from "./fetching"

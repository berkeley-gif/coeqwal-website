/**
 * @repo/data - Shared data package for COEQWAL applications
 * 
 * This package contains static data files (GeoJSON, JSON, etc.) that can be
 * shared across multiple apps in the monorepo.
 */

// Export GIS data
export { default as centralValleyBasins } from './gis/central_valley_basins_4326.geojson'
export { default as sacramentoRiverMainstem } from './gis/sacramento_river_mainstem.geojson'
export { default as sanJoaquinRiverMainstem } from './gis/san_joaquin_river_mainstem.geojson'


/**
 * Camera presets for map views
 */

/** Camera position for map views */
export interface CameraView {
  longitude: number
  latitude: number
  zoom: number
  bearing?: number
  pitch?: number
}

export const CALIFORNIA_VIEW: CameraView = {
  longitude: -124.4,
  latitude: 37.5,
  zoom: 5,
  bearing: 0,
  pitch: 0,
}

// Full-state overview used when the scenario-intro section appears.
// Centers California in the viewport (original pre-offset longitude).
export const CALIFORNIA_CENTERED_VIEW: CameraView = {
  longitude: -120.2,
  latitude: 38.5,
  zoom: 5.82,
  bearing: 0,
  pitch: 0,
}

export const CENTRAL_VALLEY_VIEW: CameraView = {
  longitude: -125.0,
  latitude: 38.5,
  zoom: 5.82,
  bearing: 0,
  pitch: 0,
}

export const DELTA_VIEW: CameraView = {
  longitude: -121.4,
  latitude: 38.2,
  zoom: 8.8,
  bearing: 0,
  pitch: 0,
}

export const PUMPING_PLANTS_VIEW: CameraView = {
  longitude: -121.4,
  latitude: 38.2,
  zoom: 8.8,
  bearing: 0,
  pitch: 0,
}

export const JERSEY_POINT_VIEW: CameraView = {
  longitude: -121.4,
  latitude: 38.2,
  zoom: 8.8,
  bearing: 0,
  pitch: 0,
}

export const SACRAMENTO_RIVER_VIEW: CameraView = {
  longitude: -121.5,
  latitude: 40,
  zoom: 6.5,
  bearing: 0,
  pitch: 0,
}

export const RESERVOIR_VIEW: CameraView = {
  longitude: -120.2,
  latitude: 37.5,
  zoom: 6,
  bearing: 0,
  pitch: 0,
}

/** Bounding box enclosing California's Urban demand-unit polygons
 *  (Community Water Systems). Measured from the demand_units tileset
 *  filtered to Class === "Urban" (167 features). */
export const CWS_DEL_BOUNDS: [[number, number], [number, number]] = [
  [-123.525, 34.995], // SW corner [lng, lat]
  [-118.803, 41.745], // NE corner [lng, lat]
]

/** Bounding box enclosing the Legal Delta (DETAW polygon).
 *  Measured from the geoschem tileset filtered to WBA_ID === "DETAW". */
export const DELTA_ECO_BOUNDS: [[number, number], [number, number]] = [
  [-122.0, 37.7], // SW corner [lng, lat]
  [-121.1, 38.85], // NE corner [lng, lat]
]

/** Bounding box framing the two SWP/CVP export pumping plants (Banks + Jones).
 *  Computed from STATION_COORDINATES in outcomeLocations.ts with padding.
 *  maxZoom: 9 in resolveOutcomeCamera prevents over-zooming. */
export const FW_EXP_BOUNDS: [[number, number], [number, number]] = [
  [-121.72, 37.75], // SW corner [lng, lat]
  [-121.49, 37.95], // NE corner [lng, lat]
]

/** Bounding box framing the two Delta salinity compliance stations (Emmaton + Jersey Point).
 *  Computed from STATION_COORDINATES in outcomeLocations.ts with padding.
 *  maxZoom: 9 in resolveOutcomeCamera prevents over-zooming. */
export const FW_DELTA_USES_BOUNDS: [[number, number], [number, number]] = [
  [-121.82, 37.95], // SW corner [lng, lat]
  [-121.47, 38.2], // NE corner [lng, lat]
]

/** Bounding box enclosing ENV_FLOWS monitoring stations (17 stations).
 *  Computed from hardcoded coordinates in outcomeLocations.ts. */
export const ENV_FLOWS_BOUNDS: [[number, number], [number, number]] = [
  [-123.804, 36.295], // SW corner [lng, lat]
  [-119.897, 41.72], // NE corner [lng, lat]
]

/** Bounding box enclosing RES_STOR reservoir markers (7 reservoirs).
 *  Computed from RESERVOIR_CONFIGS in outcomeLocations.ts.
 *  Extra vertical padding for marker labels - the northernmost
 *  reservoir (Trinity Lake at lat 40.98) renders its label ~95 px above
 *  its anchor (35 px base offset + up-to-25 px stagger + ~35 px
 *  leader/label stack). The NE lat is set well above Trinity so the
 *  label lands with comfortable breathing room rather than flush to the
 *  top edge. */
export const RES_STOR_BOUNDS: [[number, number], [number, number]] = [
  [-123.68, 36.26], // SW corner [lng, lat]
  [-117.66, 42.8], // NE corner [lng, lat]
]

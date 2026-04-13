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

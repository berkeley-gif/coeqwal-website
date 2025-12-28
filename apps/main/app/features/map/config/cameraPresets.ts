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
  longitude: -120.2,
  latitude: 37.5,
  zoom: 5,
  bearing: 0,
  pitch: 0,
}

export const CENTRAL_VALLEY_VIEW: CameraView = {
  longitude: -120.8,
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

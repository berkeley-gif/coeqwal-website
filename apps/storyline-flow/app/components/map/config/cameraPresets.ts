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

export interface ResponsiveCameraView {
  xs?: CameraView
  sm?: CameraView
  md?: CameraView
  lg: CameraView
  xl: CameraView
}

export const CALIFORNIA_VIEW: CameraView = {
  longitude: -126.065258143334,
  latitude: 37.33091086711717,
  zoom: 6,
  bearing: 0,
  pitch: 0,
}

export const MAJOR_RIVER_VIEW: CameraView = {
  longitude: -122.4311,
  latitude: 37.6478,
  zoom: 7.76,
  bearing: -9.15,
  pitch: 49.19,
}

export const CENTRAL_VALLEY_VIEW: CameraView = {
  longitude: -122.6156,
  latitude: 36.4965,
  zoom: 7,
  bearing: -20.53,
  pitch: 39.41,
}

export const DELTA_WETLAND_VIEW: CameraView = {
  longitude: -122.6311,
  latitude: 37.7478,
  zoom: 8.5,
  bearing: -9.15,
  pitch: 49.19,
}

export const DELTA_VIEW: CameraView = {
  longitude: -121.8427,
  latitude: 37.618,
  zoom: 8.2,
  bearing: 0,
  pitch: 0,
}

export const GOLD_RUSH_VIEW: CameraView = {
  longitude: -122.8613,
  latitude: 38.706,
  zoom: 7.8,
  bearing: 0,
  pitch: 0,
}

export const DRINKING_VIEW: CameraView = {
  longitude: -121.4944,
  latitude: 35.5816,
  zoom: 6.5,
  bearing: 0,
  pitch: 0,
}

export const CITY_VIEW: CameraView = {
  longitude: -120.8427,
  latitude: 35.708,
  zoom: 6.5,
  bearing: 0,
  pitch: 0,
}

export const IMPACT_SALMON_VIEW: CameraView = {
  longitude: -123.02,
  latitude: 40.718,
  zoom: 9,
  bearing: 0,
  pitch: 0,
}

export const IMPACT_DELTA_VIEW: CameraView = {
  longitude: -122.4311,
  latitude: 37.9478,
  zoom: 9,
  bearing: 0,
  pitch: 0,
}

export const IMPACT_DRINKING_VIEW: CameraView = {
  longitude: -120.4156,
  latitude: 36.2965,
  zoom: 8.5,
  bearing: 0,
  pitch: 0,
}

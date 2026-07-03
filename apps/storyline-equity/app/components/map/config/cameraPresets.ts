"use client"

export interface CameraView {
  longitude: number
  latitude: number
  zoom: number
  bearing?: number
  pitch?: number
}

export const CALIFORNIA_VIEW: CameraView = {
  longitude: -121.065258143334,
  latitude: 37.83091086711717,
  zoom: 6.2,
  bearing: 0,
  pitch: 0,
}

export const SHASTA_MCCLOUD_VIEW: CameraView = {
  longitude: -122.385,
  latitude: 40.81,
  zoom: 9.7,
  bearing: 28,
  pitch: 50,
}

export const YUBA_RIVER_VIEW: CameraView = {
  longitude: -120.98,
  latitude: 39.21,
  zoom: 8.45,
  bearing: 18,
  pitch: 42,
}

export const DELTA_INFRASTRUCTURE_VIEW: CameraView = {
  longitude: -121.62,
  latitude: 38.04,
  zoom: 9.15,
  bearing: -8,
  pitch: 42,
}

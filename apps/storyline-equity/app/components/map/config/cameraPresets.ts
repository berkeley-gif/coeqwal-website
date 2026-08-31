"use client"

export interface CameraView {
  longitude: number
  latitude: number
  zoom: number
  bearing?: number
  pitch?: number
  bounds?: [[number, number], [number, number]]
  boundsPadding?: {
    top: number
    right: number
    bottom: number
    left: number
  }
}

export const CALIFORNIA_STATE_BOUNDS: [[number, number], [number, number]] = [
  [-124.5, 32.45],
  [-114.0, 42.05],
]

export const CALIFORNIA_VIEW: CameraView = {
  longitude: -119.55,
  latitude: 37.25,
  zoom: 5.65,
  bearing: 0,
  pitch: 0,
}

export const CALIFORNIA_TRIBES_VIEW: CameraView = {
  ...CALIFORNIA_VIEW,
}

export const SHASTA_MCCLOUD_VIEW: CameraView = {
  longitude: -122.385,
  latitude: 40.81,
  zoom: 9.7,
  bearing: 28,
  pitch: 50,
}

export const YUBA_RIVER_VIEW: CameraView = {
  longitude: -121.08,
  latitude: 39.21,
  zoom: 9.2,
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

"use client"

export interface CameraView {
  longitude: number
  latitude: number
  zoom: number
  maxZoom?: number
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

export const INDIGENOUS_RIVER_NETWORK_VIEW: CameraView = {
  longitude: -120.76,
  latitude: 39.5,
  zoom: 6.5,
  maxZoom: 6.5,
  bearing: 0,
  pitch: 0,
  bounds: [
    [-122.45, 37.75],
    [-119.15, 40.85],
  ],
}

export const SHASTA_MCCLOUD_VIEW: CameraView = {
  longitude: -122.15,
  latitude: 41.1,
  zoom: 9.7,
  maxZoom: 9.7,
  bearing: 28,
  pitch: 50,
  bounds: [
    [-122.2, 40.96],
    [-122.1, 41.14],
  ],
  boundsPadding: {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
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

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
  longitude: -122.285,
  latitude: 40.81,
  zoom: 9.7,
  bearing: -28,
  pitch: 55,
}

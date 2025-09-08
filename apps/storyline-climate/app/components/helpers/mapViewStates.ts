interface MapViewState {
  longitude: number
  latitude: number
  zoom: number
  bearing: number
  pitch: number
}

export interface ResponsiveMapViewState {
  xs?: MapViewState
  sm?: MapViewState
  md?: MapViewState
  lg: MapViewState
  xl: MapViewState
}

export const stateMapViewState: ResponsiveMapViewState = {
  xl: {
    longitude: -126.065258143334,
    latitude: 37.33091086711717,
    zoom: 6,
    bearing: 0,
    pitch: 0,
  },
  lg: {
    longitude: -125.6652581433317,
    latitude: 37.44352,
    zoom: 5.4,
    bearing: 0,
    pitch: 0,
  },
}

export const deltaMapViewState: ResponsiveMapViewState = {
  lg: {
    longitude: -121.8427,
    latitude: 38.058,
    zoom: 8,
    bearing: 0,
    pitch: 0,
  },
  xl: {
    longitude: -121.8427,
    latitude: 38.058,
    zoom: 8.5,
    bearing: 0,
    pitch: 0,
  },
}

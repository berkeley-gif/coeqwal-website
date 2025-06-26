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
    latitude: 37.608,
    zoom: 7.8,
    bearing: 0,
    pitch: 0,
  },
  xl: {
    longitude: -121.8427,
    latitude: 37.618,
    zoom: 8.2,
    bearing: 0,
    pitch: 0,
  },
}

export const riverMapViewState: ResponsiveMapViewState = {
  lg: {
    longitude: -122.4311,
    latitude: 37.6478,
    zoom: 6.76,
    bearing: -9.15,
    pitch: 49.19,
  },
  xl: {
    longitude: -122.4311,
    latitude: 37.6478,
    zoom: 7.76,
    bearing: -9.15,
    pitch: 49.19,
  },
}

export const riverValleyMapViewState: ResponsiveMapViewState = {
  lg: {
    longitude: -122.4311,
    latitude: 37.2478,
    zoom: 6.5,
    bearing: -9.15,
    pitch: 49.19,
  },
  xl: {
    longitude: -122.6156,
    latitude: 36.4965,
    zoom: 7,
    bearing: -20.53,
    pitch: 39.41,
  },
}

export const riverDeltaMapViewState: ResponsiveMapViewState = {
  lg: {
    longitude: -122.6311,
    latitude: 37.7478,
    zoom: 7.5,
    bearing: -9.15,
    pitch: 49.19,
  },
  xl: {
    longitude: -122.6311,
    latitude: 37.7478,
    zoom: 8.5,
    bearing: -9.15,
    pitch: 49.19,
  },
}

export const goldRushMapViewState: ResponsiveMapViewState = {
  lg: {
    longitude: -122.5613,
    latitude: 39.306,
    zoom: 7.7,
    bearing: 0,
    pitch: 0,
  },
  xl: {
    longitude: -123.1613,
    latitude: 39.306,
    zoom: 7.8,
    bearing: 0,
    pitch: 0,
  },
}

export const reclamationMapViewState: ResponsiveMapViewState = {
  lg: {
    longitude: -122.8694,
    latitude: 38.2698,
    zoom: 7.3,
    bearing: 0,
    pitch: 0,
  },
  xl: {
    longitude: -122.6694,
    latitude: 38.0698,
    zoom: 7.8,
    bearing: 0,
    pitch: 0,
  },
}

export const drinkingMapViewState: ResponsiveMapViewState = {
  lg: {
    longitude: -121.8944,
    latitude: 35.5816,
    zoom: 5.8,
    bearing: 0,
    pitch: 0,
  },
  xl: {
    longitude: -121.4944,
    latitude: 35.5816,
    zoom: 6.5,
    bearing: 0,
    pitch: 0,
  },
}

export const cityMapViewState: ResponsiveMapViewState = {
  lg: {
    longitude: -122.8427,
    latitude: 35.808,
    zoom: 5.8,
    bearing: 0,
    pitch: 0,
  },
  xl: {
    longitude: -120.8427,
    latitude: 35.708,
    zoom: 6.5,
    bearing: 0,
    pitch: 0,
  },
}

export const valleyMapViewState: ResponsiveMapViewState = {
  lg: {
    longitude: -122.269,
    latitude: 36.7783,
    zoom: 7,
    bearing: 0,
    pitch: 0,
  },
  xl: {
    longitude: -122.769,
    latitude: 36.7783,
    zoom: 7.5,
    bearing: 0,
    pitch: 0,
  },
}

export const impactSalmonMapViewState: ResponsiveMapViewState = {
  lg: {
    longitude: -123.02,
    latitude: 40.718,
    zoom: 8,
    bearing: 0,
    pitch: 0,
  },
  xl: {
    longitude: -123.02,
    latitude: 40.718,
    zoom: 9,
    bearing: 0,
    pitch: 0,
  },
}

export const impactDeltaMapViewState: ResponsiveMapViewState = {
  lg: {
    longitude: -122.4427,
    latitude: 37.708,
    zoom: 8,
    bearing: 0,
    pitch: 0,
  },
  xl: {
    longitude: -122.4311,
    latitude: 37.9478,
    zoom: 9,
    bearing: 0,
    pitch: 0,
  },
}

export const impactGroundMapViewState: ResponsiveMapViewState = {
  lg: {
    longitude: -120.4156,
    latitude: 36.2965,
    zoom: 7.8,
    bearing: 0,
    pitch: 0,
  },
  xl: {
    longitude: -120.4156,
    latitude: 36.2965,
    zoom: 8.5,
    bearing: 0,
    pitch: 0,
  },
}

export const impactDrinkingMapViewState: ResponsiveMapViewState = {
  lg: {
    longitude: -120.4156,
    latitude: 36.2965,
    zoom: 7.8,
    bearing: 0,
    pitch: 0,
  },
  xl: {
    longitude: -120.4156, //-120.987,
    latitude: 36.2965, //36.0583,
    zoom: 8.5,
    bearing: 0,
    pitch: 0,
  },
}

export const impactClimateMapViewState: ResponsiveMapViewState =
  stateMapViewState

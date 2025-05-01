interface MapViewState {
  longitude: number
  latitude: number
  zoom: number
  bearing: number
  pitch: number
}

interface ResponsiveMapViewState {
  xs?: MapViewState
  sm?: MapViewState
  md?: MapViewState
  lg: MapViewState
  xl: MapViewState
}

export const stateMapViewState: ResponsiveMapViewState = {
  xl: {
    longitude: -127.86525814333174,
    latitude: 37.33091086711717,
    zoom: 6,
    bearing: 0,
    pitch: 0,
  },
  lg: {
    longitude: -125.96525814333174,
    latitude: 37.44352,
    zoom: 5.7,
    bearing: 0,
    pitch: 0,
  },
}

export const deltaMapViewState: ResponsiveMapViewState = {
  lg: {
    longitude: -121.8427,
    latitude: 37.758,
    zoom: 8.5,
    bearing: 0,
    pitch: 0,
  },
  xl: {
    longitude: -121.8427,
    latitude: 37.758,
    zoom: 9,
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
    zoom: 8,
    bearing: 0,
    pitch: 0,
  },
}

export const reclamationMapViewState: ResponsiveMapViewState = {
  lg: {
    longitude: -123.1694,
    latitude: 37.8698,
    zoom: 7.3,
    bearing: 0,
    pitch: 0,
  },
  xl: {
    longitude: -123.6694,
    latitude: 37.4698,
    zoom: 7.5,
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
    longitude: -122.4944,
    latitude: 35.5816,
    zoom: 6.5,
    bearing: 0,
    pitch: 0,
  },
}

export const cityMapViewState: ResponsiveMapViewState = {
  lg: {
    longitude: -123.8427,
    latitude: 35.308,
    zoom: 6,
    bearing: 0,
    pitch: 0,
  },
  xl: {
    longitude: -124.8427,
    latitude: 36.308,
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
    longitude: -124.2358,
    latitude: 39.1786,
    zoom: 8,
    bearing: 0,
    pitch: 0,
  },
  xl: {
    longitude: -124.2358,
    latitude: 39.1786,
    zoom: 8,
    bearing: 0,

    pitch: 0,
  },
}

export const impactDeltaMapViewState: ResponsiveMapViewState = {
  lg: {
    longitude: -123.8427,
    latitude: 37.708,
    zoom: 8,
    bearing: 0,
    pitch: 0,
  },
  xl: {
    longitude: -123.8427,
    latitude: 37.708,
    zoom: 8,
    bearing: 0,
    pitch: 0,
  },
}

export const impactGroundMapViewState: ResponsiveMapViewState = {
  lg: {
    longitude: -121.5147,
    latitude: 36.07,
    zoom: 8,
    bearing: 0,
    pitch: 0,
  },
  xl: {
    longitude: -121.5147,
    latitude: 36.07,
    zoom: 8,
    bearing: 0,
    pitch: 0,
  },
}

export const impactDrinkingMapViewState: ResponsiveMapViewState = {
  lg: {
    longitude: -120.987,
    latitude: 36.0583,
    zoom: 8,
    bearing: 0,
    pitch: 0,
  },
  xl: {
    longitude: -120.987,
    latitude: 36.0583,
    zoom: 8,
    bearing: 0,
    pitch: 0,
  },
}

export const impactClimateMapViewState: ResponsiveMapViewState = {
  lg: {
    longitude: -127.7628,
    latitude: 38.0422,
    zoom: 6,
    bearing: 0,
    pitch: 0,
  },
  xl: {
    longitude: -127.7628,
    latitude: 38.0422,
    zoom: 6,
    bearing: 0,
    pitch: 0,
  },
}

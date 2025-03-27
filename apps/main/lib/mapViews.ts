export type BreakpointView = {
  longitude: number
  latitude: number
  zoom: number
  pitch: number
  bearing: number
}

export const initialMapView = {
  longitude: -129.06368988805684,
  latitude: 37.46691559581208,
  zoom: 5.36,
  pitch: 0,
  bearing: 0,
  padding: { top: 0, bottom: 0, left: 0, right: 0 },
}

// One set of coordinates for each MUI breakpoint.
export const breakpointViews: Record<
  "xs" | "sm" | "md" | "lg" | "xl",
  BreakpointView
> = {
  xs: {
    longitude: -123.32201065632816,
    latitude: 36.91827613725431,
    zoom: 5,
    pitch: 0,
    bearing: 0,
  },
  sm: {
    longitude: -123.32201065632816,
    latitude: 36.91827613725431,
    zoom: 5,
    pitch: 0,
    bearing: 0,
  },
  md: {
    longitude: -124.26560803859064,
    latitude: 37.33091086711717,
    zoom: 5.5,
    pitch: 0,
    bearing: 0,
  },
  lg: {
    longitude: -122.7281490904835,
    latitude: 37.33091086711717,
    zoom: 5.5,
    pitch: 0,
    bearing: 0,
  },
  xl: {
    longitude: -128.86525814333174,
    latitude: 37.33091086711717,
    zoom: 5.5,
    pitch: 0,
    bearing: 0,
  },
}

// For 4 paragraphs in CaliforniaWaterPanel, each with 5 breakpoints.
export const paragraphMapViews: Array<
  Record<"xs" | "sm" | "md" | "lg" | "xl", BreakpointView>
> = [
  // Paragraph #1
  {
    xs: { longitude: -120.1, latitude: 37.0, zoom: 5.2, pitch: 0, bearing: 0 },
    sm: { longitude: -120.2, latitude: 37.05, zoom: 5.3, pitch: 0, bearing: 0 },
    md: { longitude: -120.3, latitude: 37.1, zoom: 5.4, pitch: 0, bearing: 0 },
    lg: { longitude: -120.4, latitude: 37.15, zoom: 5.5, pitch: 0, bearing: 0 },
    xl: { longitude: -120.5, latitude: 37.2, zoom: 5.6, pitch: 0, bearing: 0 },
  },
  // Paragraph #2
  {
    xs: {
      longitude: -122.23276,
      latitude: 38.418301,
      zoom: 7.5,
      pitch: 50,
      bearing: 36.8,
    },
    sm: {
      longitude: -122.23276,
      latitude: 38.418301,
      zoom: 7.5,
      pitch: 50,
      bearing: 36.8,
    },
    md: {
      longitude: -122.23276,
      latitude: 38.418301,
      zoom: 7.5,
      pitch: 50,
      bearing: 36.8,
    },
    lg: {
      longitude: -122.23276,
      latitude: 38.418301,
      zoom: 7.5,
      pitch: 50,
      bearing: 36.8,
    },
    xl: {
      longitude: -122.23276,
      latitude: 38.418301,
      zoom: 7.5,
      pitch: 50,
      bearing: 36.8,
    },
  },
  // Paragraph #4
  {
    xs: {
      longitude: -122.115236,
      latitude: 38.079628,
      zoom: 9.5,
      pitch: 0,
      bearing: 0,
    },
    sm: {
      longitude: -122.115236,
      latitude: 38.079628,
      zoom: 9.5,
      pitch: 0,
      bearing: 0,
    },
    md: {
      longitude: -122.115236,
      latitude: 38.079628,
      zoom: 9.5,
      pitch: 0,
      bearing: 0,
    },
    lg: {
      longitude: -122.115236,
      latitude: 38.079628,
      zoom: 9.5,
      pitch: 0,
      bearing: 0,
    },
    xl: {
      longitude: -122.115236,
      latitude: 38.079628,
      zoom: 9.5,
      pitch: 0,
      bearing: 0,
    },
  },
  // Paragraph #4
  {
    xs: {
      longitude: -121.023057,
      latitude: 37.4,
      zoom: 8.5,
      pitch: 68,
      bearing: 58.49,
    },
    sm: {
      longitude: -120.97649,
      latitude: 37.4,
      zoom: 8.5,
      pitch: 68,
      bearing: 58.49,
    },
    md: {
      longitude: -120.97649,
      latitude: 37.4,
      zoom: 8.5,
      pitch: 68,
      bearing: 58.49,
    },
    lg: {
      longitude: -120.97649,
      latitude: 37.4,
      zoom: 8.5,
      pitch: 68,
      bearing: 58.49,
    },
    xl: {
      longitude: -120.97649,
      latitude: 37.4,
      zoom: 8.5,
      pitch: 68,
      bearing: 58.49,
    },
  },
]

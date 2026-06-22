export interface LocationLabel {
  id: string
  name: string
  latitude: number
  longitude: number
}

export interface MapCircleAnnotation extends LocationLabel {
  color: string
  revealAt: number
}

export const BACKGROUND_RIVER_LABELS: LocationLabel[] = [
  {
    id: "sacramento-river",
    name: "Sacramento River",
    latitude: 39.0,
    longitude: -121.78,
  },
  {
    id: "san-joaquin-river",
    name: "San Joaquin River",
    latitude: 37.25,
    longitude: -120.82,
  },
]

export const BACKGROUND_CIRCLE_ANNOTATIONS: MapCircleAnnotation[] = [
  {
    id: "central-valley-agriculture",
    name: "Agriculture",
    latitude: 36.72,
    longitude: -120.38,
    color: "#40835D",
    revealAt: 0.42,
  },
  {
    id: "bay-area-city",
    name: "City",
    latitude: 37.78,
    longitude: -122.42,
    color: "#F27322",
    revealAt: 0.5,
  },
  {
    id: "los-angeles-city",
    name: "City",
    latitude: 34.05,
    longitude: -118.24,
    color: "#F27322",
    revealAt: 0.5,
  },
  {
    id: "delta",
    name: "Delta",
    latitude: 38.04,
    longitude: -121.62,
    color: "#75cddb",
    revealAt: 0.58,
  },
  {
    id: "shasta-salmon",
    name: "Salmon",
    latitude: 40.72,
    longitude: -122.42,
    color: "#FCB321",
    revealAt: 0.64,
  },
]

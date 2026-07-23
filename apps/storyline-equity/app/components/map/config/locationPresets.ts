export interface LocationLabel {
  id: string
  name: string
  latitude: number
  longitude: number
}

export interface MapCircleAnnotation extends LocationLabel {
  color: string
  revealAt: number
  iconSrc?: string
  offset?: [number, number]
  labelPosition?: "above" | "below"
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
    longitude: -119.32,
  },
]

export const BACKGROUND_CIRCLE_ANNOTATIONS: MapCircleAnnotation[] = [
  {
    id: "central-valley-agriculture",
    name: "Central Valley",
    latitude: 37.52,
    longitude: -120.18,
    color: "#f2f0ef",
    revealAt: 0.25,
    iconSrc: "/map-icons/ag/water-user-ag-06.svg",
    labelPosition: "above",
  },
  {
    id: "bay-area-city",
    name: "Bay Area",
    latitude: 37.78,
    longitude: -122.42,
    color: "#f2f0ef",
    revealAt: 0.4,
    iconSrc: "/map-icons/urban/water_user_urban-01.svg",
    offset: [-24, 10],
    labelPosition: "above",
  },
  {
    id: "los-angeles-city",
    name: "Los Angeles",
    latitude: 34.55,
    longitude: -119.14,
    color: "#f2f0ef",
    revealAt: 0.4,
    iconSrc: "/map-icons/urban/water_user_urban-01.svg",
    labelPosition: "above",
  },
  {
    id: "delta",
    name: "Delta",
    latitude: 38.04,
    longitude: -121.62,
    color: "#f2f0ef",
    revealAt: 0.54,
    iconSrc: "/map-icons/wetland/water_user_wetland-01.svg",
    offset: [18, -8],
  },
  {
    id: "shasta-salmon",
    name: "Chinook Salmon",
    latitude: 40.72,
    longitude: -122.42,
    color: "#f2f0ef",
    revealAt: 0.54,
    iconSrc: "/map-icons/salmon/salmon_adult.svg",
  },
]

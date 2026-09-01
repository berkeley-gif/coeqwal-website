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
    latitude: 39.6,
    longitude: -121.78,
  },
  {
    id: "san-joaquin-river",
    name: "San Joaquin River",
    latitude: 37.25,
    longitude: -119.32,
  },
]

export const SHASTA_MCCLOUD_RIVER_LABELS: LocationLabel[] = [
  {
    id: "mccloud-river",
    name: "McCloud River",
    latitude: 40.92,
    longitude: -122.22,
  },
]

export const YUBA_RIVER_LABEL: LocationLabel = {
  id: "yuba-river",
  name: "Yuba River",
  latitude: 39.08,
  longitude: -121.5,
}

export const BACKGROUND_CIRCLE_ANNOTATIONS: MapCircleAnnotation[] = [
  {
    id: "central-valley-agriculture",
    name: "",
    latitude: 36.72,
    longitude: -119.58,
    color: "#f2f0ef",
    revealAt: 0.2,
    iconSrc: "/map-icons/agriculture.svg",
    labelPosition: "above",
  },
  {
    id: "bay-area-city",
    name: "Bay Area",
    latitude: 37.78,
    longitude: -123.2,
    color: "#f2f0ef",
    revealAt: 0.32,
    iconSrc: "/map-icons/urban.svg",
    offset: [-24, 10],
    labelPosition: "above",
  },
  {
    id: "los-angeles-city",
    name: "Los Angeles",
    latitude: 33.3,
    longitude: -119.2,
    color: "#f2f0ef",
    revealAt: 0.32,
    iconSrc: "/map-icons/urban.svg",
    labelPosition: "above",
  },
  {
    id: "delta",
    name: "Delta",
    latitude: 38.04,
    longitude: -121.62,
    color: "#f2f0ef",
    revealAt: 0.46,
    iconSrc: "/map-icons/wetland.svg",
    offset: [18, -8],
  },
  {
    id: "shasta-salmon",
    name: "Chinook Salmon",
    latitude: 40.72,
    longitude: -122.42,
    color: "#f2f0ef",
    revealAt: 0.46,
    iconSrc: "/map-icons/salmon.svg",
  },
]

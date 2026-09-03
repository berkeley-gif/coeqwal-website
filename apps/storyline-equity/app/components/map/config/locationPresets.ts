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
    latitude: 40.4,
    longitude: -121.58,
  },
  {
    id: "san-joaquin-river",
    name: "San Joaquin River",
    latitude: 37.85,
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
  {
    id: "mount-shasta",
    name: "Mount Shasta",
    latitude: 41.6,
    longitude: -121.9,
  },
]

export const YUBA_RIVER_LABEL: LocationLabel = {
  id: "yuba-river",
  name: "Yuba River",
  latitude: 39.1,
  longitude: -121.25,
}

export const BACKGROUND_CIRCLE_ANNOTATIONS: MapCircleAnnotation[] = [
  {
    id: "central-valley-agriculture",
    name: "",
    latitude: 36.797348,
    longitude: -120.150571,
    color: "#f2f0ef",
    revealAt: 0.2,
    iconSrc: "/map-icons/agriculture.svg",
    labelPosition: "above",
  },
  {
    id: "bay-area-city",
    name: "Bay Area",
    // latitude: 37.675499398535585,
    // longitude: -122.76373765157861,
    latitude: 37.660033,
    longitude: -122.73767,
    color: "#f2f0ef",
    revealAt: 0.32,
    iconSrc: "/map-icons/urban.svg",
    offset: [-24, 10],
    labelPosition: "above",
  },
  {
    id: "los-angeles-city",
    name: "Los Angeles",
    latitude: 35.381637,
    longitude: -119.167607,
    color: "#f2f0ef",
    revealAt: 0.32,
    iconSrc: "/map-icons/urban.svg",
    labelPosition: "above",
  },
  {
    id: "small-community",
    name: "",
    // latitude: 38.984513458619375,
    // longitude: -120.89464564260899,
    latitude: 39.279324,
    longitude: -120.73118,
    color: "#f2f0ef",
    revealAt: 0.32,
    iconSrc: "/map-icons/urban_small.svg",
    labelPosition: "above",
  },
  {
    id: "delta",
    name: "Delta",
    // latitude: 38.112284901423045,
    // longitude: -122.10922866384978,
    latitude: 38.185267,
    longitude: -122.204065,
    color: "#f2f0ef",
    revealAt: 0.46,
    iconSrc: "/map-icons/wetland.svg",
    offset: [18, -8],
  },
  {
    id: "shasta-salmon",
    name: "Chinook Salmon",
    latitude: 40.74781,
    longitude: -122.381819,
    color: "#f2f0ef",
    revealAt: 0.46,
    iconSrc: "/map-icons/salmon.svg",
  },
]

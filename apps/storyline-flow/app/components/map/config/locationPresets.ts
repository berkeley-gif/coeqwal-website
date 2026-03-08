export interface LocationLabel {
  id: string
  name: string
  latitude: number
  longitude: number
}

export const SierraNevadaMountains: LocationLabel = {
  id: "sierra-nevada",
  name: "Sierra Nevada Mountains",
  latitude: 38.2489,
  longitude: -119.6877,
}

export const SacramentoRiver: LocationLabel = {
  id: "sacramento-river",
  name: "Sacramento River",
  latitude: 38.5816,
  longitude: -121.4944,
}

export const SanJoaquinRiver: LocationLabel = {
  id: "san-joaquin-river",
  name: "San Joaquin River",
  latitude: 37.6413,
  longitude: -121.0161,
}

export const CentralValley: LocationLabel = {
  id: "central-valley",
  name: "Central Valley",
  latitude: 37.0783,
  longitude: -120.2179,
}

export const AncientDeltaWetlands: LocationLabel = {
  id: "ancient-delta-wetlands",
  name: "1800s Delta Freshwater Wetlands",
  latitude: 38.0422,
  longitude: -121.178,
}

export const DeltaLegalBoundary: LocationLabel = {
  id: "delta-legal-boundary",
  name: "Delta Legal Boundary",
  latitude: 38.0422,
  longitude: -121.078,
}

export const SoCal: LocationLabel = {
  id: "socal",
  name: "Southern California",
  latitude: 34.0522,
  longitude: -118.2437,
}

export const NorCal: LocationLabel = {
  id: "norcal",
  name: "San Francisco Bay Area",
  latitude: 37.7749,
  longitude: -122.4194,
}

/* GOLD RUSH */

const Reclamation: LocationLabel = {
  id: "reclamation",
  name: "Reclamation District 900",
  latitude: 38.6805,
  longitude: -121.5407,
}

const Pumping: LocationLabel = {
  id: "pumping",
  name: "Byron Tract Pumping",
  latitude: 37.8346,
  longitude: -121.6404,
}

const YubaRiver: LocationLabel = {
  id: "yuba-river",
  name: "Yuba River",
  latitude: 39.1651,
  longitude: -121.4922,
}

export const GOLDRUSH_LABELS = [Reclamation, Pumping, YubaRiver]

/* DRINKING */

const ColoradoRiver: LocationLabel = {
  id: "colorado-river",
  name: "Colorado River",
  latitude: 35.1069,
  longitude: -114.9466,
}

const OwensRiver: LocationLabel = {
  id: "owens-river",
  name: "Owens River",
  latitude: 37.0662,
  longitude: -118.4553,
}

const ToulumeRiver: LocationLabel = {
  id: "toulume-river",
  name: "Toulume River",
  latitude: 37.7333,
  longitude: -119.9833,
}

const HetchHetchy: LocationLabel = {
  id: "hetch-hetchy",
  name: "Hetch Hetchy Aqueduct",
  latitude: 37.7651,
  longitude: -121.6376,
}

const LosAngelesAqueduct: LocationLabel = {
  id: "los-angeles-aqueduct",
  name: "Los Angeles Aqueduct",
  latitude: 35.5547,
  longitude: -117.1535,
}

const ColoradoRiverAqueduct: LocationLabel = {
  id: "colorado-river-aqueduct",
  name: "Colorado River Aqueduct",
  latitude: 33.9302,
  longitude: -115.8132,
}

export const DRINKING_LABELS: LocationLabel[] = [
  OwensRiver,
  ToulumeRiver,
  ColoradoRiver,
  HetchHetchy,
  LosAngelesAqueduct,
  ColoradoRiverAqueduct,
]

/* IMPACT */

export const ShastaDam: LocationLabel = {
  id: "shasta-dam",
  name: "Shasta Dam",
  latitude: 40.718,
  longitude: -122.42,
}

export const SacramentoDelta: LocationLabel = {
  id: "delta-sac-sanjoaquin",
  name: "Sacramento-San Joaquin Delta",
  latitude: 38.0422,
  longitude: -121.878,
}

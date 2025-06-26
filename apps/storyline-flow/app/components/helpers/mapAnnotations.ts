export interface TextAnnotation {
  id: string
  name: string
  latitude: number
  longitude: number
}

export const SierraNevadaMountains: TextAnnotation = {
  id: "sierra-nevada",
  name: "Sierra Nevada Mountains",
  latitude: 38.2489,
  longitude: -119.6877,
}

const SacramentoRiver: TextAnnotation = {
  id: "sacramento-river",
  name: "Sacramento River",
  latitude: 38.5816,
  longitude: -121.4944,
}

const SanJoaquinRiver: TextAnnotation = {
  id: "san-joaquin-river",
  name: "San Joaquin River",
  latitude: 37.6413,
  longitude: -121.0161,
}

const CentralValley: TextAnnotation = {
  id: "central-valley",
  name: "Central Valley",
  latitude: 37.0783,
  longitude: -120.2179,
}

const AncientDeltaWetlands: TextAnnotation = {
  id: "ancient-delta-wetlands",
  name: "1800s Delta Freshwater Wetlands",
  latitude: 38.0422,
  longitude: -121.178,
}

const DeltaWetlands: TextAnnotation = {
  id: "delta-wetlands",
  name: "Delta Wetlands",
  latitude: 38.0422,
  longitude: -121.178,
}

const YubaRiver: TextAnnotation = {
  id: "yuba-river",
  name: "Yuba River",
  latitude: 39.1651,
  longitude: -121.4922,
}

const ColoradoRiver: TextAnnotation = {
  id: "colorado-river",
  name: "Colorado River",
  latitude: 35.1069,
  longitude: -114.9466,
}

const OwensRiver: TextAnnotation = {
  id: "owens-river",
  name: "Owens River",
  latitude: 37.0662,
  longitude: -118.4553,
}

const ToulumeRiver: TextAnnotation = {
  id: "toulume-river",
  name: "Toulume River",
  latitude: 37.7333,
  longitude: -119.9833,
}

const Reclamation: TextAnnotation = {
  id: "reclamation",
  name: "Reclamation District 900",
  latitude: 38.6805,
  longitude: -121.5407,
}

const Pumping: TextAnnotation = {
  id: "pumping",
  name: "Byron Tract Pumping",
  latitude: 37.8346,
  longitude: -121.6404,
}

const HetchHetchy: TextAnnotation = {
  id: "hetch-hetchy",
  name: "Hetch Hetchy Aqueduct",
  latitude: 37.7651,
  longitude: -121.6376,
}

const LosAngelesAqueduct: TextAnnotation = {
  id: "los-angeles-aqueduct",
  name: "Los Angeles Aqueduct",
  latitude: 35.5547,
  longitude: -117.1535,
}

const ColoradoRiverAqueduct: TextAnnotation = {
  id: "colorado-river-aqueduct",
  name: "Colorado River Aqueduct",
  latitude: 33.9302,
  longitude: -115.8132,
}

export const ShastaDam: TextAnnotation = {
  id: "shasta-dam",
  name: "Shasta Dam",
  latitude: 40.718,
  longitude: -122.42,
}

export const SacramentoDelta: TextAnnotation = {
  id: "delta-sac-sanjoaquin",
  name: "Sacramento-San Joaquin Delta",
  latitude: 38.0422,
  longitude: -121.878,
}

export const FlowTextLabels: TextAnnotation[] = [
  SierraNevadaMountains,
  SacramentoRiver,
  SanJoaquinRiver,
]

export const ValleyTextLabels: TextAnnotation[] = [
  SacramentoRiver,
  SanJoaquinRiver,
  CentralValley,
]

export const DeltaTextLabels: TextAnnotation[] = [
  SacramentoRiver,
  SanJoaquinRiver,
  AncientDeltaWetlands,
]

export const GoldRushTextLabels: TextAnnotation[] = [YubaRiver]

export const IrrigationTextLabels: TextAnnotation[] = [
  DeltaWetlands,
  Reclamation,
  Pumping,
]

export const DrinkingTextLabels: TextAnnotation[] = [
  OwensRiver,
  ToulumeRiver,
  ColoradoRiver,
  HetchHetchy,
  LosAngelesAqueduct,
  ColoradoRiverAqueduct,
]

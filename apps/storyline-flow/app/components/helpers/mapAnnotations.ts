const SierraNevadaMountains = {
  id: "sierra-nevada",
  name: "Sierra Nevada Mountains",
  latitude: 38.2489,
  longitude: -119.6877,
}

const SacramentoRiver = {
  id: "sacramento-river",
  name: "Sacramento River",
  latitude: 38.5816,
  longitude: -121.4944,
}

const SanJoaquinRiver = {
  id: "san-joaquin-river",
  name: "San Joaquin River",
  latitude: 37.6413,
  longitude: -121.0161,
}

const CentralValley = {
  id: "central-valley",
  name: "Central Valley",
  latitude: 37.0783,
  longitude: -120.2179,
}

const AncientDeltaWetlands = {
  id: "ancient-delta-wetlands",
  name: "1800s Delta Freshwater Wetlands",
  latitude: 38.0422,
  longitude: -121.178,
}

const DeltaWetlands = {
  id: "delta-wetlands",
  name: "Delta Wetlands",
  latitude: 38.0422,
  longitude: -121.178,
}

const YubaRiver = {
  id: "yuba-river",
  name: "Yuba River",
  latitude: 39.1651,
  longitude: -121.4922,
}

const ColoradoRiver = {
  id: "colorado-river",
  name: "Colorado River",
  latitude: 35.1069,
  longitude: -114.9466,
}

const OwensRiver = {
  id: "owens-river",
  name: "Owens River",
  latitude: 37.0662,
  longitude: -118.4553,
}

const ToulumeRiver = {
  id: "toulume-river",
  name: "Toulume River",
  latitude: 37.7333,
  longitude: -119.9833,
}

const Reclamation = {
  id: "reclamation",
  name: "Reclamation District 900",
  latitude: 38.6805,
  longitude: -121.5407,
}

const Pumping = {
  id: "pumping",
  name: "Byron Tract Pumping",
  latitude: 37.8346,
  longitude: -121.6404,
}

const HetchHetchy = {
  id: "hetch-hetchy",
  name: "Hetch Hetchy Aqueduct",
  latitude: 37.7651,
  longitude: -121.6376,
}

const LosAngelesAqueduct = {
  id: "los-angeles-aqueduct",
  name: "Los Angeles Aqueduct",
  latitude: 35.5547,
  longitude: -117.1535,
}

const ColoradoRiverAqueduct = {
  id: "colorado-river-aqueduct",
  name: "Colorado River Aqueduct",
  latitude: 33.9302,
  longitude: -115.8132,
}

export const FlowTextLabels = [
  SierraNevadaMountains,
  SacramentoRiver,
  SanJoaquinRiver,
]

export const ValleyTextLabels = [
  SacramentoRiver,
  SanJoaquinRiver,
  CentralValley,
]

export const DeltaTextLabels = [
  SacramentoRiver,
  SanJoaquinRiver,
  AncientDeltaWetlands,
]

export const GoldRushTextLabels = [YubaRiver]

export const IrrigationTextLabels = [DeltaWetlands, Reclamation, Pumping]

export const DrinkingTextLabels = [
  OwensRiver,
  ToulumeRiver,
  ColoradoRiver,
  HetchHetchy,
  LosAngelesAqueduct,
  ColoradoRiverAqueduct,
]

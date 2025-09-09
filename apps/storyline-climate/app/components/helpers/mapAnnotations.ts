export interface TextAnnotation {
  id: string
  name: string
  latitude: number
  longitude: number
}

export const SacramentoRiver: TextAnnotation = {
  id: "sacramento-river",
  name: "Sacramento River",
  latitude: 38.266,
  longitude: -121.3727,
}

export const SanJoaquinRiver: TextAnnotation = {
  id: "san-joaquin-river",
  name: "San Joaquin River",
  latitude: 38.038,
  longitude: -121.3327,
}

export const Tunnel: TextAnnotation = {
  id: "delta-tunnel",
  name: "Delta Conveyance Project",
  latitude: 38.138,
  longitude: -121.2527,
}

export const JonesPumping: TextAnnotation = {
  id: "jones-pumping",
  name: "Jones Pumping",
  latitude: 37.775,
  longitude: -121.485,
}

export const BanksPumping: TextAnnotation = {
  id: "bank-pumping",
  name: "Banks Pumping",
  latitude: 37.805,
  longitude: -121.7505,
}
// Marker type definition
export interface MarkerData {
  id: string | number
  longitude: number
  latitude: number
  color?: string
  size?: number
  title?: string
  properties?: Record<string, unknown>
}

// Default markers for California Water features
export const WATER_FEATURES: MarkerData[] = [
  {
    id: "shasta",
    longitude: -122.4194,
    latitude: 40.7198,
    title: "Shasta Dam",
    color: "#1976D2",
    properties: { type: "dam" },
  },
  {
    id: "oroville",
    longitude: -121.4882,
    latitude: 39.54,
    title: "Oroville Dam",
    color: "#1976D2",
    properties: { type: "dam" },
  },
  {
    id: "delta",
    longitude: -121.697,
    latitude: 38.044,
    title: "Sacramento-San Joaquin Delta",
    color: "#4CAF50",
    properties: { type: "delta" },
  },
  {
    id: "folsom",
    longitude: -121.1825,
    latitude: 38.7036,
    title: "Folsom Dam",
    color: "#1976D2",
    properties: { type: "dam" },
  },
  {
    id: "sanluisreservoir",
    longitude: -121.0973,
    latitude: 37.0729,
    title: "San Luis Reservoir",
    color: "#42A5F5",
    properties: { type: "reservoir" },
  },
]

// Helper functions for marker manipulation
export function filterMarkersByType(
  markers: MarkerData[],
  type: string,
): MarkerData[] {
  return markers.filter((marker) => marker.properties?.type === type)
}

export function getMarkerById(
  markers: MarkerData[],
  id: string | number,
): MarkerData | undefined {
  return markers.find((marker) => marker.id === id)
}

// Custom function to calculate marker position based on zoom level (for advanced use)
export function calculateMarkerSize(baseSize: number, zoom: number): number {
  const min = 4
  const max = 12
  const minScale = 0.8
  const maxScale = 1.2

  const clamped = Math.max(min, Math.min(zoom, max))
  const ratio = (clamped - min) / (max - min)
  const scale = minScale + ratio * (maxScale - minScale)

  return Math.round(baseSize * scale)
}

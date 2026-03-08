"use client"

/**
 * PersistentMapWrapper - wrapper ensuring map survives tab switches
 */

import MapInstance from "./MapInstance"
import LayerOrchestrator from "./LayerOrchestrator"
//import { useMapLayers } from "./hooks/useMapLayers"

interface PersistentMapWrapperProps {
  mapboxToken?: string
}

export default function PersistentMapWrapper({
  mapboxToken,
}: PersistentMapWrapperProps) {
  // Apply Mapbox layer states based on activeSection (Learn mode)
  //useMapLayers()

  return (
    <MapInstance mapboxToken={mapboxToken}>
      <LayerOrchestrator />
    </MapInstance>
  )
}

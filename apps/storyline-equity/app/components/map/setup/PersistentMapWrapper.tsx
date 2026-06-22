"use client"

import MapInstance from "./MapInstance"
import LayerOrchestrator from "./LayerOrchestrator"

interface PersistentMapWrapperProps {
  mapboxToken?: string
}

export default function PersistentMapWrapper({ mapboxToken }: PersistentMapWrapperProps) {
  return (
    <MapInstance mapboxToken={mapboxToken}>
      <LayerOrchestrator />
    </MapInstance>
  )
}

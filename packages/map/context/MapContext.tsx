"use client"

import React, { createContext, useContext, useRef, useState } from "react"
import type { MapRef } from "react-map-gl/mapbox"
import { ViewState } from "../src/types.js"

interface MapContextValue {
  mapRef: React.RefObject<MapRef | null>
  viewState: ViewState
  setViewState: (viewState: ViewState) => void
}

const MapContext = createContext<MapContextValue | null>(null)

export const MapProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const mapRef = useRef<MapRef>(null)
  const [viewState, setViewState] = useState<ViewState>({
    longitude: -122.4,
    latitude: 37.8,
    zoom: 10,
    bearing: 0,
    pitch: 0,
  })

  return (
    <MapContext.Provider value={{ mapRef, viewState, setViewState }}>
      {children}
    </MapContext.Provider>
  )
}

export const useMap = () => {
  const context = useContext(MapContext)
  if (!context) {
    throw new Error("useMap must be used within a MapProvider")
  }
  return context
}

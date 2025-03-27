"use client"

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  ReactNode,
  useCallback,
} from "react"
import type { MapboxMapRef } from "@repo/map"
import { ViewState } from "@repo/map"

export interface MapContextProps {
  viewState: ViewState
  setViewState: React.Dispatch<React.SetStateAction<ViewState>>
  mapRef: React.RefObject<MapboxMapRef>
  flyTo: (
    longitude: number,
    latitude: number,
    zoom?: number,
    pitch?: number,
    bearing?: number,
  ) => void
  fitBounds: (
    bounds: [[number, number], [number, number]],
    options?: { padding?: number; duration?: number },
  ) => void
  isMapLoaded: boolean
  setMapLoaded: (loaded: boolean) => void
}

const MapContext = createContext<MapContextProps | undefined>(undefined)

export function MapProvider({ children }: { children: ReactNode }) {
  const mapRef = useRef<MapboxMapRef>(null) as React.RefObject<MapboxMapRef>
  const [isMapLoaded, setMapLoaded] = useState(false)

  const [viewState, setViewState] = useState<ViewState>({
    longitude: -130.5449,
    latitude: 37.4669155,
    zoom: 5,
    bearing: 0,
    pitch: 0,
    padding: {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    },
  })

  const flyTo = (
    longitude: number,
    latitude: number,
    zoom?: number,
    pitch?: number,
    bearing?: number,
  ) => {
    if (mapRef.current) {
      mapRef.current.flyTo(longitude, latitude, zoom, pitch, bearing)
    }
  }

  const fitBounds = useCallback(
    (
      bounds: [[number, number], [number, number]],
      options?: { padding?: number; duration?: number },
    ) => {
      if (mapRef.current) {
        const map = mapRef.current.getMap()
        if (map) {
          map.fitBounds(bounds, {
            padding: options?.padding ?? 50,
            duration: options?.duration ?? 2000,
          })
        }
      }
    },
    [mapRef],
  )

  return (
    <MapContext.Provider
      value={{
        viewState,
        setViewState,
        mapRef,
        flyTo,
        fitBounds,
        isMapLoaded,
        setMapLoaded,
      }}
    >
      {children}
    </MapContext.Provider>
  )
}

export function useMap() {
  const ctx = useContext(MapContext)
  if (!ctx) {
    throw new Error("useMap must be used inside a MapProvider")
  }
  return ctx
}

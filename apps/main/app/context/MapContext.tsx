"use client" // Required in Next 13's app directory if using hooks

import React, { createContext, useContext, useState, ReactNode } from "react"

export interface MinimalViewState {
  longitude: number
  latitude: number
  zoom: number
  bearing: number
  pitch: number
  padding?: {
    top?: number
    bottom?: number
    left?: number
    right?: number
  }
}

export interface MapContextProps {
  viewState: MinimalViewState
  setViewState: React.Dispatch<React.SetStateAction<MinimalViewState>>
}

const MapContext = createContext<
  | {
      viewState: MinimalViewState
      setViewState: React.Dispatch<React.SetStateAction<MinimalViewState>>
    }
  | undefined
>(undefined)

export function MapProvider({ children }: { children: ReactNode }) {
  // Initial map position
  const [viewState, setViewState] = useState<MinimalViewState>({
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

  return (
    <MapContext.Provider value={{ viewState, setViewState }}>
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

"use client"

import { useMapStore, mapActions } from "./store"
import { ViewState, MapboxMapRef } from "./types"
import { useCallback, useRef, useEffect } from "react"

// Hook for accessing view state (camera position)
export function useViewState() {
  return useMapStore((state) => state.viewState)
}

// Hook for map control actions
export function useMapControls() {
  return {
    flyTo: mapActions.flyTo,
  }
}

// Hook for connecting a map component to the store
export function useMapState() {
  const mapRef = useRef<MapboxMapRef>(null)
  const viewState = useViewState()

  // Connect the mapRef to the store on mount
  useEffect(() => {
    mapActions.setMapRef(mapRef as any)
  }, [])

  // Handler for map view state changes
  const handleViewStateChange = useCallback((newViewState: ViewState) => {
    mapActions.setViewState(newViewState)
  }, [])

  return {
    mapRef,
    viewState,
    onViewStateChange: handleViewStateChange,
  }
}

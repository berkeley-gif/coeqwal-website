"use client"

import { useRef, useEffect } from "react"
import { MapboxMap, type MapboxMapProps, type MapboxMapRef } from "./MapboxMap"
import { useMap } from "../context/MapContext"
import type { ViewState } from "./types"

// Primary map component that connects to the MapContext
export function Map({ 
  viewState, 
  initialViewState,
  onMove,
  ...otherProps 
}: MapProps) {
  const mapRef = useRef<MapboxMapRef>(null)
  const { mapRef: contextMapRef, setViewState } = useMap()

  // Connect the map ref to the context
  useEffect(() => {
    if (mapRef.current) {
      contextMapRef.current = mapRef.current
    }
  }, [contextMapRef, mapRef])

  // Handle view state changes
  const handleViewStateChange = (newViewState: ViewState) => {
    // Update context view state
    setViewState(newViewState)
    
    // Call provided onMove handler if using controlled mode
    if (onMove) {
      onMove({ viewState: newViewState })
    }
  }

  return (
    <MapboxMap
      ref={mapRef}
      {...otherProps}
      viewState={viewState}
      initialViewState={initialViewState}
      onViewStateChange={handleViewStateChange}
    />
  )
}

export interface MapProps extends Omit<MapboxMapProps, 'onViewStateChange'> {
  viewState?: ViewState;
  initialViewState?: ViewState;
  onMove?: (evt: { viewState: ViewState }) => void;
}

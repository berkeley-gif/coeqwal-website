"use client"

import { useRef, useEffect } from "react"
import { MapboxMap, type MapboxMapProps, type MapboxMapRef } from "./MapboxMap"
import { useMap } from "../context/MapContext"
import type { ViewState } from "./types"

// High-level context-based map
export function Map({
  viewState,
  initialViewState,
  onMove,
  ...otherProps
}: MapProps) {
  const mapRef = useRef<MapboxMapRef>(null)
  const { mapRef: ctxMapRef, setViewState } = useMap()

  // Connect local ref to the context so other components can call useMap()
  useEffect(() => {
    if (mapRef.current) {
      ctxMapRef.current = mapRef.current
    }
  }, [ctxMapRef])

  // Whenever the map changes in controlled mode, handle it
  const handleViewStateChange = (newState: ViewState) => {
    setViewState(newState)
    onMove?.({ viewState: newState })
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

export interface MapProps extends Omit<MapboxMapProps, "onViewStateChange"> {
  // For controlled usage
  viewState?: ViewState
  initialViewState?: ViewState
  // Custom callback
  onMove?: (evt: { viewState: ViewState }) => void
}

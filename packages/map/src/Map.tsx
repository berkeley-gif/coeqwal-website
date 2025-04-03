"use client"

import { useRef, useEffect } from "react"
import { MapboxMap, type MapProps, type MapboxMapRef } from "./MapboxMap"
import { useMap } from "../context/MapContext"
import type { ViewState } from "./types"

// Primary map component that connects to the MapContext
export function Map(props: MapProps) {
  const mapRef = useRef<MapboxMapRef>(null)
  const { mapRef: contextMapRef, viewState, setViewState } = useMap()

  // Sync props.viewState with context viewState if provided
  const finalViewState = props.viewState || viewState

  // Connect the map ref to the context
  useEffect(() => {
    if (mapRef.current) {
      // Now we can directly assign without type casting
      contextMapRef.current = mapRef.current
    }
  }, [contextMapRef, mapRef])

  return (
    <MapboxMap
      ref={mapRef}
      {...props}
      viewState={finalViewState}
      onViewStateChange={(newViewState: ViewState) => {
        // Update context view state
        setViewState(newViewState)
        // Call original handler if provided
        props.onViewStateChange?.(newViewState)
      }}
    />
  )
}

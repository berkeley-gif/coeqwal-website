"use client"

import React, { useRef, useEffect } from "react"
import { MapboxMap, type MapProps, type MapboxMapRef } from "./MapboxMap"
import { useMap } from "../context/MapContext"
import type { ViewState } from "./types"

export function MapboxMapWithContext(props: MapProps) {
  const mapRef = useRef<MapboxMapRef>(null)
  const { mapRef: contextMapRef, viewState, setViewState } = useMap()

  // Sync props.viewState with context viewState if provided
  const finalViewState = props.viewState || viewState

  // Connect the map ref to the context
  useEffect(() => {
    if (mapRef.current) {
      // @ts-expect-error - Updating the ref TODO: figure this out
      contextMapRef.current = mapRef.current
    }
  }, [contextMapRef])

  return (
    <MapboxMap
      ref={mapRef}
      {...props}
      viewState={finalViewState}
      onViewStateChange={(newViewState: ViewState) => {
        // Update context
        setViewState(newViewState)
        // Call original handler if provided
        props.onViewStateChange?.(newViewState)
      }}
    />
  )
}

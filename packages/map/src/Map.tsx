"use client"
       
import React, { useRef, useEffect } from "react"
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
      // For React-map-gl v8, update the contextMapRef to point to our MapRef
      contextMapRef.current = {
        getMap: () => mapRef.current?.getMap(),
        flyTo: (
          longitude: number,
          latitude: number,
          zoom?: number,
          pitch?: number,
          bearing?: number
        ) => {
          mapRef.current?.flyTo(longitude, latitude, zoom, pitch, bearing);
        },
      } as any;
    }
  }, [contextMapRef, mapRef]);

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

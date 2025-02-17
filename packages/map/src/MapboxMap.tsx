"use client"

import React, { useRef } from "react"
import Map, { NavigationControl, MapRef, ViewState } from "react-map-gl/mapbox"
import "mapbox-gl/dist/mapbox-gl.css"
import type { ViewStateChangeEvent } from "react-map-gl/mapbox"
import { MinimalViewState } from "../../../apps/main/app/context/MapContext.tsx"

// Reusable interface: map gets viewState + callback from parent
export interface MapProps {
  mapboxToken: string
  viewState: MinimalViewState
  onViewStateChange: (newViewState: MinimalViewState) => void
  style?: React.CSSProperties
  mapStyle?: string
  minZoom?: number
  attributionControl?: boolean
  scrollZoom?: boolean
}

// Reusable, "dumb" map component
export const MapboxMap: React.FC<MapProps> = ({
  mapboxToken,
  viewState,
  onViewStateChange,
  style = { width: "100vw", height: "100vh", pointerEvents: "auto" },
  mapStyle = "mapbox://styles/digijill/cl122pj52001415qofin7bb1c",
  minZoom = 5.0,
  attributionControl = true,
  scrollZoom = false,
}) => {
  const mapRef = useRef<MapRef>(null)

  return (
    <Map
      // Props / style
      ref={mapRef}
      reuseMaps
      mapboxAccessToken={mapboxToken}
      mapStyle={mapStyle}
      style={style}
      // Controlled view: pass in
      {...viewState}
      minZoom={minZoom}
      attributionControl={attributionControl}
      scrollZoom={scrollZoom}
      // Let user drag/pan
      dragPan
      onMove={(evt: ViewStateChangeEvent) => {
        onViewStateChange(evt.viewState)
      }}
    >
      <NavigationControl position="top-right" style={{ marginTop: "100px" }} />
    </Map>
  )
}

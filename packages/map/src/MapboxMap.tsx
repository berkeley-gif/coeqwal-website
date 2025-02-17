"use client"

import React, {
  useRef,
  useImperativeHandle,
  forwardRef,
  ForwardRefRenderFunction,
} from "react"
import Map, { NavigationControl, MapRef } from "react-map-gl/mapbox"
import "mapbox-gl/dist/mapbox-gl.css"
import type { ViewStateChangeEvent } from "react-map-gl/mapbox"
import { MinimalViewState } from "../../../apps/main/app/context/MapContext.tsx"

// Methods the parent can call via ref
export interface MapboxMapRef {
  flyTo: (longitude: number, latitude: number, zoom?: number) => void
}

// Props for our reusable MapboxMap
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

const MapboxMapBase: ForwardRefRenderFunction<MapboxMapRef, MapProps> = (
  {
    mapboxToken,
    viewState,
    onViewStateChange,
    style = { width: "100vw", height: "100vh", pointerEvents: "auto" },
    mapStyle = "mapbox://styles/digijill/cl122pj52001415qofin7bb1c",
    minZoom = 5.0,
    attributionControl = true,
    scrollZoom = false,
  },
  ref
) => {
  const mapRef = useRef<MapRef>(null)

  // Expose flyTo method to parent component
  useImperativeHandle(ref, () => ({
    flyTo(longitude: number, latitude: number, zoom = 10) {
      const mapInstance = mapRef.current?.getMap()
      if (mapInstance) {
        mapInstance.flyTo({
          center: [longitude, latitude],
          zoom,
          speed: 0.8,      // adjust for smoother flight
          curve: 1.4,      // adjust for more dramatic flight path
          essential: true, // prevent user interruptions
        })
      }
    },
  }))

  return (
    <Map
      ref={mapRef}
      reuseMaps
      mapboxAccessToken={mapboxToken}
      mapStyle={mapStyle}
      style={style}
      {...viewState}
      minZoom={minZoom}
      attributionControl={attributionControl}
      scrollZoom={scrollZoom}
      dragPan
      onMove={(evt: ViewStateChangeEvent) => {
        onViewStateChange(evt.viewState)
      }}
    >
      <NavigationControl position="top-right" style={{ marginTop: "100px" }} />
    </Map>
  )
}

export const MapboxMap = forwardRef<MapboxMapRef, MapProps>(MapboxMapBase)

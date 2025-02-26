"use client"

import React, {
  useRef,
  useImperativeHandle,
  forwardRef,
  ForwardRefRenderFunction,
} from "react"
import Map, { NavigationControl } from "react-map-gl/mapbox"
import "mapbox-gl/dist/mapbox-gl.css"
import type { ViewStateChangeEvent, MapRef } from "react-map-gl/mapbox"
import { MinimalViewState } from "../../../apps/main/app/context/MapContext.tsx"
import type { Map as MapboxMapType } from "mapbox-gl"

// Methods the parent can call via ref
export interface MapboxMapRef {
  flyTo: (longitude: number, latitude: number, zoom?: number) => void
  getMap: () => MapboxMapType | undefined
}

// Props for our reusable MapboxMap
export interface MapProps {
  mapboxToken: string
  viewState: MinimalViewState
  onViewStateChange?: (newViewState: MinimalViewState) => void
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
  const internalMapRef = useRef<MapRef>(null)

  function flyTo(longitude: number, latitude: number, zoom?: number) {
    const mapInstance = internalMapRef.current?.getMap()
    if (mapInstance) {
      mapInstance.flyTo({
        center: [longitude, latitude],
        zoom: zoom ?? 5,
        duration: 2000,
      })
    }
  }

  function getMap(): MapboxMapType | undefined {
    return internalMapRef.current?.getMap()
  }

  useImperativeHandle(ref, () => ({
    flyTo,
    getMap,
  }))

  return (
    <Map
      ref={internalMapRef}
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
        onViewStateChange?.(evt.viewState)
      }}
    >
      <NavigationControl position="top-right" style={{ marginTop: "100px" }} />
    </Map>
  )
}

export const MapboxMap = forwardRef<MapboxMapRef, MapProps>(MapboxMapBase)

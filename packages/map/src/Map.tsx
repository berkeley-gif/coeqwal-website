// packages/map/src/Map.tsx
"use client"

import { useCallback, useEffect } from "react"
import MapboxGL, { MapRef } from "react-map-gl/mapbox"
import type { MapProps } from "./types"
import { useMap } from "../context/MapContext"
import "mapbox-gl/dist/mapbox-gl.css"

export default function Map(props: MapProps) {
  const { mapRef } = useMap()

  // Ref callback assigns map instance immediately
  const assignMapRef = useCallback((instance: MapRef | null) => {
    if (instance) {
      mapRef.current = instance
      console.log("✅ mapRef.current assigned immediately:", instance)
    } else {
      console.log("🧹 Map unmounted – clearing context ref")
      mapRef.current = null
    }
  }, [mapRef])

  useEffect(() => {
    console.log("🧩 Map useEffect mounted – mapRef:", mapRef.current)
  }, [mapRef])

  return (
    <MapboxGL
      {...props}
      ref={assignMapRef}
      mapboxAccessToken={props.mapboxToken}
    />
  )
}
// packages/map/src/Map.tsx
"use client"

import MapboxGL, { MapRef } from "react-map-gl/mapbox"
import { useCallback, useEffect } from "react"
import { useMap } from "./context/MapContext"
import type { MapProps } from "./types"
import "mapbox-gl/dist/mapbox-gl.css"

export default function Map(props: MapProps) {
  const { mapRef, overlays } = useMap()

  const assignMapRef = useCallback(
    (instance: MapRef | null) => {
      if (instance) {
        mapRef.current = instance
        console.log("✅ mapRef assigned to context")
      } else {
        console.log("🧹 Map unmounted – clearing mapRef")
        mapRef.current = null
      }
    },
    [mapRef],
  )

  useEffect(() => {
    console.log("📦 Map mounted with mapRef:", mapRef.current)
  }, [mapRef])

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <MapboxGL
        {...props}
        ref={assignMapRef}
        mapboxAccessToken={props.mapboxToken}
        style={{ position: "absolute", inset: 0, ...props.style }}
      />

      {/* Render all overlays */}
      {Object.entries(overlays.current).map(([key, { element, style }]) => (
        <div
          key={key}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 10,
            pointerEvents: "auto",
            ...style,
          }}
        >
          {element}
        </div>
      ))}
    </div>
  )
}

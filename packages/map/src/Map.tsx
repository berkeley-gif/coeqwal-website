"use client"

import { MapRef, Marker } from "react-map-gl/mapbox"
import MapboxGL from "react-map-gl/mapbox"
import { useCallback } from "react"
import { useMap } from "./context/MapContext"
import type { MapProps, MarkerProperties } from "./types"
import "mapbox-gl/dist/mapbox-gl.css"

export default function Map(props: MapProps) {
  const { mapRef, markers = [] } = useMap()

  console.log("🌀 Rendering <Map />")

  const assignMapRef = useCallback(
    (instance: MapRef | null) => {
      if (!mapRef) return

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

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <MapboxGL
        {...props}
        ref={assignMapRef}
        mapboxAccessToken={props.mapboxToken}
        style={{ position: "absolute", inset: 0, ...props.style }}
      />

      {markers.map((marker: MarkerProperties, idx: number) => (
        <Marker
          key={marker.id ?? idx}
          longitude={marker.longitude}
          latitude={marker.latitude}
        >
          {marker.content}
        </Marker>
      ))}
    </div>
  )
}

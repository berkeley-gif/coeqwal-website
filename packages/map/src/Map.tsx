"use client"

import MapboxGL, { MapRef, Marker as MapboxMarker } from "react-map-gl/mapbox"
import { useCallback, useEffect } from "react"
import { useMap } from "./context/MapContext"
import type { MapProps } from "./types"
import "mapbox-gl/dist/mapbox-gl.css"

export default function Map(props: MapProps) {
  let mapRef = null
  let scenarioMarkers = null

  try {
    const ctx = useMap()
    mapRef = ctx.mapRef
    scenarioMarkers = ctx.scenarioMarkers
  } catch (err) {
    console.warn(
      "⚠️ useMap failed in <Map />, possibly outside MapProvider",
      err,
    )
  }

  console.log("🌀 Rendering <Map />")

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
    console.log("📦 Map mounted with mapRef:", mapRef?.current)
    console.log("🧪 scenarioMarkers from context:", scenarioMarkers)
  }, [mapRef, scenarioMarkers])

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <MapboxGL
        {...props}
        ref={assignMapRef}
        mapboxAccessToken={props.mapboxToken}
        style={{ position: "absolute", inset: 0, ...props.style }}
      />

      {mapRef?.current &&
        scenarioMarkers?.map((marker) => (
          <MapboxMarker
            key={marker.id}
            longitude={marker.longitude}
            latitude={marker.latitude}
          >
            {marker.content}
          </MapboxMarker>
        ))}
    </div>
  )
}

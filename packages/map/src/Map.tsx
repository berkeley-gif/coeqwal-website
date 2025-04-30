"use client"

import { MapRef, Marker, Map as MapboxGLMap } from "react-map-gl/mapbox"
import { useCallback, useEffect } from "react"
import { useMap } from "./context/MapContext"
import type { MapProps, MarkerProperties } from "./types"
import "mapbox-gl/dist/mapbox-gl.css"
import { AnimatePresence } from "@repo/motion"

export default function Map(props: MapProps) {
  const { mapRef, markers = [], motionChildren } = useMap() // Todo: incorporate motionChildrenStyle

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

  // Hide graticule layer whenever style is (re)loaded
  useEffect(() => {
    const mapInstance = mapRef?.current?.getMap?.()
    if (!mapInstance) return

    const hideGraticule = () => {
      if (mapInstance.getLayer && mapInstance.getLayer("graticule")) {
        mapInstance.setLayoutProperty("graticule", "visibility", "none")
      }
    }

    if (mapInstance.isStyleLoaded()) hideGraticule()
    mapInstance.on("styledata", hideGraticule)

    return () => {
      mapInstance.off("styledata", hideGraticule)
    }
  }, [mapRef])

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <MapboxGLMap
        {...props}
        ref={assignMapRef}
        mapboxAccessToken={props.mapboxToken}
        style={{ position: "absolute", inset: 0, ...props.style }}
      >
        {/* Render standard markers from context */}
        {markers.map((marker: MarkerProperties, idx: number) => (
          <Marker
            key={marker.id ?? idx}
            longitude={marker.longitude}
            latitude={marker.latitude}
          >
            {marker.content}
          </Marker>
        ))}

        {/* Render children (which can include markers) */}
        {props.children}

        {/* Render motion children */}
        <AnimatePresence>{motionChildren}</AnimatePresence>
      </MapboxGLMap>
    </div>
  )
}

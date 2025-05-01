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
      try {
        // First try direct hide
        if (mapInstance.getLayer && mapInstance.getLayer("graticule")) {
          console.log("Hiding graticule layer")
          mapInstance.setLayoutProperty("graticule", "visibility", "none")
        }

        // Try other possible variations of the name
        const possibleNames = [
          "graticule",
          "grid",
          "graticules",
          "lat-lon-grid",
          "grid-lines",
        ]
        possibleNames.forEach((name) => {
          if (mapInstance.getLayer && mapInstance.getLayer(name)) {
            console.log(`Hiding layer: ${name}`)
            mapInstance.setLayoutProperty(name, "visibility", "none")
          }
        })

        // Some styles use a different structure like source-layer
        // This is a more aggressive approach
        mapInstance.getStyle()?.layers?.forEach((layer) => {
          if (
            layer.id.toLowerCase().includes("grid") ||
            layer.id.toLowerCase().includes("graticule")
          ) {
            console.log(`Found and hiding layer: ${layer.id}`)
            mapInstance.setLayoutProperty(layer.id, "visibility", "none")
          }
        })
      } catch (err) {
        console.warn("Error while trying to hide graticule:", err)
      }
    }

    // Try immediately if the map is ready
    if (mapInstance.isStyleLoaded()) {
      hideGraticule()
    }

    // Set up various event listeners
    mapInstance.on("styledata", hideGraticule)
    mapInstance.on("load", hideGraticule)

    // Also set multiple timeouts as a fallback strategy
    const timeouts = [500, 1000, 2000, 3000].map((delay) =>
      setTimeout(hideGraticule, delay),
    )

    return () => {
      // Clean up all event listeners and timeouts
      mapInstance.off("styledata", hideGraticule)
      mapInstance.off("load", hideGraticule)
      timeouts.forEach(clearTimeout)
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

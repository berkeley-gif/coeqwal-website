"use client"

import { useEffect } from "react"
import { Source, Layer, useMap } from "@repo/map"
import { sacramentoRiverMainstem, sanJoaquinRiverMainstem } from "@repo/data"

interface RiversLayerProps {
  visible: boolean
  /** Animation progress from 0 (not drawn) to 1 (fully drawn). Controlled by scroll. */
  progress: number
}

export default function RiversLayer({ visible, progress }: RiversLayerProps) {
  const map = useMap()

  // Clamp progress to [0, 1] to avoid floating-point precision errors
  const clampedProgress = Math.max(0, Math.min(1, progress))

  // Always show labels when rivers are visible (labels render independently of line animation)
  const showLabels = visible

  // Add label layers directly to the map (bypasses React wrapper issues with type="symbol")
  useEffect(() => {
    if (!map.mapRef.current || !visible) return

    // Get the raw Mapbox GL map instance
    const mapInstance = map.mapRef.current.getMap()

    // Wait for sources to be loaded
    const addLabels = () => {
      // Check if both sources exist before adding labels
      const hasSacramentoSource = mapInstance.getSource("sacramento-river-source")
      const hasSanJoaquinSource = mapInstance.getSource("san-joaquin-river-source")
      
      if (!hasSacramentoSource || !hasSanJoaquinSource) {
        console.log("⏳ Waiting for river sources to load...")
        return
      }

      // Sacramento River Label
      if (!mapInstance.getLayer("sacramento-river-label")) {
        mapInstance.addLayer({
          id: "sacramento-river-label",
          type: "symbol",
          source: "sacramento-river-source",
          layout: {
            "text-field": ["get", "label"], // Use GeoJSON property
            "text-font": ["Arial Unicode MS Regular"],
            "text-size": 16,
            "symbol-placement": "line",
            "text-rotation-alignment": "map",
            "text-keep-upright": true,
            "text-max-angle": 90,
            "symbol-spacing": 300,
            "text-allow-overlap": true,
            "text-ignore-placement": true,
            "text-optional": false,
            visibility: showLabels ? "visible" : "none",
          },
          paint: {
            "text-color": "#3182BD",
            "text-halo-color": "#ffffff",
            "text-halo-width": 2,
            "text-opacity": showLabels ? 1 : 0,
          },
        })
        console.log("✅ Added Sacramento River label layer")
      }

      // San Joaquin River Label
      if (!mapInstance.getLayer("san-joaquin-river-label")) {
        mapInstance.addLayer({
          id: "san-joaquin-river-label",
          type: "symbol",
          source: "san-joaquin-river-source",
          layout: {
            "text-field": ["get", "label"], // Use GeoJSON property
            "text-font": ["Arial Unicode MS Regular"],
            "text-size": 16,
            "symbol-placement": "line",
            "text-rotation-alignment": "map",
            "text-keep-upright": true,
            "text-max-angle": 90,
            "symbol-spacing": 300,
            "text-allow-overlap": true,
            "text-ignore-placement": true,
            "text-optional": false,
            visibility: showLabels ? "visible" : "none",
          },
          paint: {
            "text-color": "#3182BD",
            "text-halo-color": "#ffffff",
            "text-halo-width": 2,
            "text-opacity": showLabels ? 1 : 0,
          },
        })
        console.log("✅ Added San Joaquin River label layer")
      }
    }

    // Poll for sources to be available (React <Source> components add them asynchronously)
    const checkInterval = setInterval(() => {
      const hasSacramentoSource = mapInstance.getSource("sacramento-river-source")
      const hasSanJoaquinSource = mapInstance.getSource("san-joaquin-river-source")
      
      if (hasSacramentoSource && hasSanJoaquinSource) {
        clearInterval(checkInterval)
        addLabels()
      }
    }, 100) // Check every 100ms

    // Cleanup timeout after 5 seconds
    const timeout = setTimeout(() => {
      clearInterval(checkInterval)
      console.warn("⚠️ River sources did not load within 5 seconds")
    }, 5000)

    // Cleanup on unmount
    return () => {
      clearInterval(checkInterval)
      clearTimeout(timeout)
      
      const mapInst = map.mapRef.current?.getMap()
      if (mapInst) {
        if (mapInst.getLayer("sacramento-river-label")) {
          mapInst.removeLayer("sacramento-river-label")
        }
        if (mapInst.getLayer("san-joaquin-river-label")) {
          mapInst.removeLayer("san-joaquin-river-label")
        }
      }
    }
    // showLabels is intentionally omitted - its changes are handled by the second useEffect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map.mapRef, visible])

  // Update label visibility when showLabels changes
  useEffect(() => {
    if (!map.mapRef.current) return

    // Get the raw Mapbox GL map instance
    const mapInstance = map.mapRef.current.getMap()

    if (mapInstance.getLayer("sacramento-river-label")) {
      mapInstance.setLayoutProperty(
        "sacramento-river-label",
        "visibility",
        showLabels ? "visible" : "none"
      )
      mapInstance.setPaintProperty(
        "sacramento-river-label",
        "text-opacity",
        showLabels ? 1 : 0
      )
    }

    if (mapInstance.getLayer("san-joaquin-river-label")) {
      mapInstance.setLayoutProperty(
        "san-joaquin-river-label",
        "visibility",
        showLabels ? "visible" : "none"
      )
      mapInstance.setPaintProperty(
        "san-joaquin-river-label",
        "text-opacity",
        showLabels ? 1 : 0
      )
    }
  }, [map.mapRef, showLabels])

  if (!visible) return null

  return (
    <>
      {/* SACRAMENTO RIVER */}
      <Source
        id="sacramento-river-source"
        type="geojson"
        data={sacramentoRiverMainstem}
        lineMetrics={true}
      >
        {/* Layer 1: Outer glow */}
        <Layer
          id="sacramento-river-glow"
          type="line"
          paint={{
            "line-color": "#4A90C9",
            "line-width": 7,
            "line-blur": 6,
            "line-opacity": 0.3,
            "line-trim-offset": [clampedProgress, 1],
          }}
          layout={{
            "line-join": "round",
            "line-cap": "round",
          }}
        />

        {/* Layer 2: Main river body */}
        <Layer
          id="sacramento-river-body"
          type="line"
          paint={{
            "line-color": "#5B9DD6",
            "line-width": 3.5,
            "line-opacity": 0.85,
            "line-trim-offset": [clampedProgress, 1],
          }}
          layout={{
            "line-join": "round",
            "line-cap": "round",
          }}
        />

        {/* Layer 3: Inner highlight */}
        <Layer
          id="sacramento-river-highlight"
          type="line"
          paint={{
            "line-color": "#8BBEE8",
            "line-width": 1.5,
            "line-opacity": 0.6,
            "line-trim-offset": [clampedProgress, 1],
          }}
          layout={{
            "line-join": "round",
            "line-cap": "round",
          }}
        />
        {/* Label added directly via map.addLayer() in useEffect above */}
      </Source>

      {/* SAN JOAQUIN RIVER */}
      <Source
        id="san-joaquin-river-source"
        type="geojson"
        data={sanJoaquinRiverMainstem}
        lineMetrics={true}
      >
        {/* Layer 1: Outer glow */}
        <Layer
          id="san-joaquin-river-glow"
          type="line"
          paint={{
            "line-color": "#4A90C9",
            "line-width": 7,
            "line-blur": 6,
            "line-opacity": 0.3,
            "line-trim-offset": [clampedProgress, 1],
          }}
          layout={{
            "line-join": "round",
            "line-cap": "round",
          }}
        />

        {/* Layer 2: Main river body */}
        <Layer
          id="san-joaquin-river-body"
          type="line"
          paint={{
            "line-color": "#5B9DD6",
            "line-width": 3.5,
            "line-opacity": 0.85,
            "line-trim-offset": [clampedProgress, 1],
          }}
          layout={{
            "line-join": "round",
            "line-cap": "round",
          }}
        />

        {/* Layer 3: Inner highlight */}
        <Layer
          id="san-joaquin-river-highlight"
          type="line"
          paint={{
            "line-color": "#8BBEE8",
            "line-width": 1.5,
            "line-opacity": 0.6,
            "line-trim-offset": [clampedProgress, 1],
          }}
          layout={{
            "line-join": "round",
            "line-cap": "round",
          }}
        />
        {/* Label added directly via map.addLayer() in useEffect above */}
      </Source>
    </>
  )
}
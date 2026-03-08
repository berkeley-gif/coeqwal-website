"use client"

/**
 * MapInstance - Mapbox instance, camera control, and viewport positioning
 */

import { ReactNode, useCallback, useEffect, useRef } from "react"
import { Map, useMap } from "@repo/map"
import { Box } from "@repo/ui/mui"
import "./mapboxControlStyles.css"
import { CALIFORNIA_VIEW } from "../config/cameraPresets"
import {
  appActions,
  useActiveSectionStore,
  useCameraView,
} from "../../../store"
import { SectionId } from "../config/sectionConfig"

// ============================================================================
// Constants
// ============================================================================

export const MAP_BOUNDS: [[number, number], [number, number]] = [
  [-145.0, 20.0],
  [-95.0, 55.0],
]

export const CALIFORNIA_BOUNDS: [[number, number], [number, number]] = [
  [-124.5, 32.5],
  [-114.0, 42.0],
]

//TODO: check this
/** Mapbox style layers that need visibility management */
const MAPBOX_LAYER_IDS = [
  "california-label",
  "central-valley-polygon",
  "central-valley-polygon-halo",
  "central-valley-label",
  "inflow-watersheds",
] as const

// ============================================================================
// Styling
// ============================================================================

// ============================================================================
// Component
// ============================================================================

interface MapInstanceProps {
  mapboxToken?: string
  children?: ReactNode
}

export default function MapInstance({
  mapboxToken,
  children,
}: MapInstanceProps) {
  const token = mapboxToken || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""
  const map = useMap()
  const prevSectionRef = useRef<SectionId | null>(null)

  const activeSection = useActiveSectionStore()
  const cameraView = useCameraView()

  // ============================================================================
  // Map Initialization
  // ============================================================================

  /** Called when map style finishes loading */
  const handleMapLoad = useCallback(() => {
    const mapboxInstance = map.mapRef?.current?.getMap?.()
    if (!mapboxInstance) return

    // Hide base layers initially (they're shown via useMapLayers as user scrolls)
    MAPBOX_LAYER_IDS.forEach((layerId) => {
      try {
        if (mapboxInstance.getLayer(layerId)) {
          mapboxInstance.setLayoutProperty(layerId, "visibility", "none")
        }
      } catch {
        // Layer might not exist
      }
    })
    //TODO: this is just to solve the issue where the source may not be loaded yet when client starts scrolling it.
    map.addSource("precipitation-source", {
      type: "vector",
      url: "mapbox://coeqwal.6dxtit1i",
    })

    appActions.setMapReady(true)
  }, [map])

  // ============================================================================
  // Camera Effects
  // ============================================================================

  useEffect(() => {
    if (!map.mapRef?.current || !cameraView) return
    if (prevSectionRef.current === activeSection) return // No change in section, skip

    prevSectionRef.current = activeSection // Update previous section
    map.mapRef.current.easeTo({
      center: [cameraView.longitude, cameraView.latitude],
      zoom: cameraView.zoom,
      bearing: cameraView.bearing ?? 0,
      pitch: cameraView.pitch ?? 0,
      padding: { left: 0, top: 0, right: 0, bottom: 0 },
      duration: 1500,
      easing: (t: number) => t * (2 - t),
    })
  }, [activeSection, cameraView, map])

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "auto",
      }}
    >
      <Map
        mapboxToken={token}
        mapStyle="mapbox://styles/coeqwal/cmh2f40sm000w01qy8m0gaea8"
        initialViewState={CALIFORNIA_VIEW}
        maxBounds={MAP_BOUNDS}
        style={{ width: "100%", height: "100%" }}
        interactive={false}
        navigationControl={false}
        dragPan={false}
        onLoad={handleMapLoad}
      >
        {children}
      </Map>
    </Box>
  )
}

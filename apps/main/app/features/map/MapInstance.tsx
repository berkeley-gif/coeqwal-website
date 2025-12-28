"use client"

/**
 * MapInstance - Mapbox instance, camera control, and viewport positioning
 */

import { useEffect, useRef, ReactNode, useCallback } from "react"
import { Map, NavigationControl, GeolocateControl, useMap } from "@repo/map"
import { Box, useTheme } from "@repo/ui/mui"
import {
  useMapMode,
  useLearnMapScrollOffset,
  useActiveSection,
  useCameraView,
  mapActions,
  type MapMode,
} from "./store"
import { CALIFORNIA_VIEW } from "./config/cameraPresets"
import type { SectionId } from "./config/sectionLayers"
import "./styles/mapboxControlStyles.css"

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

const getContainerStyles = (
  mode: MapMode,
  theme: {
    zIndex: { persistentMap: number }
    transition: { fade: string; fast: string }
  },
  scrollOffset: number = 0,
): React.CSSProperties => {
  const base: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    zIndex: theme.zIndex.persistentMap,
    transition: theme.transition.fade,
  }

  switch (mode) {
    case "hidden":
      return { ...base, opacity: 0, pointerEvents: "none" }
    case "learn":
      return {
        ...base,
        opacity: 1,
        pointerEvents: "auto",
        transform:
          scrollOffset > 0 ? `translateY(-${scrollOffset}px)` : undefined,
        transition: `${theme.transition.fade}, transform ${theme.transition.fast}`,
      }
    case "explore":
      return { ...base, opacity: 1, pointerEvents: "auto" }
    default:
      return base
  }
}

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
  const theme = useTheme()
  const prevSectionRef = useRef<SectionId | null>(null)

  const mapMode = useMapMode()
  const learnMapScrollOffset = useLearnMapScrollOffset()
  const activeSection = useActiveSection()
  const cameraView = useCameraView()

  const isLearnMode = mapMode === "learn"
  const isExploreMode = mapMode === "explore"

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

    mapActions.setMapReady(true)
  }, [map.mapRef])

  // ============================================================================
  // Camera Effects
  // ============================================================================

  /** Explore mode: fit to California bounds */
  useEffect(() => {
    if (mapMode !== "explore" || !map.mapRef?.current) return

    const leftPadding = window.innerWidth / 2
    map.mapRef.current.fitBounds(CALIFORNIA_BOUNDS, {
      padding: { left: leftPadding, top: 300, right: 0, bottom: 20 },
      maxZoom: 6,
      duration: 1000,
    })
  }, [mapMode, map])

  /** Explore mode: hide base layers */
  useEffect(() => {
    if (mapMode !== "explore" || !map.mapRef?.current) return

    const mapInstance = map.mapRef.current.getMap()
    MAPBOX_LAYER_IDS.forEach((layerId) => {
      try {
        if (mapInstance.getLayer(layerId)) {
          mapInstance.setLayoutProperty(layerId, "visibility", "none")
        }
      } catch {
        // ignore
      }
    })
  }, [mapMode, map])

  /** Explore mode: re-center on window resize */
  useEffect(() => {
    if (mapMode !== "explore" || !map.mapRef?.current) return

    const handleResize = () => {
      const leftPadding = window.innerWidth / 2
      map.mapRef.current?.fitBounds(CALIFORNIA_BOUNDS, {
        padding: { left: leftPadding, top: 300, right: 0, bottom: 20 },
        maxZoom: 6,
        duration: 300,
      })
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [mapMode, map])

  /** Learn mode: camera transitions when section changes */
  useEffect(() => {
    if (mapMode !== "learn") {
      prevSectionRef.current = null
      return
    }
    if (!map.mapRef?.current || !cameraView) return
    if (prevSectionRef.current === activeSection) return

    prevSectionRef.current = activeSection

    map.mapRef.current.easeTo({
      center: [cameraView.longitude, cameraView.latitude],
      zoom: cameraView.zoom,
      bearing: cameraView.bearing ?? 0,
      pitch: cameraView.pitch ?? 0,
      padding: { left: 0, top: 0, right: 0, bottom: 0 },
      duration: 2000,
      easing: (t: number) => t * (2 - t),
    })
  }, [activeSection, cameraView, map, mapMode])

  // ============================================================================
  // Render
  // ============================================================================

  const containerStyles = getContainerStyles(
    mapMode,
    theme,
    isLearnMode ? learnMapScrollOffset : 0,
  )

  return (
    <>
      {isLearnMode && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: theme.palette.learn.background,
            zIndex: theme.zIndex.persistentMap - 1,
            opacity: learnMapScrollOffset > 0 ? 1 : 0,
            transition: theme.transition.quick,
            pointerEvents: "none",
          }}
        />
      )}
      <Box
        id="persistent-map"
        sx={{
          ...containerStyles,
          "& .mapboxgl-ctrl-bottom-left": {
            transition: "left 0.3s ease, bottom 0.3s ease",
            left: isExploreMode ? "calc(50% + 16px)" : "10px",
            bottom: "16px",
          },
        }}
      >
        <Map
          mapboxToken={token}
          mapStyle="mapbox://styles/coeqwal/cmh2f40sm000w01qy8m0gaea8"
          initialViewState={CALIFORNIA_VIEW}
          minZoom={4}
          maxZoom={18}
          maxBounds={MAP_BOUNDS}
          style={{ width: "100%", height: "100%" }}
          scrollZoom={false}
          touchZoom={true}
          touchRotate={false}
          dragPan={true}
          dragRotate={false}
          doubleClickZoom={true}
          keyboard={true}
          interactive={true}
          projection={{ name: "globe" }}
          onLoad={handleMapLoad}
        >
          <NavigationControl position="bottom-left" />
          <GeolocateControl position="bottom-left" />
          {children}
        </Map>
      </Box>
    </>
  )
}

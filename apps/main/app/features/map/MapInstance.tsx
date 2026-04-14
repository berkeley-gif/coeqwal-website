"use client"

/**
 * MapInstance - Mapbox instance, camera control, and viewport positioning
 */

import { useEffect, useRef, ReactNode, useCallback } from "react"
import { Map, NavigationControl, GeolocateControl, useMap } from "@repo/map"
import { Box, useTheme } from "@repo/ui/mui"
import {
  useMapMode,
  useMapStyle,
  useLearnMapScrollOffset,
  useActiveSection,
  useCameraView,
  useExplorePanelWidth,
  mapActions,
  type MapMode,
} from "./store"
import { CALIFORNIA_VIEW } from "./config/cameraPresets"
import type { SectionId } from "./config/sectionLayers"
import { BasemapPicker } from "./controls/BasemapPicker"
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

/** Tighter bounds focused on the Central Valley / Delta region for the
 *  explore tool view where the 25% strip needs more zoom. */
export const EXPLORE_BOUNDS: [[number, number], [number, number]] = [
  [-124.1, 34.4],
  [-117.7, 42.5],
]

/** Mapbox style layers that need visibility management */
const MAPBOX_LAYER_IDS = [
  "california-label",
  "central-valley-polygon",
  "central-valley-polygon-halo",
  "central-valley-label",
  "inflow-watersheds",
  "delta-water",
] as const

/**
 * Create the delta-detaw runtime layer (DETAW polygon from the WBA/geoschem
 * source). Used by DeltaInfoPanel (Learn mode) and TierAnimationSection
 * (get-started). Separate from calsim-wba to avoid conflicts with GW_STOR.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ensureDeltaDetawLayer(mapInstance: any) {
  const filter = ["==", ["get", "WBA_ID"], "DETAW"]

  if (!mapInstance.getLayer("delta-detaw")) {
    try {
      mapInstance.addLayer({
        id: "delta-detaw",
        type: "fill",
        source: "composite",
        "source-layer": "geoschem",
        filter,
        paint: {
          "fill-color": "transparent",
          "fill-opacity": 0,
        },
        layout: { visibility: "none" },
      })
    } catch {
      // Layer may already exist
    }
  }

  if (!mapInstance.getLayer("delta-detaw-outline")) {
    try {
      mapInstance.addLayer({
        id: "delta-detaw-outline",
        type: "line",
        source: "composite",
        "source-layer": "geoschem",
        filter,
        paint: {
          "line-color": "#7EB8DA",
          "line-width": 4,
          "line-opacity": 0,
        },
        layout: { visibility: "none" },
      })
    } catch {
      // Layer may already exist
    }
  }
}

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
    case "get-started":
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
  const mapStyle = useMapStyle()
  const learnMapScrollOffset = useLearnMapScrollOffset()
  const activeSection = useActiveSection()
  const cameraView = useCameraView()
  const explorePanelWidth = useExplorePanelWidth()

  const isLearnMode = mapMode === "learn"
  const isExploreMode = mapMode === "explore"

  // ============================================================================
  // Map Initialization
  // ============================================================================

  /** Called when map style finishes loading (initial load or style swap) */
  const handleMapLoad = useCallback(() => {
    const mapboxInstance = map.mapRef?.current?.getMap?.()
    if (!mapboxInstance) return

    MAPBOX_LAYER_IDS.forEach((layerId) => {
      try {
        if (mapboxInstance.getLayer(layerId)) {
          mapboxInstance.setLayoutProperty(layerId, "visibility", "none")
        }
      } catch {
        // Layer might not exist in this style
      }
    })

    ensureDeltaDetawLayer(mapboxInstance)
    mapActions.setMapReady(true)

    // TEMPORARY — for measuring layer extents. Remove after use.
    // See apps/main/app/features/map/README.md for the console script.
    if (process.env.NODE_ENV === "development") {
      ;(window as unknown as Record<string, unknown>).__mapInstance =
        mapboxInstance
    }
  }, [map.mapRef])

  /** When the style URL changes, cycle mapReady so layer-setup hooks re-run.
   *  react-map-gl calls map.setStyle() internally; we listen for style.load
   *  to know when the new style is ready. */
  const prevStyleRef = useRef(mapStyle)
  useEffect(() => {
    if (prevStyleRef.current === mapStyle) return
    prevStyleRef.current = mapStyle

    mapActions.setMapReady(false)

    const mapboxInstance = map.mapRef?.current?.getMap?.()
    if (!mapboxInstance) return

    const onStyleLoad = () => {
      MAPBOX_LAYER_IDS.forEach((layerId) => {
        try {
          if (mapboxInstance.getLayer(layerId)) {
            mapboxInstance.setLayoutProperty(layerId, "visibility", "none")
          }
        } catch {
          /* layer may not exist in this style */
        }
      })
      ensureDeltaDetawLayer(mapboxInstance)
      mapActions.setMapReady(true)
    }

    mapboxInstance.once("style.load", onStyleLoad)
    return () => {
      mapboxInstance.off("style.load", onStyleLoad)
    }
  }, [mapStyle, map.mapRef])

  // ============================================================================
  // Camera Effects
  // ============================================================================

  /** Explore mode: fit to Central Valley bounds, centered in the visible strip */
  useEffect(() => {
    if (mapMode !== "explore" || !map.mapRef?.current) return

    const leftPadding = window.innerWidth * (explorePanelWidth / 100)
    map.mapRef.current.fitBounds(EXPLORE_BOUNDS, {
      padding: {
        left: leftPadding + 10,
        top: 20,
        right: 10,
        bottom: 60,
      },
      maxZoom: 10,
      duration: 1000,
    })
  }, [mapMode, map, explorePanelWidth])

  /** Explore / get-started mode: hide base layers */
  useEffect(() => {
    if (
      (mapMode !== "explore" && mapMode !== "get-started") ||
      !map.mapRef?.current
    )
      return

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
      const leftPadding = window.innerWidth * (explorePanelWidth / 100)
      map.mapRef.current?.fitBounds(EXPLORE_BOUNDS, {
        padding: {
          left: leftPadding + 10,
          top: 20,
          right: 10,
          bottom: 60,
        },
        maxZoom: 10,
        duration: 300,
      })
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [mapMode, map, explorePanelWidth])

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
            display: "flex !important",
            flexDirection: isExploreMode ? "column" : "row",
            alignItems: "flex-end",
            gap: "8px",
            transition: "left 0.3s ease, right 0.3s ease, bottom 0.3s ease",
            pointerEvents: "auto",
            ...(isExploreMode
              ? { left: "auto", right: "12px", bottom: "33px" }
              : { left: "10px", bottom: "12px" }),
            "& .mapboxgl-ctrl": { margin: "0 !important" },
          },
        }}
      >
        <Map
          mapboxToken={token}
          mapStyle={mapStyle}
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
        <BasemapPicker />
      </Box>
    </>
  )
}

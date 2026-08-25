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
  useActiveSubSection,
  useCameraView,
  useExplorePanelWidth,
  useIsVertNavExpanded,
  useStoryboardColumnRect,
  mapActions,
  type MapMode,
} from "./store"
import { CALIFORNIA_VIEW } from "./config/cameraPresets"
import { ensureCustomLayers } from "./config/tilesetSources"
import type { SubSectionId } from "./config/sectionLayers"
import { BasemapPicker } from "./controls/BasemapPicker"
import {
  NAV_WIDTH_COLLAPSED,
  NAV_WIDTH_EXPANDED,
} from "../../components/verticalNav/VerticalNav"
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
  const prevSectionRef = useRef<SubSectionId | null>(null)

  const mapMode = useMapMode()
  const mapStyle = useMapStyle()
  const learnMapScrollOffset = useLearnMapScrollOffset()
  const activeSubSection = useActiveSubSection()
  const cameraView = useCameraView()
  const explorePanelWidth = useExplorePanelWidth()
  const isVertNavExpanded = useIsVertNavExpanded()
  const navWidth = isVertNavExpanded ? NAV_WIDTH_EXPANDED : NAV_WIDTH_COLLAPSED
  const storyboardColumnRect = useStoryboardColumnRect()

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

    ensureCustomLayers(mapboxInstance)
    mapActions.setMapReady(true)

    if (process.env.NODE_ENV === "development") {
      ;(window as unknown as Record<string, unknown>).__mapInstance =
        mapboxInstance
    }
  }, [map.mapRef])

  /** When the style URL changes, cycle mapReady so layer-setup hooks re-run.
   *  react-map-gl calls map.setStyle() internally. We listen for style.load
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
      ensureCustomLayers(mapboxInstance)
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

  /** Explore / hide base layers */
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

  /** The storyboard ("outcomes-viz") overlays a 3-column layout on top of
   *  the map: narration text (left), map (middle - where the squares
   *  should land), white panel (right). The map canvas itself is always
   *  full-viewport, so without padding a camera fly centers on the whole
   *  canvas and visibly lands under the narration column instead of the
   *  middle one. `storyboardColumnRect` is the storyboard panel's own
   *  live-measured rect (TierAnimationSection.tsx, via ResizeObserver),
   *  read through the shared store since this component and the
   *  storyboard panel are siblings, not parent/child (see
   *  MapOverlayPanels.tsx) - so the padding always matches the real DOM,
   *  not a hand-reimplemented copy of the panel's CSS. */
  const getStoryboardCameraPadding = useCallback(() => {
    if (!storyboardColumnRect) {
      return { left: navWidth, top: 0, right: 0, bottom: 0 }
    }
    const columnWidth = storyboardColumnRect.width / 3
    return {
      top: 0,
      bottom: 0,
      left: storyboardColumnRect.left + columnWidth,
      right:
        window.innerWidth -
        (storyboardColumnRect.left + storyboardColumnRect.width) +
        columnWidth,
    }
  }, [storyboardColumnRect, navWidth])

  /** Learn mode: camera transitions when section changes */
  useEffect(() => {
    if (mapMode !== "learn") {
      prevSectionRef.current = null
      return
    }
    if (!map.mapRef?.current || !cameraView) return

    const sectionChanged = prevSectionRef.current !== activeSubSection

    prevSectionRef.current = activeSubSection

    // Only "outcomes-viz" has a right-hand panel to clear - other Learn
    // subsections keep their original sidebar-only padding.
    const padding: {
      top: number
      bottom: number
      left: number
      right: number
    } =
      activeSubSection === "outcomes-viz"
        ? getStoryboardCameraPadding()
        : { left: navWidth, top: 0, right: 0, bottom: 0 }

    map.mapRef.current.easeTo({
      center: [cameraView.longitude, cameraView.latitude],
      zoom: cameraView.zoom,
      bearing: cameraView.bearing ?? 0,
      pitch: cameraView.pitch ?? 0,
      padding,
      duration: sectionChanged ? 2000 : 250,
      easing: (t: number) => t * (2 - t),
    })
  }, [
    activeSubSection,
    cameraView,
    map,
    mapMode,
    navWidth,
    getStoryboardCameraPadding,
  ])

  /** Storyboard ("outcomes-viz"): re-center whenever the panel's measured
   *  rect changes. `storyboardColumnRect` updates on both window resize
   *  and sidebar toggle (both resize the panel via ResizeObserver in
   *  TierAnimationSection.tsx), so one effect covers what used to need a
   *  separate manual `resize` listener. */
  useEffect(() => {
    if (mapMode !== "learn" || activeSubSection !== "outcomes-viz") return
    if (!map.mapRef?.current || !cameraView || !storyboardColumnRect) return

    map.mapRef.current.easeTo({
      center: [cameraView.longitude, cameraView.latitude],
      zoom: cameraView.zoom,
      bearing: cameraView.bearing ?? 0,
      pitch: cameraView.pitch ?? 0,
      padding: getStoryboardCameraPadding(),
      duration: 300,
    })
  }, [
    mapMode,
    activeSubSection,
    cameraView,
    map,
    storyboardColumnRect,
    getStoryboardCameraPadding,
  ])

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

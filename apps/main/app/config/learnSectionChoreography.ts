/**
 * Scroll Choreography for Learn section scrollytelling
 *
 * Defines the complete scroll-driven animation sequence:
 * - Panel IDs and positions
 * - Map layer states at each point
 * - Entry/exit/scroll callbacks
 *
 * Configuration separate from implementation
 */

import type React from "react"
import type { PanelLayerState } from "../hooks/useLearnScrollChoreography"
import { CENTRAL_VALLEY_VIEW } from "../components/CaliforniaMapPanel"
import {
  OPACITY,
  RIVER_ANIMATION,
  BASIN_FADE,
  ANIMATION_DURATION,
  EASING,
  clamp,
} from "../constants/scrollChoreographyConstants"

/**
 * Helper: Zoom camera back to Central Valley view
 */
function zoomToCentralValley(mapRef: React.RefObject<mapboxgl.Map | null>) {
  if (mapRef?.current) {
    mapRef.current.easeTo({
      center: [CENTRAL_VALLEY_VIEW.longitude, CENTRAL_VALLEY_VIEW.latitude],
      zoom: CENTRAL_VALLEY_VIEW.zoom,
      bearing: CENTRAL_VALLEY_VIEW.bearing,
      pitch: CENTRAL_VALLEY_VIEW.pitch,
      duration: ANIMATION_DURATION.CAMERA,
      easing: EASING.EASE_OUT,
    })
  }
}

interface ChoreographyConfigParams {
  // Map operations API (from useMap())
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map: any
  // Refs for stable access to current state
  showBasinsRef: React.RefObject<boolean>
  showInflowArrowsRef: React.RefObject<boolean>
  inflowArrowsOpacityRef: React.RefObject<number>

  // Animation refs for cleanup
  labelFadeAnimationRef: React.RefObject<number | null>
  arrowFadeAnimationRef: React.RefObject<number | null>

  // State setters
  toggleBasinsOnRef: React.RefObject<() => void>
  toggleInflowArrowsOnRef: React.RefObject<() => void>
  setInflowArrowsOpacity: (opacity: number) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setGeocoderMarker: (marker: any) => void
  setShowRivers: (show: boolean) => void
  setRiversAnimationProgress: (progress: number) => void
  resetGeocodingPanel: () => void
}

// ==================== LAYER GROUP DEFINITIONS ====================
// Defines which layers are visible at each conceptual "state"

/** All map layers we control */
const ALL_LAYERS = {
  // California overview
  CALIFORNIA_LABEL: "california-label",
  // Central Valley
  CV_POLYGON_HALO: "central-valley-polygon-halo",
  CV_POLYGON: "central-valley-polygon",
  CV_LABEL: "central-valley-label",
  // Basins (controlled via React component, but listed for reference)
  BASINS_HALO: "basins-outline-halo",
  BASINS_OUTLINE: "basins-outline-layer",
  BASINS_LABELS: "basins-labels",
  // Watersheds
  INFLOW_WATERSHEDS: "inflow-watersheds",
  // Rivers (controlled separately via animation)
  // Water layer (Delta info)
  WATER: "water",
} as const

/** Layer groups for each panel state */
const LAYER_GROUPS = {
  // Panel 1: Only California label
  CALIFORNIA: [ALL_LAYERS.CALIFORNIA_LABEL],
  
  // Panel 2: Central Valley focus
  CENTRAL_VALLEY: [
    ALL_LAYERS.CV_POLYGON_HALO,
    ALL_LAYERS.CV_POLYGON,
    ALL_LAYERS.CV_LABEL,
  ],
  
  // Panels 3-5: Basins (managed via React component toggleBasins)
  // inflow-watersheds added in Panel 4+
  
  // Rest of panels: Back to Central Valley
} as const

/** Layers to hide when showing California (Panel 1) */
const HIDE_FOR_CALIFORNIA = [
  ALL_LAYERS.CV_POLYGON_HALO,
  ALL_LAYERS.CV_POLYGON,
  ALL_LAYERS.CV_LABEL,
  ALL_LAYERS.INFLOW_WATERSHEDS,
]

/** Layers to hide when showing Basins (Panels 3-5) */
const HIDE_FOR_BASINS = [
  ALL_LAYERS.CALIFORNIA_LABEL,
  ALL_LAYERS.CV_POLYGON_HALO,
  ALL_LAYERS.CV_POLYGON,
  ALL_LAYERS.CV_LABEL,
]

// ==================== TRANSITION HELPERS ====================

type MapInstance = mapboxgl.Map

/**
 * Fade a layer's opacity from current to target
 */
function fadeLayer(
  mapInstance: MapInstance,
  layerId: string,
  targetOpacity: number,
  duration: number = ANIMATION_DURATION.FADE,
  onComplete?: () => void,
): number {
  const startTime = performance.now()
  let startOpacity = 0

  // Try to get current opacity
  try {
    const layer = mapInstance.getLayer(layerId)
    if (!layer) return 0
    
    // Determine property based on layer type
    const layerType = layer.type
    const opacityProp = layerType === "symbol" ? "text-opacity" 
      : layerType === "fill" ? "fill-opacity" 
      : "line-opacity"
    
    const current = mapInstance.getPaintProperty(layerId, opacityProp)
    startOpacity = typeof current === "number" ? current : (targetOpacity > 0 ? 0 : 1)
  } catch {
    startOpacity = targetOpacity > 0 ? 0 : 1
  }

  const delta = targetOpacity - startOpacity

  const animate = (currentTime: number): number => {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
    const opacity = clamp(startOpacity + delta * eased, 0, 1)

    try {
      const layer = mapInstance.getLayer(layerId)
      if (!layer) return 0
      
      const layerType = layer.type
      if (layerType === "symbol") {
        mapInstance.setPaintProperty(layerId, "text-opacity", opacity)
      } else if (layerType === "fill") {
        mapInstance.setPaintProperty(layerId, "fill-opacity", opacity)
      } else {
        mapInstance.setPaintProperty(layerId, "line-opacity", opacity)
      }
    } catch {
      return 0
    }

    if (progress < 1) {
      return requestAnimationFrame(animate)
    } else {
      onComplete?.()
      return 0
    }
  }

  return requestAnimationFrame(animate)
}

/**
 * Show a layer with fade-in
 */
function showLayer(
  mapInstance: MapInstance,
  layerId: string,
  targetOpacity: number = OPACITY.VISIBLE,
): number {
  try {
    mapInstance.setLayoutProperty(layerId, "visibility", "visible")
  } catch {
    return 0
  }
  return fadeLayer(mapInstance, layerId, targetOpacity)
}

/**
 * Hide a layer with fade-out
 */
function hideLayer(
  mapInstance: MapInstance,
  layerId: string,
): number {
  return fadeLayer(mapInstance, layerId, 0, ANIMATION_DURATION.FADE, () => {
    try {
      mapInstance.setLayoutProperty(layerId, "visibility", "none")
    } catch {
      // Ignore
    }
  })
}

/**
 * Hide multiple layers with fade-out
 */
function hideLayers(mapInstance: MapInstance, layerIds: readonly string[]): void {
  layerIds.forEach(id => hideLayer(mapInstance, id))
}

/**
 * Immediately hide layers (no animation)
 */
function hideLayersImmediate(mapInstance: MapInstance, layerIds: readonly string[]): void {
  layerIds.forEach(id => {
    try {
      const layer = mapInstance.getLayer(id)
      if (!layer) return
      
      const layerType = layer.type
      if (layerType === "symbol") {
        mapInstance.setPaintProperty(id, "text-opacity", 0)
      } else if (layerType === "fill") {
        mapInstance.setPaintProperty(id, "fill-opacity", 0)
      } else {
        mapInstance.setPaintProperty(id, "line-opacity", 0)
      }
      mapInstance.setLayoutProperty(id, "visibility", "none")
    } catch {
      // Ignore
    }
  })
}

/**
 * Configuration factory for Learn section choreography
 *
 * Accepts refs and callbacks to keep config pure while allowing side effects
 */
export function createLearnChoreographyConfig(
  params: ChoreographyConfigParams,
): PanelLayerState[] {
  const {
    map,
    showBasinsRef,
    showInflowArrowsRef,
    inflowArrowsOpacityRef,
    labelFadeAnimationRef,
    arrowFadeAnimationRef,
    toggleBasinsOnRef,
    toggleInflowArrowsOnRef,
    setInflowArrowsOpacity,
    setGeocoderMarker,
    setShowRivers,
    setRiversAnimationProgress,
    resetGeocodingPanel,
  } = params

  return [
    // ==================== PANEL 1: California overview ====================
    // VISIBLE: california-label
    // HIDDEN: everything else
    {
      panelId: "calsim-call",
      position: 0,
      debugLabel: "Panel 1: California",
      layers: [
        { layerId: ALL_LAYERS.CALIFORNIA_LABEL, visibility: "visible", textOpacity: OPACITY.VISIBLE },
        { layerId: ALL_LAYERS.CV_LABEL, visibility: "none", textOpacity: OPACITY.HIDDEN },
        { layerId: ALL_LAYERS.CV_POLYGON, visibility: "none", lineOpacity: OPACITY.HIDDEN },
        { layerId: ALL_LAYERS.CV_POLYGON_HALO, visibility: "none", lineOpacity: OPACITY.HIDDEN },
        { layerId: ALL_LAYERS.INFLOW_WATERSHEDS, visibility: "none", fillOpacity: OPACITY.HIDDEN },
      ],
      onEnter: () => {
        // Hide basins and arrows (React-controlled layers)
        if (showBasinsRef.current) toggleBasinsOnRef.current?.()
        if (showInflowArrowsRef.current) toggleInflowArrowsOnRef.current?.()

        if (!map.mapRef?.current) return
        const mapInstance = map.mapRef.current.getMap()

        // Cancel any existing animation
        if (labelFadeAnimationRef.current !== null) {
          cancelAnimationFrame(labelFadeAnimationRef.current)
          labelFadeAnimationRef.current = null
        }

        // Immediately hide inflow-watersheds
        hideLayersImmediate(mapInstance, [ALL_LAYERS.INFLOW_WATERSHEDS])

        // Fade in california-label, fade out Central Valley layers
        showLayer(mapInstance, ALL_LAYERS.CALIFORNIA_LABEL)
        hideLayers(mapInstance, HIDE_FOR_CALIFORNIA)
      },
    },

    // ==================== PANEL 2: Central Valley focus ====================
    // VISIBLE: central-valley-polygon-halo, central-valley-polygon, central-valley-label
    // HIDDEN: california-label, inflow-watersheds, basins
    {
      panelId: "central-valley-importance",
      position: 1,
      debugLabel: "Panel 2: Central Valley",
      layers: [
        { layerId: ALL_LAYERS.CALIFORNIA_LABEL, visibility: "none", textOpacity: OPACITY.HIDDEN },
        { layerId: ALL_LAYERS.CV_LABEL, visibility: "visible", textOpacity: OPACITY.VISIBLE, textAllowOverlap: true },
        { layerId: ALL_LAYERS.CV_POLYGON, visibility: "visible", lineOpacity: OPACITY.VISIBLE, lineWidth: 2, lineJoin: "round" },
        { layerId: ALL_LAYERS.CV_POLYGON_HALO, visibility: "visible", lineOpacity: OPACITY.VISIBLE },
        { layerId: ALL_LAYERS.INFLOW_WATERSHEDS, visibility: "none", fillOpacity: OPACITY.HIDDEN },
      ],
      onEnter: () => {
        // Hide basins and arrows (React-controlled layers)
        if (showBasinsRef.current) toggleBasinsOnRef.current?.()
        if (showInflowArrowsRef.current) toggleInflowArrowsOnRef.current?.()

        if (!map.mapRef?.current) return
        const mapInstance = map.mapRef.current.getMap()

        // Cancel any existing animation
        if (labelFadeAnimationRef.current !== null) {
          cancelAnimationFrame(labelFadeAnimationRef.current)
          labelFadeAnimationRef.current = null
        }

        // Immediately hide layers that shouldn't be visible
        hideLayersImmediate(mapInstance, [ALL_LAYERS.INFLOW_WATERSHEDS])
        hideLayer(mapInstance, ALL_LAYERS.CALIFORNIA_LABEL)

        // Show Central Valley layers with fade-in
        LAYER_GROUPS.CENTRAL_VALLEY.forEach(layerId => {
          showLayer(mapInstance, layerId)
        })
      },
      onExit: () => {
        if (labelFadeAnimationRef.current !== null) {
          cancelAnimationFrame(labelFadeAnimationRef.current)
          labelFadeAnimationRef.current = null
        }
      },
    },

    // ==================== PANEL 3: Basins ====================
    // VISIBLE: basins-outline-halo, basins-outline-layer, basins-labels (via React)
    // HIDDEN: california-label, central-valley layers, inflow-watersheds
    {
      panelId: "central-valley-basins",
      position: 2,
      debugLabel: "Panel 3: Basins",
      layers: [
        { layerId: ALL_LAYERS.CALIFORNIA_LABEL, visibility: "none", textOpacity: OPACITY.HIDDEN },
        { layerId: ALL_LAYERS.CV_LABEL, visibility: "none", textOpacity: OPACITY.HIDDEN },
        { layerId: ALL_LAYERS.CV_POLYGON, visibility: "none", lineOpacity: OPACITY.HIDDEN },
        { layerId: ALL_LAYERS.CV_POLYGON_HALO, visibility: "none", lineOpacity: OPACITY.HIDDEN },
        { layerId: ALL_LAYERS.INFLOW_WATERSHEDS, visibility: "none", fillOpacity: OPACITY.HIDDEN },
      ],
      onEnter: () => {
        // Hide arrows (scrolling back up from Panel 4)
        if (showInflowArrowsRef.current) toggleInflowArrowsOnRef.current?.()

        if (!map.mapRef?.current) return
        const mapInstance = map.mapRef.current.getMap()

        // Immediately hide layers that shouldn't be visible
        hideLayersImmediate(mapInstance, [
          ...HIDE_FOR_BASINS,
          ALL_LAYERS.INFLOW_WATERSHEDS,
        ])

        // Show basins after CV layers are hidden (delay for clean transition)
        setTimeout(() => {
          if (!showBasinsRef.current) toggleBasinsOnRef.current?.()
        }, 300)
      },
    },

    // ==================== PANEL 4: Water flow & watersheds ====================
    // VISIBLE: basins + inflow-watersheds
    // HIDDEN: california-label, central-valley layers
    {
      panelId: "water-flow-call",
      position: 2.5,
      debugLabel: "Panel 4: Watersheds",
      layers: [
        { layerId: ALL_LAYERS.INFLOW_WATERSHEDS, visibility: "visible", fillOpacity: 0.4 },
      ],
      onEnter: () => {
        // Ensure basins are visible
        if (!showBasinsRef.current) toggleBasinsOnRef.current?.()

        if (!map.mapRef?.current) return
        const mapInstance = map.mapRef.current.getMap()

        // Show inflow-watersheds with fade-in
        showLayer(mapInstance, ALL_LAYERS.INFLOW_WATERSHEDS, 0.4)
      },
    },

    // ==================== PANEL 4.25: Arrow trigger ====================
    // VISIBLE: basins + inflow-watersheds + arrows
    // HIDDEN: california-label, central-valley layers
    {
      panelId: "arrows-trigger",
      position: 2.6,
      debugLabel: "Panel 4.25: Arrow Trigger",
      layers: [], // Arrows are React-controlled
      onEnter: () => {
        // Show arrows with fade-in
        if (!showInflowArrowsRef.current) toggleInflowArrowsOnRef.current?.()

        if (arrowFadeAnimationRef.current !== null) {
          cancelAnimationFrame(arrowFadeAnimationRef.current)
        }

        const duration = 1200
        const startTime = performance.now()
        const startOpacity = clamp(inflowArrowsOpacityRef.current || 0, 0, 1)

        const animate = (currentTime: number) => {
          const elapsed = currentTime - startTime
          const progress = Math.min(elapsed / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
          const newOpacity = clamp(startOpacity + eased * (1 - startOpacity), 0, 1)
          setInflowArrowsOpacity(newOpacity)

          if (progress < 1) {
            arrowFadeAnimationRef.current = requestAnimationFrame(animate)
          } else {
            arrowFadeAnimationRef.current = null
          }
        }

        arrowFadeAnimationRef.current = requestAnimationFrame(animate)
      },
      onExit: (direction) => {
        if (direction === "up") {
          // Fade out arrows when scrolling up (back to Panel 4)
          if (showInflowArrowsRef.current) toggleInflowArrowsOnRef.current?.()

          if (arrowFadeAnimationRef.current !== null) {
            cancelAnimationFrame(arrowFadeAnimationRef.current)
          }

          const duration = 800
          const startTime = performance.now()
          const startOpacity = clamp(inflowArrowsOpacityRef.current || 1, 0, 1)

          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            const newOpacity = clamp(startOpacity * (1 - eased), 0, 1)
            setInflowArrowsOpacity(newOpacity)

            if (progress < 1) {
              arrowFadeAnimationRef.current = requestAnimationFrame(animate)
            } else {
              arrowFadeAnimationRef.current = null
            }
          }

          arrowFadeAnimationRef.current = requestAnimationFrame(animate)
        }
      },
    },

    // ==================== PANEL 5: Which basin (Find my basin) ====================
    // VISIBLE: basins + inflow-watersheds + arrows
    // HIDDEN: california-label, central-valley layers
    {
      panelId: "which-basin-call",
      position: 3.5,
      debugLabel: "Panel 5: Which Basin",
      layers: [], // All layers maintained from previous panel
      onEnter: () => {
        // If returning from rivers panel, ensure basins/watersheds/arrows visible
        if (!showBasinsRef.current) toggleBasinsOnRef.current?.()
        if (!showInflowArrowsRef.current) toggleInflowArrowsOnRef.current?.()

        // Hide rivers if coming back from rivers panel
        setShowRivers(false)
        setRiversAnimationProgress(0)
      },
      onExit: (direction) => {
        if (direction === "down") {
          setGeocoderMarker(null)
          resetGeocodingPanel()
          zoomToCentralValley(map.mapRef)
        } else if (direction === "up") {
          setGeocoderMarker(null)
          zoomToCentralValley(map.mapRef)
        }
      },
    },

    // ==================== PANEL 6: Rivers animation (Sticky) ====================
    // VISIBLE: Rivers animating in, basins/watersheds/arrows fading out
    // HIDDEN: california-label, central-valley layers
    {
      panelId: "rivers-flow-response",
      position: 4.5,
      debugLabel: "Panel 6: Rivers",
      layers: [
        { layerId: ALL_LAYERS.CV_LABEL, visibility: "none", textOpacity: OPACITY.HIDDEN },
        { layerId: ALL_LAYERS.CV_POLYGON, visibility: "none", lineOpacity: OPACITY.HIDDEN },
        { layerId: ALL_LAYERS.CV_POLYGON_HALO, visibility: "none", lineOpacity: OPACITY.HIDDEN },
      ],
      onEnter: (direction) => {
        setGeocoderMarker(null)
        setRiversAnimationProgress(0)
        setShowRivers(true)

        // When scrolling up from later panels, hide Central Valley layers
        if (direction === "up") {
          if (!map.mapRef?.current) return
          const mapInstance = map.mapRef.current.getMap()

          // Hide Central Valley layers with fade
          hideLayers(mapInstance, LAYER_GROUPS.CENTRAL_VALLEY)
        }
      },
      onExit: () => {
        // Keep rivers visible for subsequent panels
      },
      onScroll: (progress) => {
        if (!map.mapRef?.current) return
        const mapInstance = map.mapRef.current.getMap()
        if (!mapInstance) return

        // RIVERS: Draw from 20%-70% of scroll progress
        const riverProgress = clamp(
          (progress - RIVER_ANIMATION.DRAW_START) /
            (RIVER_ANIMATION.DRAW_END - RIVER_ANIMATION.DRAW_START),
          0,
          1,
        )
        setRiversAnimationProgress(riverProgress)

        // BASINS/INFLOW/ARROWS: Fade out from 15%-60% of scroll progress
        const fadeProgress = clamp(
          (progress - BASIN_FADE.FADE_START) /
            (BASIN_FADE.FADE_END - BASIN_FADE.FADE_START),
          0,
          1,
        )
        const eased = 1 - Math.pow(1 - fadeProgress, 3)

        // Calculate opacity for each layer type
        const basinsOpacity = clamp((1 - eased) * OPACITY.VISIBLE, 0, OPACITY.VISIBLE)
        const inflowOpacity = clamp((1 - eased) * 0.4, 0, 0.4)
        const arrowsOpacity = clamp((1 - eased) * 1.0, 0, 1.0)

        // Fade out arrows (React-controlled)
        setInflowArrowsOpacity(arrowsOpacity)

        // Fade out map layers
        try {
          if (mapInstance.getLayer(ALL_LAYERS.INFLOW_WATERSHEDS)) {
            mapInstance.setPaintProperty(ALL_LAYERS.INFLOW_WATERSHEDS, "fill-opacity", inflowOpacity)
          }
          if (mapInstance.getLayer(ALL_LAYERS.BASINS_OUTLINE)) {
            mapInstance.setPaintProperty(ALL_LAYERS.BASINS_OUTLINE, "line-opacity", basinsOpacity)
          }
          if (mapInstance.getLayer(ALL_LAYERS.BASINS_HALO)) {
            mapInstance.setPaintProperty(ALL_LAYERS.BASINS_HALO, "line-opacity", basinsOpacity)
          }
          if (mapInstance.getLayer(ALL_LAYERS.BASINS_LABELS)) {
            mapInstance.setPaintProperty(ALL_LAYERS.BASINS_LABELS, "text-opacity", basinsOpacity)
          }
        } catch (e) {
          console.error("Error setting basin/inflow opacity:", e)
        }
      },
    },

    // ==================== PANEL 7: Delta info ====================
    // VISIBLE: Rivers visible (from previous panel)
    // HIDDEN: basins, watersheds, arrows, california-label
    {
      panelId: "delta-info-response",
      position: 5.5,
      debugLabel: "Panel 7: Delta Info",
      layers: [
        { layerId: ALL_LAYERS.INFLOW_WATERSHEDS, visibility: "none", fillOpacity: OPACITY.HIDDEN },
      ],
      onEnter: (direction) => {
        if (!map.mapRef?.current) return
        const mapInstance = map.mapRef.current.getMap()

        // Always ensure inflow-watersheds is hidden (prevent flash)
        hideLayersImmediate(mapInstance, [ALL_LAYERS.INFLOW_WATERSHEDS])

        if (direction === "up") {
          // When scrolling up from later panels, fade out Central Valley and show rivers
          hideLayers(mapInstance, LAYER_GROUPS.CENTRAL_VALLEY)
          setShowRivers(true)
        }
      },
      onExit: (direction) => {
        if (!map.mapRef?.current) return
        const mapInstance = map.mapRef.current.getMap()

        if (direction === "down") {
          // Transitioning to Central Valley panels
          setShowRivers(false)
          zoomToCentralValley(map.mapRef)

          // Hide water layer if visible
          hideLayer(mapInstance, ALL_LAYERS.WATER)

          // Show Central Valley layers with fade-in
          LAYER_GROUPS.CENTRAL_VALLEY.forEach(layerId => {
            showLayer(mapInstance, layerId)
          })
        } else if (direction === "up") {
          // Scrolling back to Rivers panel - hide CV layers BEFORE reaching rivers
          zoomToCentralValley(map.mapRef)
          hideLayersImmediate(mapInstance, [ALL_LAYERS.WATER])
          
          // Immediately hide Central Valley layers so they're gone before rivers
          hideLayersImmediate(mapInstance, [...LAYER_GROUPS.CENTRAL_VALLEY])
        }
      },
    },

    // ==================== PANEL 8: Water distribution ====================
    // VISIBLE: central-valley-polygon-halo, central-valley-polygon, central-valley-label
    // HIDDEN: california-label, basins, inflow-watersheds, rivers
    {
      panelId: "water-distribution-call",
      position: 6,
      debugLabel: "Panel 8: Water Distribution",
      layers: [
        { layerId: ALL_LAYERS.CALIFORNIA_LABEL, visibility: "none", textOpacity: OPACITY.HIDDEN },
        { layerId: ALL_LAYERS.CV_LABEL, visibility: "visible", textOpacity: OPACITY.VISIBLE },
        { layerId: ALL_LAYERS.CV_POLYGON, visibility: "visible", lineOpacity: OPACITY.VISIBLE },
        { layerId: ALL_LAYERS.CV_POLYGON_HALO, visibility: "visible", lineOpacity: OPACITY.VISIBLE },
        { layerId: ALL_LAYERS.INFLOW_WATERSHEDS, visibility: "none", fillOpacity: OPACITY.HIDDEN },
      ],
      onEnter: () => {
        if (!map.mapRef?.current) return
        const mapInstance = map.mapRef.current.getMap()

        // Hide everything that shouldn't be visible
        hideLayersImmediate(mapInstance, [ALL_LAYERS.INFLOW_WATERSHEDS])
        if (showBasinsRef.current) toggleBasinsOnRef.current?.()
        if (showInflowArrowsRef.current) toggleInflowArrowsOnRef.current?.()
        setShowRivers(false)

        // Show Central Valley layers
        LAYER_GROUPS.CENTRAL_VALLEY.forEach(layerId => {
          showLayer(mapInstance, layerId)
        })
      },
      onExit: (direction) => {
        if (direction === "up") {
          // Scrolling up toward rivers - hide CV layers immediately
          if (!map.mapRef?.current) return
          const mapInstance = map.mapRef.current.getMap()
          hideLayersImmediate(mapInstance, [...LAYER_GROUPS.CENTRAL_VALLEY])
        }
      },
    },

    // ==================== PANELS 9-14: All show Central Valley ====================
    // VISIBLE: central-valley-polygon-halo, central-valley-polygon, central-valley-label
    // HIDDEN: california-label, basins, inflow-watersheds
    
    // Common layer config for all remaining panels
    ...[
      { panelId: "calsim-detailed-response", position: 7, debugLabel: "Panel 9: CalSim Model" },
      { panelId: "coeqwal-call", position: 8, debugLabel: "Panel 10: COEQWAL" },
      { panelId: "public-data-call", position: 9, debugLabel: "Panel 11: Public Data" },
      { panelId: "scenario-explanation-call", position: 10, debugLabel: "Panel 12: Scenario Explanation" },
      { panelId: "scenario-scroll-track", position: 11, debugLabel: "Panel 13: Baseline Scenario" },
      { panelId: "scenario-buffer", position: 12, debugLabel: "Panel 14: Scenario Buffer" },
    ].map(panel => ({
      ...panel,
      layers: [
        { layerId: ALL_LAYERS.CALIFORNIA_LABEL, visibility: "none" as const, textOpacity: OPACITY.HIDDEN },
        { layerId: ALL_LAYERS.CV_LABEL, visibility: "visible" as const, textOpacity: OPACITY.VISIBLE },
        { layerId: ALL_LAYERS.CV_POLYGON, visibility: "visible" as const, lineOpacity: OPACITY.VISIBLE },
        { layerId: ALL_LAYERS.CV_POLYGON_HALO, visibility: "visible" as const, lineOpacity: OPACITY.VISIBLE },
        { layerId: ALL_LAYERS.INFLOW_WATERSHEDS, visibility: "none" as const, fillOpacity: OPACITY.HIDDEN },
      ],
    })),

    // ==================== PANEL 15: Learn more container ====================
    // VISIBLE: central-valley-polygon-halo, central-valley-polygon, central-valley-label
    // HIDDEN: california-label, inflow-watersheds
    {
      panelId: "learnMoreContainer",
      position: 13,
      debugLabel: "Panel 15: Learn more",
      layers: [
        { layerId: ALL_LAYERS.CALIFORNIA_LABEL, visibility: "none", textOpacity: OPACITY.HIDDEN },
        { layerId: ALL_LAYERS.CV_LABEL, visibility: "visible", textOpacity: OPACITY.VISIBLE },
        { layerId: ALL_LAYERS.CV_POLYGON, visibility: "visible", lineOpacity: OPACITY.VISIBLE },
        { layerId: ALL_LAYERS.CV_POLYGON_HALO, visibility: "visible", lineOpacity: OPACITY.VISIBLE },
        { layerId: ALL_LAYERS.INFLOW_WATERSHEDS, visibility: "none", fillOpacity: OPACITY.HIDDEN },
      ],
    },
  ]
}

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

// ==================== TRANSITION HELPERS ====================

type MapInstance = mapboxgl.Map

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
  // Track max progress in Rivers panel - only fade out, never fade back in during scroll
  let riversMaxProgress = 0
  const {
    map,
    showBasinsRef,
    showInflowArrowsRef,
    inflowArrowsOpacityRef,
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
        // Note: inflow-watersheds not included - it should stay hidden, no animation needed
      ],
      onEnter: () => {
        // Only handle React-controlled layers here
        // Map layer animations are handled by the layers array above
        if (showBasinsRef.current) toggleBasinsOnRef.current?.()
        if (showInflowArrowsRef.current) toggleInflowArrowsOnRef.current?.()
        setShowRivers(false)
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
        // Note: inflow-watersheds not included - it should stay hidden, no animation needed
      ],
      onEnter: () => {
        // Only handle React-controlled layers here
        // Map layer animations are handled by the layers array above
        if (showBasinsRef.current) toggleBasinsOnRef.current?.()
        if (showInflowArrowsRef.current) toggleInflowArrowsOnRef.current?.()
        setShowRivers(false)
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
        // Note: inflow-watersheds not included - it will fade in when entering Panel 4
      ],
      onEnter: () => {
        // Handle React-controlled layers
        if (showInflowArrowsRef.current) toggleInflowArrowsOnRef.current?.()
        setShowRivers(false)

        // Show basins (delay for clean transition after CV layers fade)
        setTimeout(() => {
          if (!showBasinsRef.current) toggleBasinsOnRef.current?.()
        }, 300)
      },
    },

    // ==================== PANEL 4: Water flow & watersheds ====================
    // VISIBLE: basins + inflow-watersheds
    // HIDDEN: california-label, central-valley layers, arrows
    {
      panelId: "water-flow-call",
      position: 2.5,
      debugLabel: "Panel 4: Watersheds",
      layers: [
        // inflow-watersheds handled in onEnter for direction-aware ordering
      ],
      onEnter: (direction) => {
        // Ensure basins are visible (React-controlled)
        if (!showBasinsRef.current) toggleBasinsOnRef.current?.()
        
        // Hide arrows (they appear in Panel 4.25)
        if (showInflowArrowsRef.current) toggleInflowArrowsOnRef.current?.()

        if (!map.mapRef?.current) return
        const mapInstance = map.mapRef.current.getMap()
        if (!mapInstance?.getLayer(ALL_LAYERS.INFLOW_WATERSHEDS)) return

        if (direction === "down") {
          // Scrolling DOWN: fade in inflow-watersheds
          mapInstance.setLayoutProperty(ALL_LAYERS.INFLOW_WATERSHEDS, "visibility", "visible")
          
          const duration = 1200
          const startTime = performance.now()
          const animate = (now: number) => {
            const progress = Math.min((now - startTime) / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            mapInstance.setPaintProperty(ALL_LAYERS.INFLOW_WATERSHEDS, "fill-opacity", eased * 0.3)
            if (progress < 1) requestAnimationFrame(animate)
          }
          requestAnimationFrame(animate)
        } else {
          // Scrolling UP: inflow-watersheds should already be visible, keep it at 0.3
          mapInstance.setLayoutProperty(ALL_LAYERS.INFLOW_WATERSHEDS, "visibility", "visible")
          mapInstance.setPaintProperty(ALL_LAYERS.INFLOW_WATERSHEDS, "fill-opacity", 0.3)
        }
      },
      onExit: (direction) => {
        // When scrolling UP to Panel 3, fade out inflow-watersheds
        if (direction === "up") {
          if (!map.mapRef?.current) return
          const mapInstance = map.mapRef.current.getMap()
          if (!mapInstance?.getLayer(ALL_LAYERS.INFLOW_WATERSHEDS)) return

          const duration = 800
          const startTime = performance.now()
          const animate = (now: number) => {
            const progress = Math.min((now - startTime) / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            const opacity = 0.3 * (1 - eased)
            mapInstance.setPaintProperty(ALL_LAYERS.INFLOW_WATERSHEDS, "fill-opacity", opacity)
            if (progress < 1) {
              requestAnimationFrame(animate)
            } else {
              mapInstance.setLayoutProperty(ALL_LAYERS.INFLOW_WATERSHEDS, "visibility", "none")
            }
          }
          requestAnimationFrame(animate)
        }
      },
    },

    // ==================== PANEL 4.25: Arrow trigger ====================
    // VISIBLE: basins + inflow-watersheds + arrows
    // HIDDEN: california-label, central-valley layers
    {
      panelId: "arrows-trigger",
      position: 2.6,
      debugLabel: "Panel 4.25: Arrow Trigger",
      layers: [
        // inflow-watersheds handled in onEnter for direction-aware ordering
      ],
      onEnter: (direction) => {
        // Ensure basins are visible
        if (!showBasinsRef.current) toggleBasinsOnRef.current?.()

        if (direction === "down") {
          // Scrolling DOWN: inflow-watersheds already visible from Panel 4
          // Now fade in arrows
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
        } else {
          // Scrolling UP: arrows and inflow-watersheds should already be visible from Panel 5
          // Just ensure they stay visible
          if (!showInflowArrowsRef.current) toggleInflowArrowsOnRef.current?.()
          
          // Ensure inflow-watersheds is visible
          if (map.mapRef?.current) {
            const mapInstance = map.mapRef.current.getMap()
            if (mapInstance?.getLayer(ALL_LAYERS.INFLOW_WATERSHEDS)) {
              mapInstance.setLayoutProperty(ALL_LAYERS.INFLOW_WATERSHEDS, "visibility", "visible")
              mapInstance.setPaintProperty(ALL_LAYERS.INFLOW_WATERSHEDS, "fill-opacity", 0.3)
            }
          }
        }
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
      layers: [
        // inflow-watersheds handled in onEnter for direction-aware ordering
      ],
      onEnter: (direction) => {
        // Hide rivers if coming back from rivers panel
        setShowRivers(false)
        setRiversAnimationProgress(0)

        // Ensure basins visible
        if (!showBasinsRef.current) toggleBasinsOnRef.current?.()

        if (direction === "up") {
          // Scrolling UP: ALL basin layers appear together (reverse of fade-out)
          // Show arrows immediately at full opacity
          if (!showInflowArrowsRef.current) toggleInflowArrowsOnRef.current?.()
          setInflowArrowsOpacity(1)

          // Reset ALL basin-related layer opacities (they were set to 0 during Rivers scroll)
          if (map.mapRef?.current) {
            const mapInstance = map.mapRef.current.getMap()
            
            // Inflow-watersheds
            if (mapInstance?.getLayer(ALL_LAYERS.INFLOW_WATERSHEDS)) {
              mapInstance.setLayoutProperty(ALL_LAYERS.INFLOW_WATERSHEDS, "visibility", "visible")
              mapInstance.setPaintProperty(ALL_LAYERS.INFLOW_WATERSHEDS, "fill-opacity", 0.3)
            }
            
            // Basins outline
            if (mapInstance?.getLayer(ALL_LAYERS.BASINS_OUTLINE)) {
              mapInstance.setPaintProperty(ALL_LAYERS.BASINS_OUTLINE, "line-opacity", OPACITY.VISIBLE)
            }
            
            // Basins halo
            if (mapInstance?.getLayer(ALL_LAYERS.BASINS_HALO)) {
              mapInstance.setPaintProperty(ALL_LAYERS.BASINS_HALO, "line-opacity", 1)
            }
            
            // Basins labels
            if (mapInstance?.getLayer(ALL_LAYERS.BASINS_LABELS)) {
              mapInstance.setPaintProperty(ALL_LAYERS.BASINS_LABELS, "text-opacity", 1)
            }
          }
        } else {
          // Scrolling DOWN: inflow-watersheds should already be visible from Panel 4
          // Just ensure arrows are visible
          if (!showInflowArrowsRef.current) toggleInflowArrowsOnRef.current?.()
        }
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
        // Handle React-controlled layers
        setGeocoderMarker(null)
        setRiversAnimationProgress(0)
        setShowRivers(true)
        
        // Reset progress tracker when entering from above (scrolling down)
        if (direction === "down") {
          riversMaxProgress = 0
        }
        // CV layers are hidden via the layers array above
      },
      onExit: () => {
        // Keep rivers visible for subsequent panels
      },
      onScroll: (progress) => {
        if (!map.mapRef?.current) return
        const mapInstance = map.mapRef.current.getMap()
        if (!mapInstance) return

        // RIVERS: Always update river animation based on progress
        const riverProgress = clamp(
          (progress - RIVER_ANIMATION.DRAW_START) /
            (RIVER_ANIMATION.DRAW_END - RIVER_ANIMATION.DRAW_START),
          0,
          1,
        )
        setRiversAnimationProgress(riverProgress)

        // BASINS/INFLOW/ARROWS: Only fade OUT (when scrolling down)
        // When scrolling up, keep them at their faded-out state
        // They will all fade in together when entering Panel 5
        const effectiveProgress = Math.max(progress, riversMaxProgress)
        riversMaxProgress = effectiveProgress

        const fadeProgress = clamp(
          (effectiveProgress - BASIN_FADE.FADE_START) /
            (BASIN_FADE.FADE_END - BASIN_FADE.FADE_START),
          0,
          1,
        )
        const eased = 1 - Math.pow(1 - fadeProgress, 3)

        // Calculate opacity for each layer type (only decreases, never increases during scroll)
        const basinsOpacity = clamp((1 - eased) * OPACITY.VISIBLE, 0, OPACITY.VISIBLE)
        const inflowOpacity = clamp((1 - eased) * 0.3, 0, 0.3)
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
    // HIDDEN: basins, watersheds, arrows, california-label, CV layers
    {
      panelId: "delta-info-response",
      position: 5.5,
      debugLabel: "Panel 7: Delta Info",
      layers: [
        // Note: inflow-watersheds already hidden by Rivers panel scroll handler
        { layerId: ALL_LAYERS.CV_LABEL, visibility: "none", textOpacity: OPACITY.HIDDEN },
        { layerId: ALL_LAYERS.CV_POLYGON, visibility: "none", lineOpacity: OPACITY.HIDDEN },
        { layerId: ALL_LAYERS.CV_POLYGON_HALO, visibility: "none", lineOpacity: OPACITY.HIDDEN },
      ],
      onEnter: (direction) => {
        // Handle React-controlled layers
        if (direction === "up") {
          setShowRivers(true)
        }
        // Map layer states handled by layers array above
      },
      onExit: (direction) => {
        if (direction === "down") {
          // React-controlled: hide rivers, zoom to CV
          setShowRivers(false)
          zoomToCentralValley(map.mapRef)
        } else if (direction === "up") {
          // Zoom back for rivers panel
          zoomToCentralValley(map.mapRef)
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
        // Note: inflow-watersheds already hidden by Rivers panel scroll handler
      ],
      onEnter: () => {
        // Handle React-controlled layers
        if (showBasinsRef.current) toggleBasinsOnRef.current?.()
        if (showInflowArrowsRef.current) toggleInflowArrowsOnRef.current?.()
        setShowRivers(false)
        // Map layer states handled by layers array above
      },
      onExit: (direction) => {
        // When scrolling up, immediately hide CV for clean transition to rivers
        if (direction === "up") {
          if (!map.mapRef?.current) return
          const mapInstance = map.mapRef.current.getMap()
          hideLayersImmediate(mapInstance, [...LAYER_GROUPS.CENTRAL_VALLEY])
        }
      },
    },

    // ==================== PANELS 9-14: All show Central Valley ====================
    // VISIBLE: central-valley-polygon-halo, central-valley-polygon, central-valley-label
    // HIDDEN: california-label, basins, inflow-watersheds (already hidden)
    
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
        // Note: inflow-watersheds already hidden by Rivers panel scroll handler
      ],
    })),

    // ==================== PANEL 15: Learn more container ====================
    // VISIBLE: central-valley-polygon-halo, central-valley-polygon, central-valley-label
    // HIDDEN: california-label, inflow-watersheds (already hidden)
    {
      panelId: "learnMoreContainer",
      position: 13,
      debugLabel: "Panel 15: Learn more",
      layers: [
        { layerId: ALL_LAYERS.CALIFORNIA_LABEL, visibility: "none", textOpacity: OPACITY.HIDDEN },
        { layerId: ALL_LAYERS.CV_LABEL, visibility: "visible", textOpacity: OPACITY.VISIBLE },
        { layerId: ALL_LAYERS.CV_POLYGON, visibility: "visible", lineOpacity: OPACITY.VISIBLE },
        { layerId: ALL_LAYERS.CV_POLYGON_HALO, visibility: "visible", lineOpacity: OPACITY.VISIBLE },
        // Note: inflow-watersheds already hidden by Rivers panel scroll handler
      ],
    },
  ]
}

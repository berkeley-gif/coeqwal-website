/**
 * Scroll Choreography Configuration for Learn Section
 * 
 * Defines the complete scroll-driven animation sequence:
 * - Panel IDs and positions
 * - Map layer states at each point
 * - Entry/exit/scroll callbacks
 * 
 * Following storyline-flow pattern: configuration separate from implementation
 */

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
 * Configuration factory for Learn section choreography
 * 
 * Accepts refs and callbacks to keep config pure while allowing side effects
 */
export function createLearnChoreographyConfig(params: {
  // Map operations API (from useMap())
  map: any
  // Refs for stable access to current state
  showBasinsRef: React.RefObject<boolean>
  showInflowArrowsRef: React.RefObject<boolean>
  inflowArrowsOpacityRef: React.RefObject<number>
  
  // Animation refs for cleanup
  labelFadeAnimationRef: React.MutableRefObject<number | null>
  arrowFadeAnimationRef: React.MutableRefObject<number | null>
  
  // State setters
  toggleBasinsOnRef: React.RefObject<() => void>
  toggleInflowArrowsOnRef: React.RefObject<() => void>
  setInflowArrowsOpacity: (opacity: number) => void
  setGeocoderMarker: (marker: any) => void
  setShowRivers: (show: boolean) => void
  setRiversAnimationProgress: (progress: number) => void
  resetGeocodingPanel: () => void
}): PanelLayerState[] {
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
    // ==================== PANEL 1: California Overview ====================
    {
      panelId: "calsim-call",
      position: 0,
      debugLabel: "Panel 1: California",
      layers: [
        {
          layerId: "california-label",
          visibility: "visible",
          textOpacity: OPACITY.VISIBLE,
        },
        {
          layerId: "central-valley-label",
          visibility: "none",
          textOpacity: OPACITY.HIDDEN,
        },
        {
          layerId: "central-valley-polygon",
          visibility: "none",
          lineOpacity: OPACITY.HIDDEN,
        },
      ],
    },

    // ==================== PANEL 2: Central Valley Focus ====================
    {
      panelId: "central-valley-importance",
      position: 1,
      debugLabel: "Panel 2: Central Valley",
      layers: [
        {
          layerId: "california-label",
          visibility: "none",
          textOpacity: OPACITY.HIDDEN,
        },
        {
          layerId: "central-valley-label",
          visibility: "visible",
          textOpacity: OPACITY.VISIBLE, // Set to visible so it shows on initial load
          textAllowOverlap: true,
        },
        {
          layerId: "central-valley-polygon",
          visibility: "visible",
          lineOpacity: OPACITY.VISIBLE, // Set to visible so it shows on initial load
          lineWidth: 2,
          lineJoin: "round",
        },
      ],
      onEnter: () => {
        // Hide basins when returning to Panel 2 from Panel 3
        if (showBasinsRef.current) toggleBasinsOnRef.current?.()

        // Smooth fade-in for Central Valley label and polygon
        if (!map.mapRef?.current) return

        const localMap = map.mapRef.current

        // Cancel any existing animation
        if (labelFadeAnimationRef.current !== null) {
          cancelAnimationFrame(labelFadeAnimationRef.current)
          labelFadeAnimationRef.current = null
        }

        const startTime = performance.now()

        // Ensure starting at 0 opacity
        try {
          localMap.setPaintProperty("central-valley-label", "text-opacity", 0)
          localMap.setPaintProperty("central-valley-polygon", "line-opacity", 0)
        } catch {
          // Layer might not be ready
        }

        const animate = (currentTime: number) => {
          const elapsed = currentTime - startTime
          const progress = Math.min(elapsed / ANIMATION_DURATION.FADE, 1)
          const rawEased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
          const eased = clamp(rawEased * OPACITY.VISIBLE, 0, OPACITY.VISIBLE)

          try {
            localMap.setPaintProperty("central-valley-label", "text-opacity", eased)
            localMap.setPaintProperty("central-valley-polygon", "line-opacity", eased)
          } catch {
            labelFadeAnimationRef.current = null
            return
          }

          if (progress < 1) {
            labelFadeAnimationRef.current = requestAnimationFrame(animate)
          } else {
            labelFadeAnimationRef.current = null
          }
        }

        labelFadeAnimationRef.current = requestAnimationFrame(animate)
      },
      onExit: () => {
        // Cleanup animation if leaving mid-fade
        if (labelFadeAnimationRef.current !== null) {
          cancelAnimationFrame(labelFadeAnimationRef.current)
          labelFadeAnimationRef.current = null
        }
      },
    },

    // ==================== PANEL 3: Basins ====================
    {
      panelId: "central-valley-basins",
      position: 2,
      debugLabel: "Panel 3: Basins",
      layers: [
        {
          layerId: "california-label",
          visibility: "none",
          textOpacity: OPACITY.HIDDEN,
        },
        {
          layerId: "central-valley-label",
          visibility: "none",
          textOpacity: OPACITY.HIDDEN,
        },
        {
          layerId: "central-valley-polygon",
          visibility: "none",
          lineOpacity: OPACITY.HIDDEN,
        },
        {
          layerId: "inflow-watersheds",
          visibility: "none",
          fillOpacity: OPACITY.HIDDEN,
        },
      ],
      onEnter: () => {
        // Show basins - they stay visible through Panel 5
        if (!showBasinsRef.current) toggleBasinsOnRef.current?.()
      },
    },

    // ==================== PANEL 4: Water Flow & Watersheds ====================
    {
      panelId: "water-flow-call",
      position: 2.5,
      debugLabel: "Panel 4: Watersheds",
      layers: [
        {
          layerId: "basins-labels",
          visibility: "visible",
          textOpacity: OPACITY.VISIBLE,
        },
        {
          layerId: "inflow-watersheds",
          visibility: "visible",
          fillOpacity: 0.4, // Visible with semi-transparency
        },
      ],
      onEnter: () => {
        // Ensure basins are visible
        if (!showBasinsRef.current) toggleBasinsOnRef.current?.()
      },
    },

    // ==================== PANEL 4.25: Arrow Trigger ====================
    {
      panelId: "arrows-trigger",
      position: 2.6,
      debugLabel: "Panel 4.25: Arrow Trigger",
      layers: [],
      onEnter: () => {
        // Show arrows
        if (!showInflowArrowsRef.current) toggleInflowArrowsOnRef.current?.()

        // Smooth fade-in for arrows
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
          // Fade out arrows when scrolling up
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

    // ==================== PANEL 4.5: Which Basin (Find My Basin) ====================
    {
      panelId: "which-basin-call",
      position: 3.5,
      debugLabel: "Panel 4.5: Which Basin",
      layers: [],
      onEnter: () => {
        // If returning from rivers panel, reset rivers
        if (showInflowArrowsRef.current) {
          setShowRivers(false)
          setRiversAnimationProgress(0)
        }
      },
      onExit: (direction) => {
        if (direction === "down") {
          // Clear geocoder marker and reset panel when scrolling down
          setGeocoderMarker(null)
          resetGeocodingPanel()
          
          // Return to Central Valley view when scrolling down
          if (map.mapRef?.current) {
            map.mapRef.current.easeTo({
              center: [CENTRAL_VALLEY_VIEW.longitude, CENTRAL_VALLEY_VIEW.latitude],
              zoom: CENTRAL_VALLEY_VIEW.zoom,
              bearing: CENTRAL_VALLEY_VIEW.bearing,
              pitch: CENTRAL_VALLEY_VIEW.pitch,
              duration: ANIMATION_DURATION.CAMERA,
              easing: EASING.EASE_OUT,
            })
          }
        } else if (direction === "up") {
          // Just clear the marker when scrolling up (keep search state)
          setGeocoderMarker(null)
          
          // Return to Central Valley view
          if (map.mapRef?.current) {
            map.mapRef.current.easeTo({
              center: [CENTRAL_VALLEY_VIEW.longitude, CENTRAL_VALLEY_VIEW.latitude],
              zoom: CENTRAL_VALLEY_VIEW.zoom,
              bearing: CENTRAL_VALLEY_VIEW.bearing,
              pitch: CENTRAL_VALLEY_VIEW.pitch,
              duration: ANIMATION_DURATION.CAMERA,
              easing: EASING.EASE_OUT,
            })
          }
        }
      },
    },

    // ==================== PANEL 5: Rivers Animation (Sticky) ====================
    {
      panelId: "rivers-flow-response",
      position: 4.5,
      debugLabel: "Panel 5: Rivers",
      layers: [], // Opacity managed entirely via onScroll handler
      onEnter: () => {
        // Clear geocoder marker
        setGeocoderMarker(null)
        
        // Reset rivers animation to start from beginning
        setRiversAnimationProgress(0)
        setShowRivers(true)
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
          1
        )
        setRiversAnimationProgress(riverProgress)

        // BASINS/INFLOW/ARROWS: Fade out from 10%-35% of scroll progress
        const fadeProgress = clamp(
          (progress - BASIN_FADE.FADE_START) / 
          (BASIN_FADE.FADE_END - BASIN_FADE.FADE_START),
          0,
          1
        )
        const eased = 1 - Math.pow(1 - fadeProgress, 3) // ease-out cubic
        
        // Calculate opacity for each layer type
        const basinsOpacity = clamp((1 - eased) * OPACITY.VISIBLE, 0, OPACITY.VISIBLE)
        const inflowOpacity = clamp((1 - eased) * 0.4, 0, 0.4) // Inflow starts at 0.4, not 0.9
        const arrowsOpacity = clamp((1 - eased) * 1.0, 0, 1.0) // Arrows start at 1.0

        // Fade out arrows
        setInflowArrowsOpacity(arrowsOpacity)

        try {
          if (mapInstance.getLayer("inflow-watersheds")) {
            mapInstance.setPaintProperty("inflow-watersheds", "fill-opacity", inflowOpacity)
          }
          if (mapInstance.getLayer("basins-outline-layer")) {
            mapInstance.setPaintProperty("basins-outline-layer", "line-opacity", basinsOpacity)
          }
          if (mapInstance.getLayer("basins-labels")) {
            mapInstance.setPaintProperty("basins-labels", "text-opacity", basinsOpacity)
          }
        } catch (e) {
          console.error("Error setting basin/inflow opacity:", e)
        }
      },
    },

    // ==================== PANEL 6: Water Distribution ====================
    {
      panelId: "water-distribution-call",
      position: 5.5,
      debugLabel: "Panel 6: Distribution",
      layers: [
        {
          layerId: "california-label",
          visibility: "none",
          textOpacity: OPACITY.HIDDEN,
        },
        {
          layerId: "central-valley-label",
          visibility: "none",
          textOpacity: OPACITY.HIDDEN,
        },
        {
          layerId: "central-valley-polygon",
          visibility: "none",
          lineOpacity: OPACITY.HIDDEN,
        },
        {
          layerId: "inflow-watersheds",
          visibility: "none",
          fillOpacity: OPACITY.HIDDEN,
        },
      ],
      onEnter: () => {
        // Hide basins when entering Panel 6
        if (showBasinsRef.current) toggleBasinsOnRef.current?.()
      },
    },

    // ==================== PANEL 6.5: Delta Info ====================
    {
      panelId: "delta-info-response",
      position: 6,
      debugLabel: "Panel 6.5: Delta Info",
      layers: [],
      onExit: (direction) => {
        if (direction === "down") {
          // Zoom back to Central Valley
          if (map.mapRef?.current) {
            map.mapRef.current.easeTo({
              center: [CENTRAL_VALLEY_VIEW.longitude, CENTRAL_VALLEY_VIEW.latitude],
              zoom: CENTRAL_VALLEY_VIEW.zoom,
              bearing: CENTRAL_VALLEY_VIEW.bearing,
              pitch: CENTRAL_VALLEY_VIEW.pitch,
              duration: ANIMATION_DURATION.CAMERA,
              easing: EASING.EASE_OUT,
            })
          }

          // Hide water layer
          if (map.mapRef?.current) {
            try {
              const mapInstance = map.mapRef.current.getMap()
              if (mapInstance.getLayer("water")) {
                mapInstance.setLayoutProperty("water", "visibility", "none")
              }
            } catch {
              // Water layer might not exist
            }
          }
        }
      },
    },

    // ==================== PANEL 7: CalSim Model ====================
    {
      panelId: "calsim-detailed-response",
      position: 7,
      debugLabel: "Panel 7: CalSim Model",
      layers: [
        {
          layerId: "california-label",
          visibility: "none",
          textOpacity: OPACITY.HIDDEN,
        },
        {
          layerId: "central-valley-label",
          visibility: "visible",
          textOpacity: OPACITY.VISIBLE,
        },
        {
          layerId: "central-valley-polygon",
          visibility: "visible",
          lineOpacity: OPACITY.VISIBLE,
        },
      ],
      onEnter: () => {
        // Fade out rivers when entering CalSim panel
        setShowRivers(false)
      },
    },

    // ==================== PANEL 8: COEQWAL Project ====================
    {
      panelId: "coeqwal-call",
      position: 8,
      debugLabel: "Panel 8: COEQWAL",
      layers: [
        {
          layerId: "california-label",
          visibility: "none",
          textOpacity: OPACITY.HIDDEN,
        },
        {
          layerId: "central-valley-label",
          visibility: "visible",
          textOpacity: OPACITY.VISIBLE,
        },
        {
          layerId: "central-valley-polygon",
          visibility: "visible",
          lineOpacity: OPACITY.VISIBLE,
        },
      ],
    },
  ]
}


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
          // No camera movement - already at Central Valley view for Rivers panel
        } else if (direction === "up") {
          // Just clear the marker when scrolling up (keep search state)
          setGeocoderMarker(null)
          // No camera movement needed
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
      onExit: () => {
        // Keep rivers visible and camera position unchanged when exiting
        // Don't reset rivers or change camera - let them stay for subsequent panels
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

        // BASINS/INFLOW/ARROWS: Fade out from 15%-60% of scroll progress
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

    // ==================== PANEL 6: Delta Info ====================
    {
      panelId: "delta-info-response",
      position: 5.5,
      debugLabel: "Panel 6: Delta Info",
      layers: [],
      onEnter: (direction) => {
        if (direction === "up") {
          // When scrolling up from Water Distribution, fade out Central Valley and show rivers
          if (map.mapRef?.current) {
            try {
              const mapInstance = map.mapRef.current.getMap()
              
              // Fade out Central Valley label and polygon
              const duration = ANIMATION_DURATION.CAMERA
              const startTime = performance.now()
              
              const animateCVFadeOut = (currentTime: number) => {
                const elapsed = currentTime - startTime
                const progress = Math.min(elapsed / duration, 1)
                const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
                const opacity = Math.max(0, Math.min(OPACITY.VISIBLE, (1 - eased) * OPACITY.VISIBLE))
                
                try {
                  if (mapInstance.getLayer("central-valley-label")) {
                    mapInstance.setPaintProperty("central-valley-label", "text-opacity", opacity)
                  }
                  if (mapInstance.getLayer("central-valley-polygon")) {
                    mapInstance.setPaintProperty("central-valley-polygon", "line-opacity", opacity)
                  }
                } catch {
                  // Ignore
                }
                
                if (progress < 1) {
                  requestAnimationFrame(animateCVFadeOut)
                } else {
                  // Hide after fade completes
                  try {
                    if (mapInstance.getLayer("central-valley-label")) {
                      mapInstance.setLayoutProperty("central-valley-label", "visibility", "none")
                    }
                    if (mapInstance.getLayer("central-valley-polygon")) {
                      mapInstance.setLayoutProperty("central-valley-polygon", "visibility", "none")
                    }
                  } catch {
                    // Ignore
                  }
                }
              }
              
              requestAnimationFrame(animateCVFadeOut)
            } catch {
              // Layers might not exist
            }
          }
          
          // Show rivers again
          setShowRivers(true)
        }
      },
      onExit: (direction) => {
        if (direction === "down") {
          // Fade out rivers first
          setShowRivers(false)
          
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

          // Fade out and hide water layer
          if (map.mapRef?.current) {
            try {
              const mapInstance = map.mapRef.current.getMap()
              if (mapInstance.getLayer("water")) {
                // Animate opacity from current to 0
                const duration = ANIMATION_DURATION.CAMERA
                const startTime = performance.now()
                
                const animateOpacity = (currentTime: number) => {
                  const elapsed = currentTime - startTime
                  const progress = Math.min(elapsed / duration, 1)
                  const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
                  const opacity = Math.max(0, Math.min(1, 1 - eased)) // fade from 1 to 0, clamped
                  
                  try {
                    mapInstance.setPaintProperty("water", "fill-opacity", opacity)
                  } catch {
                    // Layer might not support this property
                  }
                  
                  if (progress < 1) {
                    requestAnimationFrame(animateOpacity)
                  } else {
                    // Hide after fade completes
                    try {
                      mapInstance.setLayoutProperty("water", "visibility", "none")
                    } catch {
                      // Ignore
                    }
                  }
                }
                
                requestAnimationFrame(animateOpacity)
              }
            } catch {
              // Water layer might not exist
            }
          }

          // Show Central Valley label and polygon
          if (map.mapRef?.current) {
            try {
              const mapInstance = map.mapRef.current.getMap()
              
              // Make visible
              if (mapInstance.getLayer("central-valley-label")) {
                mapInstance.setLayoutProperty("central-valley-label", "visibility", "visible")
              }
              if (mapInstance.getLayer("central-valley-polygon")) {
                mapInstance.setLayoutProperty("central-valley-polygon", "visibility", "visible")
              }
              
              // Animate opacity from 0 to OPACITY.VISIBLE
              const duration = ANIMATION_DURATION.CAMERA
              const startTime = performance.now()
              
              const animateCVOpacity = (currentTime: number) => {
                const elapsed = currentTime - startTime
                const progress = Math.min(elapsed / duration, 1)
                const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
                const opacity = Math.max(0, Math.min(OPACITY.VISIBLE, eased * OPACITY.VISIBLE))
                
                try {
                  mapInstance.setPaintProperty("central-valley-label", "text-opacity", opacity)
                  mapInstance.setPaintProperty("central-valley-polygon", "line-opacity", opacity)
                } catch {
                  // Ignore
                }
                
                if (progress < 1) {
                  requestAnimationFrame(animateCVOpacity)
                }
              }
              
              // Start from 0 opacity
              mapInstance.setPaintProperty("central-valley-label", "text-opacity", 0)
              mapInstance.setPaintProperty("central-valley-polygon", "line-opacity", 0)
              requestAnimationFrame(animateCVOpacity)
            } catch {
              // Layers might not exist
            }
          }
        } else if (direction === "up") {
          // When scrolling up to Rivers panel, hide water layer and zoom back to Central Valley
          if (map.mapRef?.current) {
            // Zoom back to Central Valley
            map.mapRef.current.easeTo({
              center: [CENTRAL_VALLEY_VIEW.longitude, CENTRAL_VALLEY_VIEW.latitude],
              zoom: CENTRAL_VALLEY_VIEW.zoom,
              bearing: CENTRAL_VALLEY_VIEW.bearing,
              pitch: CENTRAL_VALLEY_VIEW.pitch,
              duration: ANIMATION_DURATION.CAMERA,
              easing: EASING.EASE_OUT,
            })
            
            // Hide water layer immediately
            try {
              const mapInstance = map.mapRef.current.getMap()
              if (mapInstance.getLayer("water")) {
                mapInstance.setLayoutProperty("water", "visibility", "none")
                mapInstance.setPaintProperty("water", "fill-opacity", 0)
              }
            } catch {
              // Ignore
            }
          }
        }
      },
    },

    // ==================== PANEL 6.5: Water Distribution ====================
    {
      panelId: "water-distribution-call",
      position: 6,
      debugLabel: "Panel 6.5: Water Distribution",
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
        {
          layerId: "inflow-watersheds",
          visibility: "none",
          fillOpacity: OPACITY.HIDDEN,
        },
      ],
      onEnter: () => {
        // Hide basins when entering this panel
        if (showBasinsRef.current) toggleBasinsOnRef.current?.()
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


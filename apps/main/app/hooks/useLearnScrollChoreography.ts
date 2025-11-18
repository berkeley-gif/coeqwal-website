import { useEffect, useRef } from "react"
import { useMap } from "@repo/map"
import type { MapboxMap } from "@repo/map"

/**
 * Map layer state configuration for a specific scroll position
 */
interface LayerState {
  layerId: string
  visibility?: "visible" | "none"
  opacity?: number
  textOpacity?: number
  fillOpacity?: number
  lineOpacity?: number
  lineWidth?: number
}

/**
 * Defines what map layers should look like at a specific panel
 */
interface PanelLayerState {
  /** ID of the panel element */
  panelId: string
  /** Scroll position (order matters - earlier panels = lower positions) */
  position: number
  /** Map layer states to apply when at or past this panel */
  layers: LayerState[]
  /** Optional debug label */
  debugLabel?: string
}

/**
 * Apply layer states to the map
 */
function applyLayerStates(map: MapboxMap, states: LayerState[]): void {
  console.log(`[Learn Choreography] Applying states to ${states.length} layers`)
  states.forEach((state) => {
    if (!map.getLayer(state.layerId)) {
      console.warn(`[Learn Choreography] Layer "${state.layerId}" not found`)
      return
    }

    const layer = map.getLayer(state.layerId)
    console.log(`[Learn Choreography] ✓ Updating layer "${state.layerId}" (type: ${layer?.type}):`, {
      visibility: state.visibility,
      textOpacity: state.textOpacity,
      fillOpacity: state.fillOpacity,
      lineOpacity: state.lineOpacity,
      lineWidth: state.lineWidth,
    })

    try {
      // Apply visibility
      if (state.visibility !== undefined) {
        map.setLayoutProperty(state.layerId, "visibility", state.visibility)
      }

      // Apply opacities
      if (state.textOpacity !== undefined) {
        map.setPaintProperty(state.layerId, "text-opacity", state.textOpacity)
      }
      if (state.fillOpacity !== undefined) {
        map.setPaintProperty(state.layerId, "fill-opacity", state.fillOpacity)
      }
      if (state.lineOpacity !== undefined) {
        map.setPaintProperty(state.layerId, "line-opacity", state.lineOpacity)
      }
      if (state.opacity !== undefined) {
        map.setPaintProperty(state.layerId, "opacity", state.opacity)
      }

      // Apply line width
      if (state.lineWidth !== undefined) {
        map.setPaintProperty(state.layerId, "line-width", state.lineWidth)
      }
    } catch (error) {
      console.warn(`[Learn Choreography] Error applying state to layer "${state.layerId}":`, error)
    }
  })
}

/**
 * Hook for Learn section scroll choreography
 * 
 * Progressive reveal pattern:
 * - Each panel defines what layers should be visible at that point
 * - As you scroll down, layers accumulate
 * - As you scroll back up, layers revert to previous states
 * 
 * @example
 * ```tsx
 * useLearnScrollChoreography([
 *   {
 *     panelId: "panel-1",
 *     position: 0,
 *     layers: [
 *       { layerId: "california-label", textOpacity: 1 },
 *     ],
 *   },
 *   {
 *     panelId: "panel-2",
 *     position: 1,
 *     layers: [
 *       { layerId: "california-label", textOpacity: 0 },
 *       { layerId: "central-valley-polygon", visibility: "visible", fillOpacity: 0.3 },
 *     ],
 *   },
 * ])
 * ```
 */
export function useLearnScrollChoreography(panelStates: PanelLayerState[]): void {
  const map = useMap()
  const currentPositionRef = useRef<number>(-1)
  const observersRef = useRef<IntersectionObserver[]>([])
  const panelStatesRef = useRef<PanelLayerState[]>(panelStates)

  // Update ref if panelStates change
  useEffect(() => {
    panelStatesRef.current = panelStates
  }, [panelStates])

  useEffect(() => {
    // Only set up if map is ready
    if (!map || !map.mapRef) {
      console.log("[Learn Choreography] Waiting for map...")
      return
    }

    const panels = panelStatesRef.current
    console.log("[Learn Choreography] Setting up observers for", panels.length, "panels")

    // List all available layers when setting up
    map.withMap((mapInstance) => {
      const actualMap = mapInstance.getMap()
      if (actualMap && actualMap.isStyleLoaded()) {
        const layers = actualMap.getStyle()?.layers?.map(l => l.id) || []
        console.log("[Learn Choreography] Available map layers:", layers)
      }
    })

    // Sort panels by position
    const sortedPanels = [...panels].sort((a, b) => a.position - b.position)

    // Track which panels are currently visible
    const visiblePanels = new Set<number>()

    // Create observer for each panel
    sortedPanels.forEach((panelState) => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const wasVisible = visiblePanels.has(panelState.position)
            const isVisible = entry.isIntersecting

            if (wasVisible === isVisible) return

            // Update visibility tracking
            if (isVisible) {
              visiblePanels.add(panelState.position)
            } else {
              visiblePanels.delete(panelState.position)
            }

            // Find the highest position that's visible (or just passed)
            let targetPosition = -1
            if (visiblePanels.size > 0) {
              targetPosition = Math.max(...Array.from(visiblePanels))
            } else {
              // No panels visible - use the last known position
              // If we're scrolling up past the first panel, reset to -1
              if (entry.boundingClientRect.top > 0) {
                // Panel is below viewport (scrolling up past it)
                targetPosition = panelState.position - 1
              } else {
                // Panel is above viewport (scrolling down past it)
                targetPosition = panelState.position
              }
            }

            console.log(
              `[Learn Choreography] Panel "${panelState.panelId}" intersection changed:`,
              {
                isVisible,
                wasVisible,
                panelPosition: panelState.position,
                currentPosition: currentPositionRef.current,
                targetPosition,
                visiblePanels: Array.from(visiblePanels),
                boundingTop: entry.boundingClientRect.top,
                boundingBottom: entry.boundingClientRect.bottom,
              }
            )

            // Only apply changes if position has changed
            if (targetPosition !== currentPositionRef.current) {
              console.log(
                `[Learn Choreography] 🎯 Position change: ${currentPositionRef.current} → ${targetPosition}`,
                panelState.debugLabel || panelState.panelId
              )
              currentPositionRef.current = targetPosition

              // Find the panel state for this position
              const targetPanelState = sortedPanels.find((p) => p.position === targetPosition)
              
              if (targetPanelState) {
                console.log(`[Learn Choreography] 📋 Applying ${targetPanelState.layers.length} layer states for position ${targetPosition} (${targetPanelState.debugLabel})`)
                map.withMap((mapInstance) => {
                  const actualMap = mapInstance.getMap()
                  if (!actualMap || !actualMap.isStyleLoaded()) {
                    console.log("[Learn Choreography] ⏳ Map not ready, skipping")
                    return
                  }

                  applyLayerStates(actualMap, targetPanelState.layers)
                })
              } else {
                console.warn(`[Learn Choreography] ❌ No panel state found for position ${targetPosition}`)
              }
            }
          })
        },
        {
          threshold: [0, 0.5, 1], // Multiple thresholds for better tracking
          rootMargin: "0px",
        }
      )

      observersRef.current.push(observer)

      // Wait for panel to exist, then observe
      const checkInterval = setInterval(() => {
        const panel = document.getElementById(panelState.panelId)
        if (panel) {
          observer.observe(panel)
          console.log(`[Learn Choreography] ✓ Observing: ${panelState.debugLabel || panelState.panelId}`)
          clearInterval(checkInterval)
        }
      }, 100)

      // Store interval for cleanup
      ;(observer as any)._checkInterval = checkInterval
    })

    return () => {
      observersRef.current.forEach((obs) => {
        clearInterval((obs as any)._checkInterval)
        obs.disconnect()
      })
      observersRef.current = []
      console.log("[Learn Choreography] Cleanup complete")
    }
  }, [map]) // Only depend on map, not panelStates
}


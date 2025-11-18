import { useEffect, useRef } from "react"
import { useMap } from "@repo/map"

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
export interface PanelLayerState {
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
 * Type alias for scroll choreography step - exported for convenience
 */
export type ScrollChoreographyStep = PanelLayerState

/**
 * MapContext helpers needed for applying layer states
 */
interface MapHelpers {
  hasLayer: (id: string) => boolean
  setLayoutProperty: (id: string, property: string, value: string | number) => void
  setPaintProperty: (id: string, property: string, value: string | number) => void
}

/**
 * Apply layer states to the map using MapContext helpers
 * Includes try-catch for each property to handle layer type mismatches gracefully
 */
function applyLayerStates(helpers: MapHelpers, states: LayerState[]): void {
  console.log(`[Learn Choreography] Applying states to ${states.length} layers`)
  states.forEach((state) => {
    if (!helpers.hasLayer(state.layerId)) {
      console.warn(`[Learn Choreography] Layer "${state.layerId}" not found`)
      return
    }

    console.log(`[Learn Choreography] ✓ Updating layer "${state.layerId}":`, state)

    // Apply visibility (layout property)
    if (state.visibility !== undefined) {
      try {
        helpers.setLayoutProperty(state.layerId, "visibility", state.visibility)
      } catch {
        console.warn(`[Learn Choreography] Failed to set visibility on "${state.layerId}"`)
      }
    }

    // Apply opacities (paint properties) - wrap each in try-catch to handle layer type mismatches
    // Also validate that values are not null/undefined before calling helpers
    if (state.textOpacity !== undefined && state.textOpacity !== null) {
      try {
        helpers.setPaintProperty(state.layerId, "text-opacity", state.textOpacity)
      } catch {
        console.warn(`[Learn Choreography] Layer "${state.layerId}" doesn't support text-opacity (not a symbol layer)`)
      }
    }
    if (state.fillOpacity !== undefined && state.fillOpacity !== null) {
      try {
        helpers.setPaintProperty(state.layerId, "fill-opacity", state.fillOpacity)
      } catch {
        console.warn(`[Learn Choreography] Layer "${state.layerId}" doesn't support fill-opacity (not a fill layer)`)
      }
    }
    if (state.lineOpacity !== undefined && state.lineOpacity !== null) {
      try {
        helpers.setPaintProperty(state.layerId, "line-opacity", state.lineOpacity)
      } catch {
        console.warn(`[Learn Choreography] Layer "${state.layerId}" doesn't support line-opacity (not a line layer)`)
      }
    }
    if (state.opacity !== undefined && state.opacity !== null) {
      try {
        helpers.setPaintProperty(state.layerId, "opacity", state.opacity)
      } catch {
        console.warn(`[Learn Choreography] Layer "${state.layerId}" doesn't support opacity`)
      }
    }

    // Apply line width
    if (state.lineWidth !== undefined && state.lineWidth !== null) {
      try {
        helpers.setPaintProperty(state.layerId, "line-width", state.lineWidth)
      } catch {
        console.warn(`[Learn Choreography] Layer "${state.layerId}" doesn't support line-width (not a line layer)`)
      }
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

    // Get map helpers for applying layer states
    const { hasLayer, setLayoutProperty, setPaintProperty } = map

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
                applyLayerStates({ hasLayer, setLayoutProperty, setPaintProperty }, targetPanelState.layers)
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


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
  textField?: string | unknown[]  // For changing label text (string literal or Mapbox expression array)
  textAllowOverlap?: boolean  // Override collision detection for text labels
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
  /** Optional GeoJSON source to add/show */
  geoJsonSource?: {
    id: string
    data: unknown  // GeoJSON FeatureCollection or Feature
  }
  /** Optional GeoJSON layer to add/show */
  geoJsonLayer?: {
    id: string
    type: "fill" | "line" | "symbol" | "circle"
    source: string
    paint?: Record<string, unknown>
    layout?: Record<string, unknown>
  }
}

/**
 * Type alias for scroll choreography step - exported for convenience
 */
export type ScrollChoreographyStep = PanelLayerState

/**
 * Hook for Learn section scroll choreography
 * 
 * Uses IntersectionObserver to detect when panels reach a trigger point in the viewport,
 * then applies the layer states defined in the configuration.
 * 
 * @example
 * ```tsx
 * useLearnScrollChoreography([
 *   {
 *     panelId: "panel-1",
 *     position: 0,
 *     layers: [
 *       { layerId: "california-label", visibility: "visible", textOpacity: 1 },
 *     ],
 *   },
 *   {
 *     panelId: "panel-2",
 *     position: 1,
 *     layers: [
 *       { layerId: "california-label", visibility: "none" },
 *       { layerId: "central-valley-label", visibility: "visible", textOpacity: 1 },
 *     ],
 *   },
 * ])
 * ```
 */
export function useLearnScrollChoreography(panelStates: PanelLayerState[]): void {
  const map = useMap()
  const observersRef = useRef<IntersectionObserver[]>([])
  const panelStatesRef = useRef<PanelLayerState[]>(panelStates)
  const currentPanelRef = useRef<number>(-1)
  const initializedLayersRef = useRef<Set<string>>(new Set())

  // Update ref if panelStates change
  useEffect(() => {
    panelStatesRef.current = panelStates
  }, [panelStates])

  useEffect(() => {
    // Only set up if map is ready
    if (!map || !map.mapRef) {
      return
    }

    const panels = panelStatesRef.current
    const { hasLayer, setLayoutProperty, setPaintProperty } = map

    // Sort panels by position
    const sortedPanels = [...panels].sort((a, b) => a.position - b.position)

    /**
     * Apply layer states for a given panel configuration
     */
    const applyLayerStates = (panelState: PanelLayerState) => {
      console.log(`[Choreography] Applying states for: ${panelState.debugLabel || panelState.panelId}`)
      
      panelState.layers.forEach((layerState) => {
        if (!hasLayer(layerState.layerId)) {
          console.log(`[Choreography] Layer "${layerState.layerId}" not found, skipping`)
          return
        }

        try {
          // Apply visibility
          if (layerState.visibility !== undefined) {
            setLayoutProperty(layerState.layerId, "visibility", layerState.visibility)
          }

          // Apply text-allow-overlap (one-time initialization)
          if (layerState.textAllowOverlap !== undefined) {
            const layerKey = `${layerState.layerId}-overlap`
            if (!initializedLayersRef.current.has(layerKey)) {
              setLayoutProperty(layerState.layerId, "text-allow-overlap", layerState.textAllowOverlap)
              initializedLayersRef.current.add(layerKey)
            }
          }

          // Apply opacity properties
          if (layerState.textOpacity !== undefined) {
            setPaintProperty(layerState.layerId, "text-opacity", layerState.textOpacity)
          }
          if (layerState.fillOpacity !== undefined) {
            setPaintProperty(layerState.layerId, "fill-opacity", layerState.fillOpacity)
          }
          if (layerState.lineOpacity !== undefined) {
            setPaintProperty(layerState.layerId, "line-opacity", layerState.lineOpacity)
          }

          // Apply other paint properties
          if (layerState.lineWidth !== undefined) {
            setPaintProperty(layerState.layerId, "line-width", layerState.lineWidth)
          }

          // Apply text field
          if (layerState.textField !== undefined) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setLayoutProperty(layerState.layerId, "text-field", layerState.textField as any)
          }
        } catch (error) {
          console.warn(`[Choreography] Error applying state to layer "${layerState.layerId}":`, error)
        }
      })
    }

    /**
     * Transition to a new panel state
     */
    const transitionToPanel = (targetPosition: number) => {
      if (currentPanelRef.current === targetPosition) {
        return // Already at this panel
      }

      console.log(`[Choreography] Transitioning: Panel ${currentPanelRef.current} → Panel ${targetPosition}`)
      currentPanelRef.current = targetPosition

      // Find and apply the target panel state
      const targetPanel = sortedPanels.find((p) => p.position === targetPosition)
      if (targetPanel) {
        applyLayerStates(targetPanel)
      }
    }

    // Create observer for each panel
    sortedPanels.forEach((panelState) => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const boundingRect = entry.boundingClientRect
            const viewportHeight = window.innerHeight
            const panelTop = boundingRect.top
            const panelBottom = boundingRect.bottom
            const viewportMiddle = viewportHeight / 2

            // Check if panel's top edge has crossed the middle of the viewport
            const hasCrossedMiddle = panelTop <= viewportMiddle && panelBottom > viewportMiddle

            console.log(`[Observer] ${panelState.panelId}:`, {
              isIntersecting: entry.isIntersecting,
              panelTop: Math.round(panelTop),
              panelBottom: Math.round(panelBottom),
              viewportMiddle: Math.round(viewportMiddle),
              hasCrossedMiddle,
            })

            // Trigger when panel crosses the middle OR is past the middle
            if (entry.isIntersecting && hasCrossedMiddle) {
              transitionToPanel(panelState.position)
            }
            // When scrolling back up, if this panel leaves the middle, go to previous panel
            else if (!hasCrossedMiddle && panelTop > viewportMiddle) {
              const previousPosition = panelState.position - 1
              if (previousPosition >= 0) {
                transitionToPanel(previousPosition)
              }
            }
          })
        },
        {
          threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
          rootMargin: "0px",
        }
      )

      observersRef.current.push(observer)

      // Wait for panel to exist in DOM, then observe it
      const checkInterval = setInterval(() => {
        const panelElement = document.getElementById(panelState.panelId)
        if (panelElement) {
          observer.observe(panelElement)
          clearInterval(checkInterval)
          console.log(`[Choreography] Now observing: ${panelState.panelId}`)
        }
      }, 100)

      // Store interval for cleanup
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(observer as any)._checkInterval = checkInterval
    })

    // Initialize to first panel state on mount
    const firstPanel = sortedPanels[0]
    if (firstPanel) {
      applyLayerStates(firstPanel)
      currentPanelRef.current = firstPanel.position
    }

    // Cleanup
    return () => {
      observersRef.current.forEach((obs) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        clearInterval((obs as any)._checkInterval)
        obs.disconnect()
      })
      observersRef.current = []
      // Clear initialized layers tracking
      const initializedLayers = initializedLayersRef.current
      initializedLayers.clear()
    }
  }, [map])
}

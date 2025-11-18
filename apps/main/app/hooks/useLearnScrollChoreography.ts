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
  const observersRef = useRef<IntersectionObserver[]>([])
  const panelStatesRef = useRef<PanelLayerState[]>(panelStates)

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

    // Get map helpers for applying layer states
    const { hasLayer, setLayoutProperty, setPaintProperty } = map

    // Sort panels by position
    const sortedPanels = [...panels].sort((a, b) => a.position - b.position)

    // Track intersection ratios for each panel (how much is visible)
    const panelIntersectionRatios = new Map<number, number>()

    // Helper to interpolate opacity between two panels
    const interpolateOpacity = (value: number, fromValue: number, toValue: number): number => {
      // Clamp value between 0 and 1
      const t = Math.max(0, Math.min(1, value))
      return fromValue + (toValue - fromValue) * t
    }

    // Apply smooth transitions between panels
    const applySmoothTransitions = () => {
      // Get ratios for Panel 0 and Panel 1
      const panel1Ratio = panelIntersectionRatios.get(1) || 0

      // Calculate transition progress (0 = fully Panel 0, 1 = fully Panel 1)
      // Use Panel 1's ratio as the transition progress when it's becoming visible
      const transitionProgress = panel1Ratio > 0.3 ? Math.min((panel1Ratio - 0.3) / 0.4, 1) : 0

      // Apply easing: California fades out faster (squared for acceleration)
      const californiaProgress = Math.pow(transitionProgress, 0.6) // Faster fade-out
      const centralValleyProgress = transitionProgress // Linear fade-in

      // Interpolate opacities for smooth transitions
      const californiaOpacity = interpolateOpacity(californiaProgress, 1, 0)
      const centralValleyOpacity = interpolateOpacity(centralValleyProgress, 0, 1)

      // Apply california-label opacity
      if (hasLayer("california-label")) {
        try {
          setLayoutProperty("california-label", "visibility", californiaOpacity > 0.01 ? "visible" : "none")
          if (californiaOpacity > 0.01) {
            setPaintProperty("california-label", "text-opacity", californiaOpacity)
          }
        } catch {
          // Silently ignore
        }
      }

      // Apply central-valley-label opacity
      if (hasLayer("central-valley-label")) {
        try {
          setLayoutProperty("central-valley-label", "visibility", centralValleyOpacity > 0.01 ? "visible" : "none")
          setLayoutProperty("central-valley-label", "text-allow-overlap", true)
          if (centralValleyOpacity > 0.01) {
            setPaintProperty("central-valley-label", "text-opacity", centralValleyOpacity)
          }
        } catch {
          // Silently ignore
        }
      }

      // Apply central-valley-polygon opacity
      if (hasLayer("central-valley-polygon")) {
        try {
          setLayoutProperty("central-valley-polygon", "visibility", centralValleyOpacity > 0.01 ? "visible" : "none")
          if (centralValleyOpacity > 0.01) {
            setPaintProperty("central-valley-polygon", "line-opacity", centralValleyOpacity)
            setPaintProperty("central-valley-polygon", "line-width", 2)
          }
        } catch {
          // Silently ignore
        }
      }
    }

    // Create observer for each panel
    sortedPanels.forEach((panelState) => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const intersectionRatio = entry.intersectionRatio
            
            // Update the intersection ratio for this panel
            if (intersectionRatio > 0) {
              panelIntersectionRatios.set(panelState.position, intersectionRatio)
            } else {
              panelIntersectionRatios.delete(panelState.position)
            }

            // Apply smooth transitions on every scroll update
            applySmoothTransitions()
          })
        },
        {
          threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1], // Multiple thresholds for smooth transitions
          rootMargin: "0px",
        }
      )

      observersRef.current.push(observer)

      // Wait for panel to exist, then observe
      const checkInterval = setInterval(() => {
        const panel = document.getElementById(panelState.panelId)
        if (panel) {
          observer.observe(panel)
          clearInterval(checkInterval)
        }
      }, 100)

      // Store interval for cleanup
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(observer as any)._checkInterval = checkInterval
    })

    return () => {
      observersRef.current.forEach((obs) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        clearInterval((obs as any)._checkInterval)
        obs.disconnect()
      })
      observersRef.current = []
    }
  }, [map]) // Only depend on map, not panelStates
}


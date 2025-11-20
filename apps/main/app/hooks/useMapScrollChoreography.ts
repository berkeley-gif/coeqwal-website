import { useEffect } from "react"
import { useMap } from "@repo/map"

/**
 * Configuration for a single map layer property change
 * Uses discriminated union to ensure property matches propertyType
 */
export type MapLayerAction =
  | {
      layerId: string
      propertyType: "layout"
      property: "visibility"
      value: "visible" | "none"
    }
  | {
      layerId: string
      propertyType: "paint"
      property: "text-opacity" | "fill-opacity" | "line-opacity" | "line-width"
      value: number
    }

/**
 * Configuration for a scroll-triggered map interaction
 */
export interface ScrollChoreographyStep {
  /** ID of the panel element to observe */
  panelId: string

  /** Map layer actions to apply when panel enters viewport */
  onEnter: MapLayerAction[]

  /** Map layer actions to apply when panel exits viewport */
  onExit: MapLayerAction[]

  /** IntersectionObserver threshold (default: 0.5) */
  threshold?: number

  /** IntersectionObserver rootMargin (default: "0px") */
  rootMargin?: string

  /** Optional debug label for logging */
  debugLabel?: string
}

/**
 * MapContext helpers needed for applying layer actions
 */
interface MapHelpers {
  hasLayer: (id: string) => boolean
  setLayoutProperty: (
    id: string,
    property: string,
    value: string | number,
  ) => void
  setPaintProperty: (
    id: string,
    property: string,
    value: string | number,
  ) => void
}

/**
 * Apply a single map layer action using MapContext helpers
 */
function applyMapLayerAction(
  helpers: MapHelpers,
  action: MapLayerAction,
): void {
  // Check if layer exists
  if (!helpers.hasLayer(action.layerId)) {
    console.warn(`Layer "${action.layerId}" not found`)
    return
  }

  if (action.propertyType === "layout") {
    helpers.setLayoutProperty(action.layerId, action.property, action.value)
  } else {
    helpers.setPaintProperty(action.layerId, action.property, action.value)
  }
}

/**
 * Apply multiple map layer actions using MapContext helpers
 */
function applyMapLayerActions(
  helpers: MapHelpers,
  actions: MapLayerAction[],
): void {
  actions.forEach((action) => applyMapLayerAction(helpers, action))
}

/**
 * Hook to orchestrate scroll-triggered map layer changes
 *
 * @example
 * ```tsx
 * useMapScrollChoreography([
 *   {
 *     panelId: "central-valley-importance",
 *     onEnter: [
 *       { layerId: "california-label", property: "text-opacity", propertyType: "paint", value: 0 },
 *       { layerId: "central-valley-polygon", property: "visibility", propertyType: "layout", value: "visible" },
 *     ],
 *     onExit: [
 *       { layerId: "california-label", property: "text-opacity", propertyType: "paint", value: 1 },
 *       { layerId: "central-valley-polygon", property: "visibility", propertyType: "layout", value: "none" },
 *     ],
 *   },
 * ])
 * ```
 */
export function useMapScrollChoreography(
  steps: ScrollChoreographyStep[],
): void {
  const map = useMap()

  useEffect(() => {
    // Only set up observer if map is ready
    if (!map || !map.mapRef) {
      console.log("[Scroll Choreography] Waiting for map to be ready...")
      return
    }

    console.log(
      "[Scroll Choreography] Setting up observers for panels:",
      steps.map((s) => s.panelId),
    )

    // Get map helpers for applying layer actions
    const { hasLayer, setLayoutProperty, setPaintProperty } = map

    // Track which panels are currently intersecting to avoid duplicate actions
    const intersectingPanels = new Set<string>()

    // Create separate observers for each step (to support different thresholds/margins)
    const observers: IntersectionObserver[] = []
    const intervals: NodeJS.Timeout[] = []
    const observedPanels = new Set<string>()

    steps.forEach((step) => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const wasIntersecting = intersectingPanels.has(step.panelId)
            const isIntersecting = entry.isIntersecting

            // Skip if state hasn't changed
            if (wasIntersecting === isIntersecting) {
              return
            }

            // Update tracking
            if (isIntersecting) {
              intersectingPanels.add(step.panelId)
            } else {
              intersectingPanels.delete(step.panelId)
            }

            // Apply the appropriate actions
            const actions = isIntersecting ? step.onEnter : step.onExit

            console.log(
              `[Scroll Choreography] ${step.debugLabel || step.panelId}: ${isIntersecting ? "ENTER" : "EXIT"} - ${actions.length} actions`,
            )

            if (actions.length > 0) {
              applyMapLayerActions(
                { hasLayer, setLayoutProperty, setPaintProperty },
                actions,
              )
            }
          })
        },
        {
          threshold: step.threshold ?? 0.5,
          rootMargin: step.rootMargin ?? "0px",
        },
      )

      observers.push(observer)

      // Wait for panel to exist, then observe
      const checkPanel = setInterval(() => {
        if (observedPanels.has(step.panelId)) {
          clearInterval(checkPanel)
          return
        }

        const panel = document.getElementById(step.panelId)
        if (panel) {
          observer.observe(panel)
          observedPanels.add(step.panelId)
          console.log(
            `[Scroll Choreography] ✓ Observing panel: ${step.panelId} (threshold: ${step.threshold ?? 0.5}, margin: ${step.rootMargin ?? "0px"})`,
          )
          clearInterval(checkPanel)
        }
      }, 100)

      intervals.push(checkPanel)
    })

    return () => {
      intervals.forEach((interval) => clearInterval(interval))
      observers.forEach((obs) => obs.disconnect())
      console.log("[Scroll Choreography] Cleanup complete")
    }
  }, [map, steps])
}

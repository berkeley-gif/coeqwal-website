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
  textField?: string | unknown[]
  textAllowOverlap?: boolean
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
    data: unknown
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
 * Type alias for scroll choreography step
 */
export type ScrollChoreographyStep = PanelLayerState

/**
 * Hook for Learn section scroll choreography
 * 
 * Simple system: Each panel triggers when its top edge crosses viewport middle
 */
export function useLearnScrollChoreography(panelStates: PanelLayerState[]): void {
  const map = useMap()
  const observersRef = useRef<IntersectionObserver[]>([])
  const currentPanelRef = useRef<number>(0)
  const initializedRef = useRef<boolean>(false)

  useEffect(() => {
    // Wait for map operations to be available
    if (!map || !map.hasLayer || !map.addSource || !map.addLayer) {
      console.log('[Choreography] Map operations not yet available')
      return
    }

    // Only initialize once
    if (initializedRef.current) return
    initializedRef.current = true

    console.log('[Choreography] Initializing choreography for', panelStates.length, 'panels')

    const { hasLayer, setLayoutProperty, setPaintProperty, addSource, addLayer } = map
    const sortedPanels = [...panelStates].sort((a, b) => a.position - b.position)

    // Initialize GeoJSON sources and layers
    sortedPanels.forEach((panel) => {
      if (panel.geoJsonSource && panel.geoJsonLayer) {
        const { geoJsonSource, geoJsonLayer } = panel

        console.log(`[Choreography] Adding GeoJSON source: ${geoJsonSource.id}`)
        addSource(geoJsonSource.id, {
          type: "geojson",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data: geoJsonSource.data as any,
        })

        console.log(`[Choreography] Adding GeoJSON layer: ${geoJsonLayer.id}`)
        addLayer(
          geoJsonLayer.id,
          geoJsonLayer.source,
          geoJsonLayer.type,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          geoJsonLayer.paint as any || {},
          { ...geoJsonLayer.layout, visibility: "none" },
        )
      }
    })

    /**
     * Apply layer states for a given panel configuration
     */
    const applyPanelState = (panelState: PanelLayerState) => {
      console.log(`[Choreography] Applying Panel ${panelState.position}: ${panelState.debugLabel}`)

      panelState.layers.forEach((layerState) => {
        if (!hasLayer(layerState.layerId)) {
          return
        }

        try {
          // Apply visibility
          if (layerState.visibility !== undefined) {
            setLayoutProperty(layerState.layerId, "visibility", layerState.visibility)
          }

          // Apply text-allow-overlap
          if (layerState.textAllowOverlap !== undefined) {
            setLayoutProperty(layerState.layerId, "text-allow-overlap", layerState.textAllowOverlap)
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

          // Apply other properties
          if (layerState.lineWidth !== undefined) {
            setPaintProperty(layerState.layerId, "line-width", layerState.lineWidth)
          }
        } catch (error) {
          console.warn(`[Choreography] Error applying layer "${layerState.layerId}":`, error)
        }
      })
    }

    /**
     * Transition to a new panel
     */
    const transitionToPanel = (targetPosition: number) => {
      if (currentPanelRef.current === targetPosition) return

      console.log(`[Choreography] Transition: Panel ${currentPanelRef.current} → ${targetPosition}`)
      currentPanelRef.current = targetPosition

      const targetPanel = sortedPanels.find((p) => p.position === targetPosition)
      if (targetPanel) {
        applyPanelState(targetPanel)
      }
    }

    // Create observers for each panel
    sortedPanels.forEach((panelState) => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const rect = entry.boundingClientRect
            const viewportMiddle = window.innerHeight / 2
            
            // Check if panel's top has crossed the viewport middle
            const topHasCrossedMiddle = rect.top <= viewportMiddle && rect.bottom > viewportMiddle

            if (entry.isIntersecting && topHasCrossedMiddle) {
              // Panel has reached the middle going down
              transitionToPanel(panelState.position)
            } else if (rect.top > viewportMiddle && currentPanelRef.current === panelState.position) {
              // Panel is leaving the middle going up - go to previous panel
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

      // Wait for panel element to exist in DOM
      const checkInterval = setInterval(() => {
        const panelElement = document.getElementById(panelState.panelId)
        if (panelElement) {
          observer.observe(panelElement)
          clearInterval(checkInterval)
          console.log(`[Choreography] Observing: ${panelState.panelId}`)
        }
      }, 100)

      // Store interval for cleanup
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(observer as any)._checkInterval = checkInterval
    })

    // Initialize to first panel (Panel 0)
    const firstPanel = sortedPanels[0]
    if (firstPanel) {
      applyPanelState(firstPanel)
    }

    // Cleanup
    return () => {
      console.log('[Choreography] Cleaning up')
      observersRef.current.forEach((obs) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        clearInterval((obs as any)._checkInterval)
        obs.disconnect()
      })
      observersRef.current = []
      initializedRef.current = false
    }
  }, [map, panelStates])
}

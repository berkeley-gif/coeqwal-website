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
  /** Optional callback when entering this panel */
  onEnter?: () => void
  /** Optional callback when exiting this panel */
  onExit?: () => void
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

    const { hasLayer, setLayoutProperty, setPaintProperty } = map
    const sortedPanels = [...panelStates].sort((a, b) => a.position - b.position)

    // Build master list of ALL layers mentioned across all panels
    const allLayerIds = new Set<string>()
    sortedPanels.forEach(panel => {
      panel.layers.forEach(layer => allLayerIds.add(layer.layerId))
    })

    /**
     * Apply layer states for a given panel configuration
     * Strategy: Apply all layer states directly for smooth transitions
     */
    const applyPanelState = (panelState: PanelLayerState) => {
      // Apply layer states - this will hide/show layers as specified in the config
      panelState.layers.forEach((layerState) => {
        if (!hasLayer(layerState.layerId)) {
          return
        }

        try {
          // Apply visibility first for instant swap
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

      const previousPosition = currentPanelRef.current
      const targetPanel = sortedPanels.find((p) => p.position === targetPosition)
      
      console.log(`[Choreography] ${previousPosition} → ${targetPosition}${targetPanel ? ` (${targetPanel.debugLabel})` : ''}`)

      // Call onExit for the previous panel
      if (previousPosition >= 0) {
        const previousPanel = sortedPanels.find((p) => p.position === previousPosition)
        previousPanel?.onExit?.()
      }

      currentPanelRef.current = targetPosition

      // Apply the new panel state
      if (targetPanel) {
        applyPanelState(targetPanel)
        targetPanel.onEnter?.()
      }
    }

    /**
     * Determine which panel should be active based on all panel positions
     */
    const determineActivePanel = () => {
      const viewportMiddle = window.innerHeight / 2
      let activePanel = 0 // Default to first panel

      // Check each panel to see which one the middle line is in
      for (let i = sortedPanels.length - 1; i >= 0; i--) {
        const panel = sortedPanels[i]
        if (!panel) continue

        const panelElement = document.getElementById(panel.panelId)
        if (!panelElement) continue

        const rect = panelElement.getBoundingClientRect()
        
        // If the viewport middle is within this panel's bounds, this is the active panel
        if (rect.top <= viewportMiddle && rect.bottom > viewportMiddle) {
          activePanel = panel.position
          break
        }
      }

      return activePanel
    }

    // Create observers for each panel
    sortedPanels.forEach((panelState) => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(() => {
            // On any intersection change, re-evaluate which panel should be active
            const activePanel = determineActivePanel()
            if (activePanel !== currentPanelRef.current) {
              transitionToPanel(activePanel)
            }
          })
        },
        {
          threshold: [0, 0.25, 0.5, 0.75, 1.0], // Fewer callbacks, smoother performance
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

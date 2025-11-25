import { useEffect, useRef } from "react"
import { useMap } from "@repo/map"

type OpacityProp = "fill-opacity" | "line-opacity" | "text-opacity"

/**
 * Map layer state configuration for a specific scroll position
 */
interface LayerState {
  layerId: string
  visibility?: "visible" | "none"
  opacity?: number // not used directly but kept for future
  textOpacity?: number
  fillOpacity?: number
  lineOpacity?: number
  lineWidth?: number
  lineJoin?: "bevel" | "round" | "miter"
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
  /** Optional array of GeoJSON sources (for multiple sources) */
  geoJsonSources?: Array<{
    id: string
    data: unknown
  }>
  /** Optional array of GeoJSON layers (for multiple layers) */
  geoJsonLayers?: Array<{
    id: string
    type: "fill" | "line" | "symbol" | "circle"
    source: string
    paint?: Record<string, unknown>
    layout?: Record<string, unknown>
  }>
  /** Optional callback when entering this panel */
  onEnter?: (direction?: "up" | "down") => void
  /** Optional callback when exiting this panel */
  onExit?: (direction?: "up" | "down") => void
  /** Optional callback for scroll progress through the panel (0 = top entering viewport, 1 = bottom leaving viewport) */
  onScroll?: (progress: number) => void
}

/**
 * Type alias for scroll choreography step
 */
export type ScrollChoreographyStep = PanelLayerState

const DEFAULT_FADE_DURATION = 600 // ms

/**
 * Hook for Learn section scroll choreography
 *
 * System: Each panel triggers when its top edge crosses 85% down the viewport
 * (animations start early when panels first appear from the bottom)
 */
export function useLearnScrollChoreography(
  panelStates: PanelLayerState[],
  onPanelChange?: (panelId: string) => void,
): void {
  const map = useMap()
  const observersRef = useRef<IntersectionObserver[]>([])
  const currentPanelRef = useRef<number>(0)
  const initializedRef = useRef<boolean>(false)
  const isInitialLoadRef = useRef<boolean>(true)

  // Track the last opacity we set per layer + property
  const opacityStateRef = useRef<
    Record<string, Partial<Record<OpacityProp, number>>>
  >({})

  useEffect(() => {
    // Wait for map operations to be available
    if (!map || !map.hasLayer || !map.addSource || !map.addLayer) {
      return
    }

    // Only initialize once for this map + panelStates combo
    if (initializedRef.current) return
    initializedRef.current = true

    const {
      hasLayer,
      setLayoutProperty,
      setPaintProperty,
      addSource,
      addLayer,
    } = map
    const sortedPanels = [...panelStates].sort(
      (a, b) => a.position - b.position,
    )

    // Small helper: animate opacity locally (no getPaintProperty, no .value)
    const animateOpacity = (
      layerId: string,
      prop: OpacityProp,
      target: number,
      duration: number = DEFAULT_FADE_DURATION,
    ) => {
      let startValue = opacityStateRef.current[layerId]?.[prop]

      if (typeof startValue !== "number" || Number.isNaN(startValue)) {
        // Heuristic: if target > 0, fade in from 0; if target === 0, fade out from 1
        startValue = target > 0 ? 0 : 1
      }

      const startTime = performance.now()
      const delta = target - startValue

      const step = (now: number) => {
        const t = Math.min((now - startTime) / duration, 1)
        const eased = 1 - Math.pow(1 - t, 3) // easeOutCubic
        const rawValue = startValue + delta * eased
        // Clamp to [0, 1] to avoid floating-point precision errors
        const value = Math.max(0, Math.min(1, rawValue))

        try {
          setPaintProperty(layerId, prop, value)
          opacityStateRef.current[layerId] = {
            ...opacityStateRef.current[layerId],
            [prop]: value,
          }
        } catch (err) {
          console.warn(
            `[Choreography] Failed to animate ${prop} on '${layerId}':`,
            err,
          )
          return
        }

        if (t < 1) {
          requestAnimationFrame(step)
        }
      }

      requestAnimationFrame(step)
    }

    // Build master list of ALL GeoJSON layers mentioned across all panels
    const allGeoJsonLayerIds = new Set<string>()

    sortedPanels.forEach((panel) => {
      if (panel.geoJsonLayer) {
        allGeoJsonLayerIds.add(panel.geoJsonLayer.id)
      }

      if (panel.geoJsonLayers) {
        panel.geoJsonLayers.forEach((layer) => allGeoJsonLayerIds.add(layer.id))
      }
    })

    // Initialize all GeoJSON sources and layers
    sortedPanels.forEach((panel) => {
      // Single source/layer (backwards compatibility - for basins)
      if (panel.geoJsonSource && panel.geoJsonLayer) {
        const { geoJsonSource, geoJsonLayer } = panel

        try {
          addSource(geoJsonSource.id, {
            type: "geojson",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data: geoJsonSource.data as any,
          })
        } catch {
          // Source already exists, continue
        }

        if (!hasLayer(geoJsonLayer.id)) {
          addLayer(
            geoJsonLayer.id,
            geoJsonLayer.source,
            geoJsonLayer.type,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (geoJsonLayer.paint as any) || {},
            { ...geoJsonLayer.layout, visibility: "none" },
          )
        }
      }

      // Multiple sources/layers (for rivers, etc.)
      if (panel.geoJsonSources && panel.geoJsonLayers) {
        panel.geoJsonSources.forEach((source) => {
          try {
            addSource(source.id, {
              type: "geojson",
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              data: source.data as any,
            })
          } catch {
            // Source already exists, continue
          }
        })

        panel.geoJsonLayers.forEach((layer) => {
          if (!hasLayer(layer.id)) {
            addLayer(
              layer.id,
              layer.source,
              layer.type,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (layer.paint as any) || {},
              { ...layer.layout, visibility: "none" },
            )
          }
        })
      }
    })

    /**
     * Apply layer states for a given panel configuration
     */
    const applyPanelState = (panelState: PanelLayerState) => {
      // Step 1: Hide all GeoJSON layers first
      allGeoJsonLayerIds.forEach((layerId) => {
        try {
          setLayoutProperty(layerId, "visibility", "none")
        } catch {
          // Silently ignore - layer might not exist yet
        }
      })

      // Step 2: Apply layer states for regular map layers
      panelState.layers.forEach((layerState) => {
        const layerId = layerState.layerId

        if (!hasLayer(layerId)) {
          return
        }

        try {
          const wantsVisible = layerState.visibility === "visible"
          const wantsHidden = layerState.visibility === "none"

          // Make it visible before animating opacity in
          if (wantsVisible) {
            setLayoutProperty(layerId, "visibility", "visible")
          }

          // text-allow-overlap
          if (layerState.textAllowOverlap !== undefined) {
            setLayoutProperty(
              layerId,
              "text-allow-overlap",
              layerState.textAllowOverlap,
            )
          }

          // Opacity properties — use animation so transitions are smooth
          const hasTextOpacity = layerState.textOpacity !== undefined
          const hasFillOpacity = layerState.fillOpacity !== undefined
          const hasLineOpacity = layerState.lineOpacity !== undefined

          if (hasTextOpacity) {
            animateOpacity(
              layerId,
              "text-opacity",
              layerState.textOpacity as number,
            )
          }
          if (hasFillOpacity) {
            animateOpacity(
              layerId,
              "fill-opacity",
              layerState.fillOpacity as number,
            )
          }
          if (hasLineOpacity) {
            animateOpacity(
              layerId,
              "line-opacity",
              layerState.lineOpacity as number,
            )
          }

          // Non-animated paint props
          if (layerState.lineWidth !== undefined) {
            setPaintProperty(layerId, "line-width", layerState.lineWidth)
          }

          // Layout props
          if (layerState.lineJoin !== undefined) {
            setLayoutProperty(layerId, "line-join", layerState.lineJoin)
          }

          // If a layer should end up hidden *and* we animated opacity,
          // hide it after the fade completes. Otherwise hide immediately.
          if (
            wantsHidden &&
            (hasTextOpacity || hasFillOpacity || hasLineOpacity)
          ) {
            setTimeout(() => {
              try {
                setLayoutProperty(layerId, "visibility", "none")
              } catch (err) {
                console.warn(
                  `[Choreography] Error hiding layer '${layerId}' after fade:`,
                  err,
                )
              }
            }, DEFAULT_FADE_DURATION)
          } else if (wantsHidden) {
            setLayoutProperty(layerId, "visibility", "none")
          }
        } catch (error) {
          console.warn(
            `[Choreography] Error applying layer "${layerState.layerId}":`,
            error,
          )
        }
      })

      // Step 3: Show GeoJSON layers for this panel
      if (panelState.geoJsonLayer) {
        const layerId = panelState.geoJsonLayer.id
        try {
          setLayoutProperty(layerId, "visibility", "visible")
        } catch (error) {
          console.warn(
            `[Choreography] Error showing GeoJSON layer "${layerId}":`,
            error,
          )
        }
      }

      if (panelState.geoJsonLayers) {
        panelState.geoJsonLayers.forEach((layerConfig) => {
          try {
            setLayoutProperty(layerConfig.id, "visibility", "visible")
          } catch (error) {
            console.warn(
              `[Choreography] Error showing GeoJSON layer "${layerConfig.id}":`,
              error,
            )
          }
        })
      }
    }

    /**
     * Transition to a new panel
     */
    const transitionToPanel = (targetPosition: number) => {
      if (currentPanelRef.current === targetPosition) return

      const previousPosition = currentPanelRef.current
      const targetPanel = sortedPanels.find(
        (p) => p.position === targetPosition,
      )

      // Determine scroll direction
      const direction: "up" | "down" = targetPosition > previousPosition ? "down" : "up"

      // Call onExit for the previous panel (but not on initial load)
      if (previousPosition >= 0 && !isInitialLoadRef.current) {
        const previousPanel = sortedPanels.find(
          (p) => p.position === previousPosition,
        )
        previousPanel?.onExit?.(direction)
      }

      currentPanelRef.current = targetPosition

      if (targetPanel) {
        applyPanelState(targetPanel)
        
        // Don't trigger callbacks during initial load period
        if (!isInitialLoadRef.current) {
          onPanelChange?.(targetPanel.panelId)
          targetPanel.onEnter?.(direction)
        }
      }
    }

    /**
     * Determine which panel should be active based on all panel positions
     */
    const determineActivePanel = () => {
      // Trigger point at 85% down the viewport (so animations start very early when panel appears)
      const triggerPoint = window.innerHeight * 0.85
      let activePanel = 0 // Default to first panel

      for (let i = sortedPanels.length - 1; i >= 0; i--) {
        const panel = sortedPanels[i]
        if (!panel) continue

        const panelElement = document.getElementById(panel.panelId)
        if (!panelElement) continue

        const rect = panelElement.getBoundingClientRect()

        // Panel becomes active when its top edge crosses the trigger point
        // Keep active as long as any part of panel is still visible (prevents gaps)
        if (rect.top <= triggerPoint && rect.bottom > 0) {
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
            const activePanel = determineActivePanel()
            if (activePanel !== currentPanelRef.current) {
              transitionToPanel(activePanel)
            }
          })
        },
        {
          threshold: [0, 0.25, 0.5, 0.75, 1.0],
          rootMargin: "0px",
        },
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

    // Add continuous scroll listener for smooth onScroll updates
    let scrollTicking = false
    
    const updateScrollProgress = () => {
      sortedPanels.forEach((panelState) => {
        if (panelState.onScroll) {
          const panelElement = document.getElementById(panelState.panelId)
          if (panelElement) {
            const rect = panelElement.getBoundingClientRect()
            const viewportHeight = window.innerHeight
            
            // Only calculate if panel is near/in viewport (optimization)
            if (rect.bottom > 0 && rect.top < viewportHeight) {
              // Progress: 0 when panel top is at bottom of viewport, 1 when panel bottom is at top of viewport
              const progress = Math.max(
                0,
                Math.min(
                  1,
                  (viewportHeight - rect.top) / (viewportHeight + rect.height)
                )
              )
              
              panelState.onScroll(progress)
            }
          }
        }
      })
      scrollTicking = false
    }
    
    const handleScroll = () => {
      if (!scrollTicking) {
        requestAnimationFrame(updateScrollProgress)
        scrollTicking = true
      }
    }

    // Attach scroll listener with passive flag for better performance
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    // Call updateScrollProgress initially to set correct progress on load
    updateScrollProgress()

    // Initialize to first panel
    const firstPanel = sortedPanels[0]
    if (firstPanel) {
      applyPanelState(firstPanel)
    }

    // Mark initial load as complete after a short delay to allow page to settle
    setTimeout(() => {
      isInitialLoadRef.current = false
    }, 500)

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll)
      observersRef.current.forEach((obs) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        clearInterval((obs as any)._checkInterval)
        obs.disconnect()
      })
      observersRef.current = []
      initializedRef.current = false
      isInitialLoadRef.current = true // Reset for next mount
    }
  }, [map, panelStates, onPanelChange])
}
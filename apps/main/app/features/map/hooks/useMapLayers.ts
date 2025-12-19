/**
 * useMapLayers Hook
 *
 * Applies native Mapbox layer visibility based on the active section.
 * Uses SECTION_LAYERS as the single source of truth.
 *
 * This hook handles ONLY the native Mapbox layers defined in the map style:
 * - california-label
 * - central-valley-polygon, central-valley-polygon-halo, central-valley-label
 * - inflow-watersheds
 *
 * React component layers (BasinsLayer, RiversLayer, BasinInflowArrows) are
 * controlled via props from CaliforniaMapPanel using derived selectors.
 */

"use client"

import { useEffect, useRef, useCallback } from "react"
import { useMap } from "@repo/map"
import {
  useActiveSection,
  useRiversProgress,
  useShowInflowWatersheds,
  useMapReady,
  useMapMode,
  SECTION_LAYERS,
  type SectionId,
} from "../store"
import { coordinator } from "../choreography/animationCoordinator"
import { ANIMATION_DURATION } from "../choreography/scrollChoreographyConstants"

// ============================================================================
// Layer Definitions
// ============================================================================

/**
 * Mapbox layer specification: layer ID + opacity property + target opacity
 */
interface LayerSpec {
  id: string
  opacityProp: "text-opacity" | "fill-opacity" | "line-opacity"
  targetOpacity: number
}

/**
 * Native Mapbox layer groups.
 * Each group maps to a boolean in SectionLayerConfig.
 */
const LAYER_GROUPS: Record<string, LayerSpec[]> = {
  californiaLabel: [
    { id: "california-label", opacityProp: "text-opacity", targetOpacity: 0.9 },
  ],
  centralValley: [
    {
      id: "central-valley-polygon",
      opacityProp: "line-opacity",
      targetOpacity: 0.9,
    },
    {
      id: "central-valley-polygon-halo",
      opacityProp: "line-opacity",
      targetOpacity: 0.9,
    },
    {
      id: "central-valley-label",
      opacityProp: "text-opacity",
      targetOpacity: 0.9,
    },
  ],
  inflowWatersheds: [
    {
      id: "inflow-watersheds",
      opacityProp: "fill-opacity",
      targetOpacity: 0.4,
    },
  ],
}

const FADE_DURATION = ANIMATION_DURATION.LAYER_FADE
const LAYER_ANIMATION_PREFIX = "layer-"

// ============================================================================
// Hook
// ============================================================================

export function useMapLayers() {
  const map = useMap()
  const activeSection = useActiveSection()
  const riversProgress = useRiversProgress()
  const showInflowWatersheds = useShowInflowWatersheds()
  const mapReady = useMapReady() // Use global Zustand state
  const mapMode = useMapMode() // Track which mode the map is in

  const prevSectionRef = useRef<SectionId | null>(null)
  const initializedRef = useRef(false)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      coordinator.cancelGroup(LAYER_ANIMATION_PREFIX)
    }
  }, [])

  /**
   * Apply layer visibility with optional animation
   */
  const applyLayer = useCallback(
    (spec: LayerSpec, visible: boolean, immediate = false) => {
      const mapInstance = coordinator.getValidMap(map.mapRef)
      if (!mapInstance) return

      try {
        if (!mapInstance.getLayer(spec.id)) return

        const endOpacity = visible ? spec.targetOpacity : 0

        if (immediate) {
          mapInstance.setLayoutProperty(
            spec.id,
            "visibility",
            visible ? "visible" : "none",
          )
          mapInstance.setPaintProperty(spec.id, spec.opacityProp, endOpacity)
          return
        }

        // Make visible before animating in
        if (visible) {
          mapInstance.setLayoutProperty(spec.id, "visibility", "visible")
        }

        const startOpacity =
          (mapInstance.getPaintProperty(spec.id, spec.opacityProp) as number) ??
          0

        // Skip if already at target
        if (Math.abs(startOpacity - endOpacity) < 0.01) {
          if (!visible) {
            mapInstance.setLayoutProperty(spec.id, "visibility", "none")
          }
          return
        }

        // Animate
        const animationId = `${LAYER_ANIMATION_PREFIX}${spec.id}`
        coordinator.start(
          animationId,
          (_now, elapsed) => {
            const currentMap = coordinator.getValidMap(map.mapRef)
            if (!currentMap || !coordinator.hasLayer(map.mapRef, spec.id)) {
              return false
            }

            const progress = Math.min(elapsed / FADE_DURATION, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            // Clamp opacity to valid range [0, targetOpacity] to prevent floating point errors
            const rawOpacity =
              startOpacity + (endOpacity - startOpacity) * eased
            const opacity = Math.max(
              0,
              Math.min(spec.targetOpacity, rawOpacity),
            )

            try {
              currentMap.setPaintProperty(spec.id, spec.opacityProp, opacity)
            } catch {
              return false
            }

            return progress < 1
          },
          {
            duration: FADE_DURATION,
            onComplete: () => {
              if (!visible) {
                const currentMap = coordinator.getValidMap(map.mapRef)
                if (currentMap && coordinator.hasLayer(map.mapRef, spec.id)) {
                  currentMap.setLayoutProperty(spec.id, "visibility", "none")
                }
              }
            },
          },
        )
      } catch {
        // Layer might not exist
      }
    },
    [map.mapRef],
  )

  /**
   * Apply a layer group (show/hide all layers in the group)
   */
  const applyLayerGroup = useCallback(
    (groupKey: string, visible: boolean, immediate = false) => {
      const specs = LAYER_GROUPS[groupKey]
      if (!specs) return
      specs.forEach((spec) => applyLayer(spec, visible, immediate))
    },
    [applyLayer],
  )

  // Main effect: apply layer visibility when section changes
  useEffect(() => {
    if (!mapReady) return

    const mapInstance = coordinator.getValidMap(map.mapRef)
    if (!mapInstance) return

    coordinator.cancelGroup(LAYER_ANIMATION_PREFIX)

    // Hide all native layers when not in Learn mode
    if (mapMode !== "learn") {
      Object.keys(LAYER_GROUPS).forEach((groupKey) => {
        applyLayerGroup(groupKey, false, true) // immediate hide
      })
      return
    }

    const currentConfig = SECTION_LAYERS[activeSection]
    const prevSection = prevSectionRef.current
    const isFirstRun = !initializedRef.current

    // Configure label layers for Globe projection on first run
    if (isFirstRun) {
      const labelLayers = ["california-label", "central-valley-label"]
      labelLayers.forEach((layerId) => {
        try {
          if (mapInstance.getLayer(layerId)) {
            mapInstance.setLayoutProperty(layerId, "text-allow-overlap", true)
            mapInstance.setLayoutProperty(
              layerId,
              "text-ignore-placement",
              true,
            )
            mapInstance.setLayoutProperty(layerId, "symbol-avoid-edges", false)
          }
        } catch {
          // Layer might not exist
        }
      })
      initializedRef.current = true
    }

    // ALWAYS apply ALL layer groups to their correct state
    Object.keys(LAYER_GROUPS).forEach((groupKey) => {
      // Skip inflowWatersheds when entering rivers section - the rivers progress effect handles it
      if (groupKey === "inflowWatersheds" && activeSection === "rivers") {
        return
      }

      const shouldBeVisible =
        !!currentConfig[groupKey as keyof typeof currentConfig]

      // On first run: set immediately (no animation)
      // On section change: animate the transition
      if (isFirstRun) {
        applyLayerGroup(groupKey, shouldBeVisible, true) // immediate
      } else if (prevSection !== activeSection) {
        applyLayerGroup(groupKey, shouldBeVisible, false) // animate
      }
    })

    prevSectionRef.current = activeSection
  }, [activeSection, map.mapRef, applyLayerGroup, mapReady, mapMode])

  // Rivers section: fade out inflow watersheds as rivers animate
  useEffect(() => {
    if (!mapReady || activeSection !== "rivers") return

    const mapInstance = coordinator.getValidMap(map.mapRef)
    if (!mapInstance) return

    // Fade from 30% to 60% of rivers progress
    const fadeStart = 0.3
    const fadeEnd = 0.6
    const fadeProgress = Math.max(
      0,
      Math.min(1, (riversProgress - fadeStart) / (fadeEnd - fadeStart)),
    )

    try {
      if (mapInstance.getLayer("inflow-watersheds")) {
        // Clamp opacity to valid range [0, 0.4]
        const opacity = Math.max(0, Math.min(0.4, 0.4 * (1 - fadeProgress)))
        mapInstance.setPaintProperty(
          "inflow-watersheds",
          "fill-opacity",
          opacity,
        )
      }
    } catch {
      // Layer might not exist
    }
  }, [activeSection, riversProgress, map.mapRef, mapReady])

  // Restore inflow-watersheds when leaving rivers section
  useEffect(() => {
    if (!mapReady) return
    if (activeSection === "rivers") return

    // If inflow-watersheds should be visible but we just left rivers
    if (showInflowWatersheds) {
      const mapInstance = coordinator.getValidMap(map.mapRef)
      if (!mapInstance) return

      try {
        if (mapInstance.getLayer("inflow-watersheds")) {
          mapInstance.setLayoutProperty(
            "inflow-watersheds",
            "visibility",
            "visible",
          )
          mapInstance.setPaintProperty("inflow-watersheds", "fill-opacity", 0.4)
        }
      } catch {
        // Layer might not exist
      }
    }
  }, [activeSection, showInflowWatersheds, map.mapRef, mapReady])

  // Hide delta-water layer when leaving the delta section
  // (The delta-water layer is shown by DeltaInfoPanel when user clicks to zoom to delta)
  useEffect(() => {
    if (!mapReady) return
    if (activeSection === "delta") return // Still in delta, don't hide

    const mapInstance = coordinator.getValidMap(map.mapRef)
    if (!mapInstance) return

    // Hide delta-water layer (new Mapbox tileset layer)
    try {
      if (mapInstance.getLayer("delta-water")) {
        // Fade out and hide
        const rawOpacity =
          (mapInstance.getPaintProperty("delta-water", "fill-opacity") as number) ?? 0
        const startOpacity = Math.max(0, Math.min(1, rawOpacity))

        // Only fade out if currently visible
        if (startOpacity > 0.01) {
          const duration = FADE_DURATION
          const startTime = performance.now()

          const fadeOut = (currentTime: number) => {
            const elapsed = currentTime - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            const opacity = Math.max(0, Math.min(1, startOpacity * (1 - eased)))

            try {
              mapInstance.setPaintProperty("delta-water", "fill-opacity", opacity)
            } catch {
              return
            }

            if (progress < 1) {
              requestAnimationFrame(fadeOut)
            } else {
              mapInstance.setLayoutProperty("delta-water", "visibility", "none")
            }
          }

          requestAnimationFrame(fadeOut)
        }
      }
    } catch {
      // Layer might not exist
    }

    // Also hide legacy "water" layer if it exists (backward compatibility)
    try {
      if (mapInstance.getLayer("water")) {
        const rawOpacity =
          (mapInstance.getPaintProperty("water", "fill-opacity") as number) ?? 0
        const startOpacity = Math.max(0, Math.min(1, rawOpacity))

        if (startOpacity > 0.01) {
          const duration = FADE_DURATION
          const startTime = performance.now()

          const fadeOut = (currentTime: number) => {
            const elapsed = currentTime - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            const opacity = Math.max(0, Math.min(1, startOpacity * (1 - eased)))

            try {
              mapInstance.setPaintProperty("water", "fill-opacity", opacity)
            } catch {
              return
            }

            if (progress < 1) {
              requestAnimationFrame(fadeOut)
            } else {
              mapInstance.setLayoutProperty("water", "visibility", "none")
            }
          }

          requestAnimationFrame(fadeOut)
        }
      }
    } catch {
      // Layer might not exist
    }
  }, [activeSection, map.mapRef, mapReady])

  return {
    activeSection,
    riversProgress,
  }
}

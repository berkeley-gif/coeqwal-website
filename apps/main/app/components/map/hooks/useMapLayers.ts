/**
 * useMapLayers Hook
 *
 * Applies layer visibility based on the active section.
 * Uses centralized AnimationCoordinator for (hopefully robust) animation management.
 */

"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { useMap } from "@repo/map"
import {
  useActiveSection,
  useRiversProgress,
  SECTION_LAYERS,
  learnMapActions,
  type SectionId,
} from "../store"
import { coordinator } from "../choreography/animationCoordinator"
import { ANIMATION_DURATION } from "../choreography/scrollChoreographyConstants"

// Mapbox layer IDs
const LAYERS = {
  californiaLabel: "california-label",
  centralValleyPolygon: "central-valley-polygon",
  centralValleyPolygonHalo: "central-valley-polygon-halo",
  centralValleyLabel: "central-valley-label",
  inflowWatersheds: "inflow-watersheds",
  water: "water",
} as const

// Use centralized animation duration for layer fades
const FADE_DURATION = ANIMATION_DURATION.LAYER_FADE

// Animation ID prefix for layer animations
const LAYER_ANIMATION_PREFIX = "layer-"

export function useMapLayers() {
  const map = useMap()
  const activeSection = useActiveSection()
  const riversProgress = useRiversProgress()

  // State to trigger re-render when map is ready
  const [mapReady, setMapReady] = useState(false)

  // Track previous section for transition animations
  const prevSectionRef = useRef<SectionId | null>(null)
  const mapReadyRef = useRef(false)

  // Cleanup on unmount - cancel all layer animations
  useEffect(() => {
    return () => {
      coordinator.cancelGroup(LAYER_ANIMATION_PREFIX)
    }
  }, [])

  // Poll for map to be ready
  useEffect(() => {
    if (mapReady) return

    const checkMap = () => {
      const mapInstance = coordinator.getValidMap(map.mapRef)
      if (mapInstance) {
        console.log("[useMapLayers] Map instance found!")
        if (mapInstance.isStyleLoaded()) {
          console.log("[useMapLayers] Style already loaded")
          setMapReady(true)
        } else {
          console.log("[useMapLayers] Waiting for style.load")
          mapInstance.once("style.load", () => {
            console.log("[useMapLayers] Style loaded!")
            setMapReady(true)
          })
        }
        return true
      }
      return false
    }

    // Try immediately
    if (checkMap()) return

    // Poll until map is available
    const interval = setInterval(() => {
      if (checkMap()) {
        clearInterval(interval)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [map.mapRef, mapReady])

  // Helper to apply layer with animation using coordinator
  const applyLayer = useCallback(
    (
      layerId: string,
      visible: boolean,
      opacityProp: "text-opacity" | "fill-opacity" | "line-opacity",
      targetOpacity: number = 0.9,
      immediate: boolean = false,
    ) => {
      const animationId = `${LAYER_ANIMATION_PREFIX}${layerId}`

      // Get fresh map reference
      const mapInstance = coordinator.getValidMap(map.mapRef)
      if (!mapInstance) {
        console.warn(`[useMapLayers] No valid map for layer ${layerId}`)
        return
      }

      try {
        const layerExists = mapInstance.getLayer(layerId)
        console.log(
          `[useMapLayers] Layer ${layerId} exists:`,
          !!layerExists,
          "visible:",
          visible,
          "targetOpacity:",
          targetOpacity,
          "immediate:",
          immediate,
        )

        if (!layerExists) {
          console.warn(`[useMapLayers] Layer ${layerId} not found in map style`)
          return
        }

        if (immediate) {
          // Set immediately without animation
          const visValue = visible ? "visible" : "none"
          const opacityValue = visible ? targetOpacity : 0
          console.log(
            `[useMapLayers] SETTING ${layerId}: visibility=${visValue}, ${opacityProp}=${opacityValue}`,
          )
          mapInstance.setLayoutProperty(layerId, "visibility", visValue)
          mapInstance.setPaintProperty(layerId, opacityProp, opacityValue)

          // Verify it was set
          const actualVisibility = mapInstance.getLayoutProperty(
            layerId,
            "visibility",
          )
          const actualOpacity = mapInstance.getPaintProperty(
            layerId,
            opacityProp,
          )
          console.log(
            `[useMapLayers] VERIFIED ${layerId}: visibility=${actualVisibility}, ${opacityProp}=${actualOpacity}`,
          )
          return
        }

        // Make visible before animating in
        if (visible) {
          mapInstance.setLayoutProperty(layerId, "visibility", "visible")
        }

        // Get current opacity for smooth transition
        const startOpacity =
          (mapInstance.getPaintProperty(layerId, opacityProp) as number) ?? 0
        const endOpacity = visible ? targetOpacity : 0

        // Skip animation if already at target
        if (Math.abs(startOpacity - endOpacity) < 0.01) {
          if (!visible) {
            mapInstance.setLayoutProperty(layerId, "visibility", "none")
          }
          return
        }

        // Use coordinator for animation
        coordinator.start(
          animationId,
          (_now, elapsed) => {
            // Get fresh map reference each frame
            const currentMap = coordinator.getValidMap(map.mapRef)
            if (!currentMap) return false // Stop animation - map gone

            // Check layer still exists
            if (!coordinator.hasLayer(map.mapRef, layerId)) return false

            // Calculate eased progress
            const progress = Math.min(elapsed / FADE_DURATION, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            const opacity = Math.max(
              0,
              Math.min(1, startOpacity + (endOpacity - startOpacity) * eased),
            )

            try {
              currentMap.setPaintProperty(layerId, opacityProp, opacity)
            } catch {
              return false // Stop on error
            }

            return progress < 1 // Continue if not done
          },
          {
            duration: FADE_DURATION,
            onComplete: () => {
              // Hide layer after fading out
              if (!visible) {
                const currentMap = coordinator.getValidMap(map.mapRef)
                if (currentMap && coordinator.hasLayer(map.mapRef, layerId)) {
                  try {
                    currentMap.setLayoutProperty(layerId, "visibility", "none")
                  } catch {
                    // Map may have unmounted
                  }
                }
              }
            },
          },
        )
      } catch (e) {
        console.warn(`Failed to apply layer ${layerId}:`, e)
      }
    },
    [map.mapRef],
  )

  // Main effect: apply layer states based on active section
  useEffect(() => {
    console.log(
      "[useMapLayers] Main effect running, mapReady:",
      mapReady,
      "activeSection:",
      activeSection,
    )

    if (!mapReady) {
      console.log("[useMapLayers] Map not ready yet")
      return
    }

    const mapInstance = coordinator.getValidMap(map.mapRef)
    if (!mapInstance) {
      console.log("[useMapLayers] No valid mapInstance")
      return
    }

    console.log("[useMapLayers] Applying layer states...")

    // Cancel any running layer animations when section changes
    coordinator.cancelGroup(LAYER_ANIMATION_PREFIX)

    const applyLayerStates = () => {
      console.log("[useMapLayers] applyLayerStates called")
      const currentLayers = SECTION_LAYERS[activeSection]
      const prevSection = prevSectionRef.current
      const prevLayers = prevSection ? SECTION_LAYERS[prevSection] : null
      const isFirstRun = !mapReadyRef.current

      // Mark as ready after first run
      mapReadyRef.current = true

      // On first run, set all layers to their correct state immediately
      if (isFirstRun) {
        console.log("[useMapLayers] Initial setup for section:", activeSection)

        // Configure label layers for better visibility on Globe projection
        const labelLayers = [LAYERS.californiaLabel, LAYERS.centralValleyLabel]
        labelLayers.forEach((layerId) => {
          try {
            if (mapInstance.getLayer(layerId)) {
              // Allow labels to overlap (prevent collision culling on globe)
              mapInstance.setLayoutProperty(layerId, "text-allow-overlap", true)
              mapInstance.setLayoutProperty(
                layerId,
                "text-ignore-placement",
                true,
              )
              // Don't avoid globe edges
              mapInstance.setLayoutProperty(
                layerId,
                "symbol-avoid-edges",
                false,
              )
              console.log(
                `[useMapLayers] Configured ${layerId} for Globe projection`,
              )
            }
          } catch (e) {
            console.warn(`Failed to configure ${layerId}:`, e)
          }
        })

        // California label
        applyLayer(
          LAYERS.californiaLabel,
          !!currentLayers.californiaLabel,
          "text-opacity",
          0.9,
          true, // immediate
        )

        // Central Valley layers
        applyLayer(
          LAYERS.centralValleyPolygon,
          !!currentLayers.centralValley,
          "line-opacity",
          0.9,
          true,
        )
        applyLayer(
          LAYERS.centralValleyPolygonHalo,
          !!currentLayers.centralValley,
          "line-opacity",
          0.9,
          true,
        )
        applyLayer(
          LAYERS.centralValleyLabel,
          !!currentLayers.centralValley,
          "text-opacity",
          0.9,
          true,
        )

        // Inflow watersheds
        applyLayer(
          LAYERS.inflowWatersheds,
          !!currentLayers.inflowWatersheds,
          "fill-opacity",
          0.3,
          true,
        )

        // Water layer (Delta) - starts hidden, shown by DeltaInfoPanel button
        applyLayer(LAYERS.water, false, "fill-opacity", 0.9, true)

        prevSectionRef.current = activeSection
        return
      }

      // Skip if section hasn't changed
      if (prevSection === activeSection) return

      console.log(
        "[useMapLayers] Section change:",
        prevSection,
        "->",
        activeSection,
      )
      prevSectionRef.current = activeSection

      // Animate layer changes
      // California label
      if (currentLayers.californiaLabel !== prevLayers?.californiaLabel) {
        applyLayer(
          LAYERS.californiaLabel,
          !!currentLayers.californiaLabel,
          "text-opacity",
        )
      }

      // Central Valley
      if (currentLayers.centralValley !== prevLayers?.centralValley) {
        applyLayer(
          LAYERS.centralValleyPolygon,
          !!currentLayers.centralValley,
          "line-opacity",
        )
        applyLayer(
          LAYERS.centralValleyPolygonHalo,
          !!currentLayers.centralValley,
          "line-opacity",
        )
        applyLayer(
          LAYERS.centralValleyLabel,
          !!currentLayers.centralValley,
          "text-opacity",
        )
      }

      // Inflow watersheds
      // Skip auto-hide when entering rivers section - it will fade out during rivers animation instead
      if (
        currentLayers.inflowWatersheds !== prevLayers?.inflowWatersheds &&
        activeSection !== "rivers"
      ) {
        applyLayer(
          LAYERS.inflowWatersheds,
          !!currentLayers.inflowWatersheds,
          "fill-opacity",
          0.3,
        )
      }

      // Water layer (Delta) - fade out when leaving delta section
      // Note: Water layer is SHOWN by DeltaInfoPanel button click, hidden here on section change
      if (prevSection === "delta" && activeSection !== "delta") {
        applyLayer(LAYERS.water, false, "fill-opacity", 0.9)
      }

      // Reset geocoding (marker + panel state) when leaving find-basin section
      if (prevSection === "find-basin" && activeSection !== "find-basin") {
        learnMapActions.resetGeocoding()
      }
    }

    // Apply immediately - map is ready (mapReady state ensures this)
    applyLayerStates()
  }, [activeSection, map.mapRef, applyLayer, mapReady])

  // Fade out inflow-watersheds and basins outline during rivers animation
  // Both fade starting at 30% and ending at 60% of rivers animation
  useEffect(() => {
    if (!mapReady) return

    // Only apply during rivers section
    if (activeSection !== "rivers") return

    const mapInstance = coordinator.getValidMap(map.mapRef)
    if (!mapInstance) return

    // Start fading at 30% of animation, finish at 60%
    // Rivers are well underway before these layers fade
    const fadeStart = 0.3
    const fadeEnd = 0.6
    const fadeProgress = Math.max(
      0,
      Math.min(1, (riversProgress - fadeStart) / (fadeEnd - fadeStart)),
    )

    try {
      // Fade inflow-watersheds from 0.3 to 0
      if (mapInstance.getLayer(LAYERS.inflowWatersheds)) {
        const opacity = Math.max(0, 0.3 * (1 - fadeProgress))
        mapInstance.setPaintProperty(
          LAYERS.inflowWatersheds,
          "fill-opacity",
          opacity,
        )
      }

      // Fade basins outline layers to 0.6 opacity
      // basins-outline-halo: 1 -> 0.6
      if (mapInstance.getLayer("basins-outline-halo")) {
        const opacity = 1 - fadeProgress * 0.4 // 1 -> 0.6
        mapInstance.setPaintProperty(
          "basins-outline-halo",
          "line-opacity",
          opacity,
        )
      }
      // basins-outline-layer: 0.8 -> 0.6
      if (mapInstance.getLayer("basins-outline-layer")) {
        const opacity = 0.8 - fadeProgress * 0.2 // 0.8 -> 0.6
        mapInstance.setPaintProperty(
          "basins-outline-layer",
          "line-opacity",
          opacity,
        )
      }
    } catch {
      // Layer might not exist
    }
  }, [activeSection, riversProgress, map.mapRef, mapReady])

  return {
    activeSection,
    riversProgress,
  }
}

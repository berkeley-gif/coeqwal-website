"use client"

/* useStoryboardCamera: primes the map session when the storyboard becomes active.
 *
 * Once the camera has arrived (moveend fires),
 * prime the polygon data and set up the demand-units baseline so the beat
 * engine has a clean slate to animate from.
 */

import { useRef, useEffect } from "react"
import { useMap } from "@repo/map"
import {
  DU_CLASS_FILTER,
  writeDemandUnitsBaseline,
  ensureDemandUnitsOutlineLayer,
  blueFillExpr,
  type BaselineMap,
  type SessionInitMap,
} from "../engine"

interface StoryboardCameraParams {
  /** True when activeSection === "storyboard" in the map store.
   *  Flipping false → true triggers the priming sequence. */
  isActive: boolean
  isLoading: boolean
  mapAPI: ReturnType<typeof useMap>
  /** Collect polygon screen positions once the camera fly settles. */
  computePolygonDataRef: React.RefObject<() => void>
  /** Re-apply the panel offset as the page settles after the fly. */
  applyPanelOffsetRef: React.RefObject<() => void>
  /** Gate that allows the beat engine to start painting polygons. */
  polygonsAllowedRef: React.RefObject<boolean>
  /** All polygon fill/outline layer pairs managed by the beat engine. */
  animPolygonLayers: readonly { fill: string; outline: string }[]
}

export function useStoryboardCamera({
  isActive,
  isLoading,
  mapAPI,
  computePolygonDataRef,
  applyPanelOffsetRef,
  polygonsAllowedRef,
  animPolygonLayers,
}: StoryboardCameraParams): void {
  // Prevents the priming sequence from running more than once per activation.
  // Reset to false when isActive goes false so re-entering the section
  // triggers a fresh priming sequence (camera re-flies, polygons re-project).
  const primedRef = useRef(false)

  useEffect(() => {
    if (!isActive) {
      primedRef.current = false
      return
    }

    if (isLoading) return

    const map = mapAPI.mapRef?.current?.getMap?.()
    if (!map) return

    if (primedRef.current) return
    primedRef.current = true

    const onMoveEnd = () => {
      // ── Step 1: Collect polygon screen positions ──────────────────────────
      // Projects geographic coordinates to pixel positions using the now-settled
      // camera. This is the starting point for Beat 1 where squares appear on
      // the map at their real geographic locations.
      // Must run AFTER moveend — positions calculated mid-fly would be wrong.
      computePolygonDataRef.current()
      polygonsAllowedRef.current = true

      // ── Step 2: Correct scroll offset drift ───────────────────────────────
      // The page scroll position may still be drifting slightly as the fly
      // settles. Two cheap offset re-applications catch residual drift without
      // re-querying Mapbox.
      setTimeout(() => applyPanelOffsetRef.current(), 200)
      setTimeout(() => applyPanelOffsetRef.current(), 500)

      try {
        // ── Step 3: Force animation layers visible ────────────────────────
        // Other parts of the app (e.g. switching map modes) may have hidden
        // these Mapbox layers. Ensure they're all visible before the beat
        // engine starts painting them.
        for (const { fill, outline } of animPolygonLayers) {
          if (map.getLayer(fill))
            map.setLayoutProperty(fill, "visibility", "visible")
          if (map.getLayer(outline))
            map.setLayoutProperty(outline, "visibility", "visible")
        }

        // ── Step 4: Create and baseline the demand-units layers ───────────
        // ensureDemandUnitsOutlineLayer: creates the demand-units-outline
        // Mapbox layer if it doesn't exist. It's not in the base style —
        // the storyboard adds it dynamically on first activation.
        //
        // writeDemandUnitsBaseline: sets the Beat 1 starting state on both
        // fill and outline — blue color expression, zero opacity, zero
        // transitions. Zero transitions are critical: without them every
        // per-frame setPaintProperty in the beat engine smears across the
        // 800ms default Mapbox transition instead of updating instantly.
        ensureDemandUnitsOutlineLayer(map as unknown as SessionInitMap, {
          filter: DU_CLASS_FILTER,
          lineColor: blueFillExpr(0) as readonly unknown[],
          lineWidth: 0.5,
          lineOpacity: 0,
          lineOffset: -0.25,
        })
        writeDemandUnitsBaseline(map as unknown as BaselineMap, {
          filter: DU_CLASS_FILTER,
          fillExpr: blueFillExpr(0) as readonly unknown[],
          fillOpacity: { kind: "scalar", value: 0 },
          lineOpacity: { kind: "scalar", value: 0 },
          lineWidth: 0.5,
          lineOffset: -0.25,
          visibility: "visible",
        })

        // Suppress all non-demand-units polygon layers until their beat turn.
        // The beat engine reveals them at the right moment during playback.
        for (const { fill, outline } of animPolygonLayers) {
          if (fill === "demand-units") continue
          if (map.getLayer(fill)) map.setPaintProperty(fill, "fill-opacity", 0)
          if (map.getLayer(outline))
            map.setPaintProperty(outline, "line-opacity", 0)
        }

        // ── Step 5: Zero out the basemap dim overlay ──────────────────────
        // Kill the 800ms transition that VisualizationLayers sets for the
        // Explore path. Without this, every per-frame setPaintProperty call
        // from the beat engine smears instead of updating instantly.
        if (map.getLayer("basemap-dim-overlay")) {
          map.setPaintProperty(
            "basemap-dim-overlay",
            "fill-opacity-transition",
            { duration: 0, delay: 0 },
          )
          map.setPaintProperty("basemap-dim-overlay", "fill-opacity", 0)
        }
      } catch (e) {
        /* ok — layers may not exist in all map styles */
        console.warn("[useStoryboardCamera] layer setup error (non-fatal):", e)
      }
    }

    // Register once. The camera fly was already triggered by useMapLayers
    // when activeSection changed to "storyboard".
    map.once("moveend", onMoveEnd)

    // If the user scrolls back out before moveend fires, clean up the
    // listener so we don't prime a stale session.
    return () => {
      map.off("moveend", onMoveEnd)
    }
  }, [
    isActive,
    isLoading,
    mapAPI.mapRef,
    animPolygonLayers,
    applyPanelOffsetRef,
    computePolygonDataRef,
    polygonsAllowedRef,
  ])
}
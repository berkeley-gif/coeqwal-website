"use client"

/* useStoryboardCamera: panel-in-view and camera fly-home
 *
 * Detects when the storyboard panel scrolls into view, flies the camera
 * to its home view, and primes the map session on arrival. One of the
 * TierAnimationSection hooks (see README.md).
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

interface CameraParams {
  panelRef: React.RefObject<HTMLDivElement | null>
  panelInView: boolean
  setPanelInView: (inView: boolean) => void
  isLoading: boolean
  mapAPI: ReturnType<typeof useMap>
  /** Home camera the storyboard flies to once the panel is visible. */
  home: { center: [number, number]; zoom: number }
  /** Trigger a polygon collect once the fly settles (from the projection
   *  hook). */
  computePolygonDataRef: React.RefObject<() => void>
  /** Re-apply the panel offset as the panel settles (from the projection
   *  hook). */
  applyPanelOffsetRef: React.RefObject<() => void>
  /** Gate that lets the rest of the component start painting polygons once
   *  the camera has arrived. */
  polygonsAllowedRef: React.RefObject<boolean>
  /** Polygon fill/outline layer ids that get suppressed until their beat. */
  animPolygonLayers: readonly { fill: string; outline: string }[]
}

/** Detects when the storyboard panel scrolls into view and flies the camera
 *  home on first arrival. On the fly's moveend it primes the map session:
 *  collects polygons, makes the animation layers visible, and writes the
 *  demand-units baseline so the per-frame palette cycling starts clean. */
export function useStoryboardCamera({
  panelRef,
  panelInView,
  setPanelInView,
  isLoading,
  mapAPI,
  home,
  computePolygonDataRef,
  applyPanelOffsetRef,
  polygonsAllowedRef,
  animPolygonLayers,
}: CameraParams): void {
  const cameraSetRef = useRef(false)

  /* Detect when panel scrolls into view */
  useEffect(() => {
    const el = panelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setPanelInView(true)
      },
      { threshold: 0.05 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [panelRef, setPanelInView])

  /* Fly camera once panel is visible */
  useEffect(() => {
    if (!panelInView || isLoading || !mapAPI.mapRef?.current) return
    if (cameraSetRef.current) return

    const timer = setTimeout(() => {
      if (!mapAPI.mapRef?.current) return
      const map = mapAPI.mapRef.current.getMap?.()

      const onMoveEnd = () => {
        if (!map) return
        computePolygonDataRef.current()
        polygonsAllowedRef.current = true

        // The panel may still be settling to its final scroll position
        // after the camera fly. Schedule cheap offset re-applications to
        // catch any drift without re-querying Mapbox.
        setTimeout(() => applyPanelOffsetRef.current(), 200)
        setTimeout(() => applyPanelOffsetRef.current(), 500)

        try {
          // Ensure all animation layers have visibility "visible" at the
          // layout level - OutcomePolygonLayer may have set them to "none"
          // if it was previously mounted in another map mode.
          for (const { fill, outline } of animPolygonLayers) {
            if (map.getLayer(fill))
              map.setLayoutProperty(fill, "visibility", "visible")
            if (map.getLayer(outline))
              map.setLayoutProperty(outline, "visibility", "visible")
          }

          // consolidated session-init. `ensureDemandUnitsOutlineLayer`
          // creates the `demand-units-outline` line layer once per session
          // (safe to call repeatedly: no-op if it already exists from
          // another map mode).
          // `writeDemandUnitsBaseline` then asserts the full beat-1 palette
          // state on both fill and outline layers, including zeroed
          // transitions so the per-frame color cycling in the progress
          // handler below writes cleanly without smear. Casts via
          // `unknown` because Mapbox's method signatures are stricter
          // than the helpers' permissive structural types.
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
          // Suppress all other polygon layers until their beat-2 turn
          for (const { fill, outline } of animPolygonLayers) {
            if (fill === "demand-units") continue // already handled above
            if (map.getLayer(fill))
              map.setPaintProperty(fill, "fill-opacity", 0)
            if (map.getLayer(outline))
              map.setPaintProperty(outline, "line-opacity", 0)
          }
          // Prep the shared `basemap-dim-overlay` (added by VisualizationLayers
          // and pinned to opacity 0 in get-started mode) for progress-driven
          // updates from this component. Override the 800ms transition
          // VisualizationLayers configures for the Explore path. Otherwise
          // every per-frame setPaintProperty call below would smear and
          // look broken.
          if (map.getLayer("basemap-dim-overlay")) {
            map.setPaintProperty(
              "basemap-dim-overlay",
              "fill-opacity-transition",
              { duration: 0, delay: 0 },
            )
            map.setPaintProperty("basemap-dim-overlay", "fill-opacity", 0)
          }
        } catch {
          /* ok */
        }
      }
      map?.once("moveend", onMoveEnd)

      mapAPI.mapRef.current.easeTo({
        center: home.center,
        zoom: home.zoom,
        bearing: 0,
        pitch: 0,
        duration: 1500,
        easing: (t: number) => t * (2 - t),
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
      })
      cameraSetRef.current = true
    }, 200)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelInView, isLoading, mapAPI.mapRef])
}

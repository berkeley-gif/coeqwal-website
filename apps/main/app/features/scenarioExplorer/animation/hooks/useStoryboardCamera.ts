"use client"

/* useStoryboardCamera: detects when the storyboard panel scrolls into view,
 * flies the camera home, and primes the map session on arrival. One of the
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
  /** Collect polygons once the fly settles (from the projection hook). */
  computePolygonDataRef: React.RefObject<() => void>
  /** Re-apply the panel offset as the panel settles (from the projection hook). */
  applyPanelOffsetRef: React.RefObject<() => void>
  /** Gate that lets the component start painting polygons once the camera
   *  arrives. */
  polygonsAllowedRef: React.RefObject<boolean>
  /** Polygon fill/outline layer ids suppressed until their beat. */
  animPolygonLayers: readonly { fill: string; outline: string }[]
}

/** See the file header. */
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

  /* Detect when panel scrolls into view. */
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

  /* Fly camera once panel is visible. */
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

        // Panel may still be settling its scroll position after the fly.
        // Schedule cheap offset re-applications to catch drift without
        // re-querying Mapbox.
        setTimeout(() => applyPanelOffsetRef.current(), 200)
        setTimeout(() => applyPanelOffsetRef.current(), 500)

        try {
          // Force all animation layers visible: OutcomePolygonLayer may have
          // set them to "none" when mounted in another map mode.
          for (const { fill, outline } of animPolygonLayers) {
            if (map.getLayer(fill))
              map.setLayoutProperty(fill, "visibility", "visible")
            if (map.getLayer(outline))
              map.setLayoutProperty(outline, "visibility", "visible")
          }

          // Session-init. `ensureDemandUnitsOutlineLayer` creates the
          // `demand-units-outline` layer once (no-op if it already exists).
          // `writeDemandUnitsBaseline` then asserts the full beat-1 palette on
          // fill and outline, with zeroed transitions so the per-frame color
          // cycling writes without smear. Casts via `unknown` because Mapbox's
          // signatures are stricter than the helpers' structural types.
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
          // Suppress all other polygon layers until their beat-2 turn.
          for (const { fill, outline } of animPolygonLayers) {
            if (fill === "demand-units") continue // handled above
            if (map.getLayer(fill))
              map.setPaintProperty(fill, "fill-opacity", 0)
            if (map.getLayer(outline))
              map.setPaintProperty(outline, "line-opacity", 0)
          }
          // Prep shared `basemap-dim-overlay` for progress-driven updates.
          // Override the 800ms transition VisualizationLayers sets for the
          // Explore path, else every per-frame setPaintProperty smears.
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
  }, [
    panelInView,
    isLoading,
    mapAPI.mapRef,
    home.center,
    home.zoom,
    animPolygonLayers,
    applyPanelOffsetRef,
    computePolygonDataRef,
    polygonsAllowedRef,
  ])
}

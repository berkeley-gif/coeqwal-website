"use client"

/* useScreenPolygonProjection: outcome geometry to screen polygons
 *
 * Projects outcome geometry from Mapbox into panel-relative screen
 * polygons for the morph overlay, and keeps them current on map move,
 * scroll, and resize. One of the TierAnimationSection hooks (see README.md).
 */

import { useRef, useState, useEffect, useCallback } from "react"
import { useMap } from "@repo/map"
import {
  diamondPoints,
  circlePoints,
  lineSegmentPoints,
  POINTS_PER_SHAPE,
} from "@repo/viz"
import { getOutcomeConfig } from "../../../map/config/outcomeLayerRegistry"
import {
  getOutcomeLocationCoordinates,
  SALMON_RIVER_CENTROID,
} from "../../../map/config/outcomeLocations"
import type { Centroid, OutcomeLocationData } from "../useTierAnimationData"

/** One outcome shape projected into panel-relative screen space. */
export interface ScreenPolygon {
  screenPoly: [number, number][]
  centroidScreen: [number, number]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractOuterRing(geometry: any): [number, number][] | null {
  if (!geometry) return null
  if (geometry.type === "Polygon") {
    return geometry.coordinates?.[0] as [number, number][] | null
  }
  if (geometry.type === "MultiPolygon") {
    let largest: [number, number][] = []
    for (const polygon of geometry.coordinates ?? []) {
      const ring = polygon?.[0] as [number, number][] | undefined
      if (ring && ring.length > largest.length) largest = ring
    }
    return largest.length > 0 ? largest : null
  }
  return null
}

interface ProjectionParams {
  panelRef: React.RefObject<HTMLDivElement | null>
  isLoading: boolean
  panelInView: boolean
  centroids: Centroid[]
  allLocationIds: Set<string>
  outcomeLocations: Record<string, OutcomeLocationData>
  outcomeDisplayOrder: readonly { code: string; label: string }[]
  mapAPI: ReturnType<typeof useMap>
  /** Geographic centroids per feature, written here and read by the
   *  interactive-selection code in the parent (popup lookups). */
  geoCentroidsRef: React.RefObject<Map<string, { lng: number; lat: number }>>
  /** Re-project the squares on every map move frame. Needed only while the
   *  squares track the map (active playback, or before the morph settles).
   *  Once the storyboard is paused or finished on a settled grid or chart
   *  beat, the squares sit at fixed panel-relative positions, so the camera
   *  can fly without forcing a per-frame projection and overlay re-render. */
  reprojectOnMove: boolean
}

interface ProjectionResult {
  panelSize: { width: number; height: number } | null
  allScreenPolygons: Map<string, ScreenPolygon>
  /** Trigger a fresh collect from Mapbox. Navigation and the camera fly
   *  call this through the ref so they don't depend on the changing
   *  identity of the collect callback. */
  computePolygonDataRef: React.RefObject<() => void>
  /** Re-apply the panel offset without re-querying Mapbox. The camera fly
   *  calls this to catch scroll drift after the panel settles. */
  applyPanelOffsetRef: React.RefObject<() => void>
}

/** Projects outcome geometry from Mapbox into panel-relative screen
 *  polygons for the morph overlay. Collects rings on demand, re-projects
 *  cheaply on map move, and re-offsets on scroll. */
export function useScreenPolygonProjection({
  panelRef,
  isLoading,
  panelInView,
  centroids,
  allLocationIds,
  outcomeLocations,
  outcomeDisplayOrder,
  mapAPI,
  geoCentroidsRef,
  reprojectOnMove,
}: ProjectionParams): ProjectionResult {
  const [panelSize, setPanelSize] = useState<{
    width: number
    height: number
  } | null>(null)
  const [allScreenPolygons, setAllScreenPolygons] = useState<
    Map<string, ScreenPolygon>
  >(new Map())
  const viewportDataRef = useRef<Map<string, ScreenPolygon>>(new Map())

  /* Measure panel for SVG coordinate mapping */
  const measurePanel = useCallback(() => {
    if (!panelRef.current) return
    const rect = panelRef.current.getBoundingClientRect()
    if (rect.width === 0) return
    setPanelSize({ width: rect.width, height: rect.height })
  }, [panelRef])

  useEffect(() => {
    if (isLoading) return
    const raf = requestAnimationFrame(measurePanel)
    window.addEventListener("resize", measurePanel)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", measurePanel)
    }
  }, [isLoading, measurePanel])

  /* Collect screen shapes from Mapbox layers + coordinate lookups */
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const computePolygonDataRef = useRef<() => void>(() => {})
  const reprojectRef = useRef<() => void>(() => {})
  const applyPanelOffsetRef = useRef<() => void>(() => {})
  const cachedGeoRingsRef = useRef<
    Map<
      string,
      { ring: [number, number][]; centroidLng?: number; centroidLat?: number }
    >
  >(new Map())

  const applyPanelOffset = useCallback(() => {
    if (!panelRef.current || viewportDataRef.current.size === 0) return

    const panelRect = panelRef.current.getBoundingClientRect()
    const ox = panelRect.left + panelRef.current.clientLeft
    const oy = panelRect.top + panelRef.current.clientTop

    const screenMap = new Map<string, ScreenPolygon>()
    for (const [id, vp] of viewportDataRef.current) {
      screenMap.set(id, {
        screenPoly: vp.screenPoly.map(
          ([x, y]) => [x - ox, y - oy] as [number, number],
        ),
        centroidScreen: [vp.centroidScreen[0] - ox, vp.centroidScreen[1] - oy],
      })
    }
    setAllScreenPolygons(screenMap)
  }, [panelRef])

  applyPanelOffsetRef.current = applyPanelOffset

  const collectOutcomeShapes = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current)
      retryTimerRef.current = null
    }
    cachedGeoRingsRef.current = new Map()

    if (!mapAPI.mapRef?.current || !panelRef.current) return
    if (centroids.length === 0 && allLocationIds.size === 0) return

    const map = mapAPI.mapRef.current.getMap?.()
    if (!map || !map.isStyleLoaded?.()) return

    const centroidLookup = new Map(centroids.map((c) => [c.id, c]))
    const vpMap = new Map<string, ScreenPolygon>()
    const geoCentroids = new Map<string, { lng: number; lat: number }>()

    // 1. Query polygon-based Mapbox layers per the registry
    const layersToQuery = new Map<
      string,
      { idProperty: string; sourceLayerName?: string }
    >()

    for (const { code } of outcomeDisplayOrder) {
      const config = getOutcomeConfig(code)
      if (!config || config.geometryType !== "polygon") continue
      if (!config.mapboxLayerId || layersToQuery.has(config.mapboxLayerId))
        continue
      layersToQuery.set(config.mapboxLayerId, {
        idProperty: config.idProperty ?? "DU_ID",
        sourceLayerName: config.sourceLayer,
      })
    }

    let anyPolygonsFound = false
    for (const [layerId, { idProperty, sourceLayerName }] of layersToQuery) {
      if (!map.getLayer(layerId)) continue

      // querySourceFeatures ignores layer filters, returning ALL features
      // from loaded tiles (unlike queryRenderedFeatures which respects them).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let features: any[] = []
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const layer = map.getLayer(layerId) as any
        const sourceId: string | undefined = layer?.source
        const srcLayer: string | undefined =
          layer?.sourceLayer ?? layer?.["source-layer"] ?? sourceLayerName
        if (sourceId && srcLayer) {
          features = map.querySourceFeatures(sourceId, {
            sourceLayer: srcLayer,
          })
        }
      } catch {
        /* ok */
      }

      if (features.length > 0) anyPolygonsFound = true

      const bestRings = new Map<string, [number, number][]>()
      for (const f of features) {
        const featureId: string | undefined = f.properties?.[idProperty]
        if (!featureId) continue
        const ring = extractOuterRing(f.geometry)
        if (!ring || ring.length < 3) continue
        const existing = bestRings.get(featureId)
        if (!existing || ring.length > existing.length) {
          bestRings.set(featureId, ring)
        }
      }

      for (const [featureId, ring] of bestRings) {
        let geoLng = 0,
          geoLat = 0
        for (const [lng, lat] of ring) {
          geoLng += lng
          geoLat += lat
        }
        geoLng /= ring.length
        geoLat /= ring.length
        geoCentroids.set(featureId, { lng: geoLng, lat: geoLat })

        const cData = centroidLookup.get(featureId)
        cachedGeoRingsRef.current.set(featureId, {
          ring,
          centroidLng: cData?.lng,
          centroidLat: cData?.lat,
        })

        const vpPoly: [number, number][] = []
        for (const [lng, lat] of ring) {
          try {
            const pt = map.project([lng, lat])
            vpPoly.push([pt.x, pt.y])
          } catch {
            /* vertex outside projection bounds */
          }
        }
        if (vpPoly.length < 3) continue

        let cx = 0,
          cy = 0
        for (const [x, y] of vpPoly) {
          cx += x
          cy += y
        }
        cx /= vpPoly.length
        cy /= vpPoly.length
        const centroid: [number, number] = [cx, cy]

        if (cData) {
          try {
            const pt = map.project([cData.lng, cData.lat])
            centroid[0] = pt.x
            centroid[1] = pt.y
          } catch {
            /* keep computed centroid */
          }
        }

        vpMap.set(featureId, { screenPoly: vpPoly, centroidScreen: centroid })
      }
    }

    // 2. React-marker outcomes: project coordinates to viewport shapes
    for (const { code } of outcomeDisplayOrder) {
      const config = getOutcomeConfig(code)
      if (!config || config.geometryType !== "react-marker") continue
      const locData = outcomeLocations[code]
      if (!locData) continue

      for (const locId of locData.ids) {
        if (vpMap.has(locId)) continue
        const coords = getOutcomeLocationCoordinates(code, locId)
        if (!coords) continue

        try {
          const pt = map.project(coords)
          const sx = pt.x
          const sy = pt.y

          let vpPoly: [number, number][]
          if (code === "ENV_FLOWS") {
            vpPoly = diamondPoints(sx, sy, 14, 20, POINTS_PER_SHAPE)
          } else {
            vpPoly = circlePoints(sx, sy, 8, POINTS_PER_SHAPE)
          }
          vpMap.set(locId, { screenPoly: vpPoly, centroidScreen: [sx, sy] })
        } catch {
          /* outside projection bounds */
        }
      }
    }

    // 3. Line outcomes: representative shape at centroid
    for (const { code } of outcomeDisplayOrder) {
      const config = getOutcomeConfig(code)
      if (!config || config.geometryType !== "line") continue
      const locData = outcomeLocations[code]
      if (!locData) continue

      const syntheticId = [...locData.ids][0] ?? code
      if (vpMap.has(syntheticId)) continue

      try {
        const pt = map.project(SALMON_RIVER_CENTROID)
        const sx = pt.x
        const sy = pt.y
        const vpPoly = lineSegmentPoints(
          sx - 15,
          sy,
          sx + 15,
          sy,
          8,
          POINTS_PER_SHAPE,
        )
        vpMap.set(syntheticId, { screenPoly: vpPoly, centroidScreen: [sx, sy] })
      } catch {
        /* outside projection bounds */
      }
    }

    if (!anyPolygonsFound && layersToQuery.size > 0) {
      retryTimerRef.current = setTimeout(collectOutcomeShapes, 1000)
      return
    }

    geoCentroidsRef.current = geoCentroids
    viewportDataRef.current = vpMap
    applyPanelOffset()
  }, [
    centroids,
    allLocationIds,
    outcomeLocations,
    outcomeDisplayOrder,
    mapAPI,
    applyPanelOffset,
    geoCentroidsRef,
    panelRef,
  ])

  /**
   * Re-project cached geographic data to screen without re-querying Mapbox.
   * Safe to call on every map move/zoom: feature count stays stable.
   */
  const reprojectShapes = useCallback(() => {
    if (!mapAPI.mapRef?.current || !panelRef.current) return
    const map = mapAPI.mapRef.current.getMap?.()
    if (!map) return
    if (
      cachedGeoRingsRef.current.size === 0 &&
      viewportDataRef.current.size === 0
    )
      return

    const vpMap = new Map(viewportDataRef.current)

    for (const [featureId, data] of cachedGeoRingsRef.current) {
      const vpPoly: [number, number][] = []
      for (const [lng, lat] of data.ring) {
        try {
          const pt = map.project([lng, lat])
          vpPoly.push([pt.x, pt.y])
        } catch {
          /* vertex outside projection bounds */
        }
      }
      if (vpPoly.length < 3) continue

      let cx = 0,
        cy = 0
      for (const [x, y] of vpPoly) {
        cx += x
        cy += y
      }
      cx /= vpPoly.length
      cy /= vpPoly.length
      const centroid: [number, number] = [cx, cy]

      if (data.centroidLng != null && data.centroidLat != null) {
        try {
          const pt = map.project([data.centroidLng, data.centroidLat])
          centroid[0] = pt.x
          centroid[1] = pt.y
        } catch {
          /* keep computed centroid */
        }
      }

      vpMap.set(featureId, { screenPoly: vpPoly, centroidScreen: centroid })
    }

    for (const { code } of outcomeDisplayOrder) {
      const config = getOutcomeConfig(code)
      if (!config || config.geometryType !== "react-marker") continue
      const locData = outcomeLocations[code]
      if (!locData) continue

      for (const locId of locData.ids) {
        if (vpMap.has(locId)) continue
        const coords = getOutcomeLocationCoordinates(code, locId)
        if (!coords) continue
        try {
          const pt = map.project(coords)
          const sx = pt.x
          const sy = pt.y
          let vpPoly: [number, number][]
          if (code === "ENV_FLOWS") {
            vpPoly = diamondPoints(sx, sy, 14, 20, POINTS_PER_SHAPE)
          } else {
            vpPoly = circlePoints(sx, sy, 8, POINTS_PER_SHAPE)
          }
          vpMap.set(locId, { screenPoly: vpPoly, centroidScreen: [sx, sy] })
        } catch {
          /* outside projection bounds */
        }
      }
    }

    for (const { code } of outcomeDisplayOrder) {
      const config = getOutcomeConfig(code)
      if (!config || config.geometryType !== "line") continue
      const locData = outcomeLocations[code]
      if (!locData) continue
      const syntheticId = [...locData.ids][0] ?? code
      if (vpMap.has(syntheticId)) continue
      try {
        const pt = map.project(SALMON_RIVER_CENTROID)
        const sx = pt.x
        const sy = pt.y
        const vpPoly = lineSegmentPoints(
          sx - 15,
          sy,
          sx + 15,
          sy,
          8,
          POINTS_PER_SHAPE,
        )
        vpMap.set(syntheticId, {
          screenPoly: vpPoly,
          centroidScreen: [sx, sy],
        })
      } catch {
        /* outside projection bounds */
      }
    }

    viewportDataRef.current = vpMap
    applyPanelOffset()
  }, [
    mapAPI,
    outcomeLocations,
    outcomeDisplayOrder,
    applyPanelOffset,
    panelRef,
  ])

  computePolygonDataRef.current = collectOutcomeShapes
  reprojectRef.current = reprojectShapes

  useEffect(() => {
    const onResize = () => {
      if (viewportDataRef.current.size > 0) {
        reprojectShapes()
      }
    }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [reprojectShapes])

  // Re-apply offset on scroll (cheap: no Mapbox queries).
  // With page-level scrolling, listen on window instead of a parent scroll container.
  useEffect(() => {
    if (!panelInView) return

    let rafId: number | null = null
    const onScroll = () => {
      if (rafId !== null) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        applyPanelOffsetRef.current()
        rafId = null
      })
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId)
      window.removeEventListener("scroll", onScroll)
    }
  }, [panelInView])

  // Re-project cached shapes when the map pans/zooms.
  useEffect(() => {
    if (!panelInView) return
    const map = mapAPI.mapRef?.current?.getMap?.()
    if (!map) return

    if (!reprojectOnMove) return

    let rafId: number | null = null
    const onMove = () => {
      if (rafId !== null) return
      rafId = requestAnimationFrame(() => {
        reprojectRef.current()
        rafId = null
      })
    }

    map.on("move", onMove)
    return () => {
      map.off("move", onMove)
      if (rafId !== null) cancelAnimationFrame(rafId)
    }
  }, [panelInView, mapAPI.mapRef, reprojectOnMove])

  return {
    panelSize,
    allScreenPolygons,
    computePolygonDataRef,
    applyPanelOffsetRef,
  }
}

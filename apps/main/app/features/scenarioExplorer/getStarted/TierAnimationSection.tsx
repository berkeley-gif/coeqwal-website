"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { Box, Typography, useTheme, CircularProgress } from "@repo/ui/mui"
import { useScroll, useTransform, motion } from "@repo/motion"
import type { MotionValue } from "@repo/motion"
import { StickyElement } from "@repo/scrollytelling"
import { useMap } from "@repo/map"
import { mapActions } from "../../map/store"
import { useTierAnimationData } from "./useTierAnimationData"
import PolygonMorphOverlay, {
  type PolygonMorphData,
} from "./PolygonMorphOverlay"

const SCROLL_RUNWAY = "1600vh"

const CAM_CENTER: [number, number] = [-120.2, 38.5]
const CAM_ZOOM = 5.82

/** Linearly interpolate a value across zoom stops, matching Mapbox's interpolation. */
function lerpZoom(z: number, ...stops: [number, number][]): number {
  if (stops.length === 0) return 0
  if (z <= stops[0]![0]) return stops[0]![1]
  for (let i = 1; i < stops.length; i++) {
    const [z0, v0] = stops[i - 1]!
    const [z1, v1] = stops[i]!
    if (z <= z1) {
      const t = (z - z0) / (z1 - z0)
      return v0 + t * (v1 - v0)
    }
  }
  return stops[stops.length - 1]![1]
}

/** Extract the outer ring from a GeoJSON Polygon or MultiPolygon geometry. */
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

interface TierAnimationSectionProps {
  scrollContainerRef: React.RefObject<HTMLElement | null>
}

export default function TierAnimationSection({
  scrollContainerRef,
}: TierAnimationSectionProps) {
  const theme = useTheme()
  const mapAPI = useMap()
  const {
    centroids,
    tierDistribution: _tierDistribution,
    isLoading,
    error,
  } = useTierAnimationData()

  const runwayRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const cameraSetRef = useRef(false)

  const [panelSize, setPanelSize] = useState<{
    width: number
    height: number
  } | null>(null)
  const [polygonData, setPolygonData] = useState<PolygonMorphData[]>([])
  const [mapStyle, setMapStyle] = useState({
    fillOpacity: 0.65,
    strokeWidth: 0.8,
  })
  const [panelInView, setPanelInView] = useState(false)

  // Tracks whether the camera has settled and polygons should be allowed to show
  const polygonsAllowedRef = useRef(false)

  // Activate persistent map with AG_REV visualization on mount.
  // Suppress demand-unit polygon visibility until the camera settles.
  useEffect(() => {
    mapActions.setMapMode("get-started")
    mapActions.setOutcomeVisualization("AG_REV", "s0020")

    // Continuously suppress polygon opacity until polygonsAllowedRef is set.
    // This overrides OutcomePolygonLayer's RAF-based fade-in.
    const suppressInterval = setInterval(() => {
      if (polygonsAllowedRef.current) {
        clearInterval(suppressInterval)
        return
      }
      const map = mapAPI.mapRef?.current?.getMap?.()
      if (!map?.isStyleLoaded?.()) return
      try {
        if (map.getLayer("demand-units"))
          map.setPaintProperty("demand-units", "fill-opacity", 0)
        if (map.getLayer("demand-units-outline"))
          map.setPaintProperty("demand-units-outline", "line-opacity", 0)
      } catch {
        /* ok */
      }
    }, 50)

    return () => {
      clearInterval(suppressInterval)
      mapActions.setMapMode("hidden")
      mapActions.clearOutcomeVisualization()

      if (mapAPI.mapRef?.current) {
        try {
          mapAPI.mapRef.current.easeTo({
            padding: { top: 0, bottom: 0, left: 0, right: 0 },
            duration: 0,
          })
        } catch {
          /* ok */
        }
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Detect when the runway scrolls into view
  useEffect(() => {
    const el = runwayRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setPanelInView(true)
      },
      { threshold: 0.05 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Fly camera to match the learn map's scenario-intro position (CALIFORNIA_CENTERED_VIEW).
  // Hide demand-unit polygons during the ease, then fade them in once the camera settles.
  useEffect(() => {
    if (!panelInView || isLoading || !mapAPI.mapRef?.current) return
    if (cameraSetRef.current) return

    const timer = setTimeout(() => {
      if (!mapAPI.mapRef?.current) return
      const map = mapAPI.mapRef.current.getMap?.()

      // After camera settles: compute SVG polygon data, then fade Mapbox polygons in
      const onMoveEnd = () => {
        if (!map) return

        // Compute SVG data now that the camera is stable
        computePolygonDataRef.current()

        // Allow polygons to show (stops the suppress interval)
        polygonsAllowedRef.current = true

        try {
          const fo = lerpZoom(CAM_ZOOM, [5, 0.75], [8, 0.55], [10, 0.35])
          if (map.getLayer("demand-units")) {
            map.setPaintProperty("demand-units", "fill-opacity-transition", {
              duration: 600,
              delay: 0,
            })
            map.setPaintProperty("demand-units", "fill-opacity", fo)
          }
          if (map.getLayer("demand-units-outline")) {
            map.setPaintProperty(
              "demand-units-outline",
              "line-opacity-transition",
              {
                duration: 600,
                delay: 0,
              },
            )
            map.setPaintProperty("demand-units-outline", "line-opacity", 1)
          }
        } catch {
          /* ok */
        }
      }
      map?.once("moveend", onMoveEnd)

      mapAPI.mapRef.current.easeTo({
        center: CAM_CENTER,
        zoom: CAM_ZOOM,
        bearing: 0,
        pitch: 0,
        duration: 1500,
        easing: (t: number) => t * (2 - t),
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
      })
      cameraSetRef.current = true
    }, 200)

    return () => clearTimeout(timer)
  }, [panelInView, isLoading, mapAPI.mapRef])

  const { scrollYProgress } = useScroll({
    target: runwayRef,
    container: scrollContainerRef,
    offset: ["start start", "end end"],
    layoutEffect: false,
  })

  const mapOpacity = useTransform(scrollYProgress, [0, 0.02, 0.08], [1, 1, 0])

  // At CROSSFADE_THRESHOLD, hide Mapbox polygons so the SVG overlay takes over.
  // Before the threshold, Mapbox renders AG polygons normally (no race conditions).
  const CROSSFADE_THRESHOLD = 0.15

  const svgReady = polygonData.length > 0

  useEffect(() => {
    const mapRef = mapAPI.mapRef?.current
    if (!mapRef || isLoading) return

    let currentlyVisible = true
    const fillOpacityExpr = lerpZoom(CAM_ZOOM, [5, 0.75], [8, 0.55], [10, 0.35])

    const unsubscribe = scrollYProgress.on("change", (v) => {
      const map = mapRef.getMap?.()
      if (!map?.isStyleLoaded?.()) return

      // Keep Mapbox visible until SVG polygon data is ready
      const shouldBeVisible = !svgReady || v < CROSSFADE_THRESHOLD
      if (shouldBeVisible === currentlyVisible) return
      currentlyVisible = shouldBeVisible

      try {
        if (map.getLayer("demand-units")) {
          map.setPaintProperty(
            "demand-units",
            "fill-opacity",
            shouldBeVisible ? fillOpacityExpr : 0,
          )
        }
        if (map.getLayer("demand-units-outline")) {
          map.setPaintProperty(
            "demand-units-outline",
            "line-opacity",
            shouldBeVisible ? 1 : 0,
          )
        }
      } catch {
        /* layer may not exist yet */
      }
    })

    return () => {
      unsubscribe()
      const map = mapRef.getMap?.()
      if (map?.isStyleLoaded?.()) {
        try {
          if (map.getLayer("demand-units")) {
            map.setPaintProperty(
              "demand-units",
              "fill-opacity",
              fillOpacityExpr,
            )
          }
          if (map.getLayer("demand-units-outline")) {
            map.setPaintProperty("demand-units-outline", "line-opacity", 1)
          }
        } catch {
          /* ok */
        }
      }
    }
  }, [scrollYProgress, mapAPI.mapRef, isLoading, svgReady])

  // Measure panel size for particle end positions
  const measurePanel = useCallback(() => {
    if (!panelRef.current) return
    const rect = panelRef.current.getBoundingClientRect()
    if (rect.width === 0) return
    setPanelSize({ width: rect.width, height: rect.height })
  }, [])

  useEffect(() => {
    if (isLoading) return
    const raf = requestAnimationFrame(measurePanel)
    window.addEventListener("resize", measurePanel)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", measurePanel)
    }
  }, [isLoading, measurePanel])

  // Query polygon geometries from the Mapbox demand-units layer and project
  // each vertex to panel-relative screen coordinates.
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const computePolygonDataRef = useRef<() => void>(() => {})

  const computePolygonData = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current)
      retryTimerRef.current = null
    }

    if (!mapAPI.mapRef?.current || !panelRef.current || centroids.length === 0)
      return

    const map = mapAPI.mapRef.current.getMap?.()
    if (!map || !map.isStyleLoaded?.() || !map.getLayer("demand-units")) return

    const panelEl = panelRef.current
    const panelRect = panelEl.getBoundingClientRect()
    // SVG uses position:absolute;inset:0 so its origin is inside the border
    const svgOriginX = panelRect.left + panelEl.clientLeft
    const svgOriginY = panelRect.top + panelEl.clientTop

    const centroidLookup = new Map(centroids.map((c) => [c.id, c]))

    // querySourceFeatures returns all loaded tile data (including off-screen),
    // giving more complete coverage than queryRenderedFeatures.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let features: any[] = []
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const layer = map.getLayer("demand-units") as any
      const sourceId: string | undefined = layer?.source
      const sourceLayer: string | undefined =
        layer?.sourceLayer ?? layer?.["source-layer"]
      if (sourceId && sourceLayer) {
        features = map.querySourceFeatures(sourceId, { sourceLayer })
      }
    } catch {
      /* fall through */
    }
    if (features.length === 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      features = map.queryRenderedFeatures(undefined as any, {
        layers: ["demand-units"],
      })
    }

    if (features.length === 0) {
      retryTimerRef.current = setTimeout(computePolygonData, 1000)
      return
    }

    // Tile boundaries clip polygons into fragments.keep the largest per DU_ID
    const bestRings = new Map<
      string,
      { ring: [number, number][]; cData: (typeof centroids)[0] }
    >()
    for (const f of features) {
      const duId: string | undefined = f.properties?.DU_ID
      if (!duId) continue
      const cData = centroidLookup.get(duId)
      if (!cData) continue
      const ring = extractOuterRing(f.geometry)
      if (!ring || ring.length < 3) continue
      const existing = bestRings.get(duId)
      if (!existing || ring.length > existing.ring.length) {
        bestRings.set(duId, { ring, cData })
      }
    }

    const result: PolygonMorphData[] = []
    for (const [, { ring, cData }] of bestRings) {
      const screenPoly: [number, number][] = []
      for (const [lng, lat] of ring) {
        try {
          const pt = map.project([lng, lat])
          screenPoly.push([pt.x - svgOriginX, pt.y - svgOriginY])
        } catch {
          /* vertex outside projection bounds */
        }
      }
      if (screenPoly.length < 3) continue

      let centroidPt: { x: number; y: number }
      try {
        centroidPt = map.project([cData.lng, cData.lat])
      } catch {
        continue
      }

      result.push({
        screenPoly,
        centroidScreen: [centroidPt.x - svgOriginX, centroidPt.y - svgOriginY],
        color: cData.color,
        tier: cData.tier,
      })
    }

    const zoom = map.getZoom()
    const fo = lerpZoom(zoom, [5, 0.75], [8, 0.55], [10, 0.35])
    const sw = lerpZoom(zoom, [5, 0.5], [7, 1], [9, 2])
    setMapStyle({ fillOpacity: fo, strokeWidth: sw })

    setPolygonData(result)
  }, [centroids, mapAPI])

  // Keep ref in sync so the camera effect can call the latest version
  computePolygonDataRef.current = computePolygonData

  useEffect(() => {
    window.addEventListener("resize", computePolygonData)
    return () => window.removeEventListener("resize", computePolygonData)
  }, [computePolygonData])

  if (error) {
    return (
      <Box
        sx={{
          minHeight: "50vh",
          backgroundColor: theme.palette.common.white,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="body1" color="text.secondary">
          Could not load tier animation data.
        </Typography>
      </Box>
    )
  }

  const blueBg = theme.palette.tabPanels.explore

  return (
    <div
      ref={runwayRef}
      style={{
        position: "relative",
        minHeight: SCROLL_RUNWAY,
        clipPath: "inset(0)",
      }}
    >
      <StickyElement top={0}>
        <Box
          ref={panelRef}
          sx={{
            position: "relative",
            height: "100vh",
            backgroundColor: "transparent",
            overflow: "hidden",
            boxShadow: `0 0 0 100vmax ${blueBg}`,
          }}
        >
          {/* Header */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              p: theme.space.panel.padding,
              zIndex: 3,
              pointerEvents: "none",
            }}
          >
            <Typography variant="h3" component="h2" color="text.secondary">
              Key outcomes
            </Typography>
            <Typography
              variant="body1"
              sx={{ mt: 1, maxWidth: 420, color: "text.secondary" }}
            >
              Each polygon on the map represents an agricultural district
              receiving surface water.
            </Typography>
          </Box>

          {isLoading ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
              }}
            >
              <CircularProgress size={40} />
            </Box>
          ) : (
            <>
              {/* White overlay that fades IN to cover the persistent map */}
              <MapFade opacity={mapOpacity} />

              {/* Polygon shapes morph into squares then into tier lines */}
              {polygonData.length > 0 && panelSize && (
                <PolygonMorphOverlay
                  polygons={polygonData}
                  panelWidth={panelSize.width}
                  panelHeight={panelSize.height}
                  fillOpacity={mapStyle.fillOpacity}
                  strokeWidth={mapStyle.strokeWidth}
                  scrollProgress={scrollYProgress}
                />
              )}
            </>
          )}
        </Box>
      </StickyElement>
    </div>
  )
}

function MapFade({ opacity }: { opacity: MotionValue<number> }) {
  const inverseOpacity = useTransform(opacity, (v) => 1 - v)

  return (
    <motion.div
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        width: "25%",
        backgroundColor: "white",
        opacity: inverseOpacity,
        pointerEvents: "none",
        zIndex: 1,
      }}
    />
  )
}

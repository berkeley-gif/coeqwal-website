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

const SCROLL_RUNWAY = "300vh"

const CAM_CENTER: [number, number] = [-120.5, 37.2]
const CAM_ZOOM = 6.2

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
  const { centroids, tierDistribution, isLoading, error } =
    useTierAnimationData()

  const runwayRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const cameraSetRef = useRef(false)

  const [panelSize, setPanelSize] = useState<{
    width: number
    height: number
  } | null>(null)
  const [polygonData, setPolygonData] = useState<PolygonMorphData[]>([])
  const [panelInView, setPanelInView] = useState(false)

  // Activate persistent map with AG_REV visualization on mount
  useEffect(() => {
    mapActions.setMapMode("get-started")
    mapActions.setOutcomeVisualization("AG_REV", "s0020")

    return () => {
      mapActions.setMapMode("hidden")
      mapActions.clearOutcomeVisualization()

      // Reset map padding on unmount
      if (mapAPI.mapRef?.current) {
        try {
          mapAPI.mapRef.current.easeTo({
            padding: { top: 0, bottom: 0, left: 0, right: 0 },
            duration: 0,
          })
        } catch { /* ok */ }
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

  // Fly camera to Central Valley with padding matching the panel position.
  // Deferred until the panel is in view (stuck position) so getBoundingClientRect is accurate.
  useEffect(() => {
    if (!panelInView || isLoading || !mapAPI.mapRef?.current || !panelRef.current)
      return
    if (cameraSetRef.current) return

    const timer = setTimeout(() => {
      if (!panelRef.current || !mapAPI.mapRef?.current) return

      const rect = panelRef.current.getBoundingClientRect()
      const vw = window.innerWidth
      const vh = window.innerHeight

      const padding = {
        top: Math.max(0, Math.round(rect.top)),
        bottom: Math.max(0, Math.round(vh - rect.bottom)),
        left: Math.max(0, Math.round(rect.left)),
        right: Math.max(0, Math.round(vw - rect.right)),
      }

      mapAPI.mapRef.current.easeTo({
        center: CAM_CENTER,
        zoom: CAM_ZOOM,
        bearing: 0,
        pitch: 0,
        duration: 1500,
        easing: (t: number) => t * (2 - t),
        padding,
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

  const mapOpacity = useTransform(scrollYProgress, [0, 0.3, 0.7], [1, 1, 0])

  // Fade out map polygons as squares appear (scroll-driven)
  const FILL_LAYER_ID = "demand-units"
  const OUTLINE_LAYER_ID = "demand-units-outline"

  useEffect(() => {
    const mapRef = mapAPI.mapRef?.current
    if (!mapRef || isLoading) return

    const unsubscribe = scrollYProgress.on("change", (v) => {
      const map = mapRef.getMap?.()
      if (!map || !map.isStyleLoaded?.()) return

      // Polygons fade from full to 0 between 0.1 and 0.3
      const polyOpacity = Math.max(0, Math.min(1, 1 - (v - 0.1) / 0.2))

      try {
        if (map.getLayer(FILL_LAYER_ID)) {
          map.setPaintProperty(FILL_LAYER_ID, "fill-opacity", polyOpacity)
        }
        if (map.getLayer(OUTLINE_LAYER_ID)) {
          map.setPaintProperty(OUTLINE_LAYER_ID, "line-opacity", polyOpacity)
        }
      } catch { /* layer may not exist yet */ }
    })

    return () => {
      unsubscribe()
      // Restore full opacity on cleanup
      const map = mapRef.getMap?.()
      if (map?.isStyleLoaded?.()) {
        try {
          if (map.getLayer(FILL_LAYER_ID)) {
            map.setPaintProperty(FILL_LAYER_ID, "fill-opacity", 1)
          }
          if (map.getLayer(OUTLINE_LAYER_ID)) {
            map.setPaintProperty(OUTLINE_LAYER_ID, "line-opacity", 1)
          }
        } catch { /* ok */ }
      }
    }
  }, [scrollYProgress, mapAPI.mapRef, isLoading])

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
  const computePolygonData = useCallback(() => {
    if (!mapAPI.mapRef?.current || !panelRef.current || centroids.length === 0)
      return

    const map = mapAPI.mapRef.current.getMap?.()
    if (!map || !map.isStyleLoaded?.() || !map.getLayer("demand-units")) return

    const panelRect = panelRef.current.getBoundingClientRect()

    // Build lookup from centroid data (AG demand units only)
    const centroidLookup = new Map(
      centroids.map((c) => [c.id, c]),
    )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const features: any[] = map.queryRenderedFeatures(undefined as any, {
      layers: ["demand-units"],
    })

    const seen = new Set<string>()
    const result: PolygonMorphData[] = []

    for (const f of features) {
      const duId: string | undefined = f.properties?.DU_ID
      if (!duId || seen.has(duId)) continue
      seen.add(duId)

      const cData = centroidLookup.get(duId)
      if (!cData) continue // not an AG unit in our tier data

      const ring = extractOuterRing(f.geometry)
      if (!ring || ring.length < 3) continue

      const screenPoly: [number, number][] = []
      for (const [lng, lat] of ring) {
        try {
          const pt = map.project([lng, lat])
          screenPoly.push([pt.x - panelRect.left, pt.y - panelRect.top])
        } catch {
          /* vertex outside projection bounds */
        }
      }
      if (screenPoly.length < 3) continue

      const centroidPt = mapAPI.project(cData.lng, cData.lat)
      if (!centroidPt) continue

      result.push({
        screenPoly,
        centroidScreen: [
          centroidPt.x - panelRect.left,
          centroidPt.y - panelRect.top,
        ],
        color: cData.color,
        tier: cData.tier,
      })
    }

    setPolygonData(result)
  }, [centroids, mapAPI])

  // Compute polygon data after camera has settled and panel is in view
  useEffect(() => {
    if (!panelInView || isLoading || centroids.length === 0) return
    const timer = setTimeout(computePolygonData, 2000)
    return () => clearTimeout(timer)
  }, [panelInView, isLoading, centroids, computePolygonData])

  useEffect(() => {
    window.addEventListener("resize", computePolygonData)
    return () => window.removeEventListener("resize", computePolygonData)
  }, [computePolygonData])

  if (error) {
    return (
      <Box
        sx={{
          mx: theme.space.section.sm,
          my: theme.space.section.sm,
          minHeight: "50vh",
          borderRadius: theme.borderRadius.lg,
          backgroundColor: theme.palette.common.white,
          border: theme.border.heavy,
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
  const spacing = theme.space.section.sm * 8

  return (
    <div
      ref={runwayRef}
      style={{
        position: "relative",
        minHeight: SCROLL_RUNWAY,
        clipPath: "inset(0)",
        paddingLeft: spacing,
        paddingRight: spacing,
        paddingTop: spacing,
        paddingBottom: spacing,
      }}
    >
      <StickyElement top={0}>
        <Box
          ref={panelRef}
          sx={{
            position: "relative",
            height: "80vh",
            borderRadius: theme.borderRadius.lg,
            backgroundColor: "transparent",
            border: theme.border.heavy,
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
              Outcomes
            </Typography>
            <Typography
              variant="body1"
              sx={{ mt: 1, maxWidth: 420, color: "text.secondary" }}
            >
              Each polygon on the map represents an agricultural demand unit.
              Scroll to see how they assemble into the tier distribution glyph.
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
                  tierDistribution={tierDistribution}
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

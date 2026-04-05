"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import {
  Box,
  Typography,
  useTheme,
  CircularProgress,
  IconButton,
  PlayArrowIcon,
} from "@repo/ui/mui"
import { useMotionValue, useTransform, motion, animate } from "@repo/motion"
import type { MotionValue } from "@repo/motion"
import { useMap } from "@repo/map"
import { mapActions } from "../../map/store"
import { useTierAnimationData } from "./useTierAnimationData"
import PolygonMorphOverlay, {
  type PolygonMorphData,
} from "./PolygonMorphOverlay"
import BeatTextOverlay from "./BeatTextOverlay"
import ResearcherIllustrations from "./ResearcherIllustrations"

const TOTAL_DURATION = 30

const CAM_CENTER: [number, number] = [-120.2, 38.5]
const CAM_ZOOM = 5.82

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

export default function TierAnimationSection() {
  const theme = useTheme()
  const mapAPI = useMap()
  const { centroids, isLoading, error } = useTierAnimationData()

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
  const [isPlaying, setIsPlaying] = useState(false)

  const polygonsAllowedRef = useRef(false)

  /* ── Time-based progress (0 → 1) ── */
  const progress = useMotionValue(0)

  // Beat 2 overlay: global 0.30–0.75 → 0–1
  const beat2Progress = useTransform(progress, [0.3, 0.75], [0, 1])
  // Map visibility: fully visible through beat 1, fades during early beat 2
  const mapOpacity = useTransform(progress, [0, 0.3, 0.4], [1, 1, 0])
  // SVG overlay fades out for beat 3
  const overlayOpacity = useTransform(progress, [0.73, 0.78], [1, 0])
  // Static heading fades once animation begins
  const headingOpacity = useTransform(progress, [0, 0.02, 0.06], [1, 1, 0])

  const controlsRef = useRef<ReturnType<typeof animate> | null>(null)

  const handlePlay = useCallback(() => {
    if (controlsRef.current) controlsRef.current.stop()
    progress.set(0)
    setIsPlaying(true)
    controlsRef.current = animate(progress, 1, {
      duration: TOTAL_DURATION,
      ease: "linear",
      onComplete: () => setIsPlaying(false),
    })
  }, [progress])

  useEffect(() => {
    return () => {
      controlsRef.current?.stop()
    }
  }, [])

  /* ── Activate persistent map with AG_REV visualization ── */
  useEffect(() => {
    mapActions.setMapMode("get-started")
    mapActions.setOutcomeVisualization("AG_REV", "s0020")

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

  /* ── Detect when panel scrolls into view ── */
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
  }, [])

  /* ── Fly camera once panel is visible ── */
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
              { duration: 600, delay: 0 },
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

  /* ── Beat-1 map effects + Mapbox polygon visibility ── */
  useEffect(() => {
    const mapRef = mapAPI.mapRef?.current
    if (!mapRef || isLoading) return

    const fillOpacityBase = lerpZoom(
      CAM_ZOOM,
      [5, 0.75],
      [8, 0.55],
      [10, 0.35],
    )
    let mapHidden = false

    const unsub = progress.on("change", (v) => {
      const map = mapRef.getMap?.()
      if (!map?.isStyleLoaded?.()) return

      if (v < 0.01) {
        if (mapHidden) {
          try {
            if (map.getLayer("demand-units"))
              map.setPaintProperty(
                "demand-units",
                "fill-opacity",
                fillOpacityBase,
              )
            if (map.getLayer("demand-units-outline"))
              map.setPaintProperty("demand-units-outline", "line-opacity", 1)
          } catch {
            /* ok */
          }
          mapHidden = false
        }
        return
      }

      if (v < 0.3) {
        const beat1T = v / 0.3
        const pulse = Math.sin(beat1T * Math.PI * 3)
        const opacity = 0.15 + fillOpacityBase * (0.5 + 0.5 * pulse)
        try {
          if (map.getLayer("demand-units"))
            map.setPaintProperty("demand-units", "fill-opacity", opacity)
        } catch {
          /* ok */
        }
        mapHidden = false
      } else if (!mapHidden) {
        try {
          if (map.getLayer("demand-units"))
            map.setPaintProperty("demand-units", "fill-opacity", 0)
          if (map.getLayer("demand-units-outline"))
            map.setPaintProperty("demand-units-outline", "line-opacity", 0)
        } catch {
          /* ok */
        }
        mapHidden = true
      }
    })

    return () => {
      unsub()
      const map = mapRef.getMap?.()
      if (map?.isStyleLoaded?.()) {
        try {
          if (map.getLayer("demand-units"))
            map.setPaintProperty(
              "demand-units",
              "fill-opacity",
              fillOpacityBase,
            )
          if (map.getLayer("demand-units-outline"))
            map.setPaintProperty("demand-units-outline", "line-opacity", 1)
        } catch {
          /* ok */
        }
      }
    }
  }, [progress, mapAPI.mapRef, isLoading])

  /* ── Measure panel for SVG coordinate mapping ── */
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

  /* ── Compute SVG polygon data from Mapbox demand-units layer ── */
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
    const svgOriginX = panelRect.left + panelEl.clientLeft
    const svgOriginY = panelRect.top + panelEl.clientTop

    const centroidLookup = new Map(centroids.map((c) => [c.id, c]))

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

  computePolygonDataRef.current = computePolygonData

  useEffect(() => {
    window.addEventListener("resize", computePolygonData)
    return () => window.removeEventListener("resize", computePolygonData)
  }, [computePolygonData])

  /* ── Error state ── */
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

  const forestBg = theme.palette.nature.forest

  return (
    <Box
      ref={panelRef}
      sx={{
        position: "relative",
        height: "100vh",
        backgroundColor: "transparent",
        overflow: "hidden",
        clipPath: "inset(0)",
      }}
    >
      {/* Static heading — fades when animation starts */}
      <motion.div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          padding: theme.space.panel.padding,
          zIndex: 4,
          pointerEvents: "none",
          opacity: headingOpacity,
        }}
      >
        <Typography variant="h3" component="h2" color="text.secondary">
          Key outcomes
        </Typography>
      </motion.div>

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
          {/* Background cover: transparent → forest green as map fades */}
          <MapFade opacity={mapOpacity} color={forestBg} />

          {/* SVG polygon morph overlay — active during Beat 2 */}
          {polygonData.length > 0 && panelSize && (
            <motion.div
              style={{
                opacity: overlayOpacity,
                position: "absolute",
                inset: 0,
              }}
            >
              <PolygonMorphOverlay
                polygons={polygonData}
                panelWidth={panelSize.width}
                panelHeight={panelSize.height}
                fillOpacity={mapStyle.fillOpacity}
                strokeWidth={mapStyle.strokeWidth}
                scrollProgress={beat2Progress}
              />
            </motion.div>
          )}

          {/* Researcher illustrations — Beat 3 */}
          {panelSize && (
            <ResearcherIllustrations
              progress={progress}
              panelWidth={panelSize.width}
              panelHeight={panelSize.height}
            />
          )}

          {/* Cross-fading beat text */}
          <BeatTextOverlay progress={progress} />

          {/* Play / Replay button */}
          {!isPlaying && (
            <Box
              sx={{
                position: "absolute",
                bottom: "10%",
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 5,
              }}
            >
              <IconButton
                onClick={handlePlay}
                sx={{
                  width: 64,
                  height: 64,
                  backgroundColor: "rgba(255,255,255,0.2)",
                  backdropFilter: "blur(8px)",
                  color: "text.secondary",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.35)",
                  },
                }}
              >
                <PlayArrowIcon sx={{ fontSize: 36 }} />
              </IconButton>
            </Box>
          )}
        </>
      )}
    </Box>
  )
}

function MapFade({
  opacity,
  color,
}: {
  opacity: MotionValue<number>
  color: string
}) {
  const fadeOpacity = useTransform(opacity, (v) => 1 - v)

  return (
    <motion.div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: color,
        opacity: fadeOpacity,
        pointerEvents: "none",
        zIndex: 1,
      }}
    />
  )
}

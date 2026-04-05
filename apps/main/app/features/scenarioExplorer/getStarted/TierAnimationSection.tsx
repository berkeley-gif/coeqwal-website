"use client"

import { useRef, useState, useEffect, useCallback, useMemo } from "react"
import {
  Box,
  Typography,
  useTheme,
  CircularProgress,
  IconButton,
  PlayArrowIcon,
  PauseIcon,
  ReplayIcon,
} from "@repo/ui/mui"
import { useMotionValue, useTransform, motion, animate } from "@repo/motion"
import type { MotionValue } from "@repo/motion"
import { useMap } from "@repo/map"
import {
  type ShapeMorphData,
  diamondPoints,
  circlePoints,
  lineSegmentPoints,
  POINTS_PER_SHAPE,
} from "@repo/viz"
import { mapActions, useActiveOutcomeVisualization } from "../../map/store"
import {
  getOutcomeConfig,
  RESERVOIR_CALSIM_TO_GNISIDLABEL,
} from "../../map/config/outcomeLayerRegistry"
import { CALIFORNIA_CENTERED_VIEW } from "../../map/config/cameraPresets"
import {
  getOutcomeLocationCoordinates,
  SALMON_RIVER_CENTROID,
} from "../../map/config/outcomeLocations"
import { useTierAnimationData } from "./useTierAnimationData"
import OutcomeMorphOverlay, {
  type OutcomeGroup,
  getOutcomeProgressRange,
  computeDistributionHeight,
} from "./OutcomeMorphOverlay"
import BeatTextOverlay from "./BeatTextOverlay"
// TODO(beat3): restore ResearcherIllustrations import
// import ResearcherIllustrations from "./ResearcherIllustrations"
import { OUTCOME_CODE_ORDER, getOutcomeName } from "../../../content/outcomes"

const TOTAL_DURATION = 30

const CAM_CENTER: [number, number] = [-120.2, 38.5]
const CAM_ZOOM = 5.82

const BEAT1_COLORS = ["#BDE1E4", "#92C1D5", "#186b88"] as const
const BEAT1_CYCLE = 90
const BEAT1_MID = BEAT1_COLORS[1] // convergence target

function blendHex(a: string, b: string, t: number): string {
  const [r1, g1, b1] = parseHex(a)
  const [r2, g2, b2] = parseHex(b)
  const r = Math.round(r1 + (r2 - r1) * t)
    .toString(16)
    .padStart(2, "0")
  const g = Math.round(g1 + (g2 - g1) * t)
    .toString(16)
    .padStart(2, "0")
  const bl = Math.round(b1 + (b2 - b1) * t)
    .toString(16)
    .padStart(2, "0")
  return `#${r}${g}${bl}`
}

/** Mapbox fill-color expression that smoothly cycles each polygon through the
 *  three beat-1 blues. `convergence` (0-1) shrinks the palette toward a single
 *  blue so all polygons end up the same color before the tier-color blend. */
function beat1FillExpr(phase: number, convergence = 0): unknown[] {
  const c0 =
    convergence > 0
      ? blendHex(BEAT1_COLORS[0], BEAT1_MID, convergence)
      : BEAT1_COLORS[0]
  const c1 = BEAT1_MID
  const c2 =
    convergence > 0
      ? blendHex(BEAT1_COLORS[2], BEAT1_MID, convergence)
      : BEAT1_COLORS[2]
  return [
    "interpolate-hcl",
    ["linear"],
    ["%", ["+", ["coalesce", ["id"], 0], Math.round(phase)], BEAT1_CYCLE],
    0,
    c0,
    30,
    c1,
    60,
    c2,
    89,
    c0,
  ]
}

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace("#", "")
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
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

const OUTCOME_DISPLAY_ORDER = OUTCOME_CODE_ORDER.map((code) => ({
  code,
  label: getOutcomeName(code),
}))

/** All polygon Mapbox layers that may need suppression/cleanup during animation. */
const ANIM_POLYGON_LAYERS = [
  { fill: "demand-units", outline: "demand-units-outline" },
  { fill: "calsim-wba", outline: "calsim-wba-outline" },
  { fill: "california-reservoir", outline: "california-reservoir-outline" },
  { fill: "delta-water", outline: "delta-water-outline" },
] as const

const ANIM_LINE_LAYERS = ["sacramento-river-body"] as const

const ACTIVE_OUTCOMES = new Set([
  "CWS_DEL",
  "AG_REV",
  "ENV_FLOWS",
  "GW_STOR",
  "RES_STOR",
  "DELTA_ECO",
  "FW_DELTA_USES",
  "FW_EXP",
  "WRC_SALMON_AB",
])

const LAYOUT_LINE_HEIGHT = 32
const LAYOUT_LABEL_GAP = 8
const LAYOUT_DIST_GAP = 6
const LAYOUT_COUNT_HEIGHT = 18
const LAYOUT_POST_DIST_GAP = 12

interface OutcomeLayoutItem {
  code: string
  label: string
  y: number
  x: number
  column: 0 | 1
  columnWidth: number
  isActive: boolean
  distributionY: number
  distributionHeight: number
  locationCount: number
}

interface ScreenPolygon {
  screenPoly: [number, number][]
  centroidScreen: [number, number]
}

export default function TierAnimationSection() {
  const theme = useTheme()
  const mapAPI = useMap()
  const { centroids, outcomeLocations, allLocationIds, isLoading, error } =
    useTierAnimationData()

  const panelRef = useRef<HTMLDivElement>(null)
  const cameraSetRef = useRef(false)

  const [panelSize, setPanelSize] = useState<{
    width: number
    height: number
  } | null>(null)
  const [allScreenPolygons, setAllScreenPolygons] = useState<
    Map<string, ScreenPolygon>
  >(new Map())
  const [panelInView, setPanelInView] = useState(false)
  const [playState, setPlayState] = useState<
    "idle" | "playing" | "paused" | "finished"
  >("idle")

  const polygonsAllowedRef = useRef(false)

  /* ── Time-based progress (0 → 1) ── */
  const progress = useMotionValue(0)

  // Map visibility: stays visible through beat 2
  // TODO(beat3): restore fade-out: useTransform(progress, [0, 0.72, 0.78], [1, 1, 0])
  const mapOpacity = useTransform(progress, [0, 1], [1, 1])
  // TODO(beat3): restore fade-out: useTransform(progress, [0.73, 0.78], [1, 0])
  const overlayOpacity = useTransform(progress, [0, 1], [1, 1])
  // Static heading fades once animation begins
  const headingOpacity = useTransform(progress, [0, 0.02, 0.06], [1, 1, 0])

  const controlsRef = useRef<ReturnType<typeof animate> | null>(null)

  const handlePlay = useCallback(() => {
    if (controlsRef.current) controlsRef.current.stop()
    computePolygonDataRef.current()

    const currentVal = progress.get()
    const startFrom = currentVal >= 1 ? 0 : currentVal
    if (startFrom === 0) {
      progress.set(0)
      mapActions.setOutcomeVisualization("AG_REV", "s0020")
    }

    const remaining = (1 - startFrom) * TOTAL_DURATION
    setPlayState("playing")
    controlsRef.current = animate(progress, 1, {
      duration: remaining,
      ease: "linear",
      onComplete: () => {
        setPlayState("finished")
        mapActions.clearOutcomeVisualization()

        // Reset all animation polygon layers to a clean state so
        // OutcomePolygonLayer can manage them for interactive toggling.
        const map = mapAPI.mapRef?.current?.getMap?.()
        if (map?.isStyleLoaded?.()) {
          try {
            for (const { fill, outline } of ANIM_POLYGON_LAYERS) {
              if (map.getLayer(fill)) {
                map.setPaintProperty(fill, "fill-opacity-transition", {
                  duration: 0,
                  delay: 0,
                })
                map.setPaintProperty(fill, "fill-opacity", 0)
                map.setFilter(fill, null)
              }
              if (map.getLayer(outline)) {
                map.setPaintProperty(outline, "line-opacity", 0)
              }
            }
            for (const lineLayer of ANIM_LINE_LAYERS) {
              if (map.getLayer(lineLayer)) {
                map.setPaintProperty(lineLayer, "line-opacity", 0)
              }
            }
          } catch {
            /* ok */
          }
        }
      },
    })
  }, [progress])

  const handlePause = useCallback(() => {
    if (controlsRef.current) controlsRef.current.stop()
    setPlayState("paused")
  }, [])

  const handleRewind = useCallback(() => {
    if (controlsRef.current) controlsRef.current.stop()
    computePolygonDataRef.current()
    progress.set(0)
    setPlayState("idle")
    mapActions.setOutcomeVisualization("AG_REV", "s0020")
  }, [progress])

  const activeVisualization = useActiveOutcomeVisualization()
  const selectedOutcomeCode = activeVisualization?.outcomeCode ?? null

  const isInteractive = playState === "finished"

  const handleOutcomeClick = useCallback(
    (code: string) => {
      mapActions.clearMapTooltips()

      const isToggleOff = selectedOutcomeCode === code
      mapActions.toggleOutcomeVisualization(code, "s0020")

      const map = mapAPI.mapRef?.current?.getMap?.()
      if (!map) return

      if (isToggleOff) {
        map.easeTo({
          center: { lng: CAM_CENTER[0], lat: CAM_CENTER[1] },
          zoom: CAM_ZOOM,
          duration: 1000,
        })
      } else {
        const config = getOutcomeConfig(code)
        const target = config?.cameraPreset ?? CALIFORNIA_CENTERED_VIEW
        map.easeTo({
          center: { lng: target.longitude, lat: target.latitude },
          zoom: target.zoom,
          duration: 1000,
        })
      }
    },
    [selectedOutcomeCode, mapAPI.mapRef],
  )

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
        for (const { fill, outline } of ANIM_POLYGON_LAYERS) {
          if (map.getLayer(fill)) map.setPaintProperty(fill, "fill-opacity", 0)
          if (map.getLayer(outline))
            map.setPaintProperty(outline, "line-opacity", 0)
        }
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
          // Set up demand-units for the beat-1 color cycling
          if (map.getLayer("demand-units")) {
            map.setPaintProperty("demand-units", "fill-opacity", 0)
            map.setPaintProperty(
              "demand-units",
              "fill-color",
              beat1FillExpr(0) as never,
            )
            map.setPaintProperty(
              "demand-units",
              "fill-outline-color",
              "transparent",
            )
          }
          // Suppress all other polygon layers until their beat-2 turn
          for (const { fill, outline } of ANIM_POLYGON_LAYERS) {
            if (fill === "demand-units") continue // already handled above
            if (map.getLayer(fill))
              map.setPaintProperty(fill, "fill-opacity", 0)
            if (map.getLayer(outline))
              map.setPaintProperty(outline, "line-opacity", 0)
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

  /* ── Build a Mapbox fill-color expression that assigns tier colors ── */
  const outcomeLocationsRef = useRef(outcomeLocations)
  outcomeLocationsRef.current = outcomeLocations

  /** Pre-compute per-DU tier color lookup (first outcome wins). */
  const tierColorLookupRef = useRef<Map<string, string>>(new Map())

  useEffect(() => {
    const lookup = new Map<string, string>()
    for (const { code } of OUTCOME_DISPLAY_ORDER) {
      const data = outcomeLocations[code]
      if (!data) continue
      for (const duId of data.ids) {
        if (lookup.has(duId)) continue
        const color = data.colorMap[duId]
        if (color) lookup.set(duId, color)
      }
    }
    tierColorLookupRef.current = lookup
  }, [outcomeLocations])

  /** Pre-compute the schedule for hiding map features as SVG takes over.
   *  Supports polygon layers (per-feature fade), line layers (global opacity),
   *  and react-marker (no Mapbox layer to hide). */
  interface HideScheduleEntry {
    code: string
    geometryType: "polygon" | "line" | "react-marker"
    mapboxLayerId: string
    idProperty: string
    fadeStart: number
    morphStart: number
    locationIds: string[]
  }
  const hideScheduleRef = useRef<HideScheduleEntry[]>([])

  /** Build a Mapbox match expression blending from `fromHex` to each DU's
   *  tier color at ratio `t` (0 = all from, 1 = all tier). */
  function buildBlendedTierExpr(fromHex: string, t: number): unknown[] | null {
    const lookup = tierColorLookupRef.current
    if (lookup.size === 0) return null

    const [fr, fg, fb] = parseHex(fromHex)
    const pairs: (string | unknown)[] = []
    for (const [duId, tierHex] of lookup) {
      const [tr, tg, tb] = parseHex(tierHex)
      const r = Math.round(fr + (tr - fr) * t)
      const g = Math.round(fg + (tg - fg) * t)
      const b = Math.round(fb + (tb - fb) * t)
      pairs.push(duId, `rgb(${r},${g},${b})`)
    }
    return ["match", ["get", "DU_ID"], ...pairs, fromHex]
  }

  /* ── Beat-1 map effects + Beat-2 tier color transition ── */
  useEffect(() => {
    const mapRef = mapAPI.mapRef?.current
    if (!mapRef || isLoading) return

    let phase: "idle" | "beat1" | "beat2" = "idle"

    // Blues cycle until FREEZE_AT, then hold still.
    // At CONVERGE_START the frozen blues collapse toward a single blue.
    // At BLEND_START the per-DU tier-color blend begins.
    // By BLEND_END the blend is complete and beat2 phase starts.
    const FREEZE_AT = 0.18
    const CONVERGE_START = 0.58
    const BLEND_START = 0.62
    const BLEND_END = 0.68

    let frozenColorPhase = 0

    const unsub = progress.on("change", (v) => {
      const map = mapRef.getMap?.()
      if (!map?.isStyleLoaded?.()) return

      if (v < 0.01) {
        if (phase !== "idle") {
          try {
            if (map.getLayer("demand-units")) {
              map.setPaintProperty("demand-units", "fill-opacity", 0)
              map.setPaintProperty("demand-units", "fill-color-transition", {
                duration: 0,
                delay: 0,
              })
              map.setPaintProperty(
                "demand-units",
                "fill-color",
                beat1FillExpr(0) as never,
              )
            }
            if (map.getLayer("demand-units-outline"))
              map.setPaintProperty("demand-units-outline", "line-opacity", 0)
          } catch {
            /* ok */
          }
          phase = "idle"
          frozenColorPhase = 0
        }
        return
      }

      if (v < CONVERGE_START) {
        // Beat 1: blues cycling, then frozen
        const beat1T = v / 0.3

        const fadeIn = Math.min(1, beat1T / 0.33)
        const base = 0.65 * fadeIn
        const breath = fadeIn >= 1 ? 0.05 * Math.sin(beat1T * Math.PI * 4) : 0
        const opacity = base + breath

        if (v < FREEZE_AT) {
          // Actively cycling
          const colorPhase = beat1T * BEAT1_CYCLE
          frozenColorPhase = colorPhase
          try {
            if (map.getLayer("demand-units")) {
              map.setPaintProperty(
                "demand-units",
                "fill-color",
                beat1FillExpr(colorPhase) as never,
              )
              map.setPaintProperty("demand-units", "fill-opacity", opacity)
            }
          } catch {
            /* ok */
          }
        } else {
          // Frozen: keep the last color pattern, maintain opacity at 0.65
          try {
            if (map.getLayer("demand-units")) {
              if (phase !== "beat1") {
                map.setPaintProperty(
                  "demand-units",
                  "fill-color",
                  beat1FillExpr(frozenColorPhase) as never,
                )
              }
              map.setPaintProperty("demand-units", "fill-opacity", 0.65)
            }
          } catch {
            /* ok */
          }
        }
        phase = "beat1"
      } else if (v < BLEND_START) {
        // Converge: collapse the 3-blue palette toward a single blue
        const convergence =
          (v - CONVERGE_START) / (BLEND_START - CONVERGE_START)
        const easedC = convergence * convergence

        try {
          if (map.getLayer("demand-units")) {
            map.setPaintProperty(
              "demand-units",
              "fill-color",
              beat1FillExpr(frozenColorPhase, easedC) as never,
            )
            map.setPaintProperty("demand-units", "fill-opacity", 0.65)
          }
        } catch {
          /* ok */
        }
        phase = "beat1"
      } else if (v < BLEND_END) {
        // Blend: all polygons are now the same blue; smoothly shift
        // each DU from that blue to its tier color.
        const blendT = (v - BLEND_START) / (BLEND_END - BLEND_START)
        const easedT = 1 - Math.pow(1 - blendT, 2) // ease-out

        try {
          if (map.getLayer("demand-units")) {
            const expr = buildBlendedTierExpr(BEAT1_MID, easedT)
            if (expr) {
              map.setPaintProperty("demand-units", "fill-color", expr as never)
            }
            map.setPaintProperty("demand-units", "fill-opacity", 0.65)
          }
        } catch {
          /* ok */
        }
        phase = "beat1"
      } else {
        // Beat 2+: tier colors locked in; progressively hide features
        // as their SVG copies start animating.
        if (phase !== "beat2") {
          try {
            const expr = buildBlendedTierExpr(BEAT1_MID, 1)
            if (expr && map.getLayer("demand-units")) {
              map.setPaintProperty("demand-units", "fill-color", expr as never)
            }
            // Show non-demand-unit polygon layers at their default styling
            for (const { fill } of ANIM_POLYGON_LAYERS) {
              if (fill === "demand-units") continue
              if (map.getLayer(fill)) {
                map.setPaintProperty(fill, "fill-opacity", 0.65)
              }
            }
          } catch {
            /* ok */
          }
          phase = "beat2"
        }

        // Group hide schedule entries by Mapbox layer for polygon outcomes
        const layerEntries = new Map<
          string,
          { idProperty: string; entries: typeof hideScheduleRef.current }
        >()
        const lineEntries: typeof hideScheduleRef.current = []

        for (const entry of hideScheduleRef.current) {
          if (v < entry.fadeStart) continue
          if (entry.geometryType === "polygon" && entry.mapboxLayerId) {
            let bucket = layerEntries.get(entry.mapboxLayerId)
            if (!bucket) {
              bucket = { idProperty: entry.idProperty, entries: [] }
              layerEntries.set(entry.mapboxLayerId, bucket)
            }
            bucket.entries.push(entry)
          } else if (entry.geometryType === "line" && entry.mapboxLayerId) {
            lineEntries.push(entry)
          }
          // react-marker: no Mapbox layer to hide (SVG replaces them)
        }

        // Per-layer polygon fade
        for (const [layerId, { idProperty, entries }] of layerEntries) {
          if (!map.getLayer(layerId)) continue
          const caseExpr: unknown[] = ["case"]
          for (const entry of entries) {
            const fadeDuration = entry.morphStart - entry.fadeStart
            const t = Math.min(1, (v - entry.fadeStart) / fadeDuration)
            const opacity = 0.65 * (1 - t)
            caseExpr.push(
              ["in", ["get", idProperty], ["literal", entry.locationIds]],
              opacity,
            )
          }
          caseExpr.push(0.65)
          try {
            map.setPaintProperty(layerId, "fill-opacity", caseExpr as never)
          } catch {
            /* ok */
          }
        }

        // For polygon layers with no active entries, restore default opacity
        const allPolygonLayers = new Set<string>()
        for (const entry of hideScheduleRef.current) {
          if (entry.geometryType === "polygon" && entry.mapboxLayerId) {
            allPolygonLayers.add(entry.mapboxLayerId)
          }
        }
        for (const layerId of allPolygonLayers) {
          if (layerEntries.has(layerId)) continue
          try {
            if (map.getLayer(layerId)) {
              map.setPaintProperty(layerId, "fill-opacity", 0.65)
            }
          } catch {
            /* ok */
          }
        }

        // Line outcome fade
        for (const entry of lineEntries) {
          const fadeDuration = entry.morphStart - entry.fadeStart
          const t = Math.min(1, (v - entry.fadeStart) / fadeDuration)
          const opacity = 1 - t
          try {
            if (map.getLayer(entry.mapboxLayerId)) {
              map.setPaintProperty(entry.mapboxLayerId, "line-opacity", opacity)
            }
          } catch {
            /* ok */
          }
        }
      }
    })

    return () => {
      unsub()
      const map = mapRef.getMap?.()
      if (map?.isStyleLoaded?.()) {
        try {
          for (const { fill, outline } of ANIM_POLYGON_LAYERS) {
            if (map.getLayer(fill))
              map.setPaintProperty(fill, "fill-opacity", 0)
            if (map.getLayer(outline))
              map.setPaintProperty(outline, "line-opacity", 0)
          }
          for (const lineLayer of ANIM_LINE_LAYERS) {
            if (map.getLayer(lineLayer))
              map.setPaintProperty(lineLayer, "line-opacity", 1)
          }
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

  /* ── Collect screen shapes from Mapbox layers + coordinate lookups ── */
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const computePolygonDataRef = useRef<() => void>(() => {})

  const collectOutcomeShapes = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current)
      retryTimerRef.current = null
    }

    if (!mapAPI.mapRef?.current || !panelRef.current) return
    if (centroids.length === 0 && allLocationIds.size === 0) return

    const map = mapAPI.mapRef.current.getMap?.()
    if (!map || !map.isStyleLoaded?.()) return

    const panelEl = panelRef.current
    const panelRect = panelEl.getBoundingClientRect()
    const svgOriginX = panelRect.left + panelEl.clientLeft
    const svgOriginY = panelRect.top + panelEl.clientTop

    const centroidLookup = new Map(centroids.map((c) => [c.id, c]))
    const screenMap = new Map<string, ScreenPolygon>()

    // ── 1. Query polygon-based Mapbox layers per the registry ──
    const layersToQuery = new Map<
      string,
      { idProperty: string; sourceLayerName?: string }
    >()

    for (const { code } of OUTCOME_DISPLAY_ORDER) {
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

      // Use querySourceFeatures exclusively — it ignores layer filters,
      // returning ALL features from loaded tiles. queryRenderedFeatures
      // would only return features matching the current layer filter
      // (e.g., AG_REV's Agriculture-only filter on demand-units), which
      // would silently exclude CWS_DEL and other filtered-out features.
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

      const bestRings = new Map<string, { ring: [number, number][] }>()
      for (const f of features) {
        const featureId: string | undefined = f.properties?.[idProperty]
        if (!featureId) continue
        const ring = extractOuterRing(f.geometry)
        if (!ring || ring.length < 3) continue
        const existing = bestRings.get(featureId)
        if (!existing || ring.length > existing.ring.length) {
          bestRings.set(featureId, { ring })
        }
      }

      for (const [featureId, { ring }] of bestRings) {
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

        let cx = 0,
          cy = 0
        for (const [x, y] of screenPoly) {
          cx += x
          cy += y
        }
        cx /= screenPoly.length
        cy /= screenPoly.length
        const centroidScreen: [number, number] = [cx, cy]

        const cData = centroidLookup.get(featureId)
        if (cData) {
          try {
            const pt = map.project([cData.lng, cData.lat])
            centroidScreen[0] = pt.x - svgOriginX
            centroidScreen[1] = pt.y - svgOriginY
          } catch {
            /* keep computed centroid */
          }
        }

        screenMap.set(featureId, { screenPoly, centroidScreen })
      }
    }

    // ── 2. React-marker outcomes: project coordinates to screen shapes ──
    for (const { code } of OUTCOME_DISPLAY_ORDER) {
      const config = getOutcomeConfig(code)
      if (!config || config.geometryType !== "react-marker") continue
      const locData = outcomeLocations[code]
      if (!locData) continue

      for (const locId of locData.ids) {
        if (screenMap.has(locId)) continue
        const coords = getOutcomeLocationCoordinates(code, locId)
        if (!coords) continue

        try {
          const pt = map.project(coords)
          const sx = pt.x - svgOriginX
          const sy = pt.y - svgOriginY

          let screenPoly: [number, number][]
          if (code === "ENV_FLOWS") {
            screenPoly = diamondPoints(sx, sy, 14, 20, POINTS_PER_SHAPE)
          } else {
            screenPoly = circlePoints(sx, sy, 8, POINTS_PER_SHAPE)
          }
          screenMap.set(locId, { screenPoly, centroidScreen: [sx, sy] })
        } catch {
          /* outside projection bounds */
        }
      }
    }

    // ── 3. Line outcomes: representative shape at centroid ──
    for (const { code } of OUTCOME_DISPLAY_ORDER) {
      const config = getOutcomeConfig(code)
      if (!config || config.geometryType !== "line") continue
      const locData = outcomeLocations[code]
      if (!locData) continue

      // WRC_SALMON_AB is single-value; use a synthetic ID
      const syntheticId = [...locData.ids][0] ?? code
      if (screenMap.has(syntheticId)) continue

      try {
        const pt = map.project(SALMON_RIVER_CENTROID)
        const sx = pt.x - svgOriginX
        const sy = pt.y - svgOriginY
        const screenPoly = lineSegmentPoints(
          sx - 15,
          sy,
          sx + 15,
          sy,
          8,
          POINTS_PER_SHAPE,
        )
        screenMap.set(syntheticId, { screenPoly, centroidScreen: [sx, sy] })
      } catch {
        /* outside projection bounds */
      }
    }

    if (!anyPolygonsFound && layersToQuery.size > 0) {
      retryTimerRef.current = setTimeout(collectOutcomeShapes, 1000)
      return
    }

    setAllScreenPolygons(screenMap)
  }, [centroids, allLocationIds, outcomeLocations, mapAPI])

  computePolygonDataRef.current = collectOutcomeShapes

  useEffect(() => {
    window.addEventListener("resize", collectOutcomeShapes)
    return () => window.removeEventListener("resize", collectOutcomeShapes)
  }, [collectOutcomeShapes])

  useEffect(() => {
    if (!panelInView || playState !== "idle") return
    const el = panelRef.current
    if (!el) return

    let scrollParent: Element | null = el.parentElement
    while (scrollParent) {
      const overflow = getComputedStyle(scrollParent).overflowY
      if (overflow === "auto" || overflow === "scroll") break
      scrollParent = scrollParent.parentElement
    }
    if (!scrollParent) return

    let timer: ReturnType<typeof setTimeout>
    const onScroll = () => {
      clearTimeout(timer)
      timer = setTimeout(() => computePolygonDataRef.current(), 150)
    }

    scrollParent.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      clearTimeout(timer)
      scrollParent.removeEventListener("scroll", onScroll)
    }
  }, [panelInView, playState])

  /* ── Build per-outcome shape groups for the morph overlay ── */
  const outcomeGroups: OutcomeGroup[] = useMemo(() => {
    if (allScreenPolygons.size === 0) return []
    return OUTCOME_DISPLAY_ORDER.map(({ code, label }) => {
      const locData = outcomeLocations[code]
      if (!locData) return { code, label, polygons: [] }
      const polygons: ShapeMorphData[] = []
      for (const locId of locData.ids) {
        // RES_STOR: API returns CalSim IDs; screen map uses gnisidlabel
        let screenKey = locId
        if (code === "RES_STOR" && !allScreenPolygons.has(locId)) {
          const gnisName = RESERVOIR_CALSIM_TO_GNISIDLABEL[locId]
          if (gnisName) screenKey = gnisName
        }
        const screen = allScreenPolygons.get(screenKey)
        if (!screen) continue
        polygons.push({
          screenShape: screen.screenPoly,
          centroidScreen: screen.centroidScreen,
          color: locData.colorMap[locId] || "#888888",
          tier: locData.tierMap[locId] || 1,
          sourceId: locId,
        })
      }
      return { code, label, polygons }
    }).filter((g) => g.polygons.length > 0)
  }, [allScreenPolygons, outcomeLocations])

  const activeOutcomeGroups = useMemo(
    () => outcomeGroups.filter((g) => ACTIVE_OUTCOMES.has(g.code)),
    [outcomeGroups],
  )

  useEffect(() => {
    const total = activeOutcomeGroups.length
    const schedule: HideScheduleEntry[] = []
    for (let i = 0; i < total; i++) {
      const group = activeOutcomeGroups[i]!
      const locData = outcomeLocations[group.code]
      if (!locData || locData.ids.size === 0) continue
      const config = getOutcomeConfig(group.code)
      if (!config) continue
      const [morphStart] = getOutcomeProgressRange(i, total)
      const fadeStart = morphStart - 0.03

      // For RES_STOR, translate CalSim IDs to gnisidlabel for Mapbox matching
      let locationIds = [...locData.ids]
      if (group.code === "RES_STOR") {
        const mapped = new Set<string>()
        for (const id of locationIds) {
          const gnis = RESERVOIR_CALSIM_TO_GNISIDLABEL[id]
          if (gnis) mapped.add(gnis)
        }
        locationIds = [...mapped]
      }

      schedule.push({
        code: group.code,
        geometryType: config.geometryType as
          | "polygon"
          | "line"
          | "react-marker",
        mapboxLayerId: config.mapboxLayerId,
        idProperty: config.idProperty ?? "",
        fadeStart,
        morphStart,
        locationIds,
      })
    }
    hideScheduleRef.current = schedule
  }, [activeOutcomeGroups, outcomeLocations])

  /* ── Shared layout for Beat 2 text + distribution alignment (2 columns) ── */
  const COLUMN_GAP = 12

  const outcomeLayout = useMemo(() => {
    if (!panelSize) return null
    const { width } = panelSize
    const sqPerRow = theme.scenarios.tierGrid.squaresPerRow
    const insetPx = 24
    const panelWidth3 = width * (1 / 3)
    const availableWidth = panelWidth3 - insetPx * 2
    const colWidth = (availableWidth - COLUMN_GAP) / 2
    const headerOffset = 132
    const topPad = headerOffset + Math.min(44, Math.max(28, width * 0.035))

    const itemStartY = topPad

    const LEFT_COLUMN_CODES = new Set(["CWS_DEL", "AG_REV"])
    const cursors: [number, number] = [itemStartY, itemStartY]
    const colX: [number, number] = [insetPx, insetPx + colWidth + COLUMN_GAP]

    const items: OutcomeLayoutItem[] = []

    for (let idx = 0; idx < OUTCOME_CODE_ORDER.length; idx++) {
      const code = OUTCOME_CODE_ORDER[idx]!
      const label = getOutcomeName(code)
      const isActive = ACTIVE_OUTCOMES.has(code)
      const col: 0 | 1 = LEFT_COLUMN_CODES.has(code) ? 0 : 1

      const y = cursors[col]
      const x = colX[col]
      cursors[col] += LAYOUT_LINE_HEIGHT

      const distributionY = cursors[col] + LAYOUT_DIST_GAP
      let distributionHeight = 0
      let locationCount = 0

      if (isActive) {
        const group = outcomeGroups.find((g) => g.code === code)
        if (group && group.polygons.length > 0) {
          locationCount = group.polygons.length
          distributionHeight = computeDistributionHeight(
            group.polygons,
            sqPerRow,
            colWidth,
          )
          cursors[col] +=
            LAYOUT_DIST_GAP +
            distributionHeight +
            LAYOUT_COUNT_HEIGHT +
            LAYOUT_POST_DIST_GAP
        } else {
          cursors[col] += LAYOUT_LABEL_GAP
        }
      } else {
        cursors[col] += LAYOUT_LABEL_GAP
      }

      items.push({
        code,
        label,
        y,
        x,
        column: col,
        columnWidth: colWidth,
        isActive,
        distributionY,
        distributionHeight,
        locationCount,
      })
    }

    return { items }
  }, [panelSize, outcomeGroups, theme.scenarios.tierGrid.squaresPerRow])

  const distributionPositionMap = useMemo(() => {
    if (!outcomeLayout) return {}
    const describeLocations = (code: string, count: number): string => {
      switch (code) {
        case "ENV_FLOWS":
          return `${count} river & tributary reaches`
        case "RES_STOR":
          return `${count} reservoirs`
        case "DELTA_ECO":
          return "Sacramento-San Joaquin Delta"
        case "FW_EXP":
          return "Banks & Jones Pumping Plants"
        case "FW_DELTA_USES":
          return "Emmaton & Jersey Point"
        case "WRC_SALMON_AB":
          return "population health along the Sacramento"
        default:
          return `${count} locations`
      }
    }

    const map: Record<
      string,
      {
        x: number
        y: number
        labelY: number
        maxWidth: number
        locationDescription: string
      }
    > = {}
    for (const item of outcomeLayout.items) {
      if (item.isActive && item.distributionHeight > 0) {
        map[item.code] = {
          x: item.x,
          y: item.distributionY,
          labelY: item.y,
          maxWidth: item.columnWidth,
          locationDescription: describeLocations(
            item.code,
            item.locationCount,
          ),
        }
      }
    }
    return map
  }, [outcomeLayout])

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

          {/* Outcome polygon morph overlay — active during Beat 2 */}
          {activeOutcomeGroups.length > 0 && panelSize && (
            <motion.div
              style={{
                opacity: overlayOpacity,
                position: "absolute",
                inset: 0,
                zIndex: 4,
              }}
            >
              <OutcomeMorphOverlay
                outcomes={activeOutcomeGroups}
                panelWidth={panelSize.width}
                panelHeight={panelSize.height}
                progress={progress}
                squaresPerRow={theme.scenarios.tierGrid.squaresPerRow}
                distributionPositionMap={distributionPositionMap}
                onOutcomeClick={isInteractive ? handleOutcomeClick : undefined}
                selectedOutcomeCode={isInteractive ? selectedOutcomeCode : null}
                interactive={isInteractive}
              />
            </motion.div>
          )}

          {/* TODO(beat3): restore ResearcherIllustrations
          {panelSize && (
            <ResearcherIllustrations
              progress={progress}
              panelWidth={panelSize.width}
              panelHeight={panelSize.height}
            />
          )}
          */}

          {/* Cross-fading beat text */}
          <BeatTextOverlay
            progress={progress}
            beat2Layout={outcomeLayout}
            onOutcomeClick={isInteractive ? handleOutcomeClick : undefined}
            selectedOutcomeCode={isInteractive ? selectedOutcomeCode : null}
            interactive={isInteractive}
          />

          {/* Playback controls */}
          <Box
            sx={{
              position: "absolute",
              bottom: "10%",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 5,
              display: "flex",
              gap: 1.5,
              alignItems: "center",
            }}
          >
            {/* Rewind — visible once the animation has started */}
            {playState !== "idle" && (
              <IconButton
                onClick={handleRewind}
                sx={{
                  width: 48,
                  height: 48,
                  backgroundColor: "rgba(255,255,255,0.15)",
                  backdropFilter: "blur(8px)",
                  color: "text.secondary",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.3)",
                  },
                }}
              >
                <ReplayIcon sx={{ fontSize: 24 }} />
              </IconButton>
            )}

            {/* Play / Pause toggle */}
            {playState === "playing" ? (
              <IconButton
                onClick={handlePause}
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
                <PauseIcon sx={{ fontSize: 36 }} />
              </IconButton>
            ) : (
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
            )}
          </Box>
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

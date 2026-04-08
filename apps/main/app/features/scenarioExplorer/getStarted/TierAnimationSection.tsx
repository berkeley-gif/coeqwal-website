"use client"

import { useRef, useState, useEffect, useCallback, useMemo } from "react"
import { Box, Typography, useTheme, CircularProgress } from "@repo/ui/mui"
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
import {
  mapActions,
  useActiveOutcomeVisualization,
  useLocationHighlights,
  useMapStore,
} from "../../map/store"
import {
  getOutcomeConfig,
  RESERVOIR_CALSIM_TO_GNISIDLABEL,
} from "../../map/config/outcomeLayerRegistry"
import { CALIFORNIA_CENTERED_VIEW } from "../../map/config/cameraPresets"
import {
  getOutcomeLocationCoordinates,
  SALMON_RIVER_CENTROID,
} from "../../map/config/outcomeLocations"
import {
  useTierAnimationData,
  useOutcomeTierOverrides,
} from "./useTierAnimationData"
import OutcomeMorphOverlay, {
  type OutcomeGroup,
  type LocationInfo,
  type EncodingMode,
  getOutcomeProgressRange,
  computeDistributionHeight,
  GLYPH_SIZE,
} from "./OutcomeMorphOverlay"
import BeatTextOverlay from "./BeatTextOverlay"
import PinnedLocationsList from "./PinnedLocationsList"
// TODO(beat3): restore ResearcherIllustrations import
// import ResearcherIllustrations from "./ResearcherIllustrations"
import { OUTCOME_CODE_ORDER, getOutcomeName } from "../../../content/outcomes"
import { getTierLabel } from "../../../content/tiers"
import { getDemandUnitDisplayName } from "../../map/config/demandUnitNames"
import { useScenarioTiers } from "../../scenarios/hooks/useTierData"
import { useScenarios } from "@repo/data/coeqwal/hooks"
import { useScenarioList } from "../../scenarios/hooks/useScenarioList"
import { useScenarioExplorerStore } from "../store"

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

/** Filter demand-units to only classes that correspond to tracked outcomes.
 *  Excludes "N/A" and other untracked classes that would otherwise show
 *  as spurious polygons during the beat-1 cycling animation. */
const DU_CLASS_FILTER = [
  "in",
  ["get", "Class"],
  ["literal", ["Agriculture", "Urban", "Refuge"]],
]

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

const LAYOUT_LINE_HEIGHT = 28
const LAYOUT_LABEL_GAP = 12 // space.gap.md (12px)
const LAYOUT_DIST_GAP = 4
const SLOT_COUNT_GAP = 10 // fixed gap between slot bottom and "X locations" text
const SLOT_COUNT_FONT = 11
const SLOT_POST_GAP = 8 // fixed gap after "X locations" text before next header
const BAR_VISUAL_HEIGHT = GLYPH_SIZE * 0.96 // 4 bars + 4 spacings within GLYPH_SIZE

const HIGHLIGHT_GOLD = "#ffd87e"
const BASE_FILL_OPACITY = 0.75
const ZOOM_THRESHOLD = 8
const ZOOMED_IN_OPACITY = 0.75
const ZOOM_AWARE_BASE_OPACITY = [
  "step",
  ["zoom"],
  BASE_FILL_OPACITY,
  ZOOM_THRESHOLD,
  ZOOMED_IN_OPACITY,
]

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
  slotHeight: number
  locationCount: number
  spaceBelow: number
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

  // Viewport-space polygon data (raw map.project() output, no panel offset).
  // Stable as long as the map hasn't panned/zoomed.
  const viewportDataRef = useRef<Map<string, ScreenPolygon>>(new Map())
  const [panelInView, setPanelInView] = useState(false)
  const [playState, setPlayState] = useState<
    "idle" | "playing" | "paused" | "finished"
  >("idle")

  const polygonsAllowedRef = useRef(false)
  const resolvedScenarioIdRef = useRef("s0020")

  /* ── Hide left-panel text when zoomed past threshold ── */
  const [textVisible, setTextVisible] = useState(true)
  const textVisibleRef = useRef(true)

  /* ── Time-based progress (0 → 1) ── */
  const progress = useMotionValue(0)

  // Map visibility: stays visible through beat 2
  // TODO(beat3): restore fade-out: useTransform(progress, [0, 0.72, 0.78], [1, 1, 0])
  const mapOpacity = useTransform(progress, [0, 1], [1, 1])
  // TODO(beat3): restore fade-out: useTransform(progress, [0.73, 0.78], [1, 0])
  const overlayOpacity = useTransform(progress, [0, 1], [1, 1])
  const headingOpacity = useTransform(progress, [0, 1], [1, 1])

  const controlsRef = useRef<ReturnType<typeof animate> | null>(null)

  /** Start (or resume) the progress animation. */
  const beginProgressAnimation = useCallback(
    (startFrom: number) => {
      const remaining = (1 - startFrom) * TOTAL_DURATION
      setPlayState("playing")
      controlsRef.current = animate(progress, 1, {
        duration: remaining,
        ease: "linear",
        onComplete: () => {
          setPlayState("finished")
          mapActions.clearOutcomeVisualization()
          mapActions.clearLocationHighlights()

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
    },
    [progress, mapAPI.mapRef],
  )

  const handlePlay = useCallback(() => {
    if (controlsRef.current) controlsRef.current.stop()

    const currentVal = progress.get()
    const startFrom = currentVal >= 1 ? 0 : currentVal
    const isRestart = startFrom === 0

    if (isRestart) {
      progress.set(0)
      mapActions.setOutcomeVisualization(
        "AG_REV",
        resolvedScenarioIdRef.current,
      )
    }

    // When starting from the beginning, fly the camera home first so
    // polygons align correctly even if the user panned/zoomed.
    const map = mapAPI.mapRef?.current?.getMap?.()
    if (isRestart && map) {
      const currentCenter = map.getCenter()
      const currentZoom = map.getZoom()
      const needsMove =
        Math.abs(currentCenter.lng - CAM_CENTER[0]) > 0.01 ||
        Math.abs(currentCenter.lat - CAM_CENTER[1]) > 0.01 ||
        Math.abs(currentZoom - CAM_ZOOM) > 0.05

      if (needsMove) {
        setPlayState("playing")
        map.once("moveend", () => {
          computePolygonDataRef.current()
          beginProgressAnimation(0)
        })
        map.easeTo({
          center: { lng: CAM_CENTER[0], lat: CAM_CENTER[1] },
          zoom: CAM_ZOOM,
          duration: 800,
        })
        return
      }
    }

    computePolygonDataRef.current()
    beginProgressAnimation(startFrom)
  }, [progress, mapAPI.mapRef, beginProgressAnimation])

  const handlePause = useCallback(() => {
    if (controlsRef.current) controlsRef.current.stop()
    setPlayState("paused")
  }, [])

  const handleRewind = useCallback(() => {
    if (controlsRef.current) controlsRef.current.stop()
    setHoveredLocation(null)
    setPinnedLocations(new Map())
    mapActions.clearLocationHighlights()
    mapActions.clearOutcomeVisualization()
    mapActions.clearMapTooltips()
    progress.set(0)
    setPlayState("idle")

    // Reset all Mapbox layers to their pre-animation state
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

      // Fly camera back to starting position
      map.easeTo({
        center: { lng: CAM_CENTER[0], lat: CAM_CENTER[1] },
        zoom: CAM_ZOOM,
        bearing: 0,
        pitch: 0,
        duration: 800,
      })
    }

    computePolygonDataRef.current()
  }, [progress, mapAPI.mapRef])

  const activeVisualization = useActiveOutcomeVisualization()
  const selectedOutcomeCode = activeVisualization?.outcomeCode ?? null

  const isInteractive = playState === "finished"

  /* ── Encoding mode: distribution | bar | average ── */
  const [encodingMode, setEncodingMode] = useState<EncodingMode>("distribution")
  const hydroclimate = useScenarioExplorerStore((s) => s.hydroclimate)
  const setHydroclimate = useScenarioExplorerStore((s) => s.setHydroclimate)
  const [spotlightedTier, setSpotlightedTier] = useState<number | null>(null)
  const { buildIdMapping } = useScenarioList()
  const resolvedScenarioId = useMemo(() => {
    const mapping = buildIdMapping(hydroclimate)
    return mapping["s0020"] ?? "s0020"
  }, [buildIdMapping, hydroclimate])
  const { chartData: tierChartData } = useScenarioTiers(resolvedScenarioId)
  const tierOverrides = useOutcomeTierOverrides(resolvedScenarioId)
  const { scenarios } = useScenarios()
  const s0020Scenario = useMemo(
    () => scenarios?.find((s) => s.short_code === "s0020"),
    [scenarios],
  )

  useEffect(() => {
    if (encodingMode !== "bar") setSpotlightedTier(null)
  }, [encodingMode])

  useEffect(() => {
    setSpotlightedTier(null)
  }, [selectedOutcomeCode])

  /* ── Multi-pin hover state (shared by overlay squares and map polygons) ── */
  const [hoveredLocation, setHoveredLocation] = useState<LocationInfo | null>(
    null,
  )
  const [pinnedLocations, setPinnedLocations] = useState<
    Map<string, LocationInfo>
  >(new Map())
  const [cardHoveredKey, setCardHoveredKey] = useState<string | null>(null)
  const pinnedCacheRef = useRef<Map<string, Map<string, LocationInfo>>>(
    new Map(),
  )

  const locKey = useCallback(
    (info: LocationInfo) => `${info.code}:${info.sourceId}`,
    [],
  )

  const locHandlers = useMemo(
    () => ({
      onMouseEnter: (info: LocationInfo) => setHoveredLocation(info),
      onMouseLeave: () => setHoveredLocation(null),
      onClick: (info: LocationInfo) => {
        setPinnedLocations((prev) => {
          const key = locKey(info)
          const next = new Map(prev)
          if (next.has(key)) {
            next.delete(key)
          } else {
            next.set(key, info)
          }
          return next
        })
      },
    }),
    [locKey],
  )

  const activeLocationSet = useMemo(() => {
    const set = new Map(pinnedLocations)
    if (hoveredLocation) {
      const key = locKey(hoveredLocation)
      if (!set.has(key)) set.set(key, hoveredLocation)
    }
    return set
  }, [pinnedLocations, hoveredLocation, locKey])

  const prevOutcomeRef = useRef<string | null>(null)
  useEffect(() => {
    const prev = prevOutcomeRef.current
    prevOutcomeRef.current = selectedOutcomeCode

    if (prev && prev !== selectedOutcomeCode) {
      setPinnedLocations((current) => {
        if (current.size > 0) {
          pinnedCacheRef.current.set(prev, new Map(current))
        } else {
          pinnedCacheRef.current.delete(prev)
        }
        return new Map()
      })
    }

    setHoveredLocation(null)

    const cached = selectedOutcomeCode
      ? pinnedCacheRef.current.get(selectedOutcomeCode)
      : undefined
    if (cached && cached.size > 0) {
      setPinnedLocations(new Map(cached))
    }

    origLineColorRef.current = null
    origLineWidthRef.current = null
  }, [selectedOutcomeCode])

  const centroidLookupRef = useRef<Map<string, { lng: number; lat: number }>>(
    new Map(),
  )
  const geoCentroidsRef = useRef<Map<string, { lng: number; lat: number }>>(
    new Map(),
  )
  useEffect(() => {
    centroidLookupRef.current = new Map(
      centroids.map((c) => [c.id, { lng: c.lng, lat: c.lat }]),
    )
  }, [centroids])

  /* ── Apply map highlight for all active locations ── */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const origLineColorRef = useRef<any>(null)
  const origLineWidthRef = useRef<number | null>(null)

  useEffect(() => {
    const config = selectedOutcomeCode
      ? getOutcomeConfig(selectedOutcomeCode)
      : null

    if (!config) {
      if (activeLocationSet.size === 0) mapActions.clearLocationHighlights()
      return
    }

    // ── Polygon-specific Mapbox paint changes ──
    const map = mapAPI.mapRef?.current?.getMap?.()

    const applyPaintChanges = () => {
      if (!map || config.geometryType !== "polygon") return
      const fillId = config.mapboxLayerId
      const outlineId = `${config.mapboxLayerId}-outline`
      const idProp = config.idProperty ?? "DU_ID"

      if (!map.getLayer(fillId)) return

      const activeFeatureIds: string[] = []
      const pinnedFeatureIds: string[] = []
      for (const [key, info] of activeLocationSet) {
        let fid = info.sourceId
        if (info.code === "RES_STOR") {
          fid = RESERVOIR_CALSIM_TO_GNISIDLABEL[info.sourceId] ?? info.sourceId
        }
        activeFeatureIds.push(fid)
        if (pinnedLocations.has(key)) pinnedFeatureIds.push(fid)
      }

      try {
        if (map.getLayer(outlineId)) {
          if (!origLineColorRef.current) {
            origLineColorRef.current =
              map.getPaintProperty(outlineId, "line-color") ?? "#888"
          }
          if (origLineWidthRef.current == null) {
            origLineWidthRef.current = (map.getPaintProperty(
              outlineId,
              "line-width",
            ) ?? 1) as never
          }

          if (activeFeatureIds.length > 0) {
            const activeMatch = [
              "in",
              ["get", idProp],
              ["literal", activeFeatureIds],
            ]
            map.setPaintProperty(outlineId, "line-color", [
              "case",
              activeMatch,
              HIGHLIGHT_GOLD,
              origLineColorRef.current,
            ] as never)
            map.setPaintProperty(outlineId, "line-width", [
              "case",
              activeMatch,
              2,
              1,
            ] as never)
          } else {
            map.setPaintProperty(
              outlineId,
              "line-color",
              origLineColorRef.current as never,
            )
            map.setPaintProperty(
              outlineId,
              "line-width",
              origLineWidthRef.current as never,
            )
          }
        }

        if (spotlightedTier != null) {
          const locData = outcomeLocationsRef.current[selectedOutcomeCode!]
          if (locData) {
            const spotlightIds: string[] = []
            for (const [locId, tier] of Object.entries(locData.tierMap)) {
              if (tier === spotlightedTier) {
                const fid =
                  selectedOutcomeCode === "RES_STOR"
                    ? (RESERVOIR_CALSIM_TO_GNISIDLABEL[locId] ?? locId)
                    : locId
                spotlightIds.push(fid)
              }
            }
            if (spotlightIds.length > 0) {
              const spotlightMatch = [
                "in",
                ["get", idProp],
                ["literal", spotlightIds],
              ]
              map.setPaintProperty(fillId, "fill-opacity", [
                "case",
                spotlightMatch,
                0.9,
                0.12,
              ] as never)
            }
          }
        } else if (pinnedFeatureIds.length > 0) {
          const pinnedMatch = [
            "in",
            ["get", idProp],
            ["literal", pinnedFeatureIds],
          ]
          map.setPaintProperty(fillId, "fill-opacity", [
            "step",
            ["zoom"],
            ["case", pinnedMatch, 1, BASE_FILL_OPACITY],
            ZOOM_THRESHOLD,
            ZOOMED_IN_OPACITY,
          ] as never)
        } else {
          map.setPaintProperty(
            fillId,
            "fill-opacity",
            ZOOM_AWARE_BASE_OPACITY as never,
          )
        }
      } catch {
        /* ok */
      }
    }

    let pendingIdle = false
    if (map?.isStyleLoaded?.()) {
      applyPaintChanges()
    } else if (map) {
      pendingIdle = true
      map.once("idle", applyPaintChanges)
    }

    // ── Store highlights (drives map Popups -- independent of map style) ──
    const highlights: import("../../map/store").LocationHighlight[] = []
    const nameMap = locationNameMapRef.current

    for (const [key, info] of activeLocationSet) {
      let coords: [number, number] | null = null

      // 1. AG_REV GeoJSON centroids (from useTierAnimationData)
      const c1 = centroidLookupRef.current.get(info.sourceId)
      if (c1) {
        coords = [c1.lng, c1.lat]
      }

      // 2. Geo-centroids computed from Mapbox source features (all polygon outcomes)
      if (!coords) {
        let lookupId = info.sourceId
        if (info.code === "RES_STOR") {
          lookupId =
            RESERVOIR_CALSIM_TO_GNISIDLABEL[info.sourceId] ?? info.sourceId
        }
        const c2 = geoCentroidsRef.current.get(lookupId)
        if (c2) coords = [c2.lng, c2.lat]
      }

      // 3. Hardcoded fallback (ENV_FLOWS, FW_EXP, FW_DELTA_USES, etc.)
      if (!coords) {
        coords = getOutcomeLocationCoordinates(info.code, info.sourceId)
      }

      if (!coords) continue

      const nameKey = `${info.code}:${info.sourceId}`
      const name = nameMap[nameKey] ?? getDemandUnitDisplayName(info.sourceId)
      const tierLabel = getTierLabel(info.tier)
      const ld = outcomeLocationsRef.current[info.code]
      const tierColor = ld?.colorMap[info.sourceId] ?? "#888"
      const isPinned = pinnedLocations.has(key)

      highlights.push({
        key,
        longitude: coords[0],
        latitude: coords[1],
        name,
        tierLevel: info.tier,
        tierLabel,
        tierColor,
        pinned: isPinned,
      })
    }

    highlights.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return 0
    })

    mapActions.setLocationHighlights(highlights)

    return () => {
      if (pendingIdle && map) {
        map.off("idle", applyPaintChanges)
      }
    }
  }, [
    activeLocationSet,
    hoveredLocation,
    pinnedLocations,
    selectedOutcomeCode,
    mapAPI.mapRef,
    locKey,
    spotlightedTier,
  ])

  const storeHighlights = useLocationHighlights()
  const pinnedHighlights = useMemo(
    () => storeHighlights.filter((h) => pinnedLocations.has(h.key)),
    [storeHighlights, pinnedLocations],
  )

  const handlePinnedHoverEnter = useCallback(
    (key: string) => {
      setCardHoveredKey(key)
      const info = pinnedLocations.get(key)
      if (info) setHoveredLocation(info)
    },
    [pinnedLocations],
  )

  const handlePinnedHoverLeave = useCallback(() => {
    setCardHoveredKey(null)
    setHoveredLocation(null)
  }, [])

  // Register store callbacks so map tooltips and TierMarkers can interact
  const handleTooltipToggle = useCallback((key: string) => {
    setPinnedLocations((prev) => {
      const next = new Map(prev)
      if (next.has(key)) {
        next.delete(key)
      }
      return next
    })
  }, [])
  useEffect(() => {
    mapActions.setOnLocationToggle(handleTooltipToggle)
    mapActions.setOnLocationClick(locHandlers.onClick)
    mapActions.setOnLocationHover((info) => {
      if (info) locHandlers.onMouseEnter(info)
      else locHandlers.onMouseLeave()
    })
    return () => {
      mapActions.setOnLocationToggle(null)
      mapActions.setOnLocationClick(null)
      mapActions.setOnLocationHover(null)
    }
  }, [handleTooltipToggle, locHandlers])

  const handleOutcomeClick = useCallback(
    (code: string, force?: boolean) => {
      const isToggleOff = selectedOutcomeCode === code

      if (isToggleOff && pinnedLocations.size > 0 && !force) return

      mapActions.clearMapTooltips()
      setHoveredLocation(null)

      mapActions.toggleOutcomeVisualization(code, resolvedScenarioId)

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
    [selectedOutcomeCode, mapAPI.mapRef, pinnedLocations, resolvedScenarioId],
  )

  useEffect(() => {
    return () => {
      controlsRef.current?.stop()
    }
  }, [])

  /* ── Map hover/click → shared multi-pin state for visible outcome polygons ── */
  const locHandlersRef = useRef(locHandlers)
  locHandlersRef.current = locHandlers

  useEffect(() => {
    if (!isInteractive || !selectedOutcomeCode) return
    const map = mapAPI.mapRef?.current?.getMap?.()
    if (!map) return

    const config = getOutcomeConfig(selectedOutcomeCode)
    if (!config) return

    const locData = outcomeLocationsRef.current[selectedOutcomeCode]
    if (!locData) return

    const layerId = config.mapboxLayerId
    const idProp = config.idProperty ?? "DU_ID"
    const code = selectedOutcomeCode

    const resolveLocId = (featureId: string): string | null => {
      let lid = featureId
      if (code === "RES_STOR") {
        const reverse = Object.entries(RESERVOIR_CALSIM_TO_GNISIDLABEL).find(
          ([, gnis]) => gnis === featureId,
        )
        if (reverse) lid = reverse[0]
      }
      return locData.ids.has(lid) ? lid : null
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onMouseMove = (e: any) => {
      if (!layerId || !map.getLayer(layerId)) return

      const features = map.queryRenderedFeatures(e.point, { layers: [layerId] })
      if (!features || features.length === 0) {
        locHandlersRef.current.onMouseLeave()
        map.getCanvas().style.cursor = ""
        return
      }

      const featureId: string | undefined = features[0]?.properties?.[idProp]
      if (!featureId) {
        locHandlersRef.current.onMouseLeave()
        return
      }

      const lid = resolveLocId(featureId)
      if (!lid) {
        locHandlersRef.current.onMouseLeave()
        map.getCanvas().style.cursor = ""
        return
      }

      map.getCanvas().style.cursor = "pointer"
      const tier = locData.tierMap[lid] ?? 1
      locHandlersRef.current.onMouseEnter({ code, sourceId: lid, tier })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onClick = (e: any) => {
      if (!layerId || !map.getLayer(layerId)) return

      const features = map.queryRenderedFeatures(e.point, { layers: [layerId] })
      if (!features || features.length === 0) return

      const featureId: string | undefined = features[0]?.properties?.[idProp]
      if (!featureId) return

      const lid = resolveLocId(featureId)
      if (!lid) return

      const tier = locData.tierMap[lid] ?? 1
      locHandlersRef.current.onClick({ code, sourceId: lid, tier })
    }

    const onMouseLeave = () => {
      locHandlersRef.current.onMouseLeave()
      map.getCanvas().style.cursor = ""
    }

    const canvas = map.getCanvas()
    map.on("mousemove", onMouseMove)
    map.on("click", onClick)
    map.on("mouseleave", layerId, onMouseLeave)
    map.on("mouseout", onMouseLeave)
    canvas.addEventListener("mouseleave", onMouseLeave)
    return () => {
      map.off("mousemove", onMouseMove)
      map.off("click", onClick)
      map.off("mouseleave", layerId, onMouseLeave)
      map.off("mouseout", onMouseLeave)
      canvas.removeEventListener("mouseleave", onMouseLeave)
      map.getCanvas().style.cursor = ""
    }
  }, [isInteractive, selectedOutcomeCode, mapAPI.mapRef])

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

  /* ── Keep outcome visualization scenario in sync with hydroclimate ── */
  useEffect(() => {
    resolvedScenarioIdRef.current = resolvedScenarioId
    const activeViz = useMapStore.getState().activeOutcomeVisualization
    if (activeViz) {
      mapActions.setOutcomeVisualization(
        activeViz.outcomeCode,
        resolvedScenarioId,
      )
    }
  }, [resolvedScenarioId])

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

        // The panel may still be settling to its final scroll position
        // after the camera fly. Schedule cheap offset re-applications to
        // catch any drift without re-querying Mapbox.
        setTimeout(() => applyPanelOffsetRef.current(), 200)
        setTimeout(() => applyPanelOffsetRef.current(), 500)

        try {
          // Set up demand-units for the beat-1 color cycling
          if (map.getLayer("demand-units")) {
            map.setFilter("demand-units", DU_CLASS_FILTER as never)
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
    const CONVERGE_START = 0.55
    const BLEND_START = 0.6
    const BLEND_END = 0.67

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
        const beat1T = v / FREEZE_AT

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
  const reprojectRef = useRef<() => void>(() => {})
  const applyPanelOffsetRef = useRef<() => void>(() => {})
  const cachedGeoRingsRef = useRef<
    Map<
      string,
      { ring: [number, number][]; centroidLng?: number; centroidLat?: number }
    >
  >(new Map())

  /**
   * Cheap: subtract the current panel viewport position from the stable
   * viewport-space data stored in viewportDataRef. Safe to call frequently
   * (scroll, resize, before play) without re-querying Mapbox.
   */
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
  }, [])

  applyPanelOffsetRef.current = applyPanelOffset

  /**
   * Expensive: query Mapbox source features, project to viewport-space
   * coordinates, and store in viewportDataRef. Then apply the panel offset
   * to produce panel-relative screen coordinates.
   */
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

    // ── 2. React-marker outcomes: project coordinates to viewport shapes ──
    for (const { code } of OUTCOME_DISPLAY_ORDER) {
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

    // ── 3. Line outcomes: representative shape at centroid ──
    for (const { code } of OUTCOME_DISPLAY_ORDER) {
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
  }, [centroids, allLocationIds, outcomeLocations, mapAPI, applyPanelOffset])

  /**
   * Re-project cached geographic data to screen without re-querying Mapbox.
   * Safe to call on every map move/zoom — feature count stays stable.
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

    const vpMap = new Map<string, ScreenPolygon>()

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

    for (const { code } of OUTCOME_DISPLAY_ORDER) {
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

    for (const { code } of OUTCOME_DISPLAY_ORDER) {
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
  }, [mapAPI, outcomeLocations, applyPanelOffset])

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

  // Re-apply offset on scroll (cheap — no Mapbox queries).
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

  // Re-project cached shapes when the map pans/zooms (no Mapbox re-query).
  useEffect(() => {
    if (!panelInView) return
    const map = mapAPI.mapRef?.current?.getMap?.()
    if (!map) return

    const TEXT_FADE_ZOOM = 7

    let rafId: number | null = null
    const onMove = () => {
      if (rafId !== null) return
      rafId = requestAnimationFrame(() => {
        reprojectRef.current()
        const shouldShow = map.getZoom() < TEXT_FADE_ZOOM
        if (shouldShow !== textVisibleRef.current) {
          textVisibleRef.current = shouldShow
          setTextVisible(shouldShow)
        }
        rafId = null
      })
    }

    map.on("move", onMove)
    return () => {
      map.off("move", onMove)
      if (rafId !== null) cancelAnimationFrame(rafId)
    }
  }, [panelInView, mapAPI.mapRef])

  /* ── Build per-outcome shape groups for the morph overlay ── */
  const outcomeGroups: OutcomeGroup[] = useMemo(() => {
    if (allScreenPolygons.size === 0) return []
    return OUTCOME_DISPLAY_ORDER.map(({ code, label }) => {
      const locData = outcomeLocations[code]
      if (!locData) return { code, label, polygons: [] }
      const override = tierOverrides[code]
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
          color:
            override?.colorMap[locId] ?? locData.colorMap[locId] ?? "#888888",
          tier: override?.tierMap[locId] ?? locData.tierMap[locId] ?? 1,
          sourceId: locId,
        })
      }
      return { code, label, polygons }
    }).filter((g) => g.polygons.length > 0)
  }, [allScreenPolygons, outcomeLocations, tierOverrides])

  const locationNameMap = useMemo(() => {
    const names: Record<string, string> = {}
    for (const { code } of OUTCOME_DISPLAY_ORDER) {
      const locData = outcomeLocations[code]
      if (!locData) continue
      for (const locId of locData.ids) {
        const key = `${code}:${locId}`
        const apiName = locData.nameMap[locId]
        if (apiName && apiName !== locId) {
          names[key] = apiName
          continue
        }
        if (code === "AG_REV" || code === "CWS_DEL") {
          const duName = getDemandUnitDisplayName(locId)
          if (duName !== locId) {
            names[key] = duName
          }
        }
      }
    }
    return names
  }, [outcomeLocations])

  const locationNameMapRef = useRef(locationNameMap)
  locationNameMapRef.current = locationNameMap

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
    const headerOffset = 140
    const topPad = headerOffset + Math.min(24, Math.max(16, width * 0.02))

    const itemStartY = topPad

    const LEFT_COLUMN_CODES = new Set(["CWS_DEL", "AG_REV"])
    const colX: [number, number] = [insetPx, insetPx + colWidth + COLUMN_GAP]

    const EYEBROW_HEIGHT = 22
    const EYEBROW_GAP = 6

    const eyebrows = [
      {
        label: "Consumptive uses",
        x: colX[0],
        y: itemStartY,
        columnWidth: colWidth,
        animationStart: 0.225,
      },
      {
        label: "Non-consumptive uses",
        x: colX[1],
        y: itemStartY,
        columnWidth: colWidth,
        animationStart: 0,
      },
    ]

    const firstItemY = itemStartY + EYEBROW_HEIGHT + EYEBROW_GAP
    const cursors: [number, number] = [firstItemY, firstItemY]
    let firstCol1Index = -1

    const items: OutcomeLayoutItem[] = []

    for (let idx = 0; idx < OUTCOME_CODE_ORDER.length; idx++) {
      const code = OUTCOME_CODE_ORDER[idx]!
      const label = getOutcomeName(code)
      const isActive = ACTIVE_OUTCOMES.has(code)
      const col: 0 | 1 = LEFT_COLUMN_CODES.has(code) ? 0 : 1

      if (col === 1 && firstCol1Index === -1) {
        firstCol1Index = idx
      }

      const y = cursors[col]
      const x = colX[col]
      cursors[col] += LAYOUT_LINE_HEIGHT

      const distributionY = cursors[col] + LAYOUT_DIST_GAP
      let distributionHeight = 0
      let slotHeight = 0
      let locationCount = 0

      let spaceBelow = LAYOUT_LABEL_GAP
      if (isActive) {
        const group = outcomeGroups.find((g) => g.code === code)
        if (group && group.polygons.length > 0) {
          locationCount = group.polygons.length
          distributionHeight = computeDistributionHeight(
            group.polygons,
            sqPerRow,
            colWidth,
          )
          const SINGLE_ROW = 12 // SQUARE_SIZE + SQUARE_GAP
          slotHeight =
            distributionHeight <= SINGLE_ROW
              ? distributionHeight
              : Math.max(distributionHeight, BAR_VISUAL_HEIGHT)
          spaceBelow =
            LAYOUT_DIST_GAP +
            slotHeight +
            SLOT_COUNT_GAP +
            SLOT_COUNT_FONT +
            SLOT_POST_GAP
          cursors[col] += spaceBelow
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
        slotHeight,
        locationCount,
        spaceBelow,
      })
    }

    if (firstCol1Index >= 0) {
      eyebrows[1]!.animationStart = 0.24 + firstCol1Index * 0.035 - 0.015
    }

    return { items, eyebrows, leftColumnBottom: cursors[0] }
  }, [panelSize, outcomeGroups, theme.scenarios.tierGrid.squaresPerRow])

  const distributionPositionMap = useMemo(() => {
    if (!outcomeLayout) return {}
    const describeLocations = (code: string, count: number): string => {
      switch (code) {
        case "ENV_FLOWS":
          return `${count} river & tributary reaches`
        case "RES_STOR":
          return `${count} major California reservoirs`
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
        slotHeight: number
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
          slotHeight: item.slotHeight,
          locationDescription: describeLocations(item.code, item.locationCount),
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
        pointerEvents: "none",
      }}
    >
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
                pointerEvents: "none",
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
                activeLocationSet={
                  isInteractive ? activeLocationSet : undefined
                }
                hoveredLocation={isInteractive ? hoveredLocation : null}
                onLocationEnter={
                  isInteractive ? locHandlers.onMouseEnter : undefined
                }
                onLocationLeave={
                  isInteractive ? locHandlers.onMouseLeave : undefined
                }
                onLocationClick={
                  isInteractive ? locHandlers.onClick : undefined
                }
                locationNameMap={locationNameMap}
                encodingMode={isInteractive ? encodingMode : "distribution"}
                tierChartData={tierChartData}
                spotlightedTier={spotlightedTier}
                onBarClick={
                  isInteractive
                    ? (code: string, tier: number) => {
                        setSpotlightedTier((prev) =>
                          prev === tier ? null : tier,
                        )
                      }
                    : undefined
                }
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

          <BeatTextOverlay
            progress={progress}
            headingOpacity={headingOpacity}
            playState={playState}
            onRewind={handleRewind}
            onPlay={handlePlay}
            onPause={handlePause}
            beat2Layout={outcomeLayout}
            onOutcomeClick={isInteractive ? handleOutcomeClick : undefined}
            selectedOutcomeCode={isInteractive ? selectedOutcomeCode : null}
            interactive={isInteractive}
            textHidden={!textVisible}
            scenarioId="s0020"
            scenarioName={s0020Scenario?.name ?? "Current operations"}
            scenarioDescription={s0020Scenario?.short_description ?? undefined}
            encodingMode={encodingMode}
            onEncodingChange={setEncodingMode}
            hydroclimate={hydroclimate}
            onHydroclimateChange={setHydroclimate}
          />

          {isInteractive &&
            pinnedHighlights.length > 0 &&
            selectedOutcomeCode !== "RES_STOR" &&
            selectedOutcomeCode !== "FW_EXP" &&
            selectedOutcomeCode !== "FW_DELTA_USES" && (
              <PinnedLocationsList
                highlights={pinnedHighlights}
                onUnpin={handleTooltipToggle}
                onHoverEnter={handlePinnedHoverEnter}
                onHoverLeave={handlePinnedHoverLeave}
                hoveredKey={cardHoveredKey}
                mapRef={mapAPI.mapRef}
              />
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

"use client"

/* TierAnimationSection: the storyboard orchestrator. Owns the shared
 * `progress` clock and wires every piece together. Animates nothing
 * directly. Body reads top to bottom: state, navigation, selection,
 * engine, render. See README.md. */

import { useRef, useState, useEffect, useCallback, useMemo } from "react"
import { Box, Typography, useTheme, CircularProgress } from "@repo/ui/mui"
import {
  useMotionValue,
  useTransform,
  motion,
  animate,
  useReducedMotion,
} from "@repo/motion"
import { useMap } from "@repo/map"
import {
  mapActions,
  useActiveOutcomeVisualization,
  useMapStore,
  useActiveSection,
} from "../../map/store"
import {
  getOutcomeConfig,
  RESERVOIR_CALSIM_TO_GNISIDLABEL,
} from "../../map/config/outcomeLayerRegistry"
import { resolveOutcomeCamera } from "../../map/config/resolveOutcomeCamera"
import { getOutcomeLocationCoordinates } from "../../map/config/outcomeLocations"
import {
  useTierAnimationData,
  useOutcomeTierOverrides,
} from "./useTierAnimationData"
import type { OutcomeLocationData } from "./useTierAnimationData"
import OutcomeMorphOverlay, {
  type LocationInfo,
  type EncodingMode,
} from "./OutcomeMorphOverlay"
import BeatTextOverlay from "./BeatTextOverlay"
import { useStoryboardDebugLog } from "./useStoryboardDebugLog"
import { useScreenPolygonProjection } from "./hooks/useScreenPolygonProjection"
import { useStoryboardLayout } from "./hooks/useStoryboardLayout"
import { useStoryboardCamera } from "./hooks/useStoryboardCamera"
import { useInteractiveLayerDirector } from "./hooks/useInteractiveLayerDirector"
import { useStoryboardNavigation } from "./hooks/useStoryboardNavigation"
import { OUTCOME_CODE_ORDER, getOutcomeName } from "../../../content/outcomes"
import { getTierLabel } from "../../../content/tiers"
import { getDemandUnitDisplayName } from "../../map/config/demandUnitNames"
import { useScenarioTiers } from "../../scenarios/hooks/useTierData"
import { useScenarios } from "@repo/data/coeqwal/hooks"
import { TIMING_BEATS } from "./animationTiming"
import { LOI_DU_ID } from "./demandUnitsPaint"

import {
  useBeatEngine,
  ACTOR_GROUPS,
  MapPaintArbiter,
  MapPopupArbiter,
  OverlayPopupArbiter,
  NarrationArbiter,
  OverlayMorphArbiter,
  CameraArbiter,
  InteractivePaintArbiter,
  PolygonLayerDriver,
  InteractiveLayerDirector,
  type BeatEngineApi,
  type BeatEngineContext,
  type Arbiter,
  type HideScheduleEntry,
} from "./engine"

/* Beats where the squares are settled as a grid, so hovering or clicking a
 * single square is meaningful. Other settled beats (list-bar, radar,
 * heatmap) reshape the squares into charts, and earlier beats have them on
 * the map or mid-morph, so square hover stays off there. Keyed by beat id
 * so retuning the beat order is safe. */
const GRID_INTERACTIVE_BEAT_IDS: readonly string[] = ["loi-highlight"]

const CAM_CENTER: [number, number] = [-120.2, 38.5]
const CAM_ZOOM = 5.82

/** Stateless camera helper shared by the Next, Back, and Restart handlers
 *  in `useStoryboardNavigation`. Module-scope because `home` is fixed. */
const CAMERA_ARBITER = new CameraArbiter({
  center: CAM_CENTER,
  zoom: CAM_ZOOM,
})

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace("#", "")
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
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
  { fill: "delta-detaw", outline: "delta-detaw-outline" },
] as const

/** Curated agricultural water districts illustrating what one polygon
 *  represents. Intentionally small and geographically diverse (Sac Valley,
 *  San Joaquin/Delta, Westside, Eastside), spanning multiple AG_REV tiers. */
const TIER_BLEND_POPUP_DU_IDS: readonly string[] = [
  "08N_SA2", // Glenn Colusa I.D. (Sacramento Valley)
  "62_NA3", // Turlock I.D. (San Joaquin, Eastside)
  "90_PA1", // Westlands W.D. East (San Joaquin, Westside)
  "64_PA1", // Madera I.D. (Eastside, Madera)
  "61_NA2", // Modesto I.D. (Stanislaus)
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

export default function TierAnimationSection() {
  const theme = useTheme()
  const mapAPI = useMap()
  const { centroids, outcomeLocations, allLocationIds, isLoading, error } =
    useTierAnimationData()

  const panelRef = useRef<HTMLDivElement>(null)

  const activeSection = useActiveSection()
  const isActive = activeSection === "outcomes-viz"
  /** Storyboard cursor: driven by Next / Back. */
  const [beatIndex, setBeatIndex] = useState(0)
  /** Ref copy of `beatIndex` so navigation callbacks read the latest cursor
   *  without being re-created on every change. */
  const beatIndexRef = useRef(0)
  /** `true` once the user has clicked Play since the last reset. Governs
   *  which chrome the BeatTextOverlay renders (pre-play gate vs control
   *  row). Animation math keys off `progress` and `beatIndex`. */
  const [hasPlayed, setHasPlayed] = useState(false)
  const hasPlayedRef = useRef(false)
  /** Where the user is in the storyboard.
   *  - `idle`: no advance yet
   *  - `playing`: animating between two beats
   *  - `paused`: settled on a non-final beat, waiting for input
   *  - `finished`: settled on the final beat (interactive UI lights up) */
  const [playState, setPlayState] = useState<
    "idle" | "playing" | "paused" | "finished"
  >("idle")
  /** `prefers-reduced-motion` honored at the orchestration level: every
   *  `goTo` collapses to a 0-second snap and auto-arrival jumps to the
   *  settled end-state. Child `progress` listeners resolve to their v = 1
   *  branches, so no per-listener reduced-motion code is needed. */
  const prefersReducedMotion = useReducedMotion() ?? false

  const polygonsAllowedRef = useRef(false)
  const resolvedScenarioIdRef = useRef("s0020")

  /* Left-panel text visibility. The zoom-based fade-out was retired to keep
   * the navigation controls accessible while zoomed into a clicked square.
   * State kept so a future visibility trigger can set it without a
   * refactor. */
  const [textVisible] = useState(true)

  /* Time-based progress (0 to 1) */
  const progress = useMotionValue(0)

  /* Back-out opacity for the left-panel text. Normally 1 (no-op). On Back
   * from beat 1/N we fade it to 0 while `progress` is parked at 0.45, so the
   * whole text block fades out in one motion instead of reverse-tweening
   * progress (which would unwind every staggered reveal). On completion we
   * snap `progress` to 0 and this back to 1 for a clean pre-play gate. */
  const backOutOpacity = useMotionValue(1)

  // Map, overlay, and heading stay fully visible (no fade-out).
  const overlayOpacity = useTransform(progress, [0, 1], [1, 1])
  const headingOpacity = useTransform(progress, [0, 1], [1, 1])

  const controlsRef = useRef<ReturnType<typeof animate> | null>(null)

  /** Ref copy of the beat engine api so navigation handlers and paint
   *  effects reach `setMode`/`teardown` without depending on `engineApi`
   *  identity. Assigned right after `useBeatEngine` runs below. */
  const engineApiRef = useRef<BeatEngineApi | null>(null)

  /** Ref copy of the memoized `engineContext`, populated right after its
   *  `useMemo` runs below. Lets navigation handlers and the unmount effect
   *  pass a live context to `InteractivePaintArbiter.release()` without
   *  depending on the memoized object's identity. */
  const engineContextRef = useRef<BeatEngineContext | null>(null)

  const activeVisualization = useActiveOutcomeVisualization()
  const selectedOutcomeCode = activeVisualization?.outcomeCode ?? null
  // Climate scenario backing the current selection. Bar and radar clicks
  // select the base scenario (s0020). Heatmap cells can select a climate
  // variant column (cc50/cc95), painting that climate's tiers on the map.
  const selectedScenarioId = activeVisualization?.scenarioId ?? "s0020"

  // General interactive gate for the location-highlight pipeline, map
  // hover/click wiring, and overlay structure. Active on the final beat and
  // grid beats. Off on other paused beats and during playback.
  const onGridBeat = GRID_INTERACTIVE_BEAT_IDS.includes(
    TIMING_BEATS[beatIndex]?.id ?? "",
  )
  const isInteractive =
    playState === "finished" || (playState === "paused" && onGridBeat)

  // Per-square hover/click is meaningful only on grid beats. On the final
  // beat and bar/radar/heatmap beats the shapes are reshaped into a chart,
  // so square hover would fire stray popups over the chart.
  const squareHoverEnabled = playState === "paused" && onGridBeat

  // Map-polygon hover mirrors square hover on grid beats. demand-units is
  // painted only on the loi-highlight beat, the only grid beat with polygons
  // to hover. Attribute those hovers to AG_REV when nothing is selected so
  // they flow through the same shared hover state as squares.
  const onLoiBeat = TIMING_BEATS[beatIndex]?.id === "loi-highlight"
  // The hydroclimate matrix is a tool view: clicking a cell paints the map,
  // but map-polygon hover stays off so the matrix is the only control.
  const onHeatmapBeat = TIMING_BEATS[beatIndex]?.id === "heatmap"
  const mapHoverCode = onHeatmapBeat
    ? null
    : (selectedOutcomeCode ?? (onLoiBeat ? "AG_REV" : null))

  // On the bar-chart beat, clicking an outcome's glyph paints its layer.
  // Separate from grid hover because bars are not per-square hit targets,
  // the whole glyph selects its outcome. Off elsewhere.
  const onBarBeat = TIMING_BEATS[beatIndex]?.id === "list-bar"
  const outcomeGlyphClickEnabled = playState === "paused" && onBarBeat

  // On the radar beat, clicking a vertex dot paints that outcome's layer,
  // same as the bar glyph. The radar shares one chart, so hit targets are
  // the per-vertex dots, not the per-outcome bounds rects.
  const onRadarBeat = TIMING_BEATS[beatIndex]?.id === "radar"
  const radarDotClickEnabled = playState === "paused" && onRadarBeat

  // On the heatmap beat (final, settled), clicking a matrix cell paints its
  // outcome under that cell's climate-column scenario.
  const heatmapCellClickEnabled = playState === "finished" && onHeatmapBeat

  // Any chart selection path (bar glyph, radar dot, heatmap cell). All paint
  // an outcome layer. The heatmap has its own handler because it also
  // carries the column's climate scenario.
  const outcomeSelectEnabled =
    outcomeGlyphClickEnabled || radarDotClickEnabled || heatmapCellClickEnabled

  // On grid beats, let hover highlights render as map popups and let pointer
  // events reach the map so the user can pan, zoom, and hover polygons. Both
  // off elsewhere so the storyboard keeps its scripted camera.
  useEffect(() => {
    mapActions.setShowHoverHighlightsOnMap(squareHoverEnabled)
    mapActions.setStoryboardMapInteractive(squareHoverEnabled)
    return () => {
      mapActions.setShowHoverHighlightsOnMap(false)
      mapActions.setStoryboardMapInteractive(false)
    }
  }, [squareHoverEnabled])

  /* Encoding mode: distribution | bar | average */
  const [encodingMode, setEncodingMode] = useState<EncodingMode>("distribution")
  const [spotlightedTier, setSpotlightedTier] = useState<number | null>(null)
  const resolvedScenarioId = "s0020"
  const { chartData: tierChartData } = useScenarioTiers(resolvedScenarioId)
  // No per-location tier overrides. Empty record keeps the screen-polygon
  // color-resolution path below unchanged.
  const tierOverrides: Record<string, OutcomeLocationData> = useMemo(
    () => ({}),
    [],
  )
  const { scenarios } = useScenarios()
  const s0020Scenario = useMemo(
    () => scenarios?.find((s) => s.short_code === "s0020"),
    [scenarios],
  )

  /* extra-hydroclimate columns */
  const s0020SiblingGroup = s0020Scenario?.sibling_group
  const { cc50VariantId, cc95VariantId } = useMemo(() => {
    if (!scenarios || !s0020SiblingGroup) {
      return { cc50VariantId: null, cc95VariantId: null }
    }
    const siblings = scenarios.filter(
      (s) => s.sibling_group === s0020SiblingGroup,
    )
    // Hydroclimate IDs from `HYDROCLIMATE_ID_MAP`: cc50=3, cc95=4. The API
    // returns numeric `hydroclimate_id`. The local map carries the
    // short-code mapping until the cutover (see database README).
    return {
      cc50VariantId:
        siblings.find((s) => s.hydroclimate_id === 3)?.short_code ?? null,
      cc95VariantId:
        siblings.find((s) => s.hydroclimate_id === 4)?.short_code ?? null,
    }
  }, [scenarios, s0020SiblingGroup])
  const { chartData: cc50ChartData } = useScenarioTiers(cc50VariantId)
  const { chartData: cc95ChartData } = useScenarioTiers(cc95VariantId)
  /* Only include extra hydroclimate columns whose sibling scenario
   * resolved. A missing cc50/cc95 sibling drops the column rather than
   * rendering empty chrome. Downstream geometry keys off array length, so
   * the layout collapses cleanly to fewer columns. */
  const heatmapExtraColumns = useMemo(() => {
    const cols: Array<{
      label: string
      scenarioId: string
      tierChartData?: typeof cc50ChartData
    }> = []
    if (cc50VariantId) {
      cols.push({
        label: "Moderate risk",
        scenarioId: cc50VariantId,
        tierChartData: cc50ChartData,
      })
    }
    if (cc95VariantId) {
      cols.push({
        label: "High risk",
        scenarioId: cc95VariantId,
        tierChartData: cc95ChartData,
      })
    }
    return cols
  }, [cc50VariantId, cc95VariantId, cc50ChartData, cc95ChartData])

  // Per-location tier levels for the selected climate variant. Returns {} on
  // the base scenario (s0020), so the painter falls through to base
  // `outcomeLocations` except at a selected cc50/cc95 heatmap cell.
  const climateOverrides = useOutcomeTierOverrides(selectedScenarioId)

  useEffect(() => {
    if (encodingMode !== "bar") setSpotlightedTier(null)
  }, [encodingMode])

  useEffect(() => {
    setSpotlightedTier(null)
  }, [selectedOutcomeCode])

  /* Post-interactive teardown */
  const prevSelectedOutcomeCodeRef = useRef<string | null>(null)
  useEffect(() => {
    const prev = prevSelectedOutcomeCodeRef.current
    prevSelectedOutcomeCodeRef.current = selectedOutcomeCode
    if (!(prev !== null && selectedOutcomeCode === null)) return
    mapAPI.withMap((mapRef) => {
      const m = mapRef.getMap()
      for (const { fill, outline } of ANIM_POLYGON_LAYERS) {
        if (fill === "demand-units") continue
        try {
          if (m.getLayer(fill)) {
            m.setLayoutProperty(fill, "visibility", "visible")
            m.setPaintProperty(fill, "fill-opacity", 0 as never)
          }
          if (m.getLayer(outline)) {
            m.setLayoutProperty(outline, "visibility", "visible")
            m.setPaintProperty(outline, "line-opacity", 0 as never)
          }
        } catch {
          /* ok */
        }
      }
    })
  }, [selectedOutcomeCode, mapAPI])

  /* Multi-pin hover state (shared by overlay squares and map polygons) */
  const [hoveredLocation, setHoveredLocation] = useState<LocationInfo | null>(
    null,
  )
  const [pinnedLocations, setPinnedLocations] = useState<
    Map<string, LocationInfo>
  >(new Map())

  const locKey = useCallback(
    (info: LocationInfo) => `${info.code}:${info.sourceId}`,
    [],
  )

  // Ref for reading the latest pinnedLocations inside locHandlers.onClick
  // without forcing the memo to re-create (which in turn would re-render
  // OutcomeMorphOverlay on every selection change).
  const pinnedLocationsRef = useRef(pinnedLocations)
  useEffect(() => {
    pinnedLocationsRef.current = pinnedLocations
  }, [pinnedLocations])

  const locHandlers = useMemo(
    () => ({
      onMouseEnter: (info: LocationInfo) => setHoveredLocation(info),
      onMouseLeave: () => setHoveredLocation(null),
      onClick: (info: LocationInfo) => {
        // Sticky single-select: clicking a square makes that location active
        // (gold ring/stroke, popup on both) and shows its outcome's map
        // layer. Re-clicking deselects. Clicking a different outcome's square
        // swaps the pin and layer and flies the camera to the new outcome.
        const key = locKey(info)
        const prevPins = pinnedLocationsRef.current
        const wasSelected = prevPins.has(key)

        // Outcome of the current pinned selection (if any), to detect
        // cross-outcome switches. First entry because there's at most one.
        const prevEntry = prevPins.values().next().value as
          | LocationInfo
          | undefined
        const prevOutcomeCode = prevEntry?.code ?? null
        // Fly only when the selection enters a new outcome (first click or a
        // swap to a different outcome). No fly within the same outcome or on
        // de-select.
        const isNewOutcomeSelection =
          !wasSelected && prevOutcomeCode !== info.code

        if (wasSelected) {
          setPinnedLocations(new Map())
        } else {
          setPinnedLocations(new Map([[key, info]]))
        }

        // Clear hover so the sticky selection is the sole highlight owner.
        setHoveredLocation(null)

        // Keep the outcome map layer in sync with the selection.
        if (wasSelected) {
          mapActions.clearOutcomeVisualization()
        } else {
          mapActions.setOutcomeVisualization(info.code, resolvedScenarioId)
        }

        if (isNewOutcomeSelection) {
          const action = resolveOutcomeCamera(info.code, "get-started")
          mapAPI.withMap((mapRef) => {
            if (action.type === "fitBounds") {
              mapRef.fitBounds(action.bounds, {
                padding: action.padding,
                maxZoom: action.maxZoom,
                duration: action.duration,
              })
            } else {
              mapRef.getMap().easeTo({
                center: action.center,
                zoom: action.zoom,
                padding: action.padding,
                duration: action.duration,
              })
            }
          })
        }
      },
    }),
    [locKey, resolvedScenarioId, mapAPI],
  )

  // Fly the camera to an outcome's region, matching the square-click camera.
  // Shared by the bar-glyph click below.
  const flyToOutcome = useCallback(
    (code: string) => {
      const action = resolveOutcomeCamera(code, "get-started")
      mapAPI.withMap((mapRef) => {
        if (action.type === "fitBounds") {
          mapRef.fitBounds(action.bounds, {
            padding: action.padding,
            maxZoom: action.maxZoom,
            duration: action.duration,
          })
        } else {
          mapRef.getMap().easeTo({
            center: action.center,
            zoom: action.zoom,
            padding: action.padding,
            duration: action.duration,
          })
        }
      })
    },
    [mapAPI],
  )

  // Clicking a bar glyph paints that outcome's layer and flies to its
  // region. Re-clicking clears the layer. The InteractiveLayerDirector owns
  // the layer whenever an outcome is selected and the storyboard is paused,
  // so this works on the bar beat without flipping the interactive gate.
  const handleOutcomeGlyphClick = useCallback(
    (code: string) => {
      if (selectedOutcomeCode === code) {
        mapActions.clearOutcomeVisualization()
        return
      }
      mapActions.setOutcomeVisualization(code, resolvedScenarioId)
      flyToOutcome(code)
    },
    [selectedOutcomeCode, resolvedScenarioId, flyToOutcome],
  )

  // Clicking a heatmap cell paints that outcome under the cell's
  // climate-column scenario and flies to its region. The selected scenario
  // drives `climateOverrides`. Re-clicking the same cell clears the layer.
  const handleHeatmapCellClick = useCallback(
    (code: string, scenarioId: string) => {
      if (selectedOutcomeCode === code && selectedScenarioId === scenarioId) {
        mapActions.clearOutcomeVisualization()
        return
      }
      mapActions.setOutcomeVisualization(code, scenarioId)
      flyToOutcome(code)
    },
    [selectedOutcomeCode, selectedScenarioId, flyToOutcome],
  )

  const activeLocationSet = useMemo(() => {
    const set = new Map(pinnedLocations)
    if (hoveredLocation) {
      const key = locKey(hoveredLocation)
      if (!set.has(key)) set.set(key, hoveredLocation)
    }
    return set
  }, [pinnedLocations, hoveredLocation, locKey])

  /* demo-LOI highlight state. */
  const overlayMustIncludeSourceIds = useMemo(
    () => new Set<string>([LOI_DU_ID, ...TIER_BLEND_POPUP_DU_IDS]),
    [],
  )

  const prevOutcomeRef = useRef<string | null>(null)
  useEffect(() => {
    prevOutcomeRef.current = selectedOutcomeCode

    // Clicking a square atomically sets both `pinnedLocations` and
    // `selectedOutcomeCode`. If the pins already belong to the new outcome,
    // keep them (the click handler is the source of truth). Only clear stale
    // pins whose outcome no longer matches (e.g. the animation switched
    // outcomes under a leftover selection).
    setPinnedLocations((current) => {
      if (current.size === 0) return current
      if (selectedOutcomeCode) {
        for (const pin of current.values()) {
          if (pin.code === selectedOutcomeCode) return current
        }
      }
      return new Map()
    })

    // Drop the hover on outcome change so a stale tooltip from the previous
    // outcome doesn't survive into the new view.
    setHoveredLocation(null)
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

  // Tracks whether the interactive hover wrote the current map popups. On the
  // loi-highlight beat the engine places the scripted Glenn Colusa popup on
  // arrival, so we only clear popups we placed and leave the scripted one
  // until the user hovers.
  const wroteInteractiveHighlightsRef = useRef(false)
  useEffect(() => {
    // Reset on beat change so a stale flag can't wipe the scripted popup the
    // moment we land on the beat.
    wroteInteractiveHighlightsRef.current = false
  }, [beatIndex])

  /* Location highlights (popup data, not paint). Builds the
   * `LocationHighlight[]` the map popups read from coordinates, names, and
   * tier colors for every active location. Independent of which arbiter
   * paints the map. */
  useEffect(() => {
    if (!isInteractive) return

    if (activeLocationSet.size === 0) {
      // Nothing hovered or pinned. Clear only the popups we wrote, so the
      // scripted loi-highlight popup survives until the user hovers.
      if (playState === "finished" || wroteInteractiveHighlightsRef.current) {
        mapActions.clearLocationHighlights()
        wroteInteractiveHighlightsRef.current = false
      }
      return
    }

    const highlights: import("../../map/store").LocationHighlight[] = []
    const nameMap = locationNameMapRef.current

    for (const [key, info] of activeLocationSet) {
      let coords: [number, number] | null = null

      // 1. AG_REV GeoJSON centroids (from useTierAnimationData).
      const c1 = centroidLookupRef.current.get(info.sourceId)
      if (c1) {
        coords = [c1.lng, c1.lat]
      }

      // 2. Geo-centroids from Mapbox source features (all polygon outcomes).
      if (!coords) {
        let lookupId = info.sourceId
        if (info.code === "RES_STOR") {
          lookupId =
            RESERVOIR_CALSIM_TO_GNISIDLABEL[info.sourceId] ?? info.sourceId
        }
        const c2 = geoCentroidsRef.current.get(lookupId)
        if (c2) coords = [c2.lng, c2.lat]
      }

      // 3. Hardcoded fallback (ENV_FLOWS, FW_EXP, FW_DELTA_USES, etc.).
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
    if (playState !== "finished") wroteInteractiveHighlightsRef.current = true
    // `locationNameMapRef` comes from `useStoryboardLayout` below, so listing
    // it here would be a temporal-dead-zone error. It is a stable ref, so
    // omitting it skips no needed re-run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isInteractive,
    playState,
    activeLocationSet,
    hoveredLocation,
    pinnedLocations,
    selectedOutcomeCode,
    locKey,
  ])

  // Register store callbacks so map tooltips and TierMarkers can interact.
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
    // Only wire map hover/click while interactive. During playback the map
    // is read-only. Otherwise `TierMarkers` / `TierLocationLabels` rendering
    // mid-beat would hand hover events into `locHandlers`, flipping
    // `hoveredLocation`, invalidating `activeLocationSet`, and rerunning the
    // paint effect mid-beat.
    if (!isInteractive) return
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
  }, [isInteractive, handleTooltipToggle, locHandlers])

  /* Map hover/click to shared multi-pin state for visible outcome polygons. */
  const locHandlersRef = useRef(locHandlers)
  locHandlersRef.current = locHandlers

  /* Effect to reset map when you scroll away from the section */
  useEffect(() => {
    if (isActive) return

    // Reset storyboard state on exit so re-entry starts clean.
    // When scroll migration lands, beat position will be derived from
    // scroll progress and this reset won't be needed.
    if (hasPlayedRef.current) {
      progress.set(0)
      backOutOpacity.set(1)
    }

    setBeatIndex(0)
    beatIndexRef.current = 0
    setHasPlayed(false)
    hasPlayedRef.current = false
    setPlayState("idle")

    // Clear any colored map layers left over from the storyboard
    const map = mapAPI.mapRef?.current?.getMap?.()
    if (map?.isStyleLoaded()) {
      try {
        for (const { fill, outline } of ANIM_POLYGON_LAYERS) {
          if (map.getLayer(fill)) {
            map.setPaintProperty(fill, "fill-opacity", 0)
          }
          if (map.getLayer(outline))
            map.setPaintProperty(outline, "line-opacity", 0)
        }
      } catch {
        console.log("No map fills or layers to clear")
      }
    }
  }, [isActive, progress, backOutOpacity])

  useEffect(() => {
    if (!isInteractive || !mapHoverCode) return
    const map = mapAPI.mapRef?.current?.getMap?.()
    if (!map) return

    const config = getOutcomeConfig(mapHoverCode)
    if (!config) return

    const locData = outcomeLocationsRef.current[mapHoverCode]
    if (!locData) return

    const layerId = config.mapboxLayerId
    const idProp = config.idProperty ?? "DU_ID"
    const code = mapHoverCode

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
  }, [isInteractive, mapHoverCode, mapAPI.mapRef])

  /* Keep outcome visualization scenario in sync with hydroclimate. */
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

  /* Build a Mapbox fill-color expression that assigns tier colors. */
  const outcomeLocationsRef = useRef(outcomeLocations)
  outcomeLocationsRef.current = outcomeLocations

  // Tier data the interactive painter uses. Same as `outcomeLocations` on the
  // base scenario, overlaid with the selected climate variant's tiers so a
  // heatmap cc50/cc95 cell paints that climate's colors. Separate from
  // `outcomeLocations` so the morph glyphs keep base-scenario colors.
  const painterOutcomeLocations = useMemo(
    () =>
      Object.keys(climateOverrides).length > 0
        ? { ...outcomeLocations, ...climateOverrides }
        : outcomeLocations,
    [outcomeLocations, climateOverrides],
  )
  const painterOutcomeLocationsRef = useRef(painterOutcomeLocations)
  painterOutcomeLocationsRef.current = painterOutcomeLocations

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

  /* Per-outcome schedule for hiding map features as the SVG morph takes
   * over. Field contract in `HideScheduleEntry` (`engine/types.ts`). Read by
   * `MapPaintArbiter` via `ctx.getHideSchedule()`. */
  const hideScheduleRef = useRef<HideScheduleEntry[]>([])

  /** Mapbox match expression blending `fromHex` to each DU's tier color at
   *  ratio `t` (0 = all from, 1 = all tier). */
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

  // Engine arbiter instances (stable for the lifetime of this mount).
  const arbitersRef = useRef<readonly Arbiter[] | null>(null)
  if (arbitersRef.current === null) {
    arbitersRef.current = [
      new MapPaintArbiter(),
      new MapPopupArbiter(),
      new OverlayPopupArbiter(),
      new NarrationArbiter(),
      new OverlayMorphArbiter(),
    ]
  }

  /* Interactive layer drivers + director. Event-driven (not in the
   * progress-dispatch `arbitersRef` list). `InteractivePaintArbiter` is sole
   * writer for `demand-units` / `demand-units-outline`. `PolygonLayerDriver`
   * is sole writer for the non-DU polygon fills/outlines (WBA, reservoir,
   * delta) plus their gold highlight. `InteractiveLayerDirector` holds both
   * and sequences the handoff on family swap (fade old out, new in, gated on
   * camera idle) so two owners don't race. */
  const interactivePaintArbiterRef = useRef<InteractivePaintArbiter | null>(
    null,
  )
  if (interactivePaintArbiterRef.current === null) {
    interactivePaintArbiterRef.current = new InteractivePaintArbiter()
  }

  const polygonLayerDriverRef = useRef<PolygonLayerDriver | null>(null)
  if (polygonLayerDriverRef.current === null) {
    polygonLayerDriverRef.current = new PolygonLayerDriver()
  }

  const interactiveLayerDirectorRef = useRef<InteractiveLayerDirector | null>(
    null,
  )
  if (interactiveLayerDirectorRef.current === null) {
    interactiveLayerDirectorRef.current = new InteractiveLayerDirector(
      interactivePaintArbiterRef.current,
      polygonLayerDriverRef.current,
    )
  }

  // Bridge refs for the `*Arbiter` actors that delegate to component-owned
  // callbacks. Each child writes its `applyXxxFrame(v)` into `.current` on
  // mount and clears it on unmount. The arbiter reads through the ref on each
  // `onUpdate`, keeping the engine the single `progress.on('change')`
  // subscriber.
  const narrationTickRef = useRef<((v: number) => void) | null>(null)
  const overlayMorphTickRef = useRef<((v: number) => void) | null>(null)

  // Engine context. Rebuilt every render, but the engine reads via a ref so
  // no re-subscription happens. Actor functions close over the `ctx` current
  // at dispatch time, so the latest React-state snapshot flows through. Fresh
  // Map on every `centroids` change so `buildHighlight` never reads a stale
  // empty Map (which would make the loi-highlight step-5 popup return null).
  const engineCentroidLookup = useMemo(
    () =>
      new Map<string, { lng: number; lat: number }>(
        centroids.map((c) => [c.id, { lng: c.lng, lat: c.lat }] as const),
      ),
    [centroids],
  )

  // Demo-mode state. The engine writes these setters via BeatEngineContext.
  // The overlay reads the derived key and hovered-location to drive the
  // gold-ring highlight and square-side popup during the scripted demo.
  const [demoLocation, setDemoLocation] = useState<LocationInfo | null>(null)
  const demoLocationKey = demoLocation ? locKey(demoLocation) : null
  const [demoHoveredLocation, setDemoHoveredLocation] =
    useState<LocationInfo | null>(null)

  const engineContext: BeatEngineContext = useMemo(
    () => ({
      mapRef: mapAPI.mapRef ?? null,
      outcomeLocations,
      centroidLookup: engineCentroidLookup,
      setDemoLocation,
      setDemoHoveredLocation,
      buildBlendedTierExpr,
      resolveDuName: (duId) =>
        outcomeLocations["AG_REV"]?.nameMap[duId] ??
        getDemandUnitDisplayName(duId) ??
        duId,
      resolveTierLabel: getTierLabel,
      getHideSchedule: () => hideScheduleRef.current,
      narrationTickRef,
      overlayMorphTickRef,
      // Route through `engineApiRef` (same pattern as teardown). Safe because
      // arbiters call `getMode()` only during dispatch, after `useBeatEngine`
      // populates the ref. Defaults to "idle" before first mount.
      getMode: () => engineApiRef.current?.getMode() ?? "idle",
      isActive,
    }),
    // `buildBlendedTierExpr` is a non-stable inner function but closes over a
    // ref, so its identity doesn't matter. Explicit deps memoize the context
    // on identity-stable inputs only. The engine reads via a ref, so this dep
    // set does not drive re-subscription.
    [mapAPI.mapRef, outcomeLocations, engineCentroidLookup, isActive],
  )
  engineContextRef.current = engineContext

  const engineApi = useBeatEngine({
    progress,
    actorGroups: ACTOR_GROUPS,
    context: engineContext,
    arbiters: arbitersRef.current,
    enabled: !isLoading && isActive,
  })
  engineApiRef.current = engineApi

  /* Interactive layer paint (demand-units + non-DU polygons). One path
   * through `InteractiveLayerDirector`: reconciles ownership of the
   * demand-units arbiter and polygon driver on selection change and applies
   * the per-selection overlay, sequencing cross-family handoffs. The unmount
   * release stays below so its order relative to the map-layer reset
   * holds. */
  useInteractiveLayerDirector({
    directorRef: interactiveLayerDirectorRef,
    engineContext,
    engineApiRef,
    selectedOutcomeCode,
    playState,
    theme,
    duOutcomeLocations: painterOutcomeLocations,
    duOutcomeLocationsRef: painterOutcomeLocationsRef,
    polyOutcomeLocations: outcomeLocations,
    polyOutcomeLocationsRef: outcomeLocationsRef,
    activeLocationSet,
    pinnedLocations,
    spotlightedTier,
  })

  /* Storyboard map-layer unmount cleanup */
  useEffect(() => {
    const mapRef = mapAPI.mapRef?.current
    if (!mapRef || isLoading) return
    return () => {
      const map = mapRef.getMap?.()
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
    }
  }, [mapAPI.mapRef, isLoading])

  /* Interactive layer director unmount release (both drivers) */
  useEffect(() => {
    return () => {
      const ctx = engineContextRef.current
      if (ctx) interactiveLayerDirectorRef.current?.release(ctx)
    }
  }, [])

  /* Project outcome geometry into panel-relative screen polygons. Owns
   * panelSize and the screen-polygon map. Nav and camera fly trigger a fresh
   * collect through `computePolygonDataRef`. */
  const {
    panelSize,
    allScreenPolygons,
    computePolygonDataRef,
    applyPanelOffsetRef,
  } = useScreenPolygonProjection({
    panelRef,
    isLoading,
    panelInView: isActive,
    centroids,
    allLocationIds,
    outcomeLocations,
    outcomeDisplayOrder: OUTCOME_DISPLAY_ORDER,
    mapAPI,
    geoCentroidsRef,
    // Squares track the map only during playback or before the morph
    // settles. Once paused or finished they sit at fixed panel positions, so
    // the camera can fly on a glyph click without a per-frame re-render.
    reprojectOnMove: playState === "playing" || beatIndex < 3,
  })

  /* Detect panel visibility and fly the camera home on first arrival, then
   * prime the map session (collect polygons, baseline the demand-units
   * palette). */
  useStoryboardCamera({
    isActive,
    isLoading,
    mapAPI,
    computePolygonDataRef,
    applyPanelOffsetRef,
    polygonsAllowedRef,
    animPolygonLayers: ANIM_POLYGON_LAYERS,
  })

  /* Build the Beat 2 grid layout from the screen polygons. Owns the morph
   * windows, two-column glyph layout, and the feature hide schedule the
   * engine reads via `hideScheduleRef`. */
  const {
    activeOutcomeGroups,
    locationNameMap,
    locationNameMapRef,
    outcomeMorphWindows,
    outcomeLayout,
    handleGlyphLayoutChange,
    distributionPositionMap,
  } = useStoryboardLayout({
    allScreenPolygons,
    outcomeLocations,
    tierOverrides,
    panelSize,
    outcomeDisplayOrder: OUTCOME_DISPLAY_ORDER,
    activeOutcomes: ACTIVE_OUTCOMES,
    hideScheduleRef,
  })

  /* Play, Next, Back, Restart handlers. Own every action that moves the
   * `progress` clock. Read the shared refs created above. Cursor state stays
   * here and is passed in via setters. */
  const { handlePlay, handleNext, handleBack, handleRestart } =
    useStoryboardNavigation({
      progress,
      backOutOpacity,
      prefersReducedMotion,
      panelInView: isActive,
      mapAPI,
      cameraArbiter: CAMERA_ARBITER,
      animPolygonLayers: ANIM_POLYGON_LAYERS,
      controlsRef,
      setBeatIndex,
      beatIndexRef,
      setPlayState,
      setHasPlayed,
      hasPlayedRef,
      setHoveredLocation,
      setPinnedLocations,
      engineApiRef,
      engineContextRef,
      interactiveLayerDirectorRef,
      computePolygonDataRef,
    })

  useStoryboardDebugLog({ progress, beatIndex, playState })

  /* Error state */
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

  return (
    <Box
      ref={panelRef}
      sx={{
        position: "relative",
        height: "100%",
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
          {/* Outcome polygon morph overlay: active during Beat 2. */}
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
                overlayMorphTickRef={overlayMorphTickRef}
                squaresPerRow={theme.scenarios.tierGrid.squaresPerRow}
                distributionPositionMap={distributionPositionMap}
                // On the bar and radar beats, clicking a glyph or vertex dot
                // paints its layer (see `handleOutcomeGlyphClick`). On grid
                // and final beats the layer is driven by clicking a square
                // (see `locHandlers.onClick`), so chart selection stays off.
                onOutcomeClick={
                  outcomeGlyphClickEnabled || radarDotClickEnabled
                    ? handleOutcomeGlyphClick
                    : undefined
                }
                outcomeGlyphClickEnabled={outcomeGlyphClickEnabled}
                radarDotClickEnabled={radarDotClickEnabled}
                heatmapCellClickEnabled={heatmapCellClickEnabled}
                heatmapPrimaryScenarioId={resolvedScenarioId}
                selectedScenarioId={selectedScenarioId}
                onHeatmapCellClick={
                  heatmapCellClickEnabled ? handleHeatmapCellClick : undefined
                }
                selectedOutcomeCode={
                  isInteractive || outcomeSelectEnabled
                    ? selectedOutcomeCode
                    : null
                }
                interactive={isInteractive}
                squareHoverEnabled={squareHoverEnabled}
                activeLocationSet={
                  isInteractive ? activeLocationSet : undefined
                }
                hoveredLocation={
                  isInteractive ? hoveredLocation : demoHoveredLocation
                }
                demoHighlightedLocationKey={demoLocationKey}
                mustIncludeSourceIds={overlayMustIncludeSourceIds}
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
                extraHydroclimateColumns={heatmapExtraColumns}
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

          <BeatTextOverlay
            progress={progress}
            narrationTickRef={narrationTickRef}
            headingOpacity={headingOpacity}
            backOutOpacity={backOutOpacity}
            beatIndex={beatIndex}
            totalBeats={TIMING_BEATS.length}
            hasPlayed={hasPlayed}
            onPlay={handlePlay}
            onNext={handleNext}
            onBack={handleBack}
            onRestart={handleRestart}
            beat2Layout={outcomeLayout}
            selectedOutcomeCode={isInteractive ? selectedOutcomeCode : null}
            interactive={isInteractive}
            textHidden={!textVisible}
            scenarioId="s0020"
            scenarioName={s0020Scenario?.name ?? "Current operations"}
            scenarioDescription={s0020Scenario?.short_description ?? undefined}
            encodingMode={encodingMode}
            onEncodingChange={setEncodingMode}
            outcomeMorphWindows={outcomeMorphWindows}
            onGlyphLayoutChange={handleGlyphLayoutChange}
            hideControls={prefersReducedMotion}
            heatmapExtraColumnCount={heatmapExtraColumns.length}
          />
        </>
      )}
    </Box>
  )
}

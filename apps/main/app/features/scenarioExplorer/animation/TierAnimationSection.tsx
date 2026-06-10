"use client"

/* TierAnimationSection: the storyboard orchestrator
 *
 * Owns the shared `progress` clock and wires every piece together. It
 * does not animate anything directly. The body reads top to bottom as
 * state, navigation, selection, engine, then render. See the mental
 * model and the "TierAnimationSection" section in README.md.
 */

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
import { useScreenPolygonProjection } from "./hooks/useScreenPolygonProjection"
import { useStoryboardLayout } from "./hooks/useStoryboardLayout"
import { useStoryboardCamera } from "./hooks/useStoryboardCamera"
import { useInteractivePaint } from "./hooks/useInteractivePaint"
import { useStoryboardNavigation } from "./hooks/useStoryboardNavigation"
import { OUTCOME_CODE_ORDER, getOutcomeName } from "../../../content/outcomes"
import { getTierLabel } from "../../../content/tiers"
import { getDemandUnitDisplayName } from "../../map/config/demandUnitNames"
import { useScenarioTiers } from "../../scenarios/hooks/useTierData"
import { useScenarios } from "@repo/data/coeqwal/hooks"
import { TIMING_BEATS } from "./animationTiming"
import { LOI_DU_ID } from "./demandUnitsPaint"
import { getStartedViewportCardHeightCss } from "../getStarted/getStartedViewport"
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
  InteractiveOutlineArbiter,
  type OutlinePaintTarget,
  type BeatEngineApi,
  type BeatEngineContext,
  type Arbiter,
  type DemandUnitsOverlayState,
  type HideScheduleEntry,
} from "./engine"

const STORYBOARD_CONTENT_OVERFLOW_PX = 320

/* Beats where the distribution squares are settled in the panel as a grid,
 * so hovering or clicking an individual square is meaningful. The other
 * settled beats (list-bar, radar, heatmap) display the squares as a different
 * tool and have their own interactions, and the earlier beats still have the
 * squares on the map, in flight, or just finishing their morph, so
 * distribution-square hover stays off for all of those. Interactivity begins
 * once the grid has fully settled at loi-highlight. Keyed by beat id so
 * retuning the beat order is safe. */
const GRID_INTERACTIVE_BEAT_IDS: readonly string[] = ["loi-highlight"]

const CAM_CENTER: [number, number] = [-120.2, 38.5]
const CAM_ZOOM = 5.82

/** Stateless camera helper passed into `useStoryboardNavigation` and
 *  shared by its Next, Back, and Restart handlers. Centralizes the "ease
 *  back to home if not already there, with optional moveend continuation"
 *  pattern. Module-scope because `home` is fixed for this storyboard. */
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

/** Curated list of well-known agricultural water districts used to
 *  illustrate what a single polygon represents. Each popup
 *  reuses the standard LocationHighlight styling from the rest of the app
 *  so the visual language is consistent. The list is intentionally small
 *  and geographically diverse (Sac Valley, San Joaquin/Delta, Westside,
 *  Eastside), spanning multiple tier levels of AG_REV deliveries. */
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

  const [panelInView, setPanelInView] = useState(false)
  /** Storyboard cursor: driven by Next / Back. */
  const [beatIndex, setBeatIndex] = useState(0)
  /** Ref copy of `beatIndex` so navigation callbacks can read the
   *  latest cursor without needing to be re-created on every change. */
  const beatIndexRef = useRef(0)
  /** `true` once the user has clicked Play at least since the last reset.
   *  Gates which controls the BeatTextOverlay renders:
   *    - `false`: pre-play gate. Inline Play button beside the title,
   *               subtitle only. No bottom Back/Next row.
   *    - `true`: bottom control row (Back / N-of-T / Next) visible,
   *              Play button hidden.
   *  All animation math keys off `progress` and `beatIndex`, so
   *  `hasPlayed` only governs which chrome is shown. */
  const [hasPlayed, setHasPlayed] = useState(false)
  const hasPlayedRef = useRef(false)
  /** Derived state describing where the user is in the storyboard.
   *  - `idle`: no advance yet
   *  - `playing`: actively animating between two beats
   *  - `paused`: settled on a non-final beat, waiting for user input
   *  - `finished`: settled on the final beat (interactive UI lights up) */
  const [playState, setPlayState] = useState<
    "idle" | "playing" | "paused" | "finished"
  >("idle")
  /** `prefers-reduced-motion: reduce` honored at the orchestration level:
   *  every `goTo` collapses to a 0-second snap and the auto-arrival path
   *  jumps straight to the settled end-state. Child listeners on
   *  `progress` resolve themselves to their v = 1 branches, so no
   *  per-listener reduced-motion code is needed. */
  const prefersReducedMotion = useReducedMotion() ?? false

  const polygonsAllowedRef = useRef(false)
  const resolvedScenarioIdRef = useRef("s0020")

  /* Left-panel text visibility
   *
   * The zoom-based fade-out was retired (see the reprojection effect
   * further down) to keep the bottom navigation controls accessible
   * while the map is zoomed into a clicked square. The state is kept
   * so a future visibility trigger can set it without a wider refactor. */
  const [textVisible] = useState(true)

  /* Time-based progress (0 to 1) */
  const progress = useMotionValue(0)

  /* Back-out opacity for the left-panel text
   *
   * Normally 1 (no-op). When the user presses Back from beat 1/N we
   * animate it to 0 while `progress` is parked at 0.45, so the entire
   * text block (intro paragraphs, tier legend, bottom controls) fades
   * out together in one motion instead of reverse-tweening progress,
   * which would unwind every staggered reveal in reverse. On fade
   * completion we snap `progress` to 0 and this value back to 1, and
   * the pre-play gate re-renders from a clean slate. */
  const backOutOpacity = useMotionValue(1)

  // Map, overlay, and heading stay fully visible for the whole
  // storyboard (no fade-out).
  const overlayOpacity = useTransform(progress, [0, 1], [1, 1])
  const headingOpacity = useTransform(progress, [0, 1], [1, 1])

  const controlsRef = useRef<ReturnType<typeof animate> | null>(null)

  /** Ref copy of the beat engine's api so the navigation handlers (in
   *  `useStoryboardNavigation`) and the interactive paint effects can
   *  reach `setMode`/`teardown` without depending on the memoized
   *  `engineApi` identity. Assigned right after `useBeatEngine` runs
   *  later in this component body. */
  const engineApiRef = useRef<BeatEngineApi | null>(null)

  /** Ref copy of the memoized `engineContext`. Populated right after
   *  `useMemo(engineContext, ...)` runs later in this component body.
   *  Exists so the navigation handlers and the unmount effect can pass a
   *  live context to `InteractivePaintArbiter.release()` without
   *  depending on the memoized object's identity. */
  const engineContextRef = useRef<BeatEngineContext | null>(null)

  const activeVisualization = useActiveOutcomeVisualization()
  const selectedOutcomeCode = activeVisualization?.outcomeCode ?? null
  // The climate scenario backing the current selection. Bar and radar clicks
  // select the base scenario (s0020). Heatmap cells can select a climate
  // variant column (cc50/cc95), which paints that climate's tiers on the map.
  const selectedScenarioId = activeVisualization?.scenarioId ?? "s0020"

  // General interactive gate for the location-highlight pipeline, the map
  // hover/click wiring, and the overlay structure. Active on the final settled
  // beat and on the grid beats. Off on the other paused beats and during
  // playback so nothing responds while the storyboard is still moving.
  const onGridBeat = GRID_INTERACTIVE_BEAT_IDS.includes(
    TIMING_BEATS[beatIndex]?.id ?? "",
  )
  const isInteractive =
    playState === "finished" || (playState === "paused" && onGridBeat)

  // Per-square hover/click is only meaningful on the grid beats, where the
  // squares are settled as a distribution grid. On the final beat and the
  // bar/radar/heatmap beats the same shapes are reshaped into a chart, so
  // square hover would fire stray popups over the chart area.
  const squareHoverEnabled = playState === "paused" && onGridBeat

  // Map-polygon hover mirrors square hover on the grid beats. The
  // demand-units layer is only painted on the loi-highlight beat, so that is
  // the only grid beat with polygons on the map to hover. Attribute those
  // hovers to AG_REV (the demand-units outcome) when nothing is explicitly
  // selected, so they flow through the same shared hover state as squares.
  const onLoiBeat = TIMING_BEATS[beatIndex]?.id === "loi-highlight"
  // The hydroclimate matrix is a tool view: clicking a cell paints the map,
  // but map-polygon hover stays off so the matrix reads as the only control.
  const onHeatmapBeat = TIMING_BEATS[beatIndex]?.id === "heatmap"
  const mapHoverCode = onHeatmapBeat
    ? null
    : (selectedOutcomeCode ?? (onLoiBeat ? "AG_REV" : null))

  // On the bar-chart beat, clicking an outcome's chart glyph paints that
  // outcome's layer on the map. This is a separate gate from the grid hover
  // because the bars are not per-square hit targets, the whole glyph selects
  // its outcome. Off everywhere else so the glyphs stay display-only.
  const onBarBeat = TIMING_BEATS[beatIndex]?.id === "list-bar"
  const outcomeGlyphClickEnabled = playState === "paused" && onBarBeat

  // On the radar beat, clicking an outcome's vertex dot paints that outcome's
  // layer on the map, same destination as the bar glyph. The radar collapses
  // every outcome into one shared chart, so the hit targets are the per-vertex
  // dots rather than the per-outcome bounds rects.
  const onRadarBeat = TIMING_BEATS[beatIndex]?.id === "radar"
  const radarDotClickEnabled = playState === "paused" && onRadarBeat

  // On the heatmap beat (the final, settled beat), clicking a matrix cell
  // paints its outcome under that cell's climate-column scenario.
  const heatmapCellClickEnabled = playState === "finished" && onHeatmapBeat

  // Any chart selection path is active (bar glyph, radar dot, or heatmap
  // cell). All paint an outcome layer on the map. The heatmap routes through
  // its own handler because it also carries the column's climate scenario.
  const outcomeSelectEnabled =
    outcomeGlyphClickEnabled || radarDotClickEnabled || heatmapCellClickEnabled

  // On the settled-grid beats, let unpinned (hover) highlights render as map
  // popups and let pointer events reach the map behind the storyboard, so the
  // user can pan, zoom, and hover map polygons. Both are off elsewhere so
  // hover stays quiet and the storyboard keeps its scripted camera.
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
  // No per-location tier overrides are applied. Kept as an empty record so
  // the screen-polygon color-resolution path below stays unchanged.
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
    // Hydroclimate IDs from `HYDROCLIMATE_ID_MAP`: cc50=3, cc95=4. The
    // API returns the numeric `hydroclimate_id` and the local map carries
    // the short-code mapping until the cutover described in the database
    // README ("Hydroclimate metadata" roadmap item).
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
   * actually resolved. If the API doesn't expose the cc50 or cc95
   * sibling for this strategy, the column is dropped entirely rather
   * than rendering an empty-chrome header + blank cells. The downstream
   * geometry in `OutcomeMorphOverlay.heatmapGeometry` and `BeatTextOverlay`
   * keys off array length, so the layout collapses cleanly to fewer
   * columns. */
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
  // the base scenario (s0020), so the painter falls through to the base
  // `outcomeLocations` everywhere except a selected cc50/cc95 heatmap cell.
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
        // Sticky single-select: clicking a square makes that location the
        // active one (gold ring on the square, gold stroke on the polygon,
        // popup on both) and brings up the corresponding outcome's map
        // layer. Clicking the same square again deselects and hides the
        // layer. Clicking a square in a different outcome swaps both the
        // pin and the map layer and flies the camera to the new outcome
        // (matching the old outcome-title-click camera behavior).
        const key = locKey(info)
        const prevPins = pinnedLocationsRef.current
        const wasSelected = prevPins.has(key)

        // Determine the current outcome of the pinned selection (if any)
        // so we can detect cross-outcome switches. We look at the first
        // entry because sticky single-select holds at most one pin.
        const prevEntry = prevPins.values().next().value as
          | LocationInfo
          | undefined
        const prevOutcomeCode = prevEntry?.code ?? null
        // Fly the camera whenever the selection enters a new outcome:
        //   - first click (no previous outcome, now info.code): fly
        //   - swap to a different outcome (A then B): fly
        //   - swap within the same outcome (A square 1 then square 2): no fly
        //   - de-select (wasSelected): no fly (handled below)
        const isNewOutcomeSelection =
          !wasSelected && prevOutcomeCode !== info.code

        if (wasSelected) {
          setPinnedLocations(new Map())
        } else {
          setPinnedLocations(new Map([[key, info]]))
        }

        // Clear hover so the sticky selection is the sole highlight owner
        // and no ephemeral tooltip stacks on top of it.
        setHoveredLocation(null)

        // Keep the outcome map layer in sync with the sticky selection.
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

  // Fly the camera to an outcome's region, matching the square-click camera
  // (see `locHandlers.onClick`). Shared by the bar-glyph click below.
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

  // Clicking an outcome's bar glyph paints that outcome's layer on the map
  // and flies the camera to its region. Clicking the same outcome again
  // clears the layer. The painter (InteractivePaintArbiter via
  // useInteractivePaint) owns the demand-units layer whenever an outcome is
  // selected and the storyboard is paused, so this works on the bar beat
  // without flipping the broader interactive gate.
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

  // Clicking a heatmap matrix cell paints that outcome under the cell's
  // climate-column scenario and flies to its region. The selected scenario
  // drives `climateOverrides`, so the map shows that climate's tiers. Clicking
  // the same outcome + column again clears the layer.
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

  /* demo-LOI highlight state */
  const overlayMustIncludeSourceIds = useMemo(
    () => new Set<string>([LOI_DU_ID, ...TIER_BLEND_POPUP_DU_IDS]),
    [],
  )

  const prevOutcomeRef = useRef<string | null>(null)
  useEffect(() => {
    prevOutcomeRef.current = selectedOutcomeCode

    // Under sticky single-select, clicking a square atomically sets both
    // `pinnedLocations` and `selectedOutcomeCode`. If the pins already
    // belong to the new outcome (common case: user clicked a square in
    // outcome B while outcome A was pinned), keep them untouched. The
    // click handler is the source of truth. Only clear stale pins whose
    // outcome no longer matches (e.g. the storyboard animation switched
    // outcomes out from under a leftover selection).
    setPinnedLocations((current) => {
      if (current.size === 0) return current
      if (selectedOutcomeCode) {
        for (const pin of current.values()) {
          if (pin.code === selectedOutcomeCode) return current
        }
      }
      return new Map()
    })

    // Dropping the ephemeral hover on outcome change prevents a stale
    // hover tooltip (from the previous outcome) surviving into the new
    // outcome's view.
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

  /* InteractiveOutlineArbiter
   *
   * Sibling of `InteractivePaintArbiter`. Paints the non-demand-unit
   * polygon outcomes (reservoirs and the other outcome layers) while the
   * user clicks around in interactive mode. Event-driven, held in a ref
   * like `CameraArbiter`, not in the engine dispatch list. */
  const interactiveOutlineArbiterRef = useRef<InteractiveOutlineArbiter | null>(
    null,
  )
  if (interactiveOutlineArbiterRef.current === null) {
    interactiveOutlineArbiterRef.current = new InteractiveOutlineArbiter()
  }

  // Tracks whether the interactive hover (square or map polygon) wrote the
  // current map popups. On the loi-highlight beat the engine places the
  // scripted Glenn Colusa popup on arrival, so we only clear popups we placed
  // and leave the scripted one untouched until the user actually hovers.
  const wroteInteractiveHighlightsRef = useRef(false)
  useEffect(() => {
    // Reset on every beat change so a stale flag from a prior visit can't make
    // us wipe the scripted popup the moment we land on the beat.
    wroteInteractiveHighlightsRef.current = false
  }, [beatIndex])

  /* Location highlights (popup data, not paint)
   *
   * Builds the `LocationHighlight[]` the map popups read from coordinates,
   * names, and tier colors for every active location. Runs for all outcome
   * types and is independent of which arbiter paints the map. */
  useEffect(() => {
    if (!isInteractive) return

    if (activeLocationSet.size === 0) {
      // Nothing hovered or pinned. Clear our interactive popups, but only the
      // ones we wrote, so the scripted loi-highlight popup survives until the
      // user hovers something.
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
    if (playState !== "finished") wroteInteractiveHighlightsRef.current = true
  }, [
    isInteractive,
    playState,
    activeLocationSet,
    hoveredLocation,
    pinnedLocations,
    selectedOutcomeCode,
    locKey,
  ])

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
    // Only wire map hover and click dispatchers while interactive. During
    // storyboard playback the map must be read-only. Any `TierMarkers` /
    // `TierLocationLabels` that render mid-beat (e.g. the first frame an
    // outcome briefly becomes visualization-active during a preview)
    // would otherwise hand hover events into `locHandlers`, which flips
    // `hoveredLocation` state, invalidates `activeLocationSet`, and
    // reruns the paint effect mid-beat.
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

  /* Map hover/click to shared multi-pin state for visible outcome polygons */
  const locHandlersRef = useRef(locHandlers)
  locHandlersRef.current = locHandlers

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

  /* Activate persistent map (no visualization set until interactive mode) */
  useEffect(() => {
    mapActions.setMapMode("get-started")

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

  /* Keep outcome visualization scenario in sync with hydroclimate */
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

  /* Build a Mapbox fill-color expression that assigns tier colors */
  const outcomeLocationsRef = useRef(outcomeLocations)
  outcomeLocationsRef.current = outcomeLocations

  // Tier data the interactive painter uses. Same as `outcomeLocations` on the
  // base scenario, but overlaid with the selected climate variant's tiers so
  // a heatmap cc50/cc95 cell paints that climate's colors. Kept separate from
  // `outcomeLocations` so the morph glyphs keep their base-scenario colors.
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

  /* Per-outcome schedule for hiding map features as the SVG morph
   * takes over. See `HideScheduleEntry` in `engine/types.ts` for the
   * field contract. Populated by the outcome-schedule effect below
   * and read by the `MapPaintArbiter` via `ctx.getHideSchedule()`. */
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

  /* InteractivePaintArbiter
   *
   * Event-driven arbiter (same shape as `CameraArbiter`, not in the
   * progress-dispatch `arbitersRef` list). Sole writer for
   * `demand-units` / `demand-units-outline` during interactive mode.
   * The effects below call `sync` on every (mode, selection) change,
   * `applyOverlay` on spotlight/pin changes, and `release` to hand the
   * layers back on teardown. */
  const interactivePaintArbiterRef = useRef<InteractivePaintArbiter | null>(
    null,
  )
  if (interactivePaintArbiterRef.current === null) {
    interactivePaintArbiterRef.current = new InteractivePaintArbiter()
  }

  // Bridge refs for the `*Arbiter` actors that delegate to
  // component-owned callbacks. Each child component writes its
  // `applyXxxFrame(v)` callback into `.current` on mount and clears
  // it on unmount. The arbiter reads through the ref on each
  // `onUpdate`, keeping the engine the single `progress.on('change')`
  // subscriber without lifting the components' large per-frame
  // DOM-mutation bodies into declarative actor payloads.
  const narrationTickRef = useRef<((v: number) => void) | null>(null)
  const overlayMorphTickRef = useRef<((v: number) => void) | null>(null)

  // Engine context. Rebuilt every render, but the engine reads via a
  // ref so no re-subscription happens. Every actor function (e.g.
  // `buildHighlight`) closes over whatever `ctx` was current at
  // dispatch time, so the latest React-state snapshot flows through.
  // We build a fresh Map on every `centroids` change so the
  // `buildHighlight` functions that read `ctx.centroidLookup` never see
  // a stale empty Map. (Caching the lookup once would leave the context
  // holding the initial empty Map after data loads, and the loi-highlight
  // beat's step-5 map popup would return null and never write to the store.)
  const engineCentroidLookup = useMemo(
    () =>
      new Map<string, { lng: number; lat: number }>(
        centroids.map((c) => [c.id, { lng: c.lng, lat: c.lat }] as const),
      ),
    [centroids],
  )

  // Demo-mode state. The animation engine writes to these setters via
  // BeatEngineContext (see engine/types.ts) and the overlay reads the
  // derived key and hovered-location values to drive the gold-ring
  // highlight and the square-side popup during the scripted demo path
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
      // Route through `engineApiRef` (same pattern as teardown). Safe
      // because arbiters only call `getMode()` during dispatch, which
      // happens after `useBeatEngine` has populated the ref. Before
      // first mount the ref is null and we default to "idle".
      getMode: () => engineApiRef.current?.getMode() ?? "idle",
    }),
    // `buildBlendedTierExpr` is a non-stable inner function. It closes
    // over `tierColorLookupRef` (a ref) so its identity doesn't
    // matter. Explicit deps keep the context memoized only when its
    // identity-stable inputs change. The engine reads via a ref so the
    // dep set here does not drive re-subscription.
    [mapAPI.mapRef, outcomeLocations, engineCentroidLookup],
  )
  engineContextRef.current = engineContext

  const engineApi = useBeatEngine({
    progress,
    actorGroups: ACTOR_GROUPS,
    context: engineContext,
    arbiters: arbitersRef.current,
    enabled: !isLoading,
  })
  engineApiRef.current = engineApi

  /* Interactive demand-units paint
   *
   * Reconciles the InteractivePaintArbiter's ownership of the
   * `demand-units` layers and applies the per-selection overlay. The
   * unmount release stays in this file (below) so its cleanup order
   * relative to the map-layer reset is preserved. */
  useInteractivePaint({
    interactivePaintArbiterRef,
    engineContext,
    engineApiRef,
    selectedOutcomeCode,
    playState,
    theme,
    outcomeLocations: painterOutcomeLocations,
    outcomeLocationsRef: painterOutcomeLocationsRef,
    activeLocationSet,
    pinnedLocations,
    spotlightedTier,
  })

  /* Non-DU polygon paint
   *
   * Hands the sibling arbiter the target layers and the current overlay
   * (active, pinned, and spotlight feature ids, reservoir-translated)
   * whenever the selection changes. Passes null to release when the
   * selection is not a non-DU polygon outcome. The demand-units layers are
   * owned by `InteractivePaintArbiter`, not here. */
  useEffect(() => {
    const arbiter = interactiveOutlineArbiterRef.current
    if (!arbiter) return

    const config =
      (isInteractive || outcomeSelectEnabled) && selectedOutcomeCode
        ? getOutcomeConfig(selectedOutcomeCode)
        : null
    const isNonDuPolygon =
      !!config &&
      config.geometryType === "polygon" &&
      config.layerType !== "demand-units"

    if (!isNonDuPolygon || !config) {
      arbiter.sync(engineContext, null, null)
      return
    }

    const idProperty = config.idProperty ?? "DU_ID"

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

    const spotlightFeatureIds: string[] = []
    if (spotlightedTier != null) {
      const locData = outcomeLocationsRef.current[selectedOutcomeCode!]
      if (locData) {
        for (const [locId, tier] of Object.entries(locData.tierMap)) {
          if (tier === spotlightedTier) {
            const fid =
              selectedOutcomeCode === "RES_STOR"
                ? (RESERVOIR_CALSIM_TO_GNISIDLABEL[locId] ?? locId)
                : locId
            spotlightFeatureIds.push(fid)
          }
        }
      }
    }

    const overlay: DemandUnitsOverlayState = {
      outcomeCode: selectedOutcomeCode!,
      activeFeatureIds,
      pinnedFeatureIds,
      spotlightFeatureIds,
      hasSpotlight: spotlightedTier != null,
    }

    const target: OutlinePaintTarget = {
      outcomeCode: selectedOutcomeCode!,
      fillId: config.mapboxLayerId,
      outlineId: `${config.mapboxLayerId}-outline`,
      idProperty,
      outlineOnly: !!config.outlineOnly,
    }

    arbiter.sync(engineContext, target, overlay)

    return () => arbiter.cancelPendingTeardown()
  }, [
    engineContext,
    isInteractive,
    outcomeSelectEnabled,
    selectedOutcomeCode,
    activeLocationSet,
    pinnedLocations,
    spotlightedTier,
  ])

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

  /* InteractivePaintArbiter unmount release */
  useEffect(() => {
    return () => {
      const ctx = engineContextRef.current
      if (ctx) interactivePaintArbiterRef.current?.release(ctx)
    }
  }, [])

  /* Project outcome geometry into panel-relative screen polygons.
   * Owns panelSize and the screen-polygon map. Nav and the camera fly
   * trigger a fresh collect through `computePolygonDataRef`. */
  const {
    panelSize,
    allScreenPolygons,
    computePolygonDataRef,
    applyPanelOffsetRef,
  } = useScreenPolygonProjection({
    panelRef,
    isLoading,
    panelInView,
    centroids,
    allLocationIds,
    outcomeLocations,
    outcomeDisplayOrder: OUTCOME_DISPLAY_ORDER,
    mapAPI,
    geoCentroidsRef,
    // Squares track the map only during active playback (where they may be
    // mid-morph) or before the morph settles. Once paused or finished on the
    // settled grid and chart beats, they sit at fixed panel positions, so the
    // camera can fly on a glyph click without a per-frame overlay re-render.
    reprojectOnMove: playState === "playing" || beatIndex < 3,
  })

  /* Detect panel visibility and fly the camera home on first arrival,
   * then prime the map session (collect polygons, baseline the
   * demand-units palette). */
  useStoryboardCamera({
    panelRef,
    panelInView,
    setPanelInView,
    isLoading,
    mapAPI,
    home: { center: CAM_CENTER, zoom: CAM_ZOOM },
    computePolygonDataRef,
    applyPanelOffsetRef,
    polygonsAllowedRef,
    animPolygonLayers: ANIM_POLYGON_LAYERS,
  })

  /* Build the Beat 2 grid layout from the screen polygons.
   * Owns the morph windows, two-column glyph layout, and the feature
   * hide schedule the engine reads via `hideScheduleRef`. */
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

  /* Play, Next, Back, and Restart handlers
   *
   * Owns every action that moves the `progress` clock. Reads the
   * shared refs (engine api, engine context, interactive paint arbiter,
   * polygon recompute) created above. The cursor state stays here and is
   * passed in via setters. */
  const { handlePlay, handleNext, handleBack, handleRestart } =
    useStoryboardNavigation({
      progress,
      backOutOpacity,
      prefersReducedMotion,
      panelInView,
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
      interactivePaintArbiterRef,
      computePolygonDataRef,
    })

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
        height: getStartedViewportCardHeightCss(theme, {
          contentOverflowPx: STORYBOARD_CONTENT_OVERFLOW_PX,
        }),
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
          {/* Outcome polygon morph overlay: active during Beat 2 */}
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
                // On the bar and radar beats, clicking an outcome's glyph or
                // vertex dot paints its layer on the map (see
                // `handleOutcomeGlyphClick`). On the grid and final beats the
                // layer is driven by clicking a distribution square instead
                // (see `locHandlers.onClick`), so chart selection stays off
                // there.
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

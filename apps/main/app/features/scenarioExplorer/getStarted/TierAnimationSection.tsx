"use client"

import { useRef, useState, useEffect, useCallback, useMemo } from "react"
import { Box, Typography, useTheme, CircularProgress } from "@repo/ui/mui"
import {
  useMotionValue,
  useTransform,
  motion,
  animate,
  useReducedMotion,
} from "@repo/motion"
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
  BASEMAP_DIM_OPACITY,
  getOutcomeConfig,
  RESERVOIR_CALSIM_TO_GNISIDLABEL,
} from "../../map/config/outcomeLayerRegistry"
import { resolveOutcomeCamera } from "../../map/config/resolveOutcomeCamera"
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

/* ── Storyboard beats ──
 *
 * The visualization is divided into discrete beats the user advances
 * through with Next / Back. Each beat is a checkpoint on the existing
 * `progress` MotionValue (0-1); clicking Next animates `progress` from
 * the current beat's checkpoint to the next one over the next beat's
 * `duration` seconds. All existing `progress.on("change")` listeners in
 * BeatTextOverlay / OutcomeMorphOverlay / this file already interpolate
 * smoothly between any two progress values, so beat navigation drops in
 * without changing any of them.
 *
 * Reading pauses happen naturally between Next clicks; tuning a beat's
 * duration tunes only that beat's perceived speed. */
interface BeatDef {
  /** Stable identifier (debug only). */
  id: string
  /** Target value of `progress` at the end of this beat. */
  progress: number
  /** Forward duration in seconds. Back uses 60% of this value. */
  duration: number
}

const BEATS: readonly BeatDef[] = [
  // B0 (1/4) - intro paragraphs fade, tier legend fully revealed.
  //      Played automatically on arrival. Durations are 3x the prior
  //      baseline so text + converging-blues beats give readers time
  //      to absorb the narrative.
  { id: "legend", progress: 0.45, duration: 12 },
  // B1 (2/4) - Merged transition + narrative. Duration 9s over 0.28
  //      progress (~0.32s per 0.01 progress). Sub-windows:
  //      1. Intro text collapses, tier legend floats to top of the
  //         left panel (0.46 → 0.49).
  //      2. As soon as the legend parks (no settle pause):
  //         (0.49 → 0.52, ~1s) the demand-units layer cross-fades
  //         OUT 0.65 → 0 while still wearing its frozen 3-blue
  //         palette; at 0.52, while invisible, the filter swaps to
  //         Agriculture-only and the fill-color is set directly to
  //         the AG_REV tier expression; (0.52 → 0.56, ~1.3s) the
  //         layer fades back IN 0 → 0.65, appearing already in its
  //         final tier colors. No solid-blue interstitial.
  //      3. The Beat 1C narrative paragraphs are spaced for reading:
  //         "For example, each colored location..." fades in at
  //         0.49 → 0.52 (concurrent with the map cross-fade out, so
  //         text and tier-colored polygons arrive together by 0.56),
  //         then "The colors correspond to different water delivery
  //         outcome levels..." fades in at 0.65 → 0.68, leaving a
  //         ~1.6s reading pause before the beat settles at 0.73.
  { id: "collapse-and-colors", progress: 0.73, duration: 9 },
  // B2 (3/4) - AG_REV polygons morph to their distribution squares.
  //      Tween plays the morph window [0.76, 0.78] and settles at
  //      0.78. 3.5s total over 0.05 progress: a brief lead-in (~2.1s
  //      from 0.73 → 0.76) lets the reader's eye reach the map, then
  //      the morph itself plays over [0.76, 0.78] (~1.4s).
  { id: "ag-rev-morph", progress: 0.78, duration: 3.5 },
  // B3 (4/4) - Merged "remaining outcomes" beat. The two Beat 1C
  //      paragraphs under the tier legend fade out (0.78 → 0.80),
  //      "For each scenario, outcome levels..." fades in in their
  //      place (0.80 → 0.82), and the remaining 8 outcome morphs play
  //      back-to-back over [0.84, 1.0]. Tween velocity matches AG_REV
  //      (~70s per progress unit), so each 0.02-wide morph window
  //      takes ~1.4s, identical to AG_REV's morph speed. Total
  //      duration 15.5s = 70 * 0.22 (the 0.78 → 1.0 span).
  { id: "all-other-morphs", progress: 1.0, duration: 15.5 },
] as const

const FINAL_BEAT_INDEX = BEATS.length - 1
const BACK_DURATION_FACTOR = 0.6
const MIN_NAV_DURATION = 0.4

/** Extra pixels added to the map panel's height beyond the "fits one
 *  viewport once the sticky header stack is subtracted" baseline. We
 *  intentionally let the panel extend below the fold: the intended
 *  reading posture for this panel is that the user scrolls so the
 *  title + Play button + subtitle park at the top of the visible area,
 *  and the extra pixels give the left text column enough room to hold
 *  the intro paragraphs + tier legend + beat-1C reveals + bottom
 *  controls without running against the bottom edge. Morph landing
 *  coordinates (polygon → square) are measured from the DOM via
 *  ResizeObserver in `BeatTextOverlay`, so the right-column geometry
 *  adapts automatically to the taller panel — no other tuning needed.
 *  Increase for more breathing room; decrease to bring the bottom
 *  back toward the fold. */
const TIER_PANEL_EXTRA_PX = 320

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
  { fill: "delta-detaw", outline: "delta-detaw-outline" },
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

/** Filter used during Beat 1C so the map isolates the Agricultural
 *  revenue story — only Agriculture demand-units are visible while the
 *  tier-color blend and AG example popups play out. The full
 *  DU_CLASS_FILTER is restored when Beat 2 starts. */
const DU_AG_ONLY_FILTER = ["==", ["get", "Class"], "Agriculture"]

/** Curated list of well-known agricultural water districts used to
 *  illustrate what a single polygon represents during Beat 1C. Each popup
 *  reuses the standard LocationHighlight styling from the rest of the app
 *  so the visual language is consistent. The list is intentionally small
 *  and geographically diverse (Sac Valley, San Joaquin/Delta, Westside,
 *  Eastside), spanning multiple tier levels of AG_REV deliveries. */
const BEAT1C_POPUP_DU_IDS: readonly string[] = [
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
  column: 0 | 1
  columnWidth: number
  isActive: boolean
  locationCount: number
  /** Pixel height of the glyph placeholder (0 when not active / no polygons).
   *  BeatTextOverlay renders a transparent Box of this height to reserve
   *  space in document flow; the SVG morph lands inside that rect. */
  targetHeight: number
  /** Caption text rendered in DOM below the glyph (e.g. "12 locations"). */
  locationDescription: string
}

interface GlyphRect {
  x: number
  y: number
  width: number
  height: number
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
  /** Storyboard cursor: index into `BEATS`. Driven by Next / Back. */
  const [beatIndex, setBeatIndex] = useState(0)
  /** Ref mirror of `beatIndex` so navigation callbacks can read the
   *  latest cursor without needing to be re-created on every change. */
  const beatIndexRef = useRef(0)
  /** `true` once the user has clicked Play at least since the last reset.
   *  Gates which control affordances the BeatTextOverlay renders:
   *    - `false` -> pre-play gate: inline Play button beside the title,
   *                 subtitle only; no bottom Back/Next row.
   *    - `true`  -> bottom control row (Back / N-of-T / Next) visible;
   *                 Play button hidden.
   *  All animation math keys off `progress` + `beatIndex`, so `hasPlayed`
   *  purely governs the visibility of chrome. */
  const [hasPlayed, setHasPlayed] = useState(false)
  const hasPlayedRef = useRef(false)
  /** Derived state describing where the user is in the storyboard.
   *  - `idle`: at B0, no advance yet
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

  /* ── Hide left-panel text when zoomed past threshold ── */
  const [textVisible, setTextVisible] = useState(true)
  const textVisibleRef = useRef(true)

  /* ── Time-based progress (0 → 1) ── */
  const progress = useMotionValue(0)

  /* ── Back-out opacity for the left-panel text ──
   *
   * Normally 1 (no-op). When the user presses Back from beat 1/N we
   * animate it to 0 while `progress` is parked at 0.45 — so the entire
   * text block (intro paragraphs, tier legend, bottom controls) fades
   * out together in one motion instead of reverse-tweening progress,
   * which would unwind every staggered reveal in reverse. On fade
   * completion we snap `progress` to 0 and this value back to 1, and
   * the pre-play gate re-renders from a clean slate. */
  const backOutOpacity = useMotionValue(1)

  // Map visibility: stays visible through beat 2
  // TODO(beat3): restore fade-out: useTransform(progress, [0, 0.72, 0.78], [1, 1, 0])
  const mapOpacity = useTransform(progress, [0, 1], [1, 1])
  // TODO(beat3): restore fade-out: useTransform(progress, [0.73, 0.78], [1, 0])
  const overlayOpacity = useTransform(progress, [0, 1], [1, 1])
  const headingOpacity = useTransform(progress, [0, 1], [1, 1])

  const controlsRef = useRef<ReturnType<typeof animate> | null>(null)

  /** Settle the animation to its resting end-state: clear visualization +
   *  highlights, hide all animation polygon/line layers, and flip
   *  `playState` into "finished" so the interactive UI lights up. Shared
   *  between the normal `animate(progress, 1, { onComplete })` finish and
   *  the reduced-motion fast-forward path below. */
  const settleToFinishedState = useCallback(() => {
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
  }, [mapAPI.mapRef])

  /* ── Storyboard navigation ──
   *
   * `goTo(targetIndex)` animates `progress` from its current value to
   * `BEATS[targetIndex].progress`. Direction determines the duration
   * source: forward uses the destination beat's `duration`, backward uses
   * `BACK_DURATION_FACTOR` of the source beat's `duration` so Back feels
   * snappier than Next. Under `prefers-reduced-motion`, every tween
   * collapses to an instantaneous `progress.set` + settle.
   *
   * `playState` updates:
   *   - "playing" during the tween
   *   - "finished" iff we landed on the final beat (enables interactive UI)
   *   - "paused" for any non-final landing
   *   - "idle" iff we landed on beat 0 (restart or Back from B1)
   *
   * While animating between two beats, listeners on `progress` in
   * BeatTextOverlay / OutcomeMorphOverlay already handle any intermediate
   * value, so no per-beat branching is needed inside those listeners. */
  const goTo = useCallback(
    (targetIndex: number, opts?: { viaCamera?: boolean }) => {
      const clamped = Math.max(0, Math.min(FINAL_BEAT_INDEX, targetIndex))
      const fromIndex = beatIndexRef.current
      if (controlsRef.current) controlsRef.current.stop()

      const target = BEATS[clamped]!
      const source = BEATS[fromIndex]!
      const forward = clamped > fromIndex
      const rawDuration = forward
        ? target.duration
        : source.duration * BACK_DURATION_FACTOR
      const duration = prefersReducedMotion
        ? 0
        : Math.max(MIN_NAV_DURATION, rawDuration)

      const runTween = () => {
        setBeatIndex(clamped)
        beatIndexRef.current = clamped

        const finalize = () => {
          if (clamped === FINAL_BEAT_INDEX) {
            settleToFinishedState()
          } else if (clamped === 0) {
            setPlayState("idle")
          } else {
            setPlayState("paused")
          }
        }

        if (duration === 0) {
          progress.set(target.progress)
          finalize()
          return
        }

        setPlayState("playing")
        controlsRef.current = animate(progress, target.progress, {
          duration,
          ease: "linear",
          onComplete: finalize,
        })
      }

      // Ensure polygon coords are fresh before any forward tween that
      // crosses into the morph region (the map may have been panned).
      if (forward) computePolygonDataRef.current()

      // Optionally fly the camera home first (used by Restart).
      const map = mapAPI.mapRef?.current?.getMap?.()
      if (opts?.viaCamera && map) {
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
            runTween()
          })
          map.easeTo({
            center: { lng: CAM_CENTER[0], lat: CAM_CENTER[1] },
            zoom: CAM_ZOOM,
            duration: 800,
          })
          return
        }
      }

      runTween()
    },
    [progress, prefersReducedMotion, mapAPI.mapRef, settleToFinishedState],
  )

  const handleNext = useCallback(() => {
    if (beatIndexRef.current >= FINAL_BEAT_INDEX) return
    goTo(beatIndexRef.current + 1)
  }, [goTo])

  /* ── Intro tween (Play button entry point) ──
   *
   * `progress` starts at 0 (empty map, nothing revealed). Clicking Play
   * tweens the first beat's window (0 → `BEATS[0].progress`) while
   * keeping `beatIndex` at 0 — so the storyboard indicator reads "1 / N"
   * the entire time. Under `prefers-reduced-motion`, the tween collapses
   * to an instant snap. */
  const playArrival = useCallback(() => {
    if (controlsRef.current) controlsRef.current.stop()
    setBeatIndex(0)
    beatIndexRef.current = 0
    const target = BEATS[0]!
    if (prefersReducedMotion) {
      progress.set(target.progress)
      setPlayState("paused")
      return
    }
    setPlayState("playing")
    controlsRef.current = animate(progress, target.progress, {
      duration: target.duration,
      ease: "linear",
      onComplete: () => setPlayState("paused"),
    })
  }, [progress, prefersReducedMotion])

  const handlePlay = useCallback(() => {
    // Clear any lingering back-out fade before starting the arrival
    // tween, in case Play is triggered mid-fade-out.
    if (controlsRef.current) controlsRef.current.stop()
    backOutOpacity.set(1)
    setHasPlayed(true)
    hasPlayedRef.current = true
    computePolygonDataRef.current()
    playArrival()
  }, [playArrival, backOutOpacity])

  /* ── Back ──
   *
   * On beat index > 0: normal backward tween to the previous beat.
   * On beat index === 0: do not reverse-tween `progress` (that would
   * unwind every staggered reveal). Instead, park `progress` at 0.45
   * and animate `backOutOpacity` 1 → 0 so the whole text block fades
   * out together. On completion, snap `progress` to 0 and
   * `backOutOpacity` back to 1, and flip `hasPlayed` off so the
   * pre-play gate (title + subtitle + Play button) re-renders from a
   * clean slate. */
  const handleBack = useCallback(() => {
    const i = beatIndexRef.current
    if (i > 0) {
      goTo(i - 1)
      return
    }
    if (!hasPlayedRef.current) return // pre-play: Back is a no-op

    if (controlsRef.current) controlsRef.current.stop()
    const finish = () => {
      // Snap underlying animation state back to pre-play in one frame
      // while the text is already faded out; the pre-play render takes
      // over with `backOutOpacity` reset to 1 (a no-op for the fresh
      // state since `progress` is 0 and the text block's progress-driven
      // opacity is already 0 at that value).
      progress.set(0)
      backOutOpacity.set(1)
      setHasPlayed(false)
      hasPlayedRef.current = false
      setPlayState("idle")
    }
    const duration = prefersReducedMotion ? 0 : 0.6
    if (duration === 0) {
      finish()
      return
    }
    setPlayState("playing")
    controlsRef.current = animate(backOutOpacity, 0, {
      duration,
      ease: "easeOut",
      onComplete: finish,
    })
  }, [goTo, progress, backOutOpacity, prefersReducedMotion])

  const handleRestart = useCallback(() => {
    if (controlsRef.current) controlsRef.current.stop()
    setHoveredLocation(null)
    setPinnedLocations(new Map())
    mapActions.clearLocationHighlights()
    mapActions.clearOutcomeVisualization()
    mapActions.clearMapTooltips()

    // Reset all animation polygon/line layers explicitly so the map-phase
    // effect's `v < 0.01` branch has a clean slate to rebuild from.
    const map = mapAPI.mapRef?.current?.getMap?.()
    if (map?.isStyleLoaded?.()) {
      try {
        for (const { fill, outline } of ANIM_POLYGON_LAYERS) {
          if (map.getLayer(fill)) {
            map.setLayoutProperty(fill, "visibility", "visible")
            map.setPaintProperty(fill, "fill-opacity-transition", {
              duration: 0,
              delay: 0,
            })
            map.setPaintProperty(fill, "fill-opacity", 0)
            map.setFilter(fill, null)
          }
          if (map.getLayer(outline)) {
            map.setLayoutProperty(outline, "visibility", "visible")
            map.setPaintProperty(outline, "line-opacity", 0)
          }
        }
        for (const lineLayer of ANIM_LINE_LAYERS) {
          if (map.getLayer(lineLayer)) {
            map.setPaintProperty(lineLayer, "line-opacity", 0)
          }
        }
        if (map.getLayer("demand-units")) {
          map.setFilter("demand-units", DU_CLASS_FILTER as never)
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
        // Reset shared `basemap-dim-overlay` to 0 here too, mirroring the
        // styled-layer setup path. See the comment at the demand-units
        // setup block below for why we override the transition.
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

      // Fly the camera home so the polygon coordinates the SVG overlay
      // computes on the next forward tween are anchored correctly.
      const currentCenter = map.getCenter()
      const currentZoom = map.getZoom()
      const needsMove =
        Math.abs(currentCenter.lng - CAM_CENTER[0]) > 0.01 ||
        Math.abs(currentCenter.lat - CAM_CENTER[1]) > 0.01 ||
        Math.abs(currentZoom - CAM_ZOOM) > 0.05

      if (needsMove) {
        map.easeTo({
          center: { lng: CAM_CENTER[0], lat: CAM_CENTER[1] },
          zoom: CAM_ZOOM,
          bearing: 0,
          pitch: 0,
          duration: 800,
        })
      }
    }

    // Park in the pre-play gate: user has to click Play again to re-play.
    progress.set(0)
    backOutOpacity.set(1)
    setBeatIndex(0)
    beatIndexRef.current = 0
    setHasPlayed(false)
    hasPlayedRef.current = false
    setPlayState("idle")
    computePolygonDataRef.current()
  }, [progress, backOutOpacity, mapAPI.mapRef])

  /* ── Arrival behaviour ──
   *
   * Normal motion: park in the pre-play gate. The user must click Play
   * explicitly to start the storyboard (they see the title, the Play
   * button, and the subtitle).
   * Reduced motion: jump straight to the final beat so the full settled
   * end-state is visible without any animation. */
  const hasAutoAdvancedRef = useRef(false)
  useEffect(() => {
    if (!panelInView) return
    if (hasAutoAdvancedRef.current) return
    hasAutoAdvancedRef.current = true
    if (prefersReducedMotion) {
      goTo(FINAL_BEAT_INDEX)
    }
    // Normal motion: nothing to do here; we wait for the user to click Play.
  }, [panelInView, prefersReducedMotion, goTo])

  /* ── Keyboard shortcuts ──
   *
   * Gated on `panelInView` so shortcuts don't steal keys when the user
   * has scrolled past. We only intercept ArrowRight / ArrowLeft / Home
   * when no modifier keys are held and no text input is focused. */
  useEffect(() => {
    if (!panelInView) return
    const isEditable = (el: EventTarget | null) => {
      if (!(el instanceof HTMLElement)) return false
      const tag = el.tagName
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        el.isContentEditable
      )
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return
      if (isEditable(e.target)) return
      if (e.key === "ArrowRight") {
        e.preventDefault()
        // Pre-play: ArrowRight acts as Play. Post-play: it advances.
        if (!hasPlayedRef.current) {
          handlePlay()
        } else {
          handleNext()
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        handleBack()
      } else if (e.key === "Home") {
        e.preventDefault()
        handleRestart()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [panelInView, handleNext, handleBack, handleRestart, handlePlay])

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
      // Reset demand-units when no outcome is selected
      const resetMap = mapAPI.mapRef?.current?.getMap?.()
      if (resetMap?.isStyleLoaded?.()) {
        try {
          if (resetMap.getLayer("demand-units")) {
            resetMap.setPaintProperty("demand-units", "fill-opacity", 0)
            resetMap.setFilter("demand-units", DU_CLASS_FILTER as never)
          }
          if (resetMap.getLayer("demand-units-outline")) {
            resetMap.setPaintProperty("demand-units-outline", "line-opacity", 0)
          }
        } catch {
          /* ok */
        }
      }
      return
    }

    // ── Polygon-specific Mapbox paint changes ──
    // OutcomePolygonLayer handles filter, fill-color, and base opacity.
    // This effect only handles gold outlines + spotlight/pinned opacity overrides.
    const map = mapAPI.mapRef?.current?.getMap?.()

    origLineColorRef.current = null
    origLineWidthRef.current = null

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
            map.setPaintProperty(outlineId, "line-opacity", [
              "case",
              activeMatch,
              1,
              0,
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

        if (!config.outlineOnly) {
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

  const fadeOutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleOutcomeClick = useCallback(
    (code: string, force?: boolean) => {
      const isToggleOff = selectedOutcomeCode === code

      if (isToggleOff && pinnedLocations.size > 0 && !force) return

      mapActions.clearMapTooltips()
      setHoveredLocation(null)

      if (fadeOutTimerRef.current) {
        clearTimeout(fadeOutTimerRef.current)
        fadeOutTimerRef.current = null
      }

      const map = mapAPI.mapRef?.current?.getMap?.()
      const isSwitching =
        !isToggleOff &&
        selectedOutcomeCode != null &&
        selectedOutcomeCode !== code

      if (isSwitching && map) {
        const prevConfig = getOutcomeConfig(selectedOutcomeCode!)
        if (
          prevConfig?.geometryType === "polygon" &&
          prevConfig.mapboxLayerId
        ) {
          const fillId = prevConfig.mapboxLayerId
          if (map.getLayer(fillId)) {
            map.setPaintProperty(fillId, "fill-opacity-transition", {
              duration: 200,
              delay: 0,
            })
            map.setPaintProperty(fillId, "fill-opacity", 0)
          }
        }
        fadeOutTimerRef.current = setTimeout(() => {
          fadeOutTimerRef.current = null
          mapActions.toggleOutcomeVisualization(code, resolvedScenarioId)
        }, 220)
      } else {
        mapActions.toggleOutcomeVisualization(code, resolvedScenarioId)
      }

      if (!map) return

      if (isToggleOff) {
        map.easeTo({
          center: { lng: CAM_CENTER[0], lat: CAM_CENTER[1] },
          zoom: CAM_ZOOM,
          duration: 1000,
        })
      } else {
        const action = resolveOutcomeCamera(code, "get-started")
        if (action.type === "fitBounds") {
          mapAPI.mapRef?.current?.fitBounds(action.bounds, {
            padding: action.padding,
            maxZoom: action.maxZoom,
            duration: action.duration,
          })
        } else {
          map.easeTo({
            center: action.center,
            zoom: action.zoom,
            duration: action.duration,
          })
        }
      }
    },
    [selectedOutcomeCode, mapAPI.mapRef, pinnedLocations, resolvedScenarioId],
  )

  useEffect(() => {
    return () => {
      controlsRef.current?.stop()
      if (fadeOutTimerRef.current) clearTimeout(fadeOutTimerRef.current)
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

  /* ── Activate persistent map (no visualization set until interactive mode) ── */
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
          // Ensure all animation layers have visibility "visible" at the
          // layout level - OutcomePolygonLayer may have set them to "none"
          // if it was previously mounted in another map mode.
          for (const { fill, outline } of ANIM_POLYGON_LAYERS) {
            if (map.getLayer(fill))
              map.setLayoutProperty(fill, "visibility", "visible")
            if (map.getLayer(outline))
              map.setLayoutProperty(outline, "visibility", "visible")
          }

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
          // Prep the shared `basemap-dim-overlay` (added by VisualizationLayers
          // and pinned to opacity 0 in get-started mode) for progress-driven
          // updates from this component. Override the 800ms transition
          // VisualizationLayers configures for the Explore path; otherwise
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

    let phase: "idle" | "beat1" | "beat1c" | "beat2" = "idle"

    // Beat 1  (0.00 → 0.49): blues cycle until FREEZE_AT, then hold still
    //          on all 3 DU classes (Agriculture, Urban, Refuge).
    // Beat 1B (0.49 → 0.52): cross-fade OUT — the demand-units layer
    //          fades from 0.65 → 0 with the frozen 3-blue palette
    //          intact. No "converge to mid-blue" interstitial; the
    //          polygons just disappear. Begins the instant the
    //          intro text collapse finishes (at 0.49) so there's
    //          no dead air after the legend settles at the top.
    // Beat 1C (0.52 → 0.78): at v = 0.52, while the layer is invisible,
    //          we swap the filter to Agriculture-only and set the
    //          fill-color directly to the AG_REV tier expression.
    //          (0.52 → 0.56) the layer fades back IN from 0 → 0.65
    //          already wearing its AG_REV tier colors — a clean
    //          cross-fade with no blue interstitial. (0.56 → 0.78)
    //          tier colors are locked while the Beat 1C text + example
    //          popups play.
    // Beat 2  (0.78 → 1.00): DU filter restored, tier colors locked; SVG
    //          morphs take over and features fade out on their slice.
    const FREEZE_AT = 0.18
    const BEAT1B_START = 0.49
    // Cross-fade windows (renamed in spirit, kept for diff readability):
    // BEAT1C_BLEND_START is the fade-out → fade-in pivot (filter swap
    // happens here, while the layer is at opacity 0). BEAT1C_BLEND_END
    // is when the AG_REV tier colors are fully visible at 0.65 opacity.
    const BEAT1C_BLEND_START = 0.52
    const BEAT1C_BLEND_END = 0.56
    // AG_REV now morphs solo starting at 0.76 (see getOutcomeProgressRange
    // in OutcomeMorphOverlay). Shifting BEAT2_START earlier kicks the full
    // DU filter restore + hide-schedule over in time for AG_REV's morph.
    const BEAT2_START = 0.76

    let frozenColorPhase = 0

    const unsub = progress.on("change", (v) => {
      const map = mapRef.getMap?.()
      if (!map?.isStyleLoaded?.()) return

      if (v < 0.01) {
        if (phase !== "idle") {
          try {
            if (map.getLayer("demand-units")) {
              // Restore the full DU_CLASS_FILTER on reset so the cycling
              // blues show across all 3 classes again from the top.
              map.setFilter("demand-units", DU_CLASS_FILTER as never)
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
            // Snap the basemap dim overlay back to 0 so a full reset
            // shows the bright basemap again.
            if (map.getLayer("basemap-dim-overlay")) {
              map.setPaintProperty("basemap-dim-overlay", "fill-opacity", 0)
            }
          } catch {
            /* ok */
          }
          phase = "idle"
          frozenColorPhase = 0
        }
        return
      }

      // Drive the shared basemap-dim-overlay so visualization layers pop
      // against the satellite basemap. Fades in in lockstep with the
      // initial blue-polygon reveal (v = 0 → FREEZE_AT * 0.33 ≈ 0.06)
      // and then holds steady through the blue cycle, cross-fade, AG_REV
      // tier colors, and all subsequent morphs. Only the v < 0.01 reset
      // branch above clears it.
      try {
        if (map.getLayer("basemap-dim-overlay")) {
          const dimFadeT = Math.min(1, v / (FREEZE_AT * 0.33))
          const dimOpacity = BASEMAP_DIM_OPACITY * dimFadeT
          map.setPaintProperty(
            "basemap-dim-overlay",
            "fill-opacity",
            dimOpacity,
          )
        }
      } catch {
        /* ok */
      }

      if (v < BEAT1B_START) {
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
      } else if (v < BEAT1C_BLEND_START) {
        // Beat 1B: cross-fade OUT. Keep the frozen 3-blue colors and
        // fade the layer's opacity from 0.65 → 0. No converge-to-mid
        // -blue interstitial — the polygons simply dissolve away,
        // freeing the eye to receive the AG_REV tier-colored polygons
        // that fade in next. If we're scrubbing backwards from beat1c,
        // first restore the full DU class filter and the frozen 3-blue
        // expression so the cross-fade reverses cleanly.
        if (phase !== "beat1") {
          try {
            if (map.getLayer("demand-units")) {
              map.setFilter("demand-units", DU_CLASS_FILTER as never)
              map.setPaintProperty(
                "demand-units",
                "fill-color",
                beat1FillExpr(frozenColorPhase) as never,
              )
            }
          } catch {
            /* ok */
          }
        }

        const fadeOutT =
          (v - BEAT1B_START) / (BEAT1C_BLEND_START - BEAT1B_START)
        const easedFadeOut = 1 - Math.pow(1 - fadeOutT, 2) // ease-out

        try {
          if (map.getLayer("demand-units")) {
            map.setPaintProperty(
              "demand-units",
              "fill-opacity",
              0.65 * (1 - easedFadeOut),
            )
          }
        } catch {
          /* ok */
        }
        phase = "beat1"
      } else if (v < BEAT1C_BLEND_END) {
        // Beat 1C: cross-fade IN. While the layer is at opacity 0 we
        // swap the filter to Agriculture-only and set fill-color to the
        // pure AG_REV tier expression (no blue blend). Then the layer
        // fades from 0 → 0.65 already wearing its tier colors, so the
        // user sees a clean fade from "blank water" to the colorful
        // visualization — no solid-blue intermediate.
        if (phase !== "beat1c") {
          try {
            if (map.getLayer("demand-units")) {
              map.setFilter("demand-units", DU_AG_ONLY_FILTER as never)
              const expr = buildBlendedTierExpr(BEAT1_MID, 1)
              if (expr) {
                map.setPaintProperty(
                  "demand-units",
                  "fill-color",
                  expr as never,
                )
              }
            }
          } catch {
            /* ok */
          }
        }

        const fadeInT =
          (v - BEAT1C_BLEND_START) / (BEAT1C_BLEND_END - BEAT1C_BLEND_START)
        const easedFadeIn = 1 - Math.pow(1 - fadeInT, 2) // ease-out

        try {
          if (map.getLayer("demand-units")) {
            map.setPaintProperty(
              "demand-units",
              "fill-opacity",
              0.65 * easedFadeIn,
            )
          }
        } catch {
          /* ok */
        }
        phase = "beat1c"
      } else if (v < BEAT2_START) {
        // Beat 1C tail: tier colors are fully blended; hold steady on
        // AG-only while the example text and popups play.
        if (phase !== "beat1c") {
          try {
            if (map.getLayer("demand-units")) {
              map.setFilter("demand-units", DU_AG_ONLY_FILTER as never)
              const expr = buildBlendedTierExpr(BEAT1_MID, 1)
              if (expr) {
                map.setPaintProperty(
                  "demand-units",
                  "fill-color",
                  expr as never,
                )
              }
              map.setPaintProperty("demand-units", "fill-opacity", 0.65)
            }
          } catch {
            /* ok */
          }
          phase = "beat1c"
        }
      } else {
        // Beat 2+: restore full DU filter so Urban + Refuge DUs become
        // visible with their own tier colors for their morph slices.
        // Progressively hide features as their SVG copies start animating.
        if (phase !== "beat2") {
          try {
            if (map.getLayer("demand-units")) {
              map.setFilter("demand-units", DU_CLASS_FILTER as never)
            }
            const expr = buildBlendedTierExpr(BEAT1_MID, 1)
            if (expr && map.getLayer("demand-units")) {
              map.setPaintProperty("demand-units", "fill-color", expr as never)
            }
            // Non-demand-unit polygon layers (calsim-wba, california-reservoir,
            // delta-detaw) stay hidden - the SVG overlay handles their outcomes.
            // Only demand-units is shown on the map during the animation.
          } catch {
            /* ok */
          }
          phase = "beat2"
        }

        // Collect demand-units hide schedule entries and line entries
        const duEntries: typeof hideScheduleRef.current = []
        const lineEntries: typeof hideScheduleRef.current = []

        for (const entry of hideScheduleRef.current) {
          if (
            entry.geometryType === "polygon" &&
            entry.mapboxLayerId === "demand-units"
          ) {
            duEntries.push(entry)
          } else if (entry.geometryType === "line" && entry.mapboxLayerId) {
            lineEntries.push(entry)
          }
        }

        // Build demand-units opacity expression:
        // - Fading entries: interpolated opacity (0.65 → 0)
        // - Not-yet-fading entries: 0.65 (still visible)
        // - Untracked DUs: 0 (hidden - prevents ghost mid-blue polygons)
        if (duEntries.length > 0 && map.getLayer("demand-units")) {
          const caseExpr: unknown[] = ["case"]
          for (const entry of duEntries) {
            if (v < entry.fadeStart) {
              caseExpr.push(
                ["in", ["get", "DU_ID"], ["literal", entry.locationIds]],
                0.65,
              )
            } else {
              const fadeDuration = entry.morphStart - entry.fadeStart
              const t = Math.min(1, (v - entry.fadeStart) / fadeDuration)
              const opacity = 0.65 * (1 - t)
              caseExpr.push(
                ["in", ["get", "DU_ID"], ["literal", entry.locationIds]],
                opacity,
              )
            }
          }
          caseExpr.push(0)
          try {
            map.setPaintProperty(
              "demand-units",
              "fill-opacity",
              caseExpr as never,
            )
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

  /* ── Beat 1C: progressive popups on a curated handful of AG districts ──
   *
   * During the Beat 1C tail (after the tier-color blend completes and before
   * Beat 2 starts), we reveal a few `LocationHighlight` popups to illustrate
   * concretely what the colored polygons represent. Popups appear staggered
   * across the window so the viewer's eye has time to read each one before
   * the next is drawn. They reuse the same tooltip styling (via
   * `mapActions.setLocationHighlights`) that's used elsewhere in the app when
   * a user hovers or pins a demand unit. */
  useEffect(() => {
    if (isLoading) return
    const agData = outcomeLocations["AG_REV"]
    if (!agData) return

    const POPUPS_IN = 0.69
    const POPUPS_OUT = 0.76 // clear at start of AG_REV morph (Beat 2)
    const count = BEAT1C_POPUP_DU_IDS.length
    const span = POPUPS_OUT - POPUPS_IN
    const perPopup = span / count
    let visibleCount = 0

    const clearAll = () => {
      if (visibleCount > 0) {
        mapActions.clearLocationHighlights()
        visibleCount = 0
      }
    }

    const unsub = progress.on("change", (v) => {
      if (v < POPUPS_IN || v >= POPUPS_OUT) {
        clearAll()
        return
      }
      const nextCount = Math.min(
        count,
        Math.floor((v - POPUPS_IN) / perPopup) + 1,
      )
      if (nextCount === visibleCount) return
      visibleCount = nextCount

      const highlights: import("../../map/store").LocationHighlight[] = []
      for (let i = 0; i < nextCount; i++) {
        const duId = BEAT1C_POPUP_DU_IDS[i]!
        const tier = agData.tierMap[duId]
        if (tier == null) continue
        const color = agData.colorMap[duId] ?? "#888888"
        const name =
          agData.nameMap[duId] ??
          getDemandUnitDisplayName(duId) ??
          duId
        const coord = centroidLookupRef.current.get(duId)
        if (!coord) continue
        highlights.push({
          key: `beat1c:AG_REV:${duId}`,
          longitude: coord.lng,
          latitude: coord.lat,
          name,
          tierLevel: tier,
          tierLabel: getTierLabel(tier),
          tierColor: color,
          pinned: true, // keep visible until we explicitly clear
        })
      }
      mapActions.setLocationHighlights(highlights)
    })

    return () => {
      unsub()
      clearAll()
    }
  }, [progress, outcomeLocations, isLoading])

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
   * Safe to call on every map move/zoom - feature count stays stable.
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

  // Re-apply offset on scroll (cheap - no Mapbox queries).
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

  /** Map of outcome code - Beat 2 morph window `{start, end}`.
   *  BeatTextOverlay uses `start` to fade in each outcome's title just
   *  before its own morph slice begins, and `end` to fade in the "X
   *  locations" caption once the polygons have settled as squares. */
  const outcomeMorphWindows = useMemo(() => {
    const map: Record<string, { start: number; end: number }> = {}
    if (activeOutcomeGroups.length === 0) return map
    const activeCodes = activeOutcomeGroups.map((g) => g.code)
    for (const group of activeOutcomeGroups) {
      const [start, end] = getOutcomeProgressRange(group.code, activeCodes)
      map[group.code] = { start, end }
    }
    return map
  }, [activeOutcomeGroups])

  useEffect(() => {
    const schedule: HideScheduleEntry[] = []
    const activeCodes = activeOutcomeGroups.map((g) => g.code)
    for (const group of activeOutcomeGroups) {
      const locData = outcomeLocations[group.code]
      if (!locData || locData.ids.size === 0) continue
      const config = getOutcomeConfig(group.code)
      if (!config) continue
      const [morphStart] = getOutcomeProgressRange(group.code, activeCodes)
      // Beat 2 slices are tighter now (0.22 span across 9 outcomes ≈ 0.024
      // each); use a shorter fade lead so the DU fade doesn't bleed into
      // the previous outcome's morph.
      const fadeStart = morphStart - 0.01

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

  /* Shared layout for Beat 2 text + distribution alignment (2 columns)
   *
   * The right-column layout lives in CSS document flow inside `BeatTextOverlay`.
   * This memo only describes *what* each outcome needs (column, label, glyph
   * height, caption); actual x/y positions are measured from the DOM via
   * `onGlyphLayoutChange` and flow back through `glyphLayout` state. The SVG
   * morph overlay uses those measured rects as landing coordinates. */
  const lockedHeightsRef = useRef<Map<string, number>>(new Map())

  const describeLocations = useCallback(
    (code: string, count: number): string => {
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
    },
    [],
  )

  const outcomeLayout = useMemo(() => {
    if (!panelSize) return null
    const sqPerRow = theme.scenarios.tierGrid.squaresPerRow
    // Estimate the per-column inner width so the distribution height
    // heuristic uses a realistic number of columns. The precise width is
    // measured from the DOM later; this is only used to decide row count.
    const approxColWidth = Math.max(80, panelSize.width * (1 / 3) / 2 - 36)

    // Left column renders in this explicit order (AG_REV before CWS_DEL).
    // We don't touch OUTCOME_CODE_ORDER globally — radar axes + NOD/SOD
    // helpers depend on that list — so we just prepend the left-column codes
    // in their desired order and iterate the rest of OUTCOME_CODE_ORDER after.
    const LEFT_COLUMN_ORDER = ["AG_REV", "CWS_DEL"] as const
    const LEFT_COLUMN_CODES = new Set<string>(LEFT_COLUMN_ORDER)
    const orderedCodes: string[] = [
      ...LEFT_COLUMN_ORDER,
      ...OUTCOME_CODE_ORDER.filter((c) => !LEFT_COLUMN_CODES.has(c)),
    ]

    // Eyebrow labels fade in alongside the right-panel backdrop so they're
    // fully present by the time beat 3 (AG_REV morph) settles at 0.78. The
    // 0.02 fade width is applied by BeatTextOverlay's progress handler.
    const EYEBROW_FADE_IN = 0.755
    const eyebrows = [
      {
        label: "Consumptive uses",
        x: 0,
        y: 0,
        columnWidth: approxColWidth,
        animationStart: EYEBROW_FADE_IN,
      },
      {
        label: "Non-consumptive uses",
        x: 0,
        y: 0,
        columnWidth: approxColWidth,
        animationStart: EYEBROW_FADE_IN,
      },
    ]

    const items: OutcomeLayoutItem[] = []

    for (let idx = 0; idx < orderedCodes.length; idx++) {
      const code = orderedCodes[idx]! as (typeof OUTCOME_CODE_ORDER)[number]
      const label = getOutcomeName(code)
      const isActive = ACTIVE_OUTCOMES.has(code)
      const col: 0 | 1 = LEFT_COLUMN_CODES.has(code) ? 0 : 1

      let locationCount = 0
      let targetHeight = 0

      if (isActive) {
        const group = outcomeGroups.find((g) => g.code === code)
        if (group && group.polygons.length > 0) {
          locationCount = group.polygons.length
          const freshHeight = computeDistributionHeight(
            group.polygons,
            sqPerRow,
            approxColWidth,
          )
          const locked = lockedHeightsRef.current.get(code)
          const distributionHeight =
            locked !== undefined ? Math.max(locked, freshHeight) : freshHeight
          lockedHeightsRef.current.set(code, distributionHeight)

          // Hug the squares: use the squares' visual bottom as the
          // placeholder height, so the caption sits just under the last
          // row with an identical gap across every outcome.
          // `distributionHeight` = totalRows * (SQUARE_SIZE + SQUARE_GAP)
          // includes a trailing SQUARE_GAP (6px) of empty space below the
          // last row; subtract it. No bar-height floor — bar/average
          // mode centers on slotHeight and may overflow small slots,
          // which we accept as a separate encoding-mode concern.
          const SQUARE_GAP_PX = 6
          targetHeight = Math.max(0, distributionHeight - SQUARE_GAP_PX)
        }
      }

      items.push({
        code,
        label,
        column: col,
        columnWidth: approxColWidth,
        isActive,
        locationCount,
        targetHeight,
        locationDescription: describeLocations(code, locationCount),
      })
    }

    return { items, eyebrows }
  }, [
    panelSize,
    outcomeGroups,
    theme.scenarios.tierGrid.squaresPerRow,
    describeLocations,
  ])

  /** DOM-measured glyph placeholder rects (relative to the right-column root
   *  in BeatTextOverlay, which is absolutely positioned at `right: 0` with
   *  `width: 33.33%`, i.e. its left edge aligns with `panelWidth * 2/3`).
   *  Populated via `onGlyphLayoutChange` from BeatTextOverlay's
   *  ResizeObserver; empty on first render (outcomes are invisible in Beat 1
   *  anyway, so the missing positions only become visible once measured). */
  const [glyphLayout, setGlyphLayout] = useState<Record<string, GlyphRect>>({})

  const handleGlyphLayoutChange = useCallback((layout: Record<string, GlyphRect>) => {
    setGlyphLayout((prev) => {
      // Shallow-compare to avoid redundant state updates (ResizeObserver can
      // fire frequently; same rects -> skip re-render).
      const prevKeys = Object.keys(prev)
      const nextKeys = Object.keys(layout)
      if (prevKeys.length === nextKeys.length) {
        let same = true
        for (const k of nextKeys) {
          const a = prev[k]
          const b = layout[k]!
          if (
            !a ||
            a.x !== b.x ||
            a.y !== b.y ||
            a.width !== b.width ||
            a.height !== b.height
          ) {
            same = false
            break
          }
        }
        if (same) return prev
      }
      return layout
    })
  }, [])

  const distributionPositionMap = useMemo(() => {
    const map: Record<
      string,
      { x: number; y: number; maxWidth: number; slotHeight: number }
    > = {}
    if (!outcomeLayout) return map
    for (const item of outcomeLayout.items) {
      if (!item.isActive || item.targetHeight <= 0) continue
      const g = glyphLayout[item.code]
      if (!g) continue
      map[item.code] = {
        x: g.x,
        y: g.y,
        maxWidth: g.width,
        slotHeight: g.height,
      }
    }
    return map
  }, [outcomeLayout, glyphLayout])

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
        // Baseline: shrink the panel so it fits the viewport once the
        // sticky header stack (collapsed header + Learn/Explore/Share
        // tabs + Explore sub-nav) is subtracted, plus the same 80 px
        // breathing-room constant used by GetStartedPanelShell
        // (PANEL_BREATHING_PX).
        //
        // Then add `TIER_PANEL_EXTRA_PX` so the left text column has
        // room for all reveals + bottom controls. The panel is
        // intentionally taller than one viewport — the user is
        // expected to scroll so the title + Play button park at the
        // top of the visible area; the extra pixels then extend below
        // the fold rather than crowding the text.
        height: `calc(100vh - ${theme.layout.collapsedHeaderHeight + 2 * theme.layout.collapsedTabHeight + 80 - TIER_PANEL_EXTRA_PX}px)`,
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
          {/* Background cover */}
          <MapFade opacity={mapOpacity} color={forestBg} />

          {/* Outcome polygon morph overlay - active during Beat 2 */}
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
            backOutOpacity={backOutOpacity}
            playState={playState}
            beatIndex={beatIndex}
            totalBeats={BEATS.length}
            hasPlayed={hasPlayed}
            onPlay={handlePlay}
            onNext={handleNext}
            onBack={handleBack}
            onRestart={handleRestart}
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
            outcomeMorphWindows={outcomeMorphWindows}
            onGlyphLayoutChange={handleGlyphLayoutChange}
            hideControls={prefersReducedMotion}
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

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
  getOutcomeConfig,
  RESERVOIR_CALSIM_TO_GNISIDLABEL,
} from "../../map/config/outcomeLayerRegistry"
import { resolveOutcomeCamera } from "../../map/config/resolveOutcomeCamera"
import {
  getOutcomeLocationCoordinates,
  SALMON_RIVER_CENTROID,
} from "../../map/config/outcomeLocations"
import { useTierAnimationData } from "./useTierAnimationData"
import type { OutcomeLocationData } from "./useTierAnimationData"
import OutcomeMorphOverlay, {
  type OutcomeGroup,
  type LocationInfo,
  type EncodingMode,
  getOutcomeProgressRange,
  computeDistributionHeight,
} from "./OutcomeMorphOverlay"
import BeatTextOverlay from "./BeatTextOverlay"
// Retired in favor of the anchored upper-left map popup rendered by
// `VisualizationLayers`; kept imported (prefixed to silence the unused-var
// lint) so un-commenting the card-list mount below is a one-line change.
import _PinnedLocationsList from "./PinnedLocationsList"
// TODO(beat3): restore ResearcherIllustrations import
// import ResearcherIllustrations from "./ResearcherIllustrations"
import { OUTCOME_CODE_ORDER, getOutcomeName } from "../../../content/outcomes"
import { getTierLabel } from "../../../content/tiers"
import { getDemandUnitDisplayName } from "../../map/config/demandUnitNames"
import { useScenarioTiers } from "../../scenarios/hooks/useTierData"
import { useScenarios } from "@repo/data/coeqwal/hooks"
import { BEATS, FINAL_BEAT_INDEX } from "./animationTiming"
import {
  useBeatEngine,
  BEAT_TABLE,
  MapPaintArbiter,
  MapPopupArbiter,
  OverlayPopupArbiter,
  NarrationArbiter,
  OverlayMorphArbiter,
  CameraArbiter,
  InteractivePaintArbiter,
  debugLog,
  logDuState,
  DU_CLASS_FILTER,
  writeDemandUnitsBaseline,
  ensureDemandUnitsOutlineLayer,
  type BaselineMap,
  type SessionInitMap,
  type BeatEngineApi,
  type BeatEngineContext,
  type Arbiter,
  type DemandUnitsOverlayState,
  type DemandUnitsPaintSpec,
  type HideScheduleEntry,
} from "./engine"

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
 *  coordinates (polygon -> square) are measured from the DOM via
 *  ResizeObserver in `BeatTextOverlay`, so the right-column geometry
 *  adapts automatically to the taller panel - no other tuning needed.
 *  Increase for more breathing room. Decrease to bring the bottom
 *  back toward the fold. */
const TIER_PANEL_EXTRA_PX = 320

const CAM_CENTER: [number, number] = [-120.2, 38.5]
const CAM_ZOOM = 5.82

/** Stateless camera helper shared by `goTo({ viaCamera: true })`,
 *  `handleBack`, and `handleRestart`. Centralizes the "ease back to
 *  home if not already there, with optional moveend continuation"
 *  pattern that was previously inlined three times. Module-scope
 *  because `home` is fixed for this storyboard. */
const CAMERA_ARBITER = new CameraArbiter({
  center: CAM_CENTER,
  zoom: CAM_ZOOM,
})

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

// `logDuState`, `debugLog`, and `DU_CLASS_FILTER` all live in
// `./engine` now and are imported at the top of the file.
// `DU_AG_ONLY_FILTER` is no longer referenced from this file. Its only
// caller, the legacy Beat 5 paint branch, moved to the engine's
// `MapPaintArbiter` in Phase 1.f, so the import was dropped. The
// constant itself still lives in `engine/index.ts` for use by the
// arbiter. Single source of truth for demand-units filters and
// storyboard diagnostics. See `engine/debug.ts` and
// `engine/demandUnitsBaseline.ts`.

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

/* ── Beat 5 (loi-highlight) identity ──
 *
 * Beat 5 choreographs a single AG_REV LOI (Glenn Colusa I.D., DU_ID
 * `08N_SA2`). All Beat 5 timing thresholds and the choreography that
 * uses them now live in the declarative beat engine
 * (`engine/beats.ts`, `engine/arbiters/MapPaintArbiter.ts`,
 * `engine/arbiters/OverlayPopupArbiter.ts`,
 * `engine/arbiters/MapPopupArbiter.ts`). The only Beat 5 fact still
 * referenced from this file is the LOI's DU_ID, used by the overlay
 * "must-include" pin set so the LOI's distribution square renders
 * deterministically across the morph. */
const BEAT5_LOI_ID = "08N_SA2"

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
   *  space in document flow. The SVG morph lands inside that rect. */
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
   *                 subtitle only. No bottom Back/Next row.
   *    - `true`  -> bottom control row (Back / N-of-T / Next) visible.
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

  /* ── Left-panel text visibility.
   *
   * The zoom-based fade-out was retired (see the reprojection effect
   * further down) to keep the bottom navigation controls accessible
   * while the map is zoomed into a clicked square. The state is kept
   * so a future visibility trigger can set it without a wider refactor.
   * Setter and ref are underscored to keep the unused-var lint quiet. */
  const [textVisible, _setTextVisible] = useState(true)
  const _textVisibleRef = useRef(true)

  /* ── Time-based progress (0 -> 1) ── */
  const progress = useMotionValue(0)

  /* ── Back-out opacity for the left-panel text ──
   *
   * Normally 1 (no-op). When the user presses Back from beat 1/N we
   * animate it to 0 while `progress` is parked at 0.45 - so the entire
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
    // Phase 3a: signal to the engine that the storyboard has settled
    // and the user can now click squares. Signal only - no arbiter
    // keys on this mode yet (Phase 3b wires InteractivePaintArbiter).
    engineApiRef.current?.setMode("interactive")
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
   * `BEATS[targetIndex].progress`. Forward navigation uses the
   * destination beat's `duration`. Backward navigation (only reachable
   * today via `handleRestart`, which masks the reverse tween behind a
   * camera fly) uses `BACK_DURATION_FACTOR` of the source beat's
   * `duration` so the rewind feels snappier than Next. The regular Back
   * button bypasses `goTo` entirely and snaps instead; see `handleBack`.
   * Under `prefers-reduced-motion`, every tween collapses to an
   * instantaneous `progress.set` + settle.
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

      // Phase 3a: mode signal. Any goTo (forward or backward) puts the
      // storyboard into playback mode. If the user was in interactive
      // (post-settle) and pressed Back, this correctly restores
      // playback so the staggered reveals read as scripted again.
      // settleToFinishedState below flips to "interactive" on the
      // final-beat finalize path.
      engineApiRef.current?.setMode("playback")

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

        debugLog(
          `runTween START fromV=${progress.get().toFixed(4)} targetV=${target.progress} duration=${duration}`,
        )
        logDuState("runTween START", mapAPI.mapRef?.current?.getMap?.())

        const finalize = () => {
          debugLog(
            `runTween FINALIZE clamped=${clamped} v=${progress.get().toFixed(4)}`,
          )
          logDuState("runTween FINALIZE", mapAPI.mapRef?.current?.getMap?.())
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

      // Optionally fly the camera home first (used by Next/viaCamera).
      // `CAMERA_ARBITER.flyHome` always calls `onArrive` exactly once -
      // synchronously when already home or `map` is null, async via
      // `moveend` otherwise - so we can hand off `runTween` without the
      // caller-side branching this block used to carry.
      if (opts?.viaCamera) {
        CAMERA_ARBITER.flyHome(mapAPI.mapRef?.current?.getMap?.(), {
          duration: 800,
          onStart: () => setPlayState("playing"),
          onArrive: () => {
            computePolygonDataRef.current()
            runTween()
          },
        })
        return
      }

      runTween()
    },
    [progress, prefersReducedMotion, mapAPI.mapRef, settleToFinishedState],
  )

  /* ── Clear any interactive overlay/map state tied to a sticky pin.
   *
   * Called when the user navigates between beats so that a previously
   * clicked square (and its pinned popups + outcome map layer) doesn't
   * carry over into the next beat, where the layer and overlay content
   * will generally belong to a different outcome. Mirrors the clearing
   * block in `handleRestart`. */
  /** Ref mirror of the beat engine's api so `clearInteractiveState`
   *  (declared before the engine setup to match the existing
   *  nav-handler ordering) can call `teardown()` without depending on
   *  the memoized `engineApi` identity. The ref is assigned right
   *  after `useBeatEngine` runs later in this component body. */
  const engineApiRef = useRef<BeatEngineApi | null>(null)

  /** Ref mirror of the memoized `engineContext`. Populated right after
   *  `useMemo(engineContext, ...)` runs later in this component body.
   *  Exists so pre-declared nav handlers (`clearInteractiveState`,
   *  `handleRestart`) and the unmount effect can pass a live context
   *  to `InteractivePaintArbiter.release()` without depending on the
   *  memoized object's identity. */
  const engineContextRef = useRef<BeatEngineContext | null>(null)

  const clearInteractiveState = useCallback(() => {
    const diagMap = mapAPI.mapRef?.current?.getMap?.()
    logDuState("clearInteractiveState START", diagMap)
    setHoveredLocation(null)
    setPinnedLocations(new Map())
    // Phase 3d: release interactive paint ownership synchronously,
    // BEFORE clearing the selection store. The `sync` effect driven by
    // `selectedOutcomeCode -> null` still fires on React commit, but
    // by the time it runs the arbiter has already shed ownership and
    // `sync` no-ops. Explicit release here guarantees the exit write
    // lands while the selection is still valid, independent of
    // commit-scheduling interleaving with `goTo`'s mode flip to
    // "playback". Idempotent: release is a no-op when not owning.
    const ctx = engineContextRef.current
    if (ctx) interactivePaintArbiterRef.current?.release(ctx)
    mapActions.clearLocationHighlights()
    mapActions.clearOutcomeVisualization()
    logDuState("clearInteractiveState after store clears", diagMap)
    // Force the engine to clear any actors still in-window so a mid-beat
    // nav away from Beat 4 doesn't strand the gold polygon ring, the
    // square popup, or the LOI highlight.
    engineApiRef.current?.teardown()
    logDuState("clearInteractiveState after engine teardown", diagMap)

    // Visibility restore runs separately in the selectedOutcomeCode
    // transition effect below. That effect fires after React commits
    // the `OutcomePolygonLayer` unmount triggered by
    // `clearOutcomeVisualization`, guaranteeing the restore wins the
    // race against the unmount's `visibility: "none"` write.
  }, [mapAPI])

  const handleNext = useCallback(() => {
    if (beatIndexRef.current >= FINAL_BEAT_INDEX) return
    debugLog(`handleNext START beatIndex=${beatIndexRef.current}`)
    clearInteractiveState()
    debugLog(`handleNext goTo called`)
    // `viaCamera: true` eases the map back to CAM_CENTER/CAM_ZOOM first
    // (a no-op when already home) before running the beat tween, so a
    // square-click zoom doesn't persist into the next beat.
    goTo(beatIndexRef.current + 1, { viaCamera: true })
  }, [goTo, clearInteractiveState])

  /* ── Intro tween (Play button entry point) ──
   *
   * `progress` starts at 0 (empty map, nothing revealed). Clicking Play
   * tweens the first beat's window (0 -> `BEATS[0].progress`) while
   * keeping `beatIndex` at 0 - so the storyboard indicator reads "1 / N"
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
    // Phase 3a: mode signal - storyboard is now in playback. Set
    // before `playArrival()` so any downstream effect observing the
    // mode sees the transition before the first progress tick lands.
    engineApiRef.current?.setMode("playback")
    computePolygonDataRef.current()
    playArrival()
  }, [playArrival, backOutOpacity])

  /* ── Back ──
   *
   * On beat index > 0: snap `progress` directly to the previous beat's
   * checkpoint. All `progress.on("change")` listeners are pure functions
   * of `v`, so the next frame recomputes the correct state for that beat
   * without winding the UI backward through every staggered reveal.
   * On beat index === 0: do not reverse-tween `progress` (that would
   * unwind every staggered reveal). Instead, park `progress` at 0.45
   * and animate `backOutOpacity` 1 -> 0 so the whole text block fades
   * out together. On completion, snap `progress` to 0 and
   * `backOutOpacity` back to 1, and flip `hasPlayed` off so the
   * pre-play gate (title + subtitle + Play button) re-renders from a
   * clean slate. */
  const handleBack = useCallback(() => {
    const i = beatIndexRef.current
    if (i > 0) {
      clearInteractiveState()
      if (controlsRef.current) controlsRef.current.stop()
      const targetIndex = i - 1
      const target = BEATS[targetIndex]!

      const applyBeat = () => {
        progress.set(target.progress)
        setBeatIndex(targetIndex)
        beatIndexRef.current = targetIndex
        setPlayState("paused")
      }

      // Fly the map back to the default home view first if a square-click
      // (or any other interaction) pushed the camera elsewhere. Back
      // snaps the beat `progress` in `applyBeat` rather than tweening,
      // so we route through `CAMERA_ARBITER.flyHome` (which fires
      // `onArrive` synchronously when the map is already home, and
      // otherwise waits for `moveend` before applying the snap).
      CAMERA_ARBITER.flyHome(mapAPI.mapRef?.current?.getMap?.(), {
        duration: 800,
        onStart: () => setPlayState("playing"),
        onArrive: applyBeat,
      })
      return
    }
    if (!hasPlayedRef.current) return // pre-play: Back is a no-op

    clearInteractiveState()
    if (controlsRef.current) controlsRef.current.stop()
    const finish = () => {
      // Snap underlying animation state back to pre-play in one frame
      // while the text is already faded out. The pre-play render takes
      // over with `backOutOpacity` reset to 1 (a no-op for the fresh
      // state since `progress` is 0 and the text block's progress-driven
      // opacity is already 0 at that value).
      progress.set(0)
      backOutOpacity.set(1)
      setHasPlayed(false)
      hasPlayedRef.current = false
      setPlayState("idle")
      // Phase 3a: storyboard is back in the pre-play gate.
      engineApiRef.current?.setMode("idle")
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
  }, [
    progress,
    backOutOpacity,
    prefersReducedMotion,
    clearInteractiveState,
    mapAPI.mapRef,
  ])

  const handleRestart = useCallback(() => {
    if (controlsRef.current) controlsRef.current.stop()
    setHoveredLocation(null)
    setPinnedLocations(new Map())
    // Phase 3d: release the interactive arbiter before clearing the
    // store so the DU teardown runs while the selection (and its
    // spec) is still valid. See `clearInteractiveState` for the
    // ordering rationale; the DU baseline written a few lines below
    // is the final resting state either way, but the explicit release
    // cancels any pending deferred-idle teardown from a prior exit.
    const ctx = engineContextRef.current
    if (ctx) interactivePaintArbiterRef.current?.release(ctx)
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
        // Phase 3d: consolidated DU reset. `ANIM_POLYGON_LAYERS` loop
        // above already zeroed fill/line opacity via dynamic ids; the
        // baseline helper re-asserts the full state (filter, color
        // expressions, transitions, visibility) so we return to the
        // pre-play beat-1 palette consistently. Idempotent with the
        // loop's opacity writes above. Cast via `unknown` because
        // Mapbox's method signatures are stricter than the helper's
        // intentionally permissive structural type (same cast pattern
        // as `getStyledMap` in `MapPaintArbiter`).
        writeDemandUnitsBaseline(map as unknown as BaselineMap, {
          filter: DU_CLASS_FILTER,
          fillExpr: beat1FillExpr(0) as readonly unknown[],
          fillOpacity: { kind: "scalar", value: 0 },
          lineOpacity: { kind: "scalar", value: 0 },
          lineWidth: 0.5,
          lineOffset: -0.25,
          visibility: "visible",
        })
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
      // Fire-and-forget: Restart parks in the pre-play gate immediately
      // regardless of whether a flight runs, so no `onArrive` is needed.
      // `resetOrientation: true` restores bearing/pitch to 0 when a
      // flight actually runs (matches pre-refactor behavior).
      CAMERA_ARBITER.flyHome(map, {
        duration: 800,
        resetOrientation: true,
      })
    }

    // Park in the pre-play gate: user has to click Play again to re-play.
    progress.set(0)
    backOutOpacity.set(1)
    setBeatIndex(0)
    beatIndexRef.current = 0
    setHasPlayed(false)
    hasPlayedRef.current = false
    setPlayState("idle")
    // Phase 3a: mode signal. Restart returns the engine to the same
    // pre-play regime it was in at first mount.
    engineApiRef.current?.setMode("idle")
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
    // Normal motion: nothing to do here. We wait for the user to click Play.
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

  // Interactive-UI gate. "finished" lights up after navigating all beats
  // (the canonical finish state, set by `settleToFinishedState`). We also
  // treat "paused" as interactive so clicks work whenever the storyboard
  // is parked between beats -- important because the 8-beat structure now
  // ends at the Beat 8 heatmap stub, so requiring the animation to run all
  // the way through would otherwise lock out the manual pipeline during
  // iteration on any mid-storyboard beat.
  const isInteractive = playState === "finished" || playState === "paused"

  /* ── Encoding mode: distribution | bar | average ── */
  const [encodingMode, setEncodingMode] = useState<EncodingMode>("distribution")
  const [spotlightedTier, setSpotlightedTier] = useState<number | null>(null)
  // The Get Started storyboard is permanently pinned to the s0020 baseline
  // under the historical hydroclimate. The narrative is calibrated to that
  // single combination (Beat 8's heatmap is a single-column placeholder for
  // future multi-hydroclimate columns), so we deliberately ignore the global
  // `useScenarioExplorerStore.hydroclimate` value and do not expose an
  // in-storyboard hydroclimate chooser. If multi-hydroclimate playback is
  // ever desired, reintroduce the store read here, the `buildIdMapping`
  // resolution, the `useOutcomeTierOverrides` call below, and the
  // `hydroclimate` / `onHydroclimateChange` props on `BeatTextOverlay`.
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

  useEffect(() => {
    if (encodingMode !== "bar") setSpotlightedTier(null)
  }, [encodingMode])

  useEffect(() => {
    setSpotlightedTier(null)
  }, [selectedOutcomeCode])

  /* ── Post-interactive teardown on outcome deselect.
   *
   * As of Phase 3c step 1 the `demand-units` / `demand-units-outline`
   * teardown (filter reset, opacity 0, visibility visible, blended
   * tier color, default outline width, plus the deferred-to-idle
   * handling for post-`removeLayer` style-busy windows) is owned by
   * `InteractivePaintArbiter.onExit`. That is driven from the sync
   * effect further below; nothing here has to replicate it.
   *
   * What remains here is the NON-demand-units half of the old
   * teardown: flip visibility back to `"visible"` on the animation
   * polygon layers the storyboard doesn't own (`calsim-wba`,
   * `california-reservoir`, `delta-detaw`, plus their outlines).
   * `OutcomePolygonLayer`'s unmount cleanup set those to `"none"` when
   * the user deselected a non-DU outcome; leaving them hidden means a
   * subsequent click on the same layer -- or any other code that
   * assumes the base style's default visibility -- has to discover
   * the layer is hidden and flip it back. Cheap and idempotent to do
   * it once on deselect instead. */
  /* Restore non-DU layer visibility AND zero their opacity on deselect.
   *
   * Two things need to be undone when an interactive non-DU selection
   * ends (truthy -> null `selectedOutcomeCode`):
   *
   *   1. `OutcomePolygonLayer`'s unmount flipped the fill + outline
   *      layout `visibility` to `"none"`. A subsequent storyboard
   *      Restart would then try to render Beat 5's non-DU polygons
   *      through a `visibility: "none"` layer and silently show
   *      nothing. We must put `visibility` back to `"visible"`.
   *
   *   2. The `applyPaintChanges` effect (below) writes `["case", ...]`
   *      expressions to `fill-opacity` / `line-opacity` (and a gold
   *      `line-color` expression) while a selection is active. OPL's
   *      unmount does NOT reset those paint properties -- it only
   *      toggles `visibility`. So if we restore `visibility` without
   *      also zeroing the opacities, the stale case expressions
   *      render (e.g. a gold-outlined `delta-detaw` stuck on the map
   *      after the user switched from DELTA_ECO to a marker outcome
   *      and then pressed Next). Writing scalar 0 for both opacities
   *      is enough: the next OPL mount for that outcome will raise
   *      them back to 1 as part of its fade-in path, and the
   *      in-between storyboard beats don't read these layers. */
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

  /* ── Multi-pin hover state (shared by overlay squares and map polygons) ── */
  const [hoveredLocation, setHoveredLocation] = useState<LocationInfo | null>(
    null,
  )
  const [pinnedLocations, setPinnedLocations] = useState<
    Map<string, LocationInfo>
  >(new Map())
  // `cardHoveredKey` was read only by `PinnedLocationsList` (now retired).
  // The setter is still invoked by the hover-enter/leave handlers below, so
  // the state is harmless to keep as a no-op bridge for any future card UI.
  const [_cardHoveredKey, setCardHoveredKey] = useState<string | null>(null)

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
        // (mirroring the old outcome-title-click camera behavior).
        const key = locKey(info)
        const prevPins = pinnedLocationsRef.current
        const wasSelected = prevPins.has(key)

        debugLog(
          `square click outcome=${info.code} sourceId=${info.sourceId} wasSelected=${wasSelected}`,
        )
        logDuState(
          "square click (pre-state-change)",
          mapAPI.mapRef?.current?.getMap?.(),
        )

        // -- Commented out: previous multi-pin toggle behavior. Re-enable
        //    if we ever want several pinned locations with tethered
        //    popups again.
        // setPinnedLocations((prev) => {
        //   const next = new Map(prev)
        //   if (next.has(key)) next.delete(key)
        //   else next.set(key, info)
        //   return next
        // })

        // Determine the current outcome of the pinned selection (if any)
        // so we can detect cross-outcome switches. We look at the first
        // entry because sticky single-select holds at most one pin.
        const prevEntry = prevPins.values().next().value as
          | LocationInfo
          | undefined
        const prevOutcomeCode = prevEntry?.code ?? null
        // Fly the camera whenever the selection enters a new outcome:
        //   - first click (prevOutcomeCode null -> info.code): fly
        //   - swap to a different outcome (A -> B): fly
        //   - swap within the same outcome (A square 1 -> A square 2): no fly
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

        // Fly the camera to the new outcome whenever the selection
        // enters a new outcome (first click or cross-outcome swap) so
        // the user can see the polygon that just became active.
        // Same-outcome swaps keep the camera still (both polygons are
        // already in view); de-select clicks skip this branch too.
        //
        // Routed through `mapAPI.withMap` + `mapRef.fitBounds` /
        // `mapRef.getMap().easeTo` to mirror the canonical pattern in
        // `useOutcomeVisualization.ts` (the learn/explore outcome-click
        // camera handler). Previously this block used a mix of
        // `mapAPI.mapRef?.current?.fitBounds(...)` and raw
        // `map.easeTo(...)`, and silently dropped `action.padding` on
        // the `easeTo` branch - so outcomes resolved via
        // `cameraPreset` centered without the 24px top/bottom padding
        // the `fitBounds` branch got from `resolveOutcomeCamera`.
        // Unifying through `withMap` + passing padding on both
        // branches removes that drift between the get-started and
        // explore/learn camera paths.
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

  const activeLocationSet = useMemo(() => {
    const set = new Map(pinnedLocations)
    if (hoveredLocation) {
      const key = locKey(hoveredLocation)
      if (!set.has(key)) set.set(key, hoveredLocation)
    }
    return set
  }, [pinnedLocations, hoveredLocation, locKey])

  /* ── Beat 5 demo-LOI highlight state ──
   *
   * During Beat 5 (`loi-highlight`) the storyboard choreographs a single
   * AG_REV LOI through five sub-steps (map layer fade-in, square ring,
   * square popup, polygon ring, polygon popup). Two pieces of state back
   * this choreography:
   *   - `demoLocation` drives the square's gold ring via
   *     `OutcomeMorphOverlay`'s `demoHighlightedLocationKey` prop, and
   *   - `demoHoveredLocation` drives the square's foreignObject popup via
   *     the same `hoveredLocation` prop used in interactive hover mode.
   * The map-side gold polygon stroke and map popup are driven directly
   * from the Beat 5 driver effect via Mapbox paint properties and
   * `mapActions.setLocationHighlights` respectively. */
  const [demoLocation, setDemoLocation] = useState<LocationInfo | null>(null)
  const demoLocationKey = demoLocation ? locKey(demoLocation) : null
  const [demoHoveredLocation, setDemoHoveredLocation] =
    useState<LocationInfo | null>(null)

  /* Source IDs that must survive `OutcomeMorphOverlay`'s stride subsample.
   * When an outcome has more polygons than `MAX_POLYGONS_PER_OUTCOME` the
   * overlay drops a roughly uniform subset, which can silently cull any
   * specific DU the storyboard references. Pin the Beat 5 LOI and the Beat
   * 1C popup IDs here so their squares are guaranteed to render. */
  const overlayMustIncludeSourceIds = useMemo(
    () => new Set<string>([BEAT5_LOI_ID, ...BEAT1C_POPUP_DU_IDS]),
    [],
  )

  const prevOutcomeRef = useRef<string | null>(null)
  useEffect(() => {
    prevOutcomeRef.current = selectedOutcomeCode

    // Under sticky single-select, clicking a square atomically sets both
    // `pinnedLocations` and `selectedOutcomeCode`. If the pins already
    // belong to the new outcome (common case: user clicked a square in
    // outcome B while outcome A was pinned), keep them untouched — the
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

    // The interactive paint effect caches original line-color / line-width
    // values per layer; invalidate them so the new outcome's layer starts
    // from a clean baseline.
    origLineColorRef.current = null
    origLineWidthRef.current = null

    // NOTE: pinnedCacheRef (stash/restore per-outcome pins) was used by
    // the older multi-pin + outcome-title-click flow. It is intentionally
    // not read or written here any more; a cross-outcome click replaces
    // the pin outright rather than reviving a cached selection.
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
    // Fully inert during storyboard playback. The main choreography
    // listener owns every `demand-units` paint and filter write during
    // playback, and the beat engine owns Beat 4. Running this effect
    // while `playState !== "finished" / "paused"` races them: a hover
    // during Beat 0 flips `hoveredLocation`, `activeLocationSet` grows,
    // this effect reruns, and because no outcome is selected yet its
    // reset branch sets `demand-units` fill-opacity to 0 and wipes the
    // blue cycle that the Beat 0 listener just painted.
    if (!isInteractive) return

    const config = selectedOutcomeCode
      ? getOutcomeConfig(selectedOutcomeCode)
      : null

    if (!config) {
      // No outcome selected. Only `clearLocationHighlights` remains
      // here: `demand-units` teardown is now owned by
      // `InteractivePaintArbiter.onExit` (driven by the sync effect
      // below). `playState !== "finished"` is still the guard,
      // because `playState` briefly flips to `"paused"` at every beat
      // settle mid-run and we don't want to clobber highlights during
      // intermediate beats.
      if (playState !== "finished") return
      if (activeLocationSet.size === 0) mapActions.clearLocationHighlights()
      return
    }

    // Demand-units interactive paint (both the base fill/outline AND
    // the gold-outline / spotlight / pinned overrides) moved to
    // `InteractivePaintArbiter` in Phase 3c step 2. The highlights
    // computation below runs for every outcome; the inner
    // `applyPaintChanges` function no-ops for DU layers.

    // ── Polygon-specific Mapbox paint changes ──
    // OutcomePolygonLayer handles filter, fill-color, and base opacity.
    // This effect only handles gold outlines + spotlight/pinned opacity overrides.
    const map = mapAPI.mapRef?.current?.getMap?.()

    origLineColorRef.current = null
    origLineWidthRef.current = null

    const applyPaintChanges = () => {
      if (!map || config.geometryType !== "polygon") return
      // Demand-units paint is owned exclusively by
      // `InteractivePaintArbiter` (Phase 3c step 2). Bail so we don't
      // double-write. Non-DU polygon outcomes (WBA, delta, reservoir)
      // still flow through this path.
      if (config.layerType === "demand-units") return
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
    isInteractive,
    playState,
    activeLocationSet,
    hoveredLocation,
    pinnedLocations,
    selectedOutcomeCode,
    mapAPI.mapRef,
    locKey,
    spotlightedTier,
  ])

  const storeHighlights = useLocationHighlights()
  // Kept (prefixed with `_` to silence the unused-var lint) only so that
  // re-enabling the retired `PinnedLocationsList` mount below is a one-line
  // change. Currently no consumer reads this memo.
  const _pinnedHighlights = useMemo(
    () => storeHighlights.filter((h) => pinnedLocations.has(h.key)),
    [storeHighlights, pinnedLocations],
  )

  // Prefixed with `_` so the unused-var lint stays silent while the retired
  // `PinnedLocationsList` mount sits commented out. Still functional; just
  // re-wire (and rename) when restoring the card-list UI.
  const _handlePinnedHoverEnter = useCallback(
    (key: string) => {
      setCardHoveredKey(key)
      const info = pinnedLocations.get(key)
      if (info) setHoveredLocation(info)
    },
    [pinnedLocations],
  )

  const _handlePinnedHoverLeave = useCallback(() => {
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
    // Only wire map hover and click dispatchers while interactive. During
    // storyboard playback the map must be read-only. Any `TierMarkers` /
    // `TierLocationLabels` that render mid-beat (e.g. the first tick an
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

  const fadeOutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Kept defined (prefixed with `_` to silence the unused-var lint) but no
  // longer wired up: outcome titles are display-only and layer visibility is
  // now driven by `locHandlers.onClick` (sticky square selection). Restore by
  // passing this back into OutcomeMorphOverlay / BeatTextOverlay if we ever
  // want outcome-title clicks back.
  const _handleOutcomeClick = useCallback(
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

  /* ── Map hover/click -> shared multi-pin state for visible outcome polygons ── */
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

          // Phase 3d: consolidated session-init. `ensureDemandUnitsOutlineLayer`
          // creates the `demand-units-outline` line layer once per session
          // (idempotent - no-op if it already exists from another map mode).
          // `writeDemandUnitsBaseline` then asserts the full beat-1 palette
          // state on both fill and outline layers, including zeroed
          // transitions so the per-frame color cycling in the progress
          // handler below writes cleanly without smear. Casts via
          // `unknown` because Mapbox's method signatures are stricter
          // than the helpers' permissive structural types.
          ensureDemandUnitsOutlineLayer(map as unknown as SessionInitMap, {
            filter: DU_CLASS_FILTER,
            lineColor: beat1FillExpr(0) as readonly unknown[],
            lineWidth: 0.5,
            lineOpacity: 0,
            lineOffset: -0.25,
          })
          writeDemandUnitsBaseline(map as unknown as BaselineMap, {
            filter: DU_CLASS_FILTER,
            fillExpr: beat1FillExpr(0) as readonly unknown[],
            fillOpacity: { kind: "scalar", value: 0 },
            lineOpacity: { kind: "scalar", value: 0 },
            lineWidth: 0.5,
            lineOffset: -0.25,
            visibility: "visible",
          })
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
          // VisualizationLayers configures for the Explore path. Otherwise
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

  /* Per-outcome schedule for hiding map features as the SVG morph
   * takes over. See `HideScheduleEntry` in `engine/types.ts` for the
   * field contract. Populated by the outcome-schedule effect below
   * and read by both the legacy listener and the engine's
   * `MapPaintArbiter` via `ctx.getHideSchedule()`. */
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

  /* ── InteractivePaintArbiter (Phase 3b: lifecycle tracker only) ──
   *
   * Event-driven arbiter (same shape as `CameraArbiter`, not in the
   * progress-dispatch `arbitersRef` list). Will eventually be the
   * sole writer for `demand-units` / `demand-units-outline` during
   * interactive mode. In Phase 3b its `onEnter` / `onExit` /
   * `onChangeSelection` hooks are logging stubs; legacy writers
   * (`applyPaintChanges` effect + `OutcomePolygonLayer` + the
   * `selectedOutcomeCode` transition effect) still drive actual
   * paint. The React effect below calls `sync` on every
   * (mode, selection) change so we can verify lifecycle correctness
   * via console before Phase 3c flips on the writes and deletes the
   * legacy paths. */
  const interactivePaintArbiterRef = useRef<InteractivePaintArbiter | null>(
    null,
  )
  if (interactivePaintArbiterRef.current === null) {
    interactivePaintArbiterRef.current = new InteractivePaintArbiter()
  }

  // Bridge refs for the `*Arbiter` actors that delegate to
  // component-owned callbacks. Each child component writes its
  // `applyXxxFrame(v)` callback into `.current` on mount and clears
  // it on unmount; the arbiter reads through the ref on each
  // `onUpdate`, which is how we satisfy invariant 4 ("one
  // `progress.on('change')` subscriber") without lifting the
  // components' large per-frame DOM-mutation bodies into declarative
  // actor payloads.
  const narrationTickRef = useRef<((v: number) => void) | null>(null)
  const overlayMorphTickRef = useRef<((v: number) => void) | null>(null)

  // Engine context. Rebuilt every render, but the engine reads via a
  // ref so no re-subscription happens. Every actor thunk (e.g.
  // `buildHighlight`) closes over whatever `ctx` was current at
  // dispatch time, so the latest React-state snapshot flows through.
  // Fresh Map per `centroids` change so `buildHighlight` thunks that
  // read `ctx.centroidLookup` never pick up a stale empty Map. An earlier
  // version of this memo read `centroidLookupRef.current` once at memo
  // time and cached it. The ref body later swapped to the real Map when
  // data loaded, but the memoized context still held the initial empty
  // Map, so Beat 4 step 5's map popup thunk always returned null (no
  // coord) and the popup never wrote to the store.
  const engineCentroidLookup = useMemo(
    () =>
      new Map<string, { lng: number; lat: number }>(
        centroids.map((c) => [c.id, { lng: c.lng, lat: c.lat }] as const),
      ),
    [centroids],
  )

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
    beatTable: BEAT_TABLE,
    context: engineContext,
    arbiters: arbitersRef.current,
    enabled: !isLoading,
  })
  engineApiRef.current = engineApi

  /* ── InteractivePaintArbiter sync ──
   *
   * Reconcile the arbiter's ownership of `demand-units` /
   * `demand-units-outline` whenever selection, engine mode, or
   * `playState` changes. The arbiter owns (and paints) iff all of:
   *
   *   1. A DU outcome (`layerType === "demand-units"`) is selected.
   *   2. Engine mode is not `"idle"` (we're in or past the storyboard).
   *   3. `playState !== "playing"` (no active tween --
   *      `MapPaintArbiter` owns during tweens).
   *   4. Tier data for that outcome has hydrated
   *      (`outcomeLocationsRef` has the colorMap).
   *
   * When all four hold, we build a `DemandUnitsPaintSpec` and pass it
   * to `sync`. When any fail, we pass `null` and the arbiter tears
   * down. Condition (3) is the "broadened" gate promised by Phase 3c
   * step 2: the arbiter now also owns during paused-between-beats
   * state, so a mid-storyboard square click's gold outline is
   * guaranteed to be cleaned up on deselect.
   *
   * Mode isn't reactive (it lives on a ref inside `BeatEngine`), so
   * we depend on `playState` as a proxy: every `setMode(...)` call in
   * this file happens alongside a `setPlayState(...)` call, so the
   * effect fires on the same tick the mode transitioned. */
  useEffect(() => {
    const arbiter = interactivePaintArbiterRef.current
    if (!arbiter) return

    const mode = engineApiRef.current?.getMode?.() ?? "idle"
    const canOwn =
      selectedOutcomeCode !== null && mode !== "idle" && playState !== "playing"

    let spec: DemandUnitsPaintSpec | null = null
    if (canOwn) {
      const config = getOutcomeConfig(selectedOutcomeCode!)
      if (
        config?.layerType === "demand-units" &&
        config.classFilter &&
        config.mapboxLayerId === "demand-units"
      ) {
        const locData = outcomeLocationsRef.current[selectedOutcomeCode!]
        const colorMap = locData?.colorMap
        if (colorMap && Object.keys(colorMap).length > 0) {
          const idProperty = config.idProperty ?? "DU_ID"
          // Build the tier-colored match expression: keyed on idProperty,
          // one pair per feature id, `theme.palette.grey[500]` fallback.
          const colorPairs: (string | number)[] = []
          for (const [featureId, color] of Object.entries(colorMap)) {
            colorPairs.push(featureId)
            colorPairs.push(color)
          }
          const colorExpression =
            colorPairs.length > 0
              ? [
                  "match",
                  ["get", idProperty],
                  ...colorPairs,
                  theme.palette.grey[500],
                ]
              : theme.palette.grey[500]
          spec = {
            outcomeCode: selectedOutcomeCode!,
            classFilter: config.classFilter,
            idProperty,
            featureIds: Array.from(locData!.ids),
            colorExpression,
          }
        }
      }
    }

    arbiter.sync(engineContext, spec)
    // `theme` dep covers the grey fallback; `outcomeLocations` fires
    // the re-sync when tier data hydrates for the current outcome.
  }, [engineContext, selectedOutcomeCode, playState, theme, outcomeLocations])

  /* ── InteractivePaintArbiter overlay ──
   *
   * Apply the per-selection overlay (gold outline + zoom-aware
   * fill-opacity with optional spotlight / pinned overrides) whenever
   * active locations, pinned locations, or Beat 5's spotlighted tier
   * change. Separated from `sync` because overlay state changes much
   * more frequently (hover, pin toggle, tier step) and can be written
   * as a pure overlay pass without re-running the full enter /
   * crossfade sequence.
   *
   * No-op when the arbiter doesn't own; cheap guard inside the
   * arbiter, so we don't duplicate the ownership check here. */
  useEffect(() => {
    const arbiter = interactivePaintArbiterRef.current
    if (!arbiter || !arbiter.owns() || !selectedOutcomeCode) return

    // Translate active + pinned keys into feature ids matching the
    // demand-units `idProperty`. DU outcomes don't use the reservoir
    // name-translation map, so `sourceId` is already the feature id.
    const activeFeatureIds: string[] = []
    const pinnedFeatureIds: string[] = []
    for (const [key, info] of activeLocationSet) {
      if (info.code !== selectedOutcomeCode) continue
      activeFeatureIds.push(info.sourceId)
      if (pinnedLocations.has(key)) pinnedFeatureIds.push(info.sourceId)
    }

    // Beat 5 spotlight: only meaningful for AG_REV + matching tier.
    const locData = outcomeLocationsRef.current[selectedOutcomeCode]
    const spotlightFeatureIds: string[] = []
    if (spotlightedTier != null && locData) {
      for (const [locId, tier] of Object.entries(locData.tierMap)) {
        if (tier === spotlightedTier) spotlightFeatureIds.push(locId)
      }
    }

    const overlay: DemandUnitsOverlayState = {
      outcomeCode: selectedOutcomeCode,
      activeFeatureIds,
      pinnedFeatureIds,
      spotlightFeatureIds,
      hasSpotlight: spotlightedTier != null,
    }
    arbiter.applyOverlay(engineContext, overlay)
  }, [
    engineContext,
    selectedOutcomeCode,
    activeLocationSet,
    pinnedLocations,
    spotlightedTier,
    outcomeLocations,
  ])

  /* ── InteractivePaintArbiter teardown cancellation ──
   *
   * When `playState` flips to `"playing"` the storyboard is tweening
   * and `MapPaintArbiter`'s beat actors are writing `demand-units`
   * every frame. If the arbiter has a deferred-idle teardown pending
   * from a just-prior deselect, it would land after the tween settles
   * and stomp whatever beat paint `MapPaintArbiter` left on the
   * layer. Cancel it here so the pending listener detaches cleanly.
   * Safe to call when no teardown is pending (idempotent). */
  useEffect(() => {
    if (playState !== "playing") return
    interactivePaintArbiterRef.current?.cancelPendingTeardown()
  }, [playState])

  /* ── Storyboard map-layer unmount cleanup ──
   *
   * Phase 1 (Storyboard Engine Hardening Plan v2) deleted the main
   * per-frame paint listener. All `demand-units` and
   * `demand-units-outline` paint writes during playback now flow
   * through `MapPaintArbiter` (see `engine/arbiters/MapPaintArbiter.ts`
   * and `engine/beats.ts`), and the `basemap-dim-overlay` ramp moved
   * with them.
   *
   * The legacy listener also did one job that the engine teardown
   * does not cover: when the storyboard component unmounts (the user
   * navigates away from the scenarioExplorer page or switches tabs),
   * reset the animated polygon and line layers to their neutral
   * resting state so the storyboard does not leak its paint into
   * other scenarioExplorer views. The arbiter's `teardown` only
   * clears arbiter-owned state (the gold LOI ring), not the broader
   * fill / line opacities for `ANIM_POLYGON_LAYERS` and
   * `ANIM_LINE_LAYERS`. We keep that work here as a tiny dedicated
   * unmount effect. */
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
        for (const lineLayer of ANIM_LINE_LAYERS) {
          if (map.getLayer(lineLayer))
            map.setPaintProperty(lineLayer, "line-opacity", 1)
        }
      } catch {
        /* ok */
      }
    }
  }, [mapAPI.mapRef, isLoading])

  /* ── InteractivePaintArbiter unmount release ──
   *
   * Phase 3d: if the storyboard unmounts while the arbiter is
   * mid-selection (user closed the page with a DU outcome pinned),
   * explicitly release ownership so the deferred-idle listener on
   * `map.once("idle", ...)` is cleaned up and no stale write lands on
   * a disposed map. `release` invokes `onExit` which writes the
   * scalar-0 baseline - a safe resting state for any future
   * scenarioExplorer view. Idempotent when not owning. */
  useEffect(() => {
    return () => {
      const ctx = engineContextRef.current
      if (ctx) interactivePaintArbiterRef.current?.release(ctx)
    }
  }, [])

  /* Beat 1C demo popups removed. The five curated AG district popups
   * (Glenn Colusa, Turlock, Westlands, Madera, Modesto) read as noise
   * during playback and also shared the `locationHighlights` store slot
   * with the hover-driven paint effect, causing popups to reappear on
   * hover. Removed entirely. The `BEAT1C_POPUP_DU_IDS` constant is kept
   * because `overlayMustIncludeSourceIds` still pins those DU sourceIds
   * in the overlay so their distribution squares render deterministically
   * in the morph. */

  /* Beat 5 demo-LOI driver removed in Phase 1.h. The engine's
   * `OverlayPopupArbiter` and `MapPopupArbiter` (see
   * `engine/arbiters/`) now drive `demoLocation`,
   * `demoHoveredLocation`, and `mapActions.setLocationHighlights` for
   * the Glenn Colusa I.D. (`AG_REV` / `08N_SA2`) LOI sequence. The
   * legacy effect was already inert behind the `ENGINE_OWNS_BEAT4`
   * flag; this commit deletes both. See Storyboard Engine Hardening
   * Plan v2, Phase 1.h. */

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
  //
  // NOTE: an earlier version of this effect also faded the text column out
  // when the map zoom exceeded `TEXT_FADE_ZOOM = 7`, on the theory that
  // the text would otherwise overlap a zoomed-in polygon during the
  // storytelling phase. It was disabled because (a) under the interactive
  // sticky single-select flow, clicking a square legitimately zooms past
  // that threshold, and (b) hiding the text column also hides the bottom
  // Back / step / Next controls, which the user needs to navigate beats.
  // `textVisible` and `textVisibleRef` are kept around as a hook in case
  // we want to wire up a different visibility trigger later.
  useEffect(() => {
    if (!panelInView) return
    const map = mapAPI.mapRef?.current?.getMap?.()
    if (!map) return

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
        // RES_STOR: API returns CalSim IDs. Screen map uses gnisidlabel
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
      // AG_REV is excluded from the map-side hide schedule. The overlay
      // morph in OutcomeMorphOverlay still fades its SVG polygons into
      // distribution squares on its own 0.01-wide slice, but the map's
      // `demand-units` polygons stay painted at 0.65 through Beat 2 and
      // Beat 3 so the user keeps visual anchoring to the AG districts
      // while the other outcomes morph in.
      if (group.code === "AG_REV") continue
      const locData = outcomeLocations[group.code]
      if (!locData || locData.ids.size === 0) continue
      const config = getOutcomeConfig(group.code)
      if (!config) continue
      const [morphStart] = getOutcomeProgressRange(group.code, activeCodes)
      // Beat 2 slices are tight (0.08 span across 8 outcomes + AG_REV's
      // 0.01 slice in the compressed progress domain). Use a short fade
      // lead so the DU fade doesn't bleed into the previous outcome's
      // morph.
      const fadeStart = morphStart - 0.005

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
   * height, caption). Actual x/y positions are measured from the DOM via
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
    // measured from the DOM later. This is only used to decide row count.
    const approxColWidth = Math.max(80, (panelSize.width * (1 / 3)) / 2 - 36)

    // Left column renders in this explicit order (AG_REV before CWS_DEL).
    // We don't touch OUTCOME_CODE_ORDER globally - radar axes + NOD/SOD
    // helpers depend on that list - so we just prepend the left-column codes
    // in their desired order and iterate the rest of OUTCOME_CODE_ORDER after.
    const LEFT_COLUMN_ORDER = ["AG_REV", "CWS_DEL"] as const
    const LEFT_COLUMN_CODES = new Set<string>(LEFT_COLUMN_ORDER)
    const orderedCodes: string[] = [
      ...LEFT_COLUMN_ORDER,
      ...OUTCOME_CODE_ORDER.filter((c) => !LEFT_COLUMN_CODES.has(c)),
    ]

    // Eyebrow labels fade in alongside the right-panel backdrop so they're
    // fully present by the time beat 3 (AG_REV morph) settles at 0.39. The
    // 0.01 fade width is applied by BeatTextOverlay's progress handler.
    const EYEBROW_FADE_IN = 0.3775
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
          // last row. Subtract it. No bar-height floor - bar/average
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
   *  ResizeObserver. Empty on first render (outcomes are invisible in Beat 1
   *  anyway, so the missing positions only become visible once measured). */
  const [glyphLayout, setGlyphLayout] = useState<Record<string, GlyphRect>>({})

  const handleGlyphLayoutChange = useCallback(
    (layout: Record<string, GlyphRect>) => {
      setGlyphLayout((prev) => {
        // Shallow-compare to avoid redundant state updates (ResizeObserver can
        // fire frequently. Same rects -> skip re-render).
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
    },
    [],
  )

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
        // intentionally taller than one viewport - the user is
        // expected to scroll so the title + Play button park at the
        // top of the visible area. The extra pixels then extend below
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
                overlayMorphTickRef={overlayMorphTickRef}
                squaresPerRow={theme.scenarios.tierGrid.squaresPerRow}
                distributionPositionMap={distributionPositionMap}
                // Click-to-show-outcome-layer is intentionally disabled: the
                // layer is now driven by clicking a distribution square
                // (see `locHandlers.onClick`), so outcome titles are
                // display-only. `handleOutcomeClick` is still defined but no
                // longer wired up here.
                onOutcomeClick={undefined}
                selectedOutcomeCode={isInteractive ? selectedOutcomeCode : null}
                interactive={isInteractive}
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
            narrationTickRef={narrationTickRef}
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
            // Outcome-title clicks no longer drive layer visibility; see the
            // matching comment above on OutcomeMorphOverlay.
            onOutcomeClick={undefined}
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
          />

          {/* Retired: right-side pinned-location cards with dashed leader
           * lines. Pinned highlights now render as a simple anchored popup
           * to the upper-left of the polygon, via the lightweight popup in
           * `VisualizationLayers`. Left commented out so we can revive the
           * card-list layout if the design calls for it again.
           *
           * {isInteractive &&
           *   pinnedHighlights.length > 0 &&
           *   selectedOutcomeCode !== "RES_STOR" &&
           *   selectedOutcomeCode !== "FW_EXP" &&
           *   selectedOutcomeCode !== "FW_DELTA_USES" && (
           *     <PinnedLocationsList
           *       highlights={pinnedHighlights}
           *       onUnpin={handleTooltipToggle}
           *       onHoverEnter={handlePinnedHoverEnter}
           *       onHoverLeave={handlePinnedHoverLeave}
           *       hoveredKey={cardHoveredKey}
           *       mapRef={mapAPI.mapRef}
           *     />
           *   )}
           */}
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

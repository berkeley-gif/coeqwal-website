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
import { OUTCOME_CODE_ORDER, getOutcomeName } from "../../../content/outcomes"
import { getTierLabel } from "../../../content/tiers"
import { getDemandUnitDisplayName } from "../../map/config/demandUnitNames"
import { useScenarioTiers } from "../../scenarios/hooks/useTierData"
import { useScenarios } from "@repo/data/coeqwal/hooks"
import { TIMING_BEATS, FINAL_TIMING_BEAT_INDEX } from "./animationTiming"
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
  DU_CLASS_FILTER,
  writeDemandUnitsBaseline,
  ensureDemandUnitsOutlineLayer,
  beat1FillExpr,
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
const STORYBOARD_CONTENT_OVERFLOW_PX = 320

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

/** Curated list of well-known agricultural water districts used to
 *  illustrate what a single polygon represents. Each popup
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

/* loi-highlight
 *
 * Choreographs a single AG_REV LOI (Glenn Colusa I.D., DU_ID
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
  /** Storyboard cursor: driven by Next / Back. */
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

  /* Left-panel text visibility.
   *
   * The zoom-based fade-out was retired (see the reprojection effect
   * further down) to keep the bottom navigation controls accessible
   * while the map is zoomed into a clicked square. The state is kept
   * so a future visibility trigger can set it without a wider refactor. */
  const [textVisible] = useState(true)

  /* Time-based progress (0 -> 1) */
  const progress = useMotionValue(0)

  /* Back-out opacity for the left-panel text
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
  // TODO(?): restore fade-out: useTransform(progress, [0, 0.72, 0.78], [1, 1, 0])
  const mapOpacity = useTransform(progress, [0, 1], [1, 1])
  // TODO(?): restore fade-out: useTransform(progress, [0.73, 0.78], [1, 0])
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
    // signal to the engine that the storyboard has settled
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

  /* Storyboard navigation
   *
   * `goTo(targetIndex)` animates `progress` from its current value to
   * `TIMING_BEATS[targetIndex].progress`. Forward navigation uses the
   * destination beat's `duration`. Backward navigation (only reachable
   * today via `handleRestart`, which masks the reverse tween behind a
   * camera fly) uses `BACK_DURATION_FACTOR` of the source beat's
   * `duration` so the rewind feels snappier than Next. The regular Back
   * button bypasses `goTo` entirely and snaps instead. See `handleBack`.
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
      const clamped = Math.max(0, Math.min(FINAL_TIMING_BEAT_INDEX, targetIndex))
      const fromIndex = beatIndexRef.current
      if (controlsRef.current) controlsRef.current.stop()

      // mode signal. Any goTo (forward or backward) puts the
      // storyboard into playback mode. If the user was in interactive
      // (post-settle) and pressed Back, this correctly restores
      // playback so the staggered reveals read as scripted again.
      // settleToFinishedState below flips to "interactive" on the
      // final-beat finalize path.
      engineApiRef.current?.setMode("playback")

      const target = TIMING_BEATS[clamped]!
      const source = TIMING_BEATS[fromIndex]!
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
          if (clamped === FINAL_TIMING_BEAT_INDEX) {
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

  /* Clear any interactive overlay/map state tied to a sticky pin.
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
    setHoveredLocation(null)
    setPinnedLocations(new Map())
    // release interactive paint ownership synchronously,
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
    // Force the engine to clear any actors still in-window so a mid-beat
    // nav away doesn't strand the gold polygon ring, the
    // square popup, or the LOI highlight.
    engineApiRef.current?.teardown()

    // Visibility restore runs separately in the selectedOutcomeCode
    // transition effect below. That effect fires after React commits
    // the `OutcomePolygonLayer` unmount triggered by
    // `clearOutcomeVisualization`, guaranteeing the restore wins the
    // race against the unmount's `visibility: "none"` write.
  }, [])

  const handleNext = useCallback(() => {
    if (beatIndexRef.current >= FINAL_TIMING_BEAT_INDEX) return
    clearInteractiveState()
    // `viaCamera: true` eases the map back to CAM_CENTER/CAM_ZOOM first
    // (a no-op when already home) before running the beat tween, so a
    // square-click zoom doesn't persist into the next beat.
    goTo(beatIndexRef.current + 1, { viaCamera: true })
  }, [goTo, clearInteractiveState])

  /* Intro tween (Play button entry point)
   *
   * `progress` starts at 0 (empty map, nothing revealed). Clicking Play
   * tweens the first beat's window (0 -> `TIMING_BEATS[0].progress`) while
   * keeping `beatIndex` at 0 - so the storyboard indicator reads "1 / N"
   * the entire time. Under `prefers-reduced-motion`, the tween collapses
   * to an instant snap. */
  const playArrival = useCallback(() => {
    if (controlsRef.current) controlsRef.current.stop()
    setBeatIndex(0)
    beatIndexRef.current = 0
    const target = TIMING_BEATS[0]!
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
    // mode signal - storyboard is now in playback. Set
    // before `playArrival()` so any downstream effect observing the
    // mode sees the transition before the first progress tick lands.
    engineApiRef.current?.setMode("playback")
    computePolygonDataRef.current()
    playArrival()
  }, [playArrival, backOutOpacity])

  /* Back
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
      const target = TIMING_BEATS[targetIndex]!

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
    // release the interactive arbiter before clearing the
    // store so the DU teardown runs while the selection (and its
    // spec) is still valid. See `clearInteractiveState` for the
    // ordering rationale. The DU baseline written a few lines below
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
        // consolidated DU reset. `ANIM_POLYGON_LAYERS` loop
        // above already zeroed fill/line opacity via dynamic ids. The
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

  /* Arrival behaviour
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
      goTo(FINAL_TIMING_BEAT_INDEX)
    }
    // Normal motion: nothing to do here. We wait for the user to click Play.
  }, [panelInView, prefersReducedMotion, goTo])

  /* Keyboard shortcuts
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

  // Interactive-UI gate. "finished" lights up
  const isInteractive = playState === "finished" || playState === "paused"

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
      tierChartData?: typeof cc50ChartData
    }> = []
    if (cc50VariantId) {
      cols.push({ label: "Moderate risk", tierChartData: cc50ChartData })
    }
    if (cc95VariantId) {
      cols.push({ label: "High risk", tierChartData: cc95ChartData })
    }
    return cols
  }, [cc50VariantId, cc95VariantId, cc50ChartData, cc95ChartData])

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
        // (mirroring the old outcome-title-click camera behavior).
        const key = locKey(info)
        const prevPins = pinnedLocationsRef.current
        const wasSelected = prevPins.has(key)

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

  /* demo-LOI highlight state */
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

    // The interactive paint effect caches original line-color / line-width
    // values per layer. Invalidate them so the new outcome's layer starts
    // from a clean baseline.
    origLineColorRef.current = null
    origLineWidthRef.current = null

    // NOTE: pinnedCacheRef (stash/restore per-outcome pins) was used by
    // the older multi-pin + outcome-title-click flow. It is intentionally
    // not read or written here any more. A cross-outcome click replaces
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

  /* Apply map highlight for all active locations */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const origLineColorRef = useRef<any>(null)
  const origLineWidthRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isInteractive) return

    const config = selectedOutcomeCode
      ? getOutcomeConfig(selectedOutcomeCode)
      : null

    if (!config) {
      if (playState !== "finished") return
      if (activeLocationSet.size === 0) mapActions.clearLocationHighlights()
      return
    }

    const map = mapAPI.mapRef?.current?.getMap?.()

    origLineColorRef.current = null
    origLineWidthRef.current = null

    const applyPaintChanges = () => {
      if (!map || config.geometryType !== "polygon") return

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

    // Store highlights (drives map Popups -- independent of map style)
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

  useEffect(() => {
    return () => {
      controlsRef.current?.stop()
    }
  }, [])

  /* Map hover/click -> shared multi-pin state for visible outcome polygons */
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

  /* Detect when panel scrolls into view */
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

  /* Fly camera once panel is visible */
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

          // consolidated session-init. `ensureDemandUnitsOutlineLayer`
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

  /* Build a Mapbox fill-color expression that assigns tier colors */
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

  /* InteractivePaintArbiter
   *
   * Event-driven arbiter (same shape as `CameraArbiter`, not in the
   * progress-dispatch `arbitersRef` list). Will eventually be the
   * sole writer for `demand-units` / `demand-units-outline` during
   * interactive mode. In Phase 3b its `onEnter` / `onExit` /
   * `onChangeSelection` hooks are logging stubs. Legacy writers
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
  // it on unmount. The arbiter reads through the ref on each
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

  /* InteractivePaintArbiter sync
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
    // `theme` dep covers the grey fallback. `outcomeLocations` fires
    // the re-sync when tier data hydrates for the current outcome.
  }, [engineContext, selectedOutcomeCode, playState, theme, outcomeLocations])

  /* InteractivePaintArbiter overlay
   *
   * Apply the per-selection overlay (gold outline + zoom-aware
   * fill-opacity with optional spotlight / pinned overrides) whenever
   * active locations, pinned locations, or Beat 5's spotlighted tier
   * change. Separated from `sync` because overlay state changes much
   * more frequently (hover, pin toggle, tier step) and can be written
   * as a pure overlay pass without re-running the full enter /
   * crossfade sequence.
   *
   * No-op when the arbiter doesn't own. Cheap guard inside the
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

    // Spotlight: only meaningful for AG_REV + matching tier.
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

  /* InteractivePaintArbiter teardown cancellation
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
        for (const lineLayer of ANIM_LINE_LAYERS) {
          if (map.getLayer(lineLayer))
            map.setPaintProperty(lineLayer, "line-opacity", 1)
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

  /* Measure panel for SVG coordinate mapping */
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
  }, [])

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

    // 2. React-marker outcomes: project coordinates to viewport shapes
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

    // 3. Line outcomes: representative shape at centroid
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

  // Re-project cached shapes when the map pans/zooms.

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

  /* Build per-outcome shape groups for the morph overlay */
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

  /** Map of outcome code */
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
      // AG_REV is excluded
      if (group.code === "AG_REV") continue
      const locData = outcomeLocations[group.code]
      if (!locData || locData.ids.size === 0) continue
      const config = getOutcomeConfig(group.code)
      if (!config) continue
      const [morphStart] = getOutcomeProgressRange(group.code, activeCodes)
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

  const forestBg = theme.palette.nature.forest

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
            playState={playState}
            beatIndex={beatIndex}
            totalBeats={TIMING_BEATS.length}
            hasPlayed={hasPlayed}
            onPlay={handlePlay}
            onNext={handleNext}
            onBack={handleBack}
            onRestart={handleRestart}
            beat2Layout={outcomeLayout}
            // Outcome-title clicks no longer drive layer visibility. See the
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
            heatmapExtraColumnCount={heatmapExtraColumns.length}
          />
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

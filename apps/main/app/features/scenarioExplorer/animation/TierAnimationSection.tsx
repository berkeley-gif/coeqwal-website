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
import { useTierAnimationData } from "./useTierAnimationData"
import type { OutcomeLocationData } from "./useTierAnimationData"
import OutcomeMorphOverlay, {
  type LocationInfo,
  type EncodingMode,
} from "./OutcomeMorphOverlay"
import BeatTextOverlay from "./BeatTextOverlay"
import { useScreenPolygonProjection } from "./hooks/useScreenPolygonProjection"
import { useStoryboardLayout } from "./hooks/useStoryboardLayout"
import { useStoryboardCamera } from "./hooks/useStoryboardCamera"
import { OUTCOME_CODE_ORDER, getOutcomeName } from "../../../content/outcomes"
import { getTierLabel } from "../../../content/tiers"
import { getDemandUnitDisplayName } from "../../map/config/demandUnitNames"
import { useScenarioTiers } from "../../scenarios/hooks/useTierData"
import { useScenarios } from "@repo/data/coeqwal/hooks"
import { TIMING_BEATS, FINAL_TIMING_BEAT_INDEX } from "./animationTiming"
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
  DU_CLASS_FILTER,
  writeDemandUnitsBaseline,
  blueFillExpr,
  type BaselineMap,
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

  /** Settle the animation to its resting end-state: clear visualization +
   *  highlights, hide all animation polygon/line layers, and flip
   *  `playState` into "finished" so the interactive UI lights up. Shared
   *  between the normal `animate(progress, 1, { onComplete })` finish and
   *  the reduced-motion fast-forward path below. */
  const settleToFinishedState = useCallback(() => {
    setPlayState("finished")
    // Signal to the engine that the storyboard has settled and the
    // user can now click squares.
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
   *   - "finished" when we landed on the final beat (enables interactive UI)
   *   - "paused" for any non-final landing
   *   - "idle" when we landed on beat 0 (restart or Back from B1)
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

      // Rule: every tween starts from a settled beat. If the user clicks
      // while a beat is still animating, finish it first by snapping
      // `progress` to its checkpoint. Each beat's morphs play across a
      // fixed slice of `progress`, so a tween that started mid-slice would
      // cross the leftover slice at the wrong speed and the squares would
      // rush to their places. When the beat is already settled, `progress`
      // is already on `source.progress`, so this does nothing.
      progress.set(source.progress)
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
      // `CAMERA_ARBITER.flyHome` always calls `onArrive` exactly once:
      // synchronously when already home or `map` is null, and via
      // `moveend` otherwise. So we can hand off `runTween` without the
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

  /* Clear any interactive overlay/map state tied to a sticky pin
   *
   * Called when the user navigates between beats so that a previously
   * clicked square (and its pinned popups + outcome map layer) doesn't
   * carry over into the next beat, where the layer and overlay content
   * will generally belong to a different outcome. Matches the clearing
   * block in `handleRestart`. */
  /** Ref copy of the beat engine's api so `clearInteractiveState`
   *  (declared before the engine setup to match the existing
   *  nav-handler ordering) can call `teardown()` without depending on
   *  the memoized `engineApi` identity. The ref is assigned right
   *  after `useBeatEngine` runs later in this component body. */
  const engineApiRef = useRef<BeatEngineApi | null>(null)

  /** Ref copy of the memoized `engineContext`. Populated right after
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
    // `selectedOutcomeCode` going null still fires on React commit, but
    // by the time it runs the arbiter has already shed ownership and
    // `sync` does nothing. Releasing here guarantees the exit write
    // lands while the selection is still valid, no matter how commit
    // scheduling interleaves with `goTo`'s mode flip to "playback".
    // Safe to call when not owning: release is then a no-op.
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
   * tweens the first beat's window (0 to `TIMING_BEATS[0].progress`)
   * while keeping `beatIndex` at 0, so the storyboard indicator reads
   * "1 / N" the entire time. Under `prefers-reduced-motion`, the tween
   * collapses to an instant snap. */
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
    // Mode signal: storyboard is now in playback. Set before
    // `playArrival()` so any downstream effect observing the mode sees
    // the transition before the first progress frame lands.
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
   * and animate `backOutOpacity` 1 to 0 so the whole text block fades
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
      // Storyboard is back in the pre-play gate.
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
        // baseline helper re-applies the full state (filter, color
        // expressions, transitions, visibility) so we return to the
        // pre-play beat-1 palette consistently. Idempotent with the
        // loop's opacity writes above. Cast via `unknown` because
        // Mapbox's method signatures are stricter than the helper's
        // intentionally permissive structural type (same cast pattern
        // as `getStyledMap` in `MapPaintArbiter`).
        writeDemandUnitsBaseline(map as unknown as BaselineMap, {
          filter: DU_CLASS_FILTER,
          fillExpr: blueFillExpr(0) as readonly unknown[],
          fillOpacity: { kind: "scalar", value: 0 },
          lineOpacity: { kind: "scalar", value: 0 },
          lineWidth: 0.5,
          lineOffset: -0.25,
          visibility: "visible",
        })
        // Reset shared `basemap-dim-overlay` to 0 here too, matching the
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
    // Restart returns the engine to the same pre-play state it was in
    // at first mount.
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
        // (matching the old outcome-title-click camera behavior).
        const key = locKey(info)
        const prevPins = pinnedLocationsRef.current
        const wasSelected = prevPins.has(key)

        // Commented out: previous multi-pin toggle behavior. Re-enable
        // if we ever want several pinned locations with tethered
        // popups again.
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

  /* Location highlights (popup data, not paint)
   *
   * Builds the `LocationHighlight[]` the map popups read from coordinates,
   * names, and tier colors for every active location. Runs for all outcome
   * types and is independent of which arbiter paints the map. */
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

  useEffect(() => {
    return () => {
      controlsRef.current?.stop()
    }
  }, [])

  /* Map hover/click to shared multi-pin state for visible outcome polygons */
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

  /* InteractivePaintArbiter sync
   *
   * Reconcile the arbiter's ownership of `demand-units` /
   * `demand-units-outline` whenever selection, engine mode, or
   * `playState` changes. The arbiter owns (and paints) only when all of:
   *
   *   1. A DU outcome (`layerType === "demand-units"`) is selected.
   *   2. Engine mode is not `"idle"` (we're in or past the storyboard).
   *   3. `playState !== "playing"` (no active tween, since
   *      `MapPaintArbiter` owns during tweens).
   *   4. Tier data for that outcome has hydrated
   *      (`outcomeLocationsRef` has the colorMap).
   *
   * When all four hold, we build a `DemandUnitsPaintSpec` and pass it
   * to `sync`. When any fail, we pass `null` and the arbiter tears
   * down. Condition (3) lets the arbiter also own during the
   * paused-between-beats state, so a mid-storyboard square click's
   * gold outline is cleaned up on deselect.
   *
   * Mode isn't reactive (it lives on a ref inside `BeatEngine`), so
   * we depend on `playState` as a proxy: every `setMode(...)` call in
   * this file happens alongside a `setPlayState(...)` call, so the
   * effect fires on the same frame the mode transitioned. */
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
      isInteractive && selectedOutcomeCode
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
    selectedOutcomeCode,
    activeLocationSet,
    pinnedLocations,
    spotlightedTier,
  ])

  /* InteractivePaintArbiter overlay
   *
   * Apply the per-selection overlay (gold outline + zoom-aware
   * fill-opacity with optional spotlight / pinned overrides) whenever
   * active locations, pinned locations, or the loi-highlight beat's spotlighted tier
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
   * and overwrite whatever beat paint `MapPaintArbiter` left on the
   * layer. Cancel it here so the pending listener detaches cleanly.
   * Safe to call when no teardown is pending. */
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

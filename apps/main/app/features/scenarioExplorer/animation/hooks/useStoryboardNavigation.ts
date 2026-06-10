"use client"

/* useStoryboardNavigation: the Play, Next, Back, and Restart handlers
 *
 * Owns every action that moves the shared `progress` clock: the intro
 * Play tween, beat-to-beat navigation, the Back fade-out, and the full
 * Restart reset. Also registers the keyboard shortcuts and the
 * reduced-motion auto-arrival. The cursor state itself (`beatIndex`,
 * `playState`, `hasPlayed`) stays in the parent and is passed in via
 * setters so the parent's many effects keep reading it in place. One of
 * the TierAnimationSection hooks (see README.md).
 */

import { useCallback, useEffect, useRef } from "react"
import { animate } from "@repo/motion"
import type { MotionValue } from "@repo/motion"
import { useMap } from "@repo/map"
import { mapActions } from "../../../map/store"
import type { LocationInfo } from "../OutcomeMorphOverlay"
import { TIMING_BEATS, FINAL_TIMING_BEAT_INDEX } from "../animationTiming"
import {
  DU_CLASS_FILTER,
  writeDemandUnitsBaseline,
  blueFillExpr,
  type BaselineMap,
  type BeatEngineApi,
  type BeatEngineContext,
  type CameraArbiter,
  type InteractivePaintArbiter,
} from "../engine"

type PlayState = "idle" | "playing" | "paused" | "finished"

// Backward navigation feels snappier than forward, so rewinds run at a
// fraction of the source beat's duration. Every tween is also clamped to
// a floor so the very short beats don't feel instant.
const BACK_DURATION_FACTOR = 0.6
const MIN_NAV_DURATION = 0.4

interface StoryboardNavigationParams {
  progress: MotionValue<number>
  backOutOpacity: MotionValue<number>
  prefersReducedMotion: boolean
  panelInView: boolean
  mapAPI: ReturnType<typeof useMap>
  /** Shared camera helper that eases the map back to the home view. */
  cameraArbiter: CameraArbiter
  /** Map layers reset on settle and Restart. Passed in because the parent
   *  also touches them in its own cleanup effects. */
  animPolygonLayers: readonly { fill: string; outline: string }[]
  controlsRef: React.RefObject<ReturnType<typeof animate> | null>
  setBeatIndex: React.Dispatch<React.SetStateAction<number>>
  beatIndexRef: React.RefObject<number>
  setPlayState: React.Dispatch<React.SetStateAction<PlayState>>
  setHasPlayed: React.Dispatch<React.SetStateAction<boolean>>
  hasPlayedRef: React.RefObject<boolean>
  setHoveredLocation: React.Dispatch<React.SetStateAction<LocationInfo | null>>
  setPinnedLocations: React.Dispatch<
    React.SetStateAction<Map<string, LocationInfo>>
  >
  // Shared-ref seam: created in the parent, read here at call time.
  engineApiRef: React.RefObject<BeatEngineApi | null>
  engineContextRef: React.RefObject<BeatEngineContext | null>
  interactivePaintArbiterRef: React.RefObject<InteractivePaintArbiter | null>
  computePolygonDataRef: React.RefObject<() => void>
}

interface StoryboardNavigation {
  goTo: (targetIndex: number, opts?: { viaCamera?: boolean }) => void
  handlePlay: () => void
  handleNext: () => void
  handleBack: () => void
  handleRestart: () => void
}

/** See the file header. */
export function useStoryboardNavigation({
  progress,
  backOutOpacity,
  prefersReducedMotion,
  panelInView,
  mapAPI,
  cameraArbiter,
  animPolygonLayers,
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
}: StoryboardNavigationParams): StoryboardNavigation {
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
        for (const { fill, outline } of animPolygonLayers) {
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
      // `cameraArbiter.flyHome` always calls `onArrive` exactly once:
      // synchronously when already home or `map` is null, and via
      // `moveend` otherwise. So we can hand off `runTween` without the
      // caller-side branching this block used to carry.
      if (opts?.viaCamera) {
        cameraArbiter.flyHome(mapAPI.mapRef?.current?.getMap?.(), {
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
    // transition effect in the parent. That effect fires after React
    // commits the `OutcomePolygonLayer` unmount triggered by
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
      // so we route through `cameraArbiter.flyHome` (which fires
      // `onArrive` synchronously when the map is already home, and
      // otherwise waits for `moveend` before applying the snap).
      cameraArbiter.flyHome(mapAPI.mapRef?.current?.getMap?.(), {
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
        for (const { fill, outline } of animPolygonLayers) {
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
        // consolidated DU reset. `animPolygonLayers` loop
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
      cameraArbiter.flyHome(map, {
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

  // Stop any in-flight tween when the storyboard unmounts.
  useEffect(() => {
    return () => {
      controlsRef.current?.stop()
    }
  }, [])

  return { goTo, handlePlay, handleNext, handleBack, handleRestart }
}

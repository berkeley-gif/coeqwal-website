"use client"

/* useStoryboardNavigation: Play, Next, Back, Restart handlers plus keyboard
 * shortcuts. Owns every action that moves the shared `progress` clock. Cursor
 * state (`beatIndex`, `playState`, `hasPlayed`) lives in the parent and is
 * passed in via setters. One of the TierAnimationSection hooks (see README.md).
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
  type InteractiveLayerDirector,
} from "../engine"

type PlayState = "idle" | "playing" | "paused" | "finished"

const BACK_DURATION_FACTOR = 0.6
const MIN_NAV_DURATION = 0.4

interface StoryboardNavigationParams {
  progress: MotionValue<number>
  backOutOpacity: MotionValue<number>
  prefersReducedMotion: boolean
  panelInView: boolean
  mapAPI: ReturnType<typeof useMap>
  /** Camera helper that eases the map back to the home view. */
  cameraArbiter: CameraArbiter
  /** Map layers reset on settle and Restart. */
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
  // Shared refs: created in the parent, read here at call time.
  engineApiRef: React.RefObject<BeatEngineApi | null>
  engineContextRef: React.RefObject<BeatEngineContext | null>
  interactiveLayerDirectorRef: React.RefObject<InteractiveLayerDirector | null>
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
  interactiveLayerDirectorRef,
  computePolygonDataRef,
}: StoryboardNavigationParams): StoryboardNavigation {
  /** Settle to the resting end-state: clear visualization and highlights, hide
   *  animation polygon/line layers, flip `playState` to "finished". Shared by
   *  the normal tween finish and the reduced-motion fast-forward path. */
  const settleToFinishedState = useCallback(() => {
    setPlayState("finished")
    // Engine now interactive: user can click squares.
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
  }, [mapAPI.mapRef, animPolygonLayers, engineApiRef, setPlayState])

  /* goTo(targetIndex): animate `progress` to `TIMING_BEATS[targetIndex]`.
   * Forward uses the destination beat's `duration`. Backward (only via
   * `handleRestart`) uses `BACK_DURATION_FACTOR` of the source beat's. The
   * regular Back button snaps instead (see `handleBack`). Under
   * reduced-motion every tween collapses to an instant `progress.set` + settle.
   *
   * `playState`: "playing" during the tween, "finished" on the final beat,
   * "idle" on beat 0, "paused" otherwise. */
  const goTo = useCallback(
    (targetIndex: number, opts?: { viaCamera?: boolean }) => {
      const clamped = Math.max(
        0,
        Math.min(FINAL_TIMING_BEAT_INDEX, targetIndex),
      )
      const fromIndex = beatIndexRef.current
      if (controlsRef.current) controlsRef.current.stop()

      // Any goTo puts the storyboard into playback mode (restores playback if
      // the user was interactive and pressed Back). settleToFinishedState
      // flips back to "interactive" on the final beat.
      engineApiRef.current?.setMode("playback")

      const target = TIMING_BEATS[clamped]!
      const source = TIMING_BEATS[fromIndex]!
      const forward = clamped > fromIndex

      // Every tween must start from a settled beat. Snap `progress` to the
      // source checkpoint first: starting mid-slice would cross the leftover
      // slice at the wrong speed. No-op when the beat is already settled.
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

      // Refresh polygon coords before a forward tween crosses into the morph
      // region (the map may have been panned).
      if (forward) computePolygonDataRef.current()

      // Optionally fly the camera home first (Next/viaCamera). `flyHome`
      // calls `onArrive` exactly once: synchronously when already home or
      // `map` is null, via `moveend` otherwise.
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
    [
      progress,
      prefersReducedMotion,
      mapAPI.mapRef,
      settleToFinishedState,
      beatIndexRef,
      cameraArbiter,
      computePolygonDataRef,
      controlsRef,
      engineApiRef,
      setBeatIndex,
      setPlayState,
    ],
  )

  /* Clear interactive overlay/map state tied to a sticky pin, so a previously
   * clicked square and its pinned popups + outcome layer don't carry into the
   * next beat. Matches the clearing block in `handleRestart`. */
  const clearInteractiveState = useCallback(() => {
    setHoveredLocation(null)
    setPinnedLocations(new Map())
    // Release interactive paint ownership synchronously, BEFORE clearing the
    // selection store, so the exit write lands while the selection is still
    // valid regardless of how commit scheduling interleaves with `goTo`'s mode
    // flip. The later `sync` effect then no-ops. Safe when not owning.
    const ctx = engineContextRef.current
    if (ctx) interactiveLayerDirectorRef.current?.release(ctx)
    mapActions.clearLocationHighlights()
    mapActions.clearOutcomeVisualization()
    // Clear any engine actors still in-window so a mid-beat nav away doesn't
    // strand the gold polygon ring, the square popup, or the LOI highlight.
    engineApiRef.current?.teardown()

    // Visibility restore runs in the parent's selectedOutcomeCode transition
    // effect, after React commits the OutcomePolygonLayer unmount, so it wins
    // the race against the unmount's `visibility: "none"` write.
  }, [
    engineApiRef,
    engineContextRef,
    interactiveLayerDirectorRef,
    setHoveredLocation,
    setPinnedLocations,
  ])

  const handleNext = useCallback(() => {
    if (beatIndexRef.current >= FINAL_TIMING_BEAT_INDEX) return
    clearInteractiveState()
    // `viaCamera` eases back to home first (no-op when already home) so a
    // square-click zoom doesn't persist into the next beat.
    goTo(beatIndexRef.current + 1, { viaCamera: true })
  }, [goTo, clearInteractiveState, beatIndexRef])

  /* Intro tween (Play). Tweens the first beat's window (0 to
   * `TIMING_BEATS[0].progress`) while keeping `beatIndex` at 0 so the indicator
   * reads "1 / N". Reduced-motion collapses to an instant snap. */
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
  }, [
    progress,
    prefersReducedMotion,
    beatIndexRef,
    controlsRef,
    setBeatIndex,
    setPlayState,
  ])

  const handlePlay = useCallback(() => {
    // Clear any lingering back-out fade in case Play is triggered mid-fade-out.
    if (controlsRef.current) controlsRef.current.stop()
    backOutOpacity.set(1)
    setHasPlayed(true)
    hasPlayedRef.current = true
    // Set playback mode before `playArrival()` so downstream effects see the
    // transition before the first progress frame lands.
    engineApiRef.current?.setMode("playback")
    computePolygonDataRef.current()
    playArrival()
  }, [
    playArrival,
    backOutOpacity,
    computePolygonDataRef,
    controlsRef,
    engineApiRef,
    hasPlayedRef,
    setHasPlayed,
  ])

  /* Back. On beat > 0, snap `progress` to the previous checkpoint; the pure
   * `progress` listeners recompute that beat without winding the UI backward.
   * On beat 0, do not reverse-tween (that unwinds every staggered reveal):
   * fade `backOutOpacity` 1 to 0 so the text block fades out together, then
   * snap `progress` to 0, reset `backOutOpacity`, and flip `hasPlayed` off so
   * the pre-play gate re-renders clean. */
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

      // Fly home first if an interaction pushed the camera elsewhere. `flyHome`
      // fires `onArrive` synchronously when already home, otherwise on
      // `moveend`, then `applyBeat` snaps the beat.
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
      // Snap state back to pre-play in one frame while the text is faded out.
      // Resetting `backOutOpacity` to 1 is a no-op for the fresh state since
      // `progress` is 0 and the text opacity is already 0 there.
      progress.set(0)
      backOutOpacity.set(1)
      setHasPlayed(false)
      hasPlayedRef.current = false
      setPlayState("idle")
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
    beatIndexRef,
    cameraArbiter,
    controlsRef,
    engineApiRef,
    hasPlayedRef,
    setBeatIndex,
    setHasPlayed,
    setPlayState,
  ])

  const handleRestart = useCallback(() => {
    if (controlsRef.current) controlsRef.current.stop()
    setHoveredLocation(null)
    setPinnedLocations(new Map())
    // Release the interactive arbiter before clearing the store so DU teardown
    // runs while the selection is still valid (see `clearInteractiveState`).
    // Also cancels any pending deferred-idle teardown from a prior exit.
    const ctx = engineContextRef.current
    if (ctx) interactiveLayerDirectorRef.current?.release(ctx)
    mapActions.clearLocationHighlights()
    mapActions.clearOutcomeVisualization()
    mapActions.clearMapTooltips()

    // Reset animation polygon/line layers so the map-phase effect's `v < 0.01`
    // branch has a clean slate to rebuild from.
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
        // Consolidated DU reset. The baseline helper re-applies the full
        // beat-1 palette state (filter, color expressions, transitions,
        // visibility). Idempotent with the loop's opacity writes above. Cast
        // via `unknown` because Mapbox's signatures are stricter than the
        // helper's permissive structural type (as in `MapPaintArbiter`).
        writeDemandUnitsBaseline(map as unknown as BaselineMap, {
          filter: DU_CLASS_FILTER,
          fillExpr: blueFillExpr(0) as readonly unknown[],
          fillOpacity: { kind: "scalar", value: 0 },
          lineOpacity: { kind: "scalar", value: 0 },
          lineWidth: 0.5,
          lineOffset: -0.25,
          visibility: "visible",
        })
        // Reset shared `basemap-dim-overlay` to 0, overriding its transition
        // (see the demand-units setup block for why).
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

      // Fly home so the next forward tween's polygon coords anchor correctly.
      // Fire-and-forget: Restart parks in the pre-play gate immediately, so no
      // `onArrive`. `resetOrientation` restores bearing/pitch to 0 on flight.
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
    // Return the engine to its first-mount pre-play state.
    engineApiRef.current?.setMode("idle")
    computePolygonDataRef.current()
  }, [
    progress,
    backOutOpacity,
    mapAPI.mapRef,
    animPolygonLayers,
    beatIndexRef,
    cameraArbiter,
    computePolygonDataRef,
    controlsRef,
    engineApiRef,
    engineContextRef,
    hasPlayedRef,
    interactiveLayerDirectorRef,
    setBeatIndex,
    setHasPlayed,
    setHoveredLocation,
    setPinnedLocations,
    setPlayState,
  ])

  /* Arrival. Normal motion parks in the pre-play gate (user clicks Play).
   * Reduced motion jumps straight to the final settled beat. */
  const hasAutoAdvancedRef = useRef(false)
  useEffect(() => {
    if (!panelInView) return
    if (hasAutoAdvancedRef.current) return
    hasAutoAdvancedRef.current = true
    if (prefersReducedMotion) {
      goTo(FINAL_TIMING_BEAT_INDEX)
    }
    // Normal motion: wait for the user to click Play.
  }, [panelInView, prefersReducedMotion, goTo])

  /* Keyboard shortcuts. Gated on `panelInView` so they don't steal keys after
   * scroll. Intercept ArrowRight/ArrowLeft/Home only with no modifiers and no
   * text input focused. */
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
        // Pre-play: ArrowRight plays. Post-play: it advances.
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
  }, [
    panelInView,
    handleNext,
    handleBack,
    handleRestart,
    handlePlay,
    hasPlayedRef,
  ])

  // Stop any in-flight tween when the storyboard unmounts.
  useEffect(() => {
    return () => {
      controlsRef.current?.stop()
    }
  }, [controlsRef])

  return { goTo, handlePlay, handleNext, handleBack, handleRestart }
}

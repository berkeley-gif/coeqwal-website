"use client"

/**
 * Drives the IntroSection's morphing-headline choreography from the
 * geometry of the three scroll panels (VideoHero, About, WaterThemes).
 *
 * Geometry in one paragraph
 * -------------------------
 * The intro renders three full-bleed panels stacked vertically inside a
 * shared container. A `MorphingHeadline` is fixed in the upper-left
 * corner and morphs through three text states, one per panel. The morph
 * is timed against the moving "seams" between panels: as the gap
 * between panel A and panel B sweeps past the headline, the text
 * crossfades to the next state. Between the second seam and the bottom
 * of the WaterThemes panel, the headline glides to the vertical center
 * of the viewport, holds, and then glides back up to its top anchor.
 *
 * Outputs
 * -------
 * Everything `MorphingHeadline` and the per-panel content fades need:
 *
 *   - `headlineHeight`        Pixel height of the fixed headline. The
 *                             ViewportCenterMarker uses this to size
 *                             itself so the second crossfade window
 *                             spans the centered headline's extent.
 *   - `panelBoundaries`       Geometry-driven boundaries fed straight
 *                             into `MorphingHeadline`.
 *   - `crossfadeAt1`          Fallback crossfade point for transition 0
 *                             (used by `MorphingHeadline` when the
 *                             range pair below isn't ready yet).
 *   - `crossfadeRanges`       Per-transition `[start, end]` windows so
 *                             text changes exactly while the seam is
 *                             within the headline's vertical extent.
 *   - `centerEnterRange`      Window during which the headline glides
 *                             from its top anchor to viewport center.
 *   - `centerExitRange`       Window during which the headline glides
 *                             back up to its top anchor.
 *   - `aboutOpacity`          Per-panel content motion value for the
 *                             About panel (0 -> 1 at `crossfadeAt1`).
 *   - `waterThemesOpacity`    Same idea for the WaterThemes panel
 *                             (0 -> 1 at `crossfadeAt2`).
 *
 * Why two ref groups
 * ------------------
 * `panelRefs` drive scroll-meeting math. `headlineRef` and
 * `viewportCenterRef` are both "what does the seam meet?". The
 * viewport-center marker is sized to the headline's own height
 * (computed here) and lives outside the scroll container, so the
 * About -> WaterThemes seam can be measured against the headline at
 * its centered position rather than its default top anchor.
 */

import { useEffect, useMemo, useState, type RefObject } from "react"
import {
  useScrollProgress,
  useMotionValue,
  useMeetingProgress,
} from "@repo/scrollytelling"
import type { MotionValue } from "@repo/motion"

export interface MorphingHeadlineChoreographyRefs {
  /** Wraps the entire IntroSection. Defines the scroll range. */
  containerRef: RefObject<HTMLDivElement | null>
  /** The fixed `MorphingHeadline` element. */
  headlineRef: RefObject<HTMLDivElement | null>
  /** Panel 1: the VideoHero. */
  videoHeroRef: RefObject<HTMLDivElement | null>
  /** Panel 2: the About COEQWAL panel. */
  aboutPanelRef: RefObject<HTMLDivElement | null>
  /** Panel 3: the WaterThemes panel. */
  waterThemesPanelRef: RefObject<HTMLDivElement | null>
  /**
   * Invisible fixed marker centered on the viewport, sized to the
   * headline's measured height. Used to time the second crossfade
   * against the centered headline.
   */
  viewportCenterRef: RefObject<HTMLDivElement | null>
}

export interface MorphingHeadlineChoreography {
  headlineHeight: number
  panelBoundaries: {
    panels: { start: number; mid: number; end: number }[]
    ready: boolean
  }
  crossfadeAt1: number
  crossfadeRanges: Array<[number, number] | undefined>
  centerEnterRange: [number, number]
  centerExitRange: [number, number]
  aboutOpacity: MotionValue<number>
  waterThemesOpacity: MotionValue<number>
}

/**
 * Tweak factor for the About -> WaterThemes text crossfade. The text
 * window is shifted forward by `gap2Duration * textDelayFactor` so the
 * dark-blue panel-3 text doesn't fade in while the white inset-frame
 * seam is still crossing the headline (which would read as dark text
 * over a white band). At 1.0 the text only starts morphing once the
 * seam is fully above the headline's top edge.
 */
const TEXT_DELAY_FACTOR = 1.0

/**
 * Half a `gap2Duration` pause after the seam leaves the centered
 * headline before the headline starts gliding back up. Tweak for feel.
 */
const CENTER_EXIT_PAUSE_FACTOR = 0.5

/**
 * Length of the upward glide back to the top anchor, expressed as a
 * multiple of `gap2Duration`. Larger = slower, smoother return.
 */
const CENTER_EXIT_DURATION_FACTOR = 2.0

/**
 * Fraction of the gap1End -> gap2Start window over which the headline
 * completes its glide down to viewport center. 0.5 = midway between
 * the first seam leaving the headline and the second seam approaching
 * it. Decoupled from the text crossfade so the vertical translation
 * can take more scroll distance than the text change.
 */
const CENTER_ENTER_FRACTION = 0.5

export function useMorphingHeadlineChoreography({
  refs,
}: {
  refs: MorphingHeadlineChoreographyRefs
}): MorphingHeadlineChoreography {
  const {
    containerRef,
    headlineRef,
    videoHeroRef,
    aboutPanelRef,
    waterThemesPanelRef,
    viewportCenterRef,
  } = refs

  // Measure the morphing headline's rendered height so the
  // viewport-center marker (rendered by the consumer) can be sized
  // to match. The marker is what `useMeetingProgress` compares against
  // to time the About -> WaterThemes text crossfade and the
  // return-to-top glide. It needs a real (non-zero) height so the
  // start/end meeting points are two distinct scroll events spanning
  // the centered headline's vertical extent.
  const [headlineHeight, setHeadlineHeight] = useState(0)
  useEffect(() => {
    if (typeof window === "undefined") return
    const el = headlineRef.current
    if (!el) return
    const update = () => setHeadlineHeight(el.getBoundingClientRect().height)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    window.addEventListener("resize", update, { passive: true })
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", update)
    }
  }, [headlineRef])

  const scrollProgress = useScrollProgress(containerRef)

  // `crossfadeAt{1,2}` = scroll progress at which the seam between two
  // adjacent panels sits at the headline's TOP edge. Used for
  // `panelBoundaries` (drives `activeIndex` / screen reader state)
  // and as a fallback when `crossfadeRanges` aren't ready yet.
  const crossfadeAt1 = useMeetingProgress(
    containerRef,
    videoHeroRef,
    headlineRef,
    { edgeA: "bottom", edgeB: "top" },
  )
  const crossfadeAt2 = useMeetingProgress(
    containerRef,
    aboutPanelRef,
    headlineRef,
    { edgeA: "bottom", edgeB: "top" },
  )

  // Transition 0 (VideoHero -> About): gap enters when hero's bottom
  // reaches the headline's bottom; leaves when About's top reaches the
  // headline's top. Because the headline is `position: fixed`, the
  // window's width equals the headline's own height.
  const gap1Start = useMeetingProgress(
    containerRef,
    videoHeroRef,
    headlineRef,
    { edgeA: "bottom", edgeB: "bottom" },
  )
  const gap1End = useMeetingProgress(containerRef, aboutPanelRef, headlineRef, {
    edgeA: "top",
    edgeB: "top",
  })

  // Transition 1 (About -> WaterThemes): measure against the
  // viewport-center marker, which is sized to the headline's height
  // and centered on the viewport. The two meeting events span the
  // centered headline's vertical extent. `gap2Start` is when the seam
  // reaches the centered headline's BOTTOM, `gap2End` is when it
  // reaches its TOP, mirroring the gap1 pattern.
  const gap2Start = useMeetingProgress(
    containerRef,
    aboutPanelRef,
    viewportCenterRef,
    { edgeA: "bottom", edgeB: "bottom" },
  )
  const gap2End = useMeetingProgress(
    containerRef,
    waterThemesPanelRef,
    viewportCenterRef,
    { edgeA: "top", edgeB: "top" },
  )

  const gap2Duration = gap2End - gap2Start
  const textCrossfadeDelay = gap2Duration * TEXT_DELAY_FACTOR
  const textCrossfadeStart = gap2Start + textCrossfadeDelay
  const textCrossfadeEnd = gap2End + textCrossfadeDelay

  const crossfadeRanges = useMemo<Array<[number, number] | undefined>>(
    () => [
      [gap1Start, gap1End],
      [textCrossfadeStart, textCrossfadeEnd],
    ],
    [gap1Start, gap1End, textCrossfadeStart, textCrossfadeEnd],
  )

  // Motion-only ranges for the headline's center glide. Decoupled from
  // the text crossfade above so the vertical translation can take
  // more scroll distance than the text change.
  //
  // Enter: starts as the VideoHero -> About seam reaches the
  // headline's bottom (gap1Start), finishes partway between gap1End
  // and the About -> WaterThemes seam approach. Stretches the
  // downward glide well past the text crossfade for a smoother feel.
  //
  // Exit: anchored off `gap2End` (seam reaches the top of the
  // centered headline), deliberately not off `textCrossfadeEnd`. The
  // delay applied to the text crossfade is a cosmetic shift; the
  // motion pause + return glide should still be scheduled relative
  // to the seam itself so timing doesn't drift if the text delay is
  // tweaked later.
  const centerEnterEnd = gap1End + (gap2Start - gap1End) * CENTER_ENTER_FRACTION
  const centerEnterRange: [number, number] = [gap1Start, centerEnterEnd]
  const centerExitPause = gap2Duration * CENTER_EXIT_PAUSE_FACTOR
  const centerExitDuration = gap2Duration * CENTER_EXIT_DURATION_FACTOR
  const centerExitRange: [number, number] = [
    gap2End + centerExitPause,
    gap2End + centerExitPause + centerExitDuration,
  ]

  // Build panel boundaries for `MorphingHeadline` from the meeting
  // points. `ready` flips true once both crossfadeAt values have
  // measured a real position; before that, MorphingHeadline falls
  // back to weight-based timing.
  const panelBoundaries = useMemo(
    () => ({
      panels: [
        { start: 0, mid: crossfadeAt1 / 2, end: crossfadeAt1 },
        {
          start: crossfadeAt1,
          mid: (crossfadeAt1 + crossfadeAt2) / 2,
          end: crossfadeAt2,
        },
        { start: crossfadeAt2, mid: (crossfadeAt2 + 1) / 2, end: 1 },
      ],
      ready: crossfadeAt1 > 0 && crossfadeAt2 > 0,
    }),
    [crossfadeAt1, crossfadeAt2],
  )

  // Per-panel content opacity driven by the same meeting points.
  // Seeded from the current scroll position so HMR / remount doesn't
  // leave content invisible when the user is already scrolled past
  // a panel.
  const aboutOpacity = useMotionValue(
    scrollProgress.get() >= crossfadeAt1 ? 1 : 0,
  )
  const waterThemesOpacity = useMotionValue(
    scrollProgress.get() >= crossfadeAt2 ? 1 : 0,
  )

  useEffect(() => {
    // Re-sync immediately in case crossfadeAt values were measured
    // after mount.
    const initial = scrollProgress.get()
    aboutOpacity.set(initial >= crossfadeAt1 ? 1 : 0)
    waterThemesOpacity.set(initial >= crossfadeAt2 ? 1 : 0)

    return scrollProgress.on("change", (p) => {
      aboutOpacity.set(p >= crossfadeAt1 ? 1 : 0)
      waterThemesOpacity.set(p >= crossfadeAt2 ? 1 : 0)
    })
  }, [
    scrollProgress,
    crossfadeAt1,
    crossfadeAt2,
    aboutOpacity,
    waterThemesOpacity,
  ])

  return {
    headlineHeight,
    panelBoundaries,
    crossfadeAt1,
    crossfadeRanges,
    centerEnterRange,
    centerExitRange,
    aboutOpacity,
    waterThemesOpacity,
  }
}

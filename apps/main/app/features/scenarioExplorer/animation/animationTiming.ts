/* Storyboard beats + timing primitives
 *
 * The Get-Started "Visualizing key outcomes" visualization is split into
 * beats the user steps through with Next / Back. Each beat is a
 * checkpoint on the shared `progress` MotionValue (0 to 1). Next animates
 * `progress` from the current checkpoint to the next over the next beat's
 * `duration` seconds. Listeners in BeatTextOverlay, OutcomeMorphOverlay,
 * and TierAnimationSection interpolate smoothly between any two progress
 * values, so navigation works.
 *
 * Each beat covers a different progress span over a different duration,
 * so the same progress width maps to different wall-clock seconds in
 * different beats. We author fade widths in seconds and convert with
 * `secondsToProgress`, so a "paragraph reveal" always feels ~1.1s no
 * matter which beat it's in. */

export interface TimingBeat {
  /** Stable identifier (debug only). */
  id: string
  /** Target value of `progress` at the end of this beat. */
  progress: number
  /** Forward duration in seconds. */
  duration: number
}

/* `progress` is an abstract 0-to-1 clock. These targets are authored
 *  checkpoints with no intrinsic meaning. Only their order and relative
 *  spacing matter. Beats 0-3 occupy [0, 0.5] and beats 4-7 occupy
 *  [0.5, 1.0]. Fade timing is decoupled from this coordinate. Author
 *  fade widths in seconds with `secondsToProgress` so they stay
 *  consistent if you retune a beat.
 *
 *  See the animation README for the full per-beat choreography. */

export const TIMING_BEATS: readonly TimingBeat[] = [
  { id: "legend", progress: 0.225, duration: 12 }, // [0]
  { id: "collapse-and-colors", progress: 0.365, duration: 9 }, // [1]
  { id: "ag-rev-morph", progress: 0.4, duration: 5 }, // [2]
  { id: "all-other-morphs", progress: 0.5, duration: 14 }, // [3]
  { id: "loi-highlight", progress: 0.62, duration: 9 }, // [4]
  { id: "list-bar", progress: 0.72, duration: 5 }, // [5]
  { id: "radar", progress: 0.87, duration: 7 }, // [6]
  { id: "heatmap", progress: 1.0, duration: 5 }, // [7]
] as const

export const FINAL_TIMING_BEAT_INDEX = TIMING_BEATS.length - 1

/** Pixels the storyboard's radar, heatmap, and HTML axis labels are
 *  shifted up so the right-column visualization and the narration beside
 *  it read as a single block. Kept in sync across `OutcomeMorphOverlay`
 *  and `BeatTextOverlay` measurement. */
export const STORYBOARD_VISUAL_LIFT_PX = 110

/* Pace primitives (seconds)
 *
 * Reference point: Beat 0, where the intro paragraph reveals over ~1.1s
 * and the tier-legend rows stagger ~1.3s apart. These constants capture
 * that rhythm so every reveal shares a few cadences instead of scattered
 * magic numbers.
 *
 * PARAGRAPH_FADE_SEC - A full sentence or paragraph block faded in as one
 *     piece.
 * ITEM_FADE_SEC - A short single-line element (tier legend row, outcome
 *     eyebrow). Shorter than a paragraph so a staggered list reads
 *     staccato against the slower paragraph pace.
 * ITEM_STAGGER_SEC - Time between the starts of consecutive item reveals
 *     in a staggered list.
 * BLOCK_EXIT_SEC - Snap-out pace for a block that's being replaced by the
 *     next reveal. */
export const PARAGRAPH_FADE_SEC = 1.1
export const ITEM_FADE_SEC = 0.55
export const ITEM_STAGGER_SEC = 1.3
export const BLOCK_EXIT_SEC = 0.45

/* Right-panel backdrop fade (progress units, not seconds)
 *
 * The white right-panel backdrop and its column eyebrow labels fade in
 * together, starting at this progress point and over this width, so both
 * are present by the time the ag-rev-morph beat settles. */
export const BACKDROP_FADE_IN_PROGRESS = 0.3775
export const BACKDROP_FADE_IN_WIDTH = 0.01

/** Progress-per-second for beat[i]. */
function beatRate(i: number): number {
  const prev = i === 0 ? 0 : TIMING_BEATS[i - 1]!.progress
  return (TIMING_BEATS[i]!.progress - prev) / TIMING_BEATS[i]!.duration
}

/** Convert a duration in seconds to a progress-fraction width, scaled to
 *  the velocity of the beat that contains the fade. Use this whenever you
 *  author a fade window (`(v - start) / width`) so the wall-clock duration
 *  stays consistent as beat durations are retuned. */
export function secondsToProgress(beatIndex: number, seconds: number): number {
  return beatRate(beatIndex) * seconds
}

/* Storyboard beats + timing primitives.
 *
 * The "Visualizing key outcomes" visualization is split into beats stepped
 * through with Next / Back. Each beat is a checkpoint on the shared
 * `progress` MotionValue (0 to 1). Next animates `progress` to the next
 * checkpoint over that beat's `duration` seconds. Listeners interpolate
 * between any two progress values.
 *
 * Each beat covers a different progress span over a different duration, so
 * the same progress width maps to different wall-clock seconds. Author fade
 * widths in seconds and convert with `secondsToProgress` so a reveal feels
 * the same pace in any beat. */

export interface TimingBeat {
  /** Stable identifier (debug only). */
  id: string
  /** Target value of `progress` at the end of this beat. */
  progress: number
  /** Forward duration in seconds. */
  duration: number
}

/* `progress` is an abstract 0-to-1 clock. Only the targets' order and
 *  relative spacing matter. Beats 0-3 occupy [0, 0.5], beats 4-7 occupy
 *  [0.5, 1.0]. See the animation README for the per-beat choreography. */

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

/** Pixels the radar, heatmap, and HTML axis labels shift up so the
 *  right-column visualization and the narration beside it read as one block.
 *  Kept in sync across `OutcomeMorphOverlay` and `BeatTextOverlay`. */
export const STORYBOARD_VISUAL_LIFT_PX = 110

/* Pace primitives (seconds). Shared cadences instead of scattered magic
 * numbers, calibrated to Beat 0 (intro paragraph ~1.1s, legend rows ~1.3s
 * apart).
 *
 * PARAGRAPH_FADE_SEC: full sentence or paragraph faded in as one piece.
 * ITEM_FADE_SEC: short single-line element (legend row, eyebrow), faster
 *     than a paragraph so a staggered list reads staccato.
 * ITEM_STAGGER_SEC: time between consecutive item reveal starts.
 * BLOCK_EXIT_SEC: snap-out pace for a block being replaced. */
export const PARAGRAPH_FADE_SEC = 1.1
export const ITEM_FADE_SEC = 0.55
export const ITEM_STAGGER_SEC = 1.3
export const BLOCK_EXIT_SEC = 0.45

/* Right-panel backdrop fade (progress units, not seconds).
 *
 * The white backdrop and its column eyebrows fade in together from this
 * point over this width, so both are present when ag-rev-morph settles. */
export const BACKDROP_FADE_IN_PROGRESS = 0.3775
export const BACKDROP_FADE_IN_WIDTH = 0.01

/** Progress-per-second for beat[i]. */
function beatRate(i: number): number {
  const prev = i === 0 ? 0 : TIMING_BEATS[i - 1]!.progress
  return (TIMING_BEATS[i]!.progress - prev) / TIMING_BEATS[i]!.duration
}

/** Convert seconds to a progress-fraction width, scaled to the containing
 *  beat's velocity. Use for any fade window (`(v - start) / width`) so the
 *  wall-clock duration stays consistent as beat durations are retuned. */
export function secondsToProgress(beatIndex: number, seconds: number): number {
  return beatRate(beatIndex) * seconds
}

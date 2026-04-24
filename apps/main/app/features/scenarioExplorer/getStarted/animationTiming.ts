/* ── Storyboard beats + timing primitives ──
 *
 * The Get-Started "Visualizing key outcomes" visualization is divided into
 * discrete beats the user advances through with Next / Back. Each beat is a
 * checkpoint on the shared `progress` MotionValue (0-1). Clicking Next
 * animates `progress` from the current beat's checkpoint to the next one
 * over the next beat's `duration` seconds. Listeners in BeatTextOverlay,
 * OutcomeMorphOverlay, and TierAnimationSection all interpolate smoothly
 * between any two progress values, so beat navigation drops in without
 * changing any of them.
 *
 * Reading pauses happen naturally between Next clicks. Tuning a beat's
 * duration tunes only that beat's perceived speed.
 *
 * Because each beat covers a different progress span over a different
 * duration, the same progress-fraction width maps to very different wall-
 * clock seconds in different beats. We therefore author fade widths in
 * seconds and convert to progress fractions via `secondsToProgress`, so a
 * "paragraph reveal" always feels ~1.1s regardless of which beat it lives
 * in. */

export interface BeatDef {
  /** Stable identifier (debug only). */
  id: string
  /** Target value of `progress` at the end of this beat. */
  progress: number
  /** Forward duration in seconds. */
  duration: number
}

/* Progress thresholds were compressed from [0, 1.0] into [0, 0.5] to make
 *  room for Beats 5-8 (loi-highlight, list-bar, radar, heatmap) in the
 *  remaining [0.5, 1.0]. Every threshold below (and in BeatTextOverlay,
 *  TierAnimationSection, and OutcomeMorphOverlay.getOutcomeProgressRange)
 *  is half of its pre-compression value. Durations are unchanged, so each
 *  beat's per-second rate doubled; seconds-based fades still feel the same
 *  because they flow through `secondsToProgress`. */
export const BEATS: readonly BeatDef[] = [
  // B0 (1/4) - intro paragraphs fade, tier legend fully revealed.
  //      Played automatically on arrival.
  { id: "legend", progress: 0.225, duration: 12 },
  // B1 (2/4) - Merged transition + narrative. 9s over 0.14 progress.
  //      Sub-windows (all in the compressed progress domain):
  //      1. Intro text collapses, tier legend floats to top of the
  //         left panel (0.23 -> 0.245).
  //      2. As soon as the legend parks (no settle pause):
  //         (0.245 -> 0.26, ~1s) the demand-units layer cross-fades
  //         OUT 0.65 -> 0 while still wearing its frozen 3-blue
  //         palette. At 0.26, while invisible, the filter swaps to
  //         Agriculture-only and the fill-color is set directly to
  //         the AG_REV tier expression. (0.26 -> 0.28, ~1.3s) the
  //         layer fades back IN 0 -> 0.65, appearing already in its
  //         final tier colors.
  //      3. Beat 1C narration paces for reading: "For example, each
  //         colored location..." fades in at 0.245 -> 0.26
  //         (concurrent with the map cross-fade out, so text + tier
  //         colors arrive together by 0.28); then "The colors
  //         correspond to different water delivery outcome
  //         levels..." fades in at 0.325 -> 0.34, leaving a ~1.6s
  //         reading pause before the beat settles at 0.365.
  { id: "collapse-and-colors", progress: 0.365, duration: 9 },
  // B2 (3/4) - Text swap + AG_REV morph + post-morph caption. 10s
  //      over 0.035 progress. Beat 1C paragraphs fade out
  //      0.365 -> 0.3675 and collapse; the Beat 3 "before" paragraph
  //      fades in 0.3675 -> 0.3725 into the same slot, giving a
  //      reading beat before AG_REV morphs to its distribution
  //      squares over [0.38, 0.39]. Once the morph completes the
  //      "before" paragraph fades out 0.39 -> 0.3925 and the "after"
  //      paragraph fades in 0.3925 -> 0.3975, landing as the beat
  //      settles at 0.40.
  { id: "ag-rev-morph", progress: 0.4, duration: 5 },
  // B3 (4/8) - "Remaining outcomes" beat. 14s over 0.10 progress
  //      (same per-progress velocity as AG_REV's morph). The Beat 3
  //      "after" paragraph fades out 0.40 -> 0.41; "For each
  //      scenario, outcome levels..." fades in in its place
  //      0.41 -> 0.42, and the remaining 8 outcome morphs play
  //      back-to-back across [0.42, 0.50] (each a 0.01-wide slice,
  //      ~1.4s each, matching AG_REV's speed).
  { id: "all-other-morphs", progress: 0.5, duration: 14 },
  // B4 (5/8) - Distribution view + LOI highlight. 9s over 0.12
  //      progress. "For each scenario..." fades out 0.50 -> 0.51;
  //      sentence 1 of the Beat 5 narration ("Outcomes can be
  //      displayed in different ways...") fades in 0.51 -> 0.53;
  //      sentence 2 ("Locations of interest can be selected on
  //      the map or from the chart") fades in 0.545 -> 0.560.
  //      Five-step LOI choreography plays across the second half
  //      of the beat on a single AG_REV LOI (Glenn Colusa I.D.):
  //        [0.555, 0.575] AG demand-unit layer fades in on the map
  //        [0.580, 0.590] gold ring on the distribution square
  //        [0.590, 0.600] popup near the square
  //        [0.600, 0.610] gold stroke on the map polygon
  //        [0.610, 0.620] popup near the polygon
  //      Beat settles at 0.62; tail [0.62, 0.63] clears all demo
  //      state so Beat 6 starts clean.
  { id: "loi-highlight", progress: 0.62, duration: 9 },
  // B5 (6/8) - List view. 5s over 0.10 progress. The Beat 5
  //      narration fades out 0.62 -> 0.63; "The list view
  //      summarizes key outcomes as bar charts." fades in
  //      0.63 -> 0.65. Simultaneously, all 9 distribution grids
  //      morph into their per-outcome bar glyphs across
  //      [0.62, 0.72] (OutcomeMorphOverlay applies `barBlend`
  //      on top of the settled square targets) and the bar
  //      track + guide chrome fades in. Beat settles at 0.72.
  { id: "list-bar", progress: 0.72, duration: 5 },
  // B6 (7/8) - Radar chart. 7s over 0.15 progress. The Beat 6
  //      narration fades out 0.72 -> 0.73; "The radar chart displays
  //      the average values of key outcomes..." fades in
  //      0.73 -> 0.75. In parallel: the per-outcome bars collapse
  //      into single dots at each grid center across [0.72, 0.75]
  //      (`avgBlend`); the dots then glide from their grid columns
  //      out to their polar-vertex positions across [0.75, 0.82]
  //      (`radarBlend`); finally the radar chrome (axes, rings,
  //      connecting polygon) fades in across [0.82, 0.87]
  //      (`radarChromeBlend`). Beat settles at 0.87.
  { id: "radar", progress: 0.87, duration: 7 },
  // B7 (8/8) - Heat map. 5s over 0.13 progress. Radar chrome (rings,
  //      axes, connecting polygon) fades out 0.87 -> 0.90; in the
  //      same window the Beat 7 narration fades out and the Beat 8
  //      narration ("The heat map displays how key outcomes change
  //      under different hydroclimate futures.") fades in
  //      0.88 -> 0.90. Representative dots migrate from their polar
  //      vertices into a single stacked column of tier-colored cells
  //      across [0.87, 0.95] (`heatmapBlend`), then the heatmap
  //      chrome (outcome labels on the side) fades in over
  //      [0.95, 1.0] (`heatmapChromeBlend`). Because the demo is
  //      scoped to a single hydroclimate (`s0020`), the heatmap is a
  //      single column; the layout generalizes trivially to multiple
  //      columns when additional hydroclimates are added. Beat
  //      settles at 1.0.
  { id: "heatmap", progress: 1.0, duration: 5 },
] as const

export const FINAL_BEAT_INDEX = BEATS.length - 1

/** Pixels the storyboard's radar, heatmap, and HTML axis labels are
 *  shifted up so the right-column visualization and Beat 3+ narration
 *  read as a single block. Kept in sync across `OutcomeMorphOverlay` and
 *  `BeatTextOverlay` measurement. */
export const STORYBOARD_VISUAL_LIFT_PX = 110

/* ── Reveal pace primitives (seconds) ──
 *
 * Reference point: step 1 (Beat 0), where the intro paragraph and subtitle
 * reveal over ~1.1s and the tier-legend rows stagger ~1.3s apart. These
 * constants codify that rhythm so every reveal in the visualization sits on
 * one of a handful of shared cadences instead of a grab-bag of magic
 * progress-fraction widths.
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

/** Progress-per-second for beat[i]. */
function beatRate(i: number): number {
  const prev = i === 0 ? 0 : BEATS[i - 1]!.progress
  return (BEATS[i]!.progress - prev) / BEATS[i]!.duration
}

/** Convert a duration in seconds to a progress-fraction width, scaled to
 *  the velocity of the beat that contains the fade. Use this whenever you
 *  author a fade window (`(v - start) / width`) so the wall-clock duration
 *  stays consistent as beat durations are retuned. */
export function secondsToProgress(beatIndex: number, seconds: number): number {
  return beatRate(beatIndex) * seconds
}

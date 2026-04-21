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

export const BEATS: readonly BeatDef[] = [
  // B0 (1/4) - intro paragraphs fade, tier legend fully revealed.
  //      Played automatically on arrival. Durations are 3x the prior
  //      baseline so text + converging-blues beats give readers time
  //      to absorb the narrative.
  { id: "legend", progress: 0.45, duration: 12 },
  // B1 (2/4) - Merged transition + narrative. Duration 9s over 0.28
  //      progress (~0.32s per 0.01 progress). Sub-windows:
  //      1. Intro text collapses, tier legend floats to top of the
  //         left panel (0.46 -> 0.49).
  //      2. As soon as the legend parks (no settle pause):
  //         (0.49 -> 0.52, ~1s) the demand-units layer cross-fades
  //         OUT 0.65 -> 0 while still wearing its frozen 3-blue
  //         palette. At 0.52, while invisible, the filter swaps to
  //         Agriculture-only and the fill-color is set directly to
  //         the AG_REV tier expression. (0.52 -> 0.56, ~1.3s) the
  //         layer fades back IN 0 -> 0.65, appearing already in its
  //         final tier colors. No solid-blue interstitial.
  //      3. The Beat 1C narrative paragraphs are spaced for reading:
  //         "For example, each colored location..." fades in at
  //         0.49 -> 0.52 (concurrent with the map cross-fade out, so
  //         text and tier-colored polygons arrive together by 0.56),
  //         then "The colors correspond to different water delivery
  //         outcome levels..." fades in at 0.65 -> 0.68, leaving a
  //         ~1.6s reading pause before the beat settles at 0.73.
  { id: "collapse-and-colors", progress: 0.73, duration: 9 },
  // B2 (3/4) - Text swap + AG_REV morph + post-morph caption. 10s
  //      total over 0.07 progress (~143s per progress unit). The two
  //      Beat 1C paragraphs below the tier legend fade out 0.73 ->
  //      0.735 and collapse; the Beat 3 "before" paragraph ("Each
  //      location can be symbolized as a square colored with the
  //      outcome level. These can be gathered together in a
  //      distribution view.") fades in 0.735 -> 0.745 into the same
  //      document-flow slot, giving ~3.5s of reading time before the
  //      AG_REV polygons morph to their distribution squares over
  //      [0.76, 0.78] (~2.9s). Once the morph completes, the "before"
  //      paragraph fades out 0.78 -> 0.785 and the "after" paragraph
  //      ("The distribution shows how agricultural revenue plays out
  //      in this scenario across all the districts at a glance.")
  //      fades in 0.785 -> 0.795 into the same slot, landing as the
  //      beat settles at 0.80. The tier legend stays put throughout.
  { id: "ag-rev-morph", progress: 0.8, duration: 10 },
  // B3 (4/4) - Merged "remaining outcomes" beat. 14s over 0.20
  //      progress (~70s per progress unit, same velocity as AG_REV's
  //      morph). The Beat 3 "after" paragraph fades out 0.80 -> 0.82;
  //      "For each scenario, outcome levels..." fades in in its place
  //      0.82 -> 0.84, and the remaining 8 outcome morphs play
  //      back-to-back over [0.84, 1.0] (each a 0.02-wide slice, ~1.4s
  //      each, matching AG_REV's morph speed).
  { id: "all-other-morphs", progress: 1.0, duration: 14 },
] as const

export const FINAL_BEAT_INDEX = BEATS.length - 1

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
export function secondsToProgress(
  beatIndex: number,
  seconds: number,
): number {
  return beatRate(beatIndex) * seconds
}

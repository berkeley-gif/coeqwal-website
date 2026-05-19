"use client"

import { useRef, useEffect, useLayoutEffect, type RefObject } from "react"
import {
  Box,
  Typography,
  useTheme,
  alpha,
  ArrowForwardIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  IconButton,
  PlayArrowIcon,
  ReplayIcon,
} from "@repo/ui/mui"
import { motion } from "@repo/motion"
import type { MotionValue } from "@repo/motion"
import type { EncodingMode } from "./OutcomeMorphOverlay"
import {
  PARAGRAPH_FADE_SEC,
  ITEM_FADE_SEC,
  ITEM_STAGGER_SEC,
  BLOCK_EXIT_SEC,
  secondsToProgress,
  STORYBOARD_VISUAL_LIFT_PX,
} from "./animationTiming"
import { OUTCOME_CODE_ORDER } from "../../../content/outcomes"

/* ── Per-beat progress-fraction widths, derived from the seconds-based
 *    primitives in `animationTiming.ts`. ──
 *
 * Each beat has a different progress-per-second rate, so the same wall-clock
 * duration maps to different progress widths. Precomputing once at module
 * scope keeps the hot `progress.on("change")` listener free of arithmetic. */
const B0_PARA = secondsToProgress(0, PARAGRAPH_FADE_SEC)
const B0_ITEM = secondsToProgress(0, ITEM_FADE_SEC)
const B0_STEP = secondsToProgress(0, ITEM_STAGGER_SEC)
const B1_PARA = secondsToProgress(1, PARAGRAPH_FADE_SEC)
const B1_EXIT = secondsToProgress(1, BLOCK_EXIT_SEC)
const B2_PARA = secondsToProgress(2, PARAGRAPH_FADE_SEC)
const B2_EXIT = secondsToProgress(2, BLOCK_EXIT_SEC)
const B3_PARA = secondsToProgress(3, PARAGRAPH_FADE_SEC)
const B4_PARA = secondsToProgress(4, PARAGRAPH_FADE_SEC)
const B4_EXIT = secondsToProgress(4, BLOCK_EXIT_SEC)
const B5_PARA = secondsToProgress(5, PARAGRAPH_FADE_SEC)
const B5_EXIT = secondsToProgress(5, BLOCK_EXIT_SEC)
const B6_PARA = secondsToProgress(6, PARAGRAPH_FADE_SEC)
const B6_EXIT = secondsToProgress(6, BLOCK_EXIT_SEC)
const B7_PARA = secondsToProgress(7, PARAGRAPH_FADE_SEC)

/** Pixels the right-column overlay (white backdrop + content column
 *  with scenario header, outcome titles/captions, and the HTML axis
 *  labels that dock to the radar) is lifted above the panel's standard
 *  top padding. Pairs with `STORYBOARD_VISUAL_LIFT_PX` (which lifts the
 *  SVG radar/heatmap + their label landing coordinates by the same
 *  amount relative to the panel's vertical centerline) so the whole
 *  right-column block reads as a single unit parked near the top of
 *  the visible area. */
const OVERLAY_TOP_LIFT_PX = 30

interface ColumnEyebrow {
  label: string
  x: number
  y: number
  columnWidth: number
  animationStart: number
}

interface Beat2LayoutItem {
  code: string
  label: string
  column: 0 | 1
  columnWidth: number
  isActive: boolean
  locationCount: number
  /** Pixel height the glyph placeholder should reserve in document flow. */
  targetHeight: number
  /** Caption rendered under the glyph (e.g. "12 locations"). */
  locationDescription: string
}

interface Beat2Layout {
  items: Beat2LayoutItem[]
  eyebrows: ColumnEyebrow[]
}

export interface GlyphRect {
  x: number
  y: number
  width: number
  height: number
}

interface BeatTextOverlayProps {
  progress: MotionValue<number>
  /** Bridge into `NarrationArbiter`. The component writes its
   *  `applyNarrationFrame(v)` dispatcher into `.current` on mount
   *  and clears it on unmount. The arbiter reads through the ref
   *  every tick. See
   *  `apps/main/app/features/scenarioExplorer/animation/engine/arbiters/NarrationArbiter.ts`. */
  narrationTickRef: RefObject<((v: number) => void) | null>
  headingOpacity: MotionValue<number>
  /** Multiplicative opacity applied on top of the progress-driven fade
   *  for the left-panel text block (`beat1Ref`). Defaults to a constant
   *  1 when omitted. The parent animates this from 1 to 0 during the
   *  Back-from-first-beat gesture so the entire text block (intro paragraphs,
   *  tier legend, bottom controls) fades out together instead of each
   *  reveal being reversed through the progress timeline. */
  backOutOpacity?: MotionValue<number>
  playState: "idle" | "playing" | "paused" | "finished"
  /** Storyboard navigation. `beatIndex` is a 0-based cursor into the
   *  storyboard. `totalBeats` is the length of that storyboard. Handlers
   *  drive Play / Next / Back / Restart.
   *
   *  `hasPlayed` gates which control chrome is shown:
   *    - false -> inline Play button beside the title (pre-play gate).
   *    - true  -> bottom control row with Back / N-of-T / Next. */
  beatIndex?: number
  totalBeats?: number
  hasPlayed?: boolean
  onPlay?: () => void
  onNext?: () => void
  onBack?: () => void
  onRestart?: () => void
  /** When true (e.g. reduced-motion users), hide all storyboard controls
   *  and let `beat1Ref` scroll internally so the fully revealed end-state
   *  body content is reachable without the Next / Back affordances. */
  hideControls?: boolean
  beat2Layout?: Beat2Layout | null
  onOutcomeClick?: (code: string, force?: boolean) => void
  selectedOutcomeCode?: string | null
  interactive?: boolean
  textHidden?: boolean
  scenarioId?: string
  scenarioName?: string
  scenarioDescription?: string
  encodingMode?: EncodingMode
  onEncodingChange?: (mode: EncodingMode) => void
  onAddLocation?: () => void
  /** Map of outcome code -> Beat 2 morph progress window. `start` drives
   *  each outcome title's fade-in (just before its polygons begin morphing).
   *  `end` drives the caption fade-in (once the polygons settle as squares). */
  outcomeMorphWindows?: Record<string, { start: number; end: number }>
  /** Called by the ResizeObserver whenever per-outcome glyph placeholders
   *  are laid out (or resized). The parent uses these rects as landing
   *  coordinates for the SVG morph overlay. Coordinates are relative to
   *  the right-column root Box (its left edge == panelWidth * 2/3). */
  onGlyphLayoutChange?: (layout: Record<string, GlyphRect>) => void
  /** Number of extra hydroclimate columns beyond the primary column in
   *  the Beat 8 heatmap (i.e. the length of `extraHydroclimateColumns`
   *  passed to `OutcomeMorphOverlay`). Used here to compute the
   *  same multi-column geometry so row labels anchor to the left edge
   *  of the leftmost column rather than drifting as extras fade in.
   *  Defaults to 0 (legacy single-column heatmap). */
  heatmapExtraColumnCount?: number
}

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v))
}

export default function BeatTextOverlay({
  progress,
  narrationTickRef,
  headingOpacity,
  backOutOpacity,
  playState,
  beatIndex = 0,
  totalBeats = 1,
  hasPlayed = false,
  onPlay,
  onNext,
  onBack,
  onRestart,
  beat2Layout,
  onOutcomeClick,
  selectedOutcomeCode,
  interactive,
  textHidden = false,
  scenarioName,
  onAddLocation,
  outcomeMorphWindows,
  onGlyphLayoutChange,
  hideControls = false,
  heatmapExtraColumnCount = 0,
}: BeatTextOverlayProps) {
  const theme = useTheme()

  /** Single source of truth for the "<name> scenario" label rendered in
   *  both the right-column overlay header and the Beat 3 intro sentence.
   *  Falls back to "Current operations scenario" when no scenarioName is
   *  passed (e.g. before the scenarios query resolves), so both call
   *  sites stay in lockstep. */
  const displayScenarioLabel = scenarioName
    ? `${scenarioName} scenario`
    : "Current operations scenario"

  const beat1Ref = useRef<HTMLDivElement>(null)
  const beat2PanelRef = useRef<HTMLDivElement>(null)
  const beat2IntroRef = useRef<HTMLDivElement>(null)
  const tierLegendRef = useRef<HTMLDivElement>(null)
  /** Per-row refs (one per tier level) so the legend can fade in row by row
   *  instead of as a single block. Index 0 = Optimal (top row). */
  const tierLegendRowRefs = useRef<(HTMLDivElement | null)[]>([])
  /** Wrapper around the two intro paragraphs ("Different scenarios..." +
   *  "To compare results..."). After the legend fully lands, this block
   *  fades out and collapses its height so the tier legend slides up into
   *  the vacated space via document flow. */
  const introCollapseRef = useRef<HTMLDivElement>(null)
  /** Wrapper around the "How are scenario results measured?" subtitle.
   *  Collapses on the same schedule as `introCollapseRef` so, post-reveal,
   *  only the page title sits above the tier legend. */
  const subtitleCollapseRef = useRef<HTMLDivElement>(null)
  /** Outermost Box (`position: absolute; inset: 0` of the animation panel).
   *  Used as the y-reference frame for placeholder measurements so glyph
   *  positions map 1:1 to the SVG overlay's panel-top coordinate system,
   *  regardless of where the right-column root is vertically offset. */
  const panelRootRef = useRef<HTMLDivElement>(null)
  /** Root Box of the right-column (absolutely positioned at `right: 0`,
   *  `width: 33.33%`). Its left edge aligns with `panelWidth * 2/3` which
   *  matches the SVG overlay's `panelLeft` origin, so glyph `pos.x` is
   *  measured relative to this root (while `pos.y` uses `panelRootRef`). */
  const rightColumnRootRef = useRef<HTMLDivElement>(null)
  /** Title row elements, keyed by outcome code. */
  const titleRefsMap = useRef<Map<string, HTMLDivElement | null>>(new Map())
  /** Transparent glyph-placeholder boxes that reserve SVG landing space. */
  const placeholderRefsMap = useRef<Map<string, HTMLDivElement | null>>(
    new Map(),
  )
  /** Caption Typographies under each glyph. */
  const captionRefsMap = useRef<Map<string, HTMLDivElement | null>>(new Map())
  /** Panel-relative center of each outcome title block as it would
   *  appear in Step 7's *wrapped* layout (`whiteSpace: normal`,
   *  `textAlign: center`, `max-width` sized from the radar arc). Steps
   *  1-6 render titles single-line, so the wrapped centers differ from
   *  the at-rest bounding rect. The measure pass computes them by
   *  temporarily applying wrap styles to every title at once inside
   *  `useLayoutEffect`, reading `getBoundingClientRect`, and reverting
   *  before the browser paints. */
  const wrappedTitleGeomRef = useRef<
    Map<string, { textCenterX: number; textCenterY: number }>
  >(new Map())
  /** Precomputed per-outcome delta for the Beat 6 radar-label slide.
   *  Populated by the same measure pass that fills `wrappedTitleGeomRef`.
   *  The per-frame tick just multiplies by `blend` and writes a translate. */
  const radarLabelDeltaRef = useRef<Map<string, { dx: number; dy: number }>>(
    new Map(),
  )
  /** Precomputed per-outcome delta for the Beat 8 heatmap-label slide.
   *  Targets align the title text's right edge with the heatmap cell's
   *  left edge minus a small gutter and the text's vertical center with
   *  the cell's center, so labels read like the y-axis on the resilience
   *  heatmap. Measured against the at-rest (unwrapped, noWrap) text
   *  bounding rect. */
  const heatmapLabelDeltaRef = useRef<Map<string, { dx: number; dy: number }>>(
    new Map(),
  )
  /** Latest `max-width` (px) the wrap-measure pass applied to titles.
   *  Re-applied by the per-frame tick when it toggles wrap styles on at
   *  Step 7 so the runtime wrap matches the geometry the delta was
   *  computed from. */
  const radarLabelMaxWidthRef = useRef<number>(110)
  /** Per-outcome `maxWidth` (px) for heatmap y-axis label wrapping. Filled
   *  in `measure()`. Applied when `v >= 0.95` in the progress tick. */
  const heatmapLabelMaxWRef = useRef<Map<string, number>>(new Map())
  /** When true, `axisLabel` titles use right-aligned, wrapped text for
   *  the Beat 8 heatmap column. Mutually exclusive with radar-axis wrap. */
  const heatmapTextActiveRef = useRef(false)
  /** Tracks whether the per-frame tick has currently applied Step 7's
   *  wrap styles to the title blocks. Used to toggle wrap inline styles
   *  once per transition instead of rewriting them every frame. */
  const radarWrapActiveRef = useRef<boolean>(false)
  const eyebrowRefs = useRef<(HTMLDivElement | null)[]>([])
  const eyebrowDataRef = useRef<ColumnEyebrow[] | undefined>(undefined)
  eyebrowDataRef.current = beat2Layout?.eyebrows
  const beat2LayoutRef = useRef<Beat2Layout | null | undefined>(undefined)
  beat2LayoutRef.current = beat2Layout
  /** Scenario-name overline header at the top of the right-column
   *  overlay ("Current operations scenario"). Opacity-driven by the
   *  progress tick so the header fades in with Step 3's Beat 3 reveal
   *  and stays through Step 8, rather than persisting from page load. */
  const scenarioOverlayHeaderRef = useRef<HTMLDivElement>(null)
  // NOTE: addLocationCtaRef is kept live because its JSX (the
  // "Add a location to track" CTA) is preserved behind a
  // `{false && ...}` guard below for future reuse.
  /** The three reveal blocks below the tier legend collapse their
   *  vertical space while hidden so the bottom control row (which sits
   *  in document flow below them) hugs whatever text is actually
   *  visible - not some lower bound set by invisible-but-reserved
   *  blocks. We use the CSS grid `grid-template-rows: Xfr` trick:
   *  the ref points at a single-row grid whose row collapses at `0fr`
   *  and expands to its min-content size at `1fr`, so the browser
   *  computes the natural height itself from document flow - no
   *  measurement needed. */
  const beat1cExampleRef = useRef<HTMLDivElement>(null)
  const beat1cDeliveryRef = useRef<HTMLDivElement>(null)
  const beat3BeforeRef = useRef<HTMLDivElement>(null)
  const beat3AfterRef = useRef<HTMLDivElement>(null)
  const allOtherOutcomesRef = useRef<HTMLDivElement>(null)
  // Beat 5 splits into two sentences so S2 can reveal right before the
  // five-step LOI choreography starts (~0.555). Keeping them in separate
  // grid-rows collapses avoids S2's reveal pushing S1 around.
  const beat5LoiS1Ref = useRef<HTMLDivElement>(null)
  const beat5LoiS2Ref = useRef<HTMLDivElement>(null)
  const beat6ListRef = useRef<HTMLDivElement>(null)
  const beat7RadarRef = useRef<HTMLDivElement>(null)
  const beat8HeatmapRef = useRef<HTMLDivElement>(null)
  /* View-mode headers layered above the two-column eyebrow row in the
   * right panel. One ref per Beat 5-8. Opacity is driven by the same
   * progress windows as the matching narration paragraph. */
  const distributionHeaderRef = useRef<HTMLDivElement>(null)
  const listHeaderRef = useRef<HTMLDivElement>(null)
  const radarHeaderRef = useRef<HTMLDivElement>(null)
  const heatmapHeaderRef = useRef<HTMLDivElement>(null)
  const addLocationCtaRef = useRef<HTMLDivElement>(null)
  const textHiddenRef = useRef(textHidden)
  textHiddenRef.current = textHidden
  const outcomeMorphWindowsRef = useRef(outcomeMorphWindows)
  outcomeMorphWindowsRef.current = outcomeMorphWindows

  /* ── Narration frame applier (beat-engine bridge) ──
   *
   * Combines the two legacy `progress.on("change")` subscribers
   * (first-panel fade multiplied by `backOutOpacity`, plus the big
   * per-beat narration tick over every DOM ref in this component)
   * into one callback the beat engine invokes via the
   * `NarrationArbiter`. See
   * `engine/arbiters/NarrationArbiter.ts` for the bridge rationale.
   * Per StorybookEngineHardeningPlanV2 invariant 4, the engine is
   * the only `progress.on("change")` subscriber in the storyboard.
   *
   * `latestNarrationFrameRef` is updated on every render so the
   * closures over component state and refs always reflect the most
   * recent render. The bridge-register effect further down writes a
   * stable dispatcher into `narrationTickRef.current`. That
   * dispatcher reads `latestNarrationFrameRef.current` on each call.
   *
   * `backOutOpacity` is a separate MotionValue (not `progress`), so
   * its own `on("change")` subscription remains below. When it
   * changes we re-run the narration frame at `progress.get()` so
   * `beat1Ref`'s fade-out multiplier stays in sync. */
  const latestNarrationFrameRef = useRef<(v: number) => void>(() => {})
  latestNarrationFrameRef.current = (v: number) => {
    // Beat 1 (first-panel) opacity: progress-driven fade-in (0.01 ->
    // 0.01 + B0_PARA) multiplied by `backOutOpacity` (default 1,
    // animated to 0 on Back-from-first-beat so the whole text block
    // fades out together without reversing each reveal).
    if (beat1Ref.current) {
      const el = beat1Ref.current
      const fadeIn = textHiddenRef.current ? 0 : clamp01((v - 0.01) / B0_PARA)
      const mult = backOutOpacity ? backOutOpacity.get() : 1
      el.style.opacity = String(fadeIn * mult)
    }

    if (beat2IntroRef.current) {
      const fadeIn = clamp01((v - 0.1) / B0_PARA)
      beat2IntroRef.current.style.opacity = String(fadeIn)
    }

    // Intro collapse group: after the Critical row lands (~0.45), fade
    // out the intro paragraphs + subtitle immediately so the user sees
    // a response to clicking Next, then collapse their height so the
    // tier legend slides up into the vacated space via document flow.
    // The subtitle ("How are scenario results measured?") collapses on
    // the same schedule as the intro paragraphs so only the page title
    // sits above the legend at rest. Running the two sequentially (fade
    // then slide) reads more cleanly than overlapping them. Windows are
    // kept tight (0.015 each, ~0.7s in the merged beat-2/5 tween) so
    // the whole transition feels snappy and completes before Beat 1B's
    // map convergence (starting at 0.50) takes over attention.
    //
    // Collapse is driven via `grid-template-rows: 1fr -> 0fr` on the
    // outer wrapper. The browser interpolates each row's height from
    // the inner overflow-hidden child's natural `min-content` height
    // down to zero, so no JS measurement is needed (same pattern as
    // `beat1cExampleRef` / `beat1cDeliveryRef` / `allOtherOutcomesRef`
    // below).
    const introFadeOut = clamp01((v - 0.23) / B1_EXIT)
    const introCollapse = clamp01((v - 0.2375) / B1_EXIT)
    const rowsFrac = 1 - introCollapse
    if (introCollapseRef.current) {
      const el = introCollapseRef.current
      el.style.opacity = String(1 - introFadeOut)
      el.style.gridTemplateRows = `${rowsFrac}fr`
    }
    if (subtitleCollapseRef.current) {
      const el = subtitleCollapseRef.current
      el.style.opacity = String(1 - introFadeOut)
      el.style.gridTemplateRows = `${rowsFrac}fr`
    }

    if (beat2PanelRef.current) {
      // Beat 2 panel backdrop now serves purely as a reading surface for
      // outcome titles + location captions, since the narrative text
      // lives on the left panel. It fades in with AG_REV's solo morph
      // so the backdrop arrives together with the first graphics.
      // The fade completes by 0.39 (beat 3's settle point) so the
      // backdrop is fully present when the AG_REV morph lands.
      const fadeIn = clamp01((v - 0.3775) / 0.01)
      beat2PanelRef.current.style.opacity = String(fadeIn)
    }

    if (scenarioOverlayHeaderRef.current) {
      // Scenario-name overline header appears with the Step 3 "before"
      // paragraph ("These are the outcomes for the <name> scenario.")
      // so the header and the sentence land together as a single
      // introduction of the scenario context. Held visible for the
      // rest of the storyboard. Opacity falls back to 0 automatically
      // if the user navigates back to Steps 1-2 (v < 0.3675).
      const fadeIn = clamp01((v - 0.3675) / B2_PARA)
      scenarioOverlayHeaderRef.current.style.opacity = String(fadeIn)
    }

    // Outcome titles fade in per-slice, synced to each outcome's own morph.
    // Each title appears just before its polygons begin morphing so the
    // viewer can read the title while watching that slice animate.
    // Captions fade in across the *last portion* of each morph window so
    // they're fully visible the moment the polygons settle as squares.
    // (Earlier we had captions starting at morphEnd, which left AG_REV's
    // caption only partially faded in when beat 3 ends at AG_REV's
    // morphEnd of 0.78.)
    const windows = outcomeMorphWindowsRef.current
    const TITLE_LEAD = 0.004
    const TITLE_FADE = 0.009
    // Wrap-flip opacity dip.
    //
    // The Step 7 single-line -> wrapped style flip is necessarily
    // instantaneous (line breaks are discrete, so wrap cannot tween),
    // which reads as a visible "pop" in the label's text layout. To
    // mask it we dip each title's opacity through 0 right at the flip
    // and raise it back, so the re-flow happens while the label is
    // invisible. A second dip (0.95) masks the switch to the heatmap
    // y-axis label layout. The flip at 0.76 is scheduled at the dip
    // floor so the re-flow runs while the label is invisible.
    //
    // The 0.76 flip is also aligned with the dip floor (`wantWrap`
    // threshold == dip peak) so the label's DOM state changes at the
    // exact moment its visible opacity is 0. Dip widths (~0.01 on
    // each side) trade off masking strength against total dim time;
    // 0.01 of progress ~= a few frames at typical scrub speed, enough
    // to hide the layout shift without leaving the label conspicuously
    // absent mid-slide.
    const WRAP_DIP_OUT_CENTER = 0.76
    const WRAP_DIP_OUT_HALF = 0.01
    /** Masks the discrete switch to heatmap y-axis label layout at v=0.95. */
    const HEATMAP_WRAP_DIP_CENTER = 0.95
    const HEATMAP_WRAP_DIP_HALF = 0.01
    let wrapDip = 1
    if (
      v >= WRAP_DIP_OUT_CENTER - WRAP_DIP_OUT_HALF &&
      v <= WRAP_DIP_OUT_CENTER + WRAP_DIP_OUT_HALF
    ) {
      wrapDip =
        v < WRAP_DIP_OUT_CENTER
          ? 1 -
            (v - (WRAP_DIP_OUT_CENTER - WRAP_DIP_OUT_HALF)) / WRAP_DIP_OUT_HALF
          : (v - WRAP_DIP_OUT_CENTER) / WRAP_DIP_OUT_HALF
    } else if (
      v >= HEATMAP_WRAP_DIP_CENTER - HEATMAP_WRAP_DIP_HALF &&
      v <= HEATMAP_WRAP_DIP_CENTER + HEATMAP_WRAP_DIP_HALF
    ) {
      wrapDip =
        v < HEATMAP_WRAP_DIP_CENTER
          ? 1 -
            (v - (HEATMAP_WRAP_DIP_CENTER - HEATMAP_WRAP_DIP_HALF)) /
              HEATMAP_WRAP_DIP_HALF
          : (v - HEATMAP_WRAP_DIP_CENTER) / HEATMAP_WRAP_DIP_HALF
    }
    /** Fades labels out in place on the radar ring [0.86,0.9], holds
     *  them invisible [0.9,0.95] while the morph runs, then fades them
     *  in at the heatmap y-axis [0.95,0.99] with no position tween. */
    const pathOpacity =
      v < 0.86
        ? 1
        : v < 0.9
          ? 1 - (v - 0.86) / 0.04
          : v < 0.95
            ? 0
            : Math.min(1, (v - 0.95) / 0.04)
    // CAPTION_LEAD == CAPTION_FADE means the fade window finishes
    // exactly at morphEnd, so the "x locations" text is fully opaque
    // the instant the squares lock in.
    const CAPTION_FADE = 0.006
    const CAPTION_LEAD = CAPTION_FADE
    // Late morph slices (when activeOutcomeGroups is short) can push the
    // caption's natural fadeEnd past the end of beat 4 (0.5), leaving
    // the caption partially opaque at rest. Cap fadeEnd so every
    // caption settles at opacity 1 before beat 4 ends.
    const CAPTION_FADE_END_CEILING = 0.495
    const layoutItems = beat2LayoutRef.current?.items
    if (layoutItems) {
      for (const item of layoutItems) {
        const win = windows?.[item.code]
        const titleEl = titleRefsMap.current.get(item.code)
        const captionEl = captionRefsMap.current.get(item.code)

        if (!win) {
          // No morph window yet (outcome's polygons haven't populated
          // `activeOutcomeGroups`, or it's not in ACTIVE_OUTCOMES).
          // Keep the title + caption fully hidden so stale slots don't
          // leak into earlier beats (e.g., "Winter-run salmon" showing
          // at the end of beat 3 before its real morph slice arrives).
          if (titleEl) titleEl.style.opacity = "0"
          if (captionEl) captionEl.style.opacity = "0"
          continue
        }

        const morphStart = win.start
        const morphEnd = win.end

        if (titleEl) {
          const titleFadeStart = morphStart - TITLE_LEAD
          // Multiply in the wrap-flip dip so the re-flow happens while
          // the label is invisible. `wrapDip` is 1 outside the dip
          // windows, so Beats 0-5 and the steady middle of Beat 6 are
          // unaffected.
          titleEl.style.opacity = String(
            clamp01((v - titleFadeStart) / TITLE_FADE) * wrapDip * pathOpacity,
          )
        }

        if (captionEl) {
          const rawFadeEnd = morphEnd + (CAPTION_FADE - CAPTION_LEAD)
          const captionFadeEnd = Math.min(rawFadeEnd, CAPTION_FADE_END_CEILING)
          const captionFadeStart = captionFadeEnd - CAPTION_FADE
          const captionFadeIn = clamp01((v - captionFadeStart) / CAPTION_FADE)
          // Captions describe the location set under each distribution
          // glyph ("12 river & tributary reaches", etc.). They stay
          // visible through Beats 4-5 (distribution + list view), then
          // fade out at the *start* of Beat 6 (radar) so the right-third
          // clears for the radar ring. 0.72 is Beat 6's progress start;
          // `B6_EXIT` is the shared snap-out pace (~0.45s). Monotonic on
          // `v`, so Back-from-radar re-runs the fade in reverse without
          // any extra bookkeeping.
          const captionFadeOut = clamp01((v - 0.72) / B6_EXIT)
          captionEl.style.opacity = String(captionFadeIn * (1 - captionFadeOut))
        }
      }
    }

    // Beats 6-8: Step 7 wraps + centers for the radar. Step 8 wraps +
    // right-aligns for the heatmap. The two are mutually exclusive.
    const wantHeatmapText = v >= 0.95
    const wantRadarAxisWrap = v >= 0.76 && v < 0.9 && !wantHeatmapText
    if (wantHeatmapText && !heatmapTextActiveRef.current) {
      heatmapTextActiveRef.current = true
      radarWrapActiveRef.current = false
      const maxWMap = heatmapLabelMaxWRef.current
      titleRefsMap.current.forEach((el, code) => {
        if (!el) return
        const textEl = el.firstElementChild as HTMLElement | null
        if (!textEl) return
        textEl.style.whiteSpace = ""
        textEl.style.textAlign = ""
        textEl.style.maxWidth = ""
        textEl.style.overflowWrap = ""
        textEl.style.color = ""
        el.style.justifyContent = ""
        el.style.overflow = ""
        const mw = maxWMap.get(code) ?? 120
        textEl.style.whiteSpace = "normal"
        textEl.style.textAlign = "right"
        textEl.style.maxWidth = `${mw}px`
        textEl.style.overflowWrap = "break-word"
        textEl.style.color = theme.palette.text.primary
        el.style.justifyContent = "flex-end"
        el.style.overflow = "visible"
      })
    } else if (!wantHeatmapText && heatmapTextActiveRef.current) {
      heatmapTextActiveRef.current = false
      titleRefsMap.current.forEach((el) => {
        if (!el) return
        const textEl = el.firstElementChild as HTMLElement | null
        if (!textEl) return
        textEl.style.whiteSpace = ""
        textEl.style.textAlign = ""
        textEl.style.maxWidth = ""
        textEl.style.overflowWrap = ""
        textEl.style.color = ""
        el.style.justifyContent = ""
        el.style.overflow = ""
      })
    }
    if (!wantHeatmapText && wantRadarAxisWrap !== radarWrapActiveRef.current) {
      radarWrapActiveRef.current = wantRadarAxisWrap
      const maxW = radarLabelMaxWidthRef.current
      titleRefsMap.current.forEach((el) => {
        if (!el) return
        const textEl = el.firstElementChild as HTMLElement | null
        if (!textEl) return
        if (wantRadarAxisWrap) {
          textEl.style.whiteSpace = "normal"
          textEl.style.textAlign = "center"
          textEl.style.maxWidth = `${maxW}px`
          textEl.style.overflowWrap = "break-word"
          textEl.style.color = theme.palette.text.primary
          el.style.justifyContent = "center"
          el.style.overflow = "visible"
        } else {
          textEl.style.whiteSpace = ""
          textEl.style.textAlign = ""
          textEl.style.maxWidth = ""
          textEl.style.overflowWrap = ""
          textEl.style.color = ""
          el.style.justifyContent = ""
          el.style.overflow = ""
        }
      })
    }
    // Position: home -> radar [0.75,0.82], hold on the ring until
    // 0.9+pathOpacity, then the heatmap axis at 0.95+ with no slide
    // between radar and heatmap.
    const radarDeltas = radarLabelDeltaRef.current
    const heatmapDeltas = heatmapLabelDeltaRef.current
    if (radarDeltas.size > 0 || heatmapDeltas.size > 0) {
      const radarIn = clamp01((v - 0.75) / 0.07)
      const radarPosBlend = v < 0.75 ? 0 : v < 0.82 ? radarIn : v < 0.9 ? 1 : 0
      const heatmapPosBlend = v < 0.95 ? 0 : 1
      titleRefsMap.current.forEach((el, code) => {
        if (!el) return
        const rd = radarDeltas.get(code)
        const hd = heatmapDeltas.get(code)
        const dx =
          (rd ? rd.dx * radarPosBlend : 0) + (hd ? hd.dx * heatmapPosBlend : 0)
        const dy =
          (rd ? rd.dy * radarPosBlend : 0) + (hd ? hd.dy * heatmapPosBlend : 0)
        if (dx !== 0 || dy !== 0) {
          el.style.transform = `translate(${dx}px, ${dy}px)`
        } else if (el.style.transform) {
          el.style.transform = ""
        }
      })
    }

    const eyebrows = eyebrowDataRef.current
    if (eyebrows) {
      for (let i = 0; i < eyebrows.length; i++) {
        const el = eyebrowRefs.current[i]
        if (!el) continue
        // 0.01 fade width matches the right-panel backdrop so both
        // land together just before beat 3 settles at 0.39.
        const fadeIn = clamp01((v - eyebrows[i]!.animationStart) / 0.01)
        // Hand off to the view-mode header at Beat 5 start: mirror the
        // "For each scenario..." paragraph exit (0.50 -> 0.51) so the
        // two column eyebrows vacate the slot just as the
        // "Distribution view" header fades in.
        const fadeOut = clamp01((v - 0.5) / B4_EXIT)
        el.style.opacity = String(fadeIn * (1 - fadeOut))
      }
    }

    // Tier legend staggers in row by row (Optimal -> Acceptable -> At risk
    // -> Critical) so the gap between "To compare results..." (0.10-0.12)
    // and the map's Beat 1B collapse (0.245) fills with a meaningful
    // level-by-level reveal instead of a single wide dead zone.
    // Per-row fade uses `ITEM_FADE_SEC` (~0.55s) - half the paragraph
    // pace - so the list reads staccato against the slower paragraph
    // reveals. The row-to-row cadence is `ITEM_STAGGER_SEC` (~1.3s).
    const TIER_LEGEND_FIRST_START = 0.13
    const TIER_LEGEND_ROW_STEP = B0_STEP
    const TIER_LEGEND_ROW_FADE = B0_ITEM
    const legendRows = tierLegendRowRefs.current
    for (let i = 0; i < legendRows.length; i++) {
      const el = legendRows[i]
      if (!el) continue
      const start = TIER_LEGEND_FIRST_START + i * TIER_LEGEND_ROW_STEP
      el.style.opacity = String(clamp01((v - start) / TIER_LEGEND_ROW_FADE))
    }

    // Beat 1C + follow-on narrative paragraphs.
    //
    // Each paragraph fades in as a complete block via opacity only.
    // The outer grid-row still collapses from `1fr` to `0fr` to keep
    // the slot out of the document flow before the paragraph is due
    // (so the bottom control row hugs the last visible text at rest),
    // but the row-size change is a near-instant threshold rather than
    // a synchronized ramp: the slot pops open a hair before the
    // opacity fade begins, then the text fades in as one whole
    // paragraph instead of vertically "unfolding" line by line.
    //
    // Each slot opens during a tween (`playState === "playing"`), when
    // the bottom controls are invisible anyway, so the layout push on
    // the control row isn't perceived.
    // Beat 1C paragraphs fade in during beat 2 (0.245 / 0.325) and
    // then fade out at the start of beat 3 (0.365 -> 0.3675), freeing
    // the left-panel slot below the tier legend for the Beat 3
    // narration. Their grid rows collapse once fully faded out so the
    // new paragraph slides cleanly into their former document-flow
    // slot.
    if (beat1cExampleRef.current) {
      const el = beat1cExampleRef.current
      const fadeIn = clamp01((v - 0.245) / B1_PARA)
      const fadeOut = clamp01((v - 0.365) / B2_EXIT)
      el.style.opacity = String(fadeIn * (1 - fadeOut))
      el.style.gridTemplateRows = v >= 0.2425 && v < 0.3675 ? "1fr" : "0fr"
    }

    if (beat1cDeliveryRef.current) {
      const el = beat1cDeliveryRef.current
      const fadeIn = clamp01((v - 0.325) / B1_PARA)
      const fadeOut = clamp01((v - 0.365) / B2_EXIT)
      el.style.opacity = String(fadeIn * (1 - fadeOut))
      el.style.gridTemplateRows = v >= 0.3225 && v < 0.3675 ? "1fr" : "0fr"
    }

    // Step 3 narration splits into two slots sharing the document-flow
    // slot freed by the Beat 1C paragraphs. The "before" paragraph
    // fades in (0.3675 -> 0.3725) before the AG_REV morph fires at
    // [0.38, 0.39], then fades out (0.39 -> 0.3925) once the morph
    // completes so the "after" paragraph can slide into the same slot
    // (fade in 0.3925 -> 0.3975) and land with Beat 3's settle at 0.40.
    if (beat3BeforeRef.current) {
      const el = beat3BeforeRef.current
      const fadeIn = clamp01((v - 0.3675) / B2_PARA)
      const fadeOut = clamp01((v - 0.39) / B2_EXIT)
      el.style.opacity = String(fadeIn * (1 - fadeOut))
      el.style.gridTemplateRows = v >= 0.3675 && v < 0.3925 ? "1fr" : "0fr"
    }

    if (beat3AfterRef.current) {
      const el = beat3AfterRef.current
      const fadeIn = clamp01((v - 0.3925) / B2_PARA)
      // beat3After's fade-out cross-fades with `allOtherOutcomesRef`'s
      // fade-in (both width 0.01 in Beat 3 time), so it intentionally
      // runs slower than BLOCK_EXIT to keep the two paragraphs visually
      // tethered across the swap. Left as a bespoke width for now.
      const fadeOut = clamp01((v - 0.4) / 0.01)
      el.style.opacity = String(fadeIn * (1 - fadeOut))
      el.style.gridTemplateRows = v >= 0.3925 && v < 0.41 ? "1fr" : "0fr"
    }

    // "For each scenario, outcome levels..." fades in during beat 4,
    // right after the Beat 3 "after" paragraph finishes fading out
    // (0.40 -> 0.41). The remaining 8 outcome morphs then play
    // alongside this sentence over [0.42, 0.50]. Once beat 4 settles
    // it fades out (0.50 -> 0.51, B4_EXIT) so the Beat 5 narration can
    // slide into the same document-flow slot.
    if (allOtherOutcomesRef.current) {
      const el = allOtherOutcomesRef.current
      const fadeIn = clamp01((v - 0.41) / B3_PARA)
      const fadeOut = clamp01((v - 0.5) / B4_EXIT)
      el.style.opacity = String(fadeIn * (1 - fadeOut))
      el.style.gridTemplateRows = v >= 0.41 && v < 0.51 ? "1fr" : "0fr"
    }

    // Beat 5 narration splits into two sentences so the five-step LOI
    // choreography (starting at 0.555 in TierAnimationSection) can lead
    // with the matching second sentence.
    //  S1 "Outcomes can be displayed... / distribution view..."
    //     fades in 0.51 -> 0.53 and holds through the beat.
    //  S2 "Locations of interest can be selected..." fades in
    //     0.545 -> 0.560 just before step 1 kicks in.
    // Both share the beat-exit window 0.62 -> 0.63 so the Beat 6
    // paragraph can slide into the same slot.
    if (beat5LoiS1Ref.current) {
      const el = beat5LoiS1Ref.current
      const fadeIn = clamp01((v - 0.51) / B4_PARA)
      const fadeOut = clamp01((v - 0.62) / B5_EXIT)
      el.style.opacity = String(fadeIn * (1 - fadeOut))
      el.style.gridTemplateRows = v >= 0.51 && v < 0.63 ? "1fr" : "0fr"
    }
    if (beat5LoiS2Ref.current) {
      const el = beat5LoiS2Ref.current
      const fadeIn = clamp01((v - 0.545) / B4_PARA)
      const fadeOut = clamp01((v - 0.62) / B5_EXIT)
      el.style.opacity = String(fadeIn * (1 - fadeOut))
      el.style.gridTemplateRows = v >= 0.545 && v < 0.63 ? "1fr" : "0fr"
    }

    // Beat 6 narration ("The list view summarizes key outcomes as bar
    // charts.") fades in 0.63 -> 0.65 into the freed document-flow
    // slot, landing just before the bar morph completes at 0.72. It
    // fades back out 0.72 -> 0.73 to make room for Beat 7.
    if (beat6ListRef.current) {
      const el = beat6ListRef.current
      const fadeIn = clamp01((v - 0.63) / B5_PARA)
      const fadeOut = clamp01((v - 0.72) / B6_EXIT)
      el.style.opacity = String(fadeIn * (1 - fadeOut))
      el.style.gridTemplateRows = v >= 0.63 && v < 0.73 ? "1fr" : "0fr"
    }

    // Beat 7 narration ("The radar chart displays the average values
    // of key outcomes...") fades in 0.73 -> 0.75 into the freed slot
    // while the bars collapse into dots (0.72 -> 0.75) and migrate to
    // their polar vertices (0.75 -> 0.82). It fades back out
    // 0.87 -> 0.88 to make room for Beat 8.
    if (beat7RadarRef.current) {
      const el = beat7RadarRef.current
      const fadeIn = clamp01((v - 0.73) / B6_PARA)
      const fadeOut = clamp01((v - 0.87) / B6_EXIT)
      el.style.opacity = String(fadeIn * (1 - fadeOut))
      el.style.gridTemplateRows = v >= 0.73 && v < 0.88 ? "1fr" : "0fr"
    }

    // Beat 8 narration ("The heat map displays how key outcomes change
    // under different hydroclimate futures.") fades in 0.88 -> 0.90
    // into the freed slot, while the radar chrome fades out and the
    // radar vertices morph into a column of tier-colored cells.
    if (beat8HeatmapRef.current) {
      const el = beat8HeatmapRef.current
      el.style.opacity = String(clamp01((v - 0.88) / B7_PARA))
      el.style.gridTemplateRows = v >= 0.88 ? "1fr" : "0fr"
    }

    // View-mode headers: a single centered label at the top of the
    // right panel, occupying the slot vacated by the two column
    // eyebrows ("Consumptive / Non-consumptive uses"). Each header
    // rides the same fade window as its matching narration paragraph
    // so label + paragraph arrive and depart together.
    if (distributionHeaderRef.current) {
      const el = distributionHeaderRef.current
      const fadeIn = clamp01((v - 0.51) / B4_PARA)
      const fadeOut = clamp01((v - 0.62) / B5_EXIT)
      el.style.opacity = String(fadeIn * (1 - fadeOut))
    }
    if (listHeaderRef.current) {
      const el = listHeaderRef.current
      const fadeIn = clamp01((v - 0.63) / B5_PARA)
      const fadeOut = clamp01((v - 0.72) / B6_EXIT)
      el.style.opacity = String(fadeIn * (1 - fadeOut))
    }
    if (radarHeaderRef.current) {
      const el = radarHeaderRef.current
      const fadeIn = clamp01((v - 0.73) / B6_PARA)
      const fadeOut = clamp01((v - 0.87) / B6_EXIT)
      el.style.opacity = String(fadeIn * (1 - fadeOut))
    }
    if (heatmapHeaderRef.current) {
      const el = heatmapHeaderRef.current
      el.style.opacity = String(clamp01((v - 0.88) / B7_PARA))
    }

    // NOTE: bottom control row opacity is driven by `playState`
    // (see the dedicated effect earlier in the file), not by
    // `progress`. The row is only visible at the reading pauses
    // between beats, so it doesn't need a progress-driven fade.
  }

  /* ── Bridge registration ──
   *
   * Writes a stable dispatcher into `narrationTickRef.current` so
   * the engine's `NarrationArbiter` invokes the latest narration
   * frame every tick. Runs once per mount (dep set is stable). The
   * dispatcher reads through `latestNarrationFrameRef` so closures
   * stay fresh without re-subscription. An eager call on mount
   * matches the legacy listener's immediate-sync behavior for
   * `beat1Ref` opacity. */
  useEffect(() => {
    const dispatch = (v: number) => latestNarrationFrameRef.current(v)
    narrationTickRef.current = dispatch
    dispatch(progress.get())
    return () => {
      if (narrationTickRef.current === dispatch) {
        narrationTickRef.current = null
      }
    }
  }, [narrationTickRef, progress])

  /* ── `backOutOpacity` driver ──
   *
   * `backOutOpacity` is a separate MotionValue, not `progress`, so
   * the engine's single-subscriber invariant does not apply. When it
   * changes we re-run the narration frame at the current progress so
   * `beat1Ref`'s fade-out multiplier follows the back-out animation. */
  useEffect(() => {
    if (!backOutOpacity) return
    return backOutOpacity.on("change", () => {
      latestNarrationFrameRef.current(progress.get())
    })
  }, [backOutOpacity, progress])

  /* ── Report glyph placeholder rects up to the parent ──
   *
   * `pos.x` must be the glyph's offset into the right-third column (the
   * SVG adds `panelWidth * 2/3` to it), so we measure `x` relative to
   * `rightColumnRootRef` whose left edge sits at `panelWidth * 2/3`.
   *
   * `pos.y` must be panel-top relative (the SVG is pinned with
   * `inset: 0` of the same panel). Since the right-column root is now
   * vertically offset (`top: padding`) so its top aligns with the
   * title bar on the left panel, we measure `y` against `panelRootRef`
   * (the outer `position: absolute; inset: 0` box) to keep the SVG
   * landing rects at the true placeholder positions.  */
  useLayoutEffect(() => {
    if (!onGlyphLayoutChange) return
    const root = rightColumnRootRef.current
    const panel = panelRootRef.current
    if (!root || !panel) return

    const measure = () => {
      const rootRect = root.getBoundingClientRect()
      const panelRect = panel.getBoundingClientRect()
      const layout: Record<string, GlyphRect> = {}
      placeholderRefsMap.current.forEach((el, code) => {
        if (!el) return
        const r = el.getBoundingClientRect()
        layout[code] = {
          x: r.left - rootRect.left,
          y: r.top - panelRect.top,
          width: r.width,
          height: r.height,
        }
      })
      onGlyphLayoutChange(layout)

      // Sync the white backdrop's height to the content column's
      // natural height. The backdrop sits at `zIndex: 3` (below the
      // SVG morph overlay at `zIndex: 4`) so the distribution squares
      // render on top of the backdrop, not under it. Because the two
      // siblings can't share a parent without a stacking conflict, we
      // mirror the height here instead of nesting them.
      const backdrop = beat2PanelRef.current
      if (backdrop) {
        backdrop.style.height = `${rootRect.height}px`
      }

      // Radar geometry is shared with `OutcomeMorphOverlay.radarGeometry`,
      // so each label block's center lands on the same `(cx + rMax*cosθ,
      // cy + rMax*sinθ)` axis tip the SVG spokes terminate at.
      const panelW = panelRect.width
      const panelH = panelRect.height
      const panelLeft = panelW * (2 / 3)
      const rightW = panelW - panelLeft
      const cx = panelLeft + rightW / 2
      // Keep in sync with `OutcomeMorphOverlay.radarGeometry`: the
      // radar center is pushed slightly above the panel midline so the
      // chart sits higher, leaving room for Beat 7's narration / Beat
      // 8 heatmap below. Label positions share this cy so HTML axis
      // labels ring the same center as the SVG vertices.
      const cy = panelH * 0.42 - STORYBOARD_VISUAL_LIFT_PX
      const rMax = Math.min(rightW / 2, panelH / 2) * 0.6
      // Push labels past the axis tip by a small pad so they sit in
      // the chart's margin instead of overlapping the outer ring /
      // polygon trace. Keep in sync with any visual crowding tweaks.
      const LABEL_PAD = 22
      const labelR = rMax + LABEL_PAD
      const activeItems =
        beat2LayoutRef.current?.items.filter(
          (it) => it.isActive && it.targetHeight > 0,
        ) ?? []
      const N = activeItems.length
      // Arc length between neighboring axes at the label-placement ring
      // bounds how wide a label can get before it bumps its neighbor.
      // 0.9 of that arc leaves a small breathing gap. Clamped so edge
      // cases (very few active outcomes, very small panels) still
      // produce a sane width.
      const arc = N > 0 ? (2 * Math.PI * labelR) / N : 120
      const maxLabelW = Math.max(72, Math.min(160, arc * 0.9))
      radarLabelMaxWidthRef.current = maxLabelW

      // Radar-mode wrap geometry.
      //
      // Steps 1-6 render each title single-line (`noWrap`, left-aligned,
      // clipped by the outer block's `overflow: hidden`). Step 7 wraps
      // them at `maxLabelW` and centers every line. Because the two
      // modes have different block rectangles (wrap grows the block
      // vertically, centering shifts the text horizontally), the radar
      // slide needs the *wrapped* center to land at the axis point.
      //
      // We measure wrapped dimensions here via a synchronous
      // apply-measure-revert across every title at once. Applying all
      // titles simultaneously matches the runtime state (every column
      // reflows together as wrap kicks in), so wrapped `top` / `center`
      // positions reflect the layout the slide will actually start
      // from. Reverting before returning keeps at-rest Steps 1-6
      // un-wrapped. Because the whole pass lives inside
      // `useLayoutEffect`, the browser never paints the transient
      // wrapped layout.
      const wrapStateByCode = new Map<
        string,
        {
          textEl: HTMLElement
          prevWhiteSpace: string
          prevTextAlign: string
          prevMaxWidth: string
          prevOverflowWrap: string
          boxEl: HTMLDivElement
          prevBoxJustify: string
          prevBoxOverflow: string
          prevBoxTransform: string
        }
      >()
      titleRefsMap.current.forEach((el, code) => {
        if (!el) return
        const textEl = el.firstElementChild as HTMLElement | null
        if (!textEl) return
        wrapStateByCode.set(code, {
          textEl,
          prevWhiteSpace: textEl.style.whiteSpace,
          prevTextAlign: textEl.style.textAlign,
          prevMaxWidth: textEl.style.maxWidth,
          prevOverflowWrap: textEl.style.overflowWrap,
          boxEl: el,
          prevBoxJustify: el.style.justifyContent,
          prevBoxOverflow: el.style.overflow,
          prevBoxTransform: el.style.transform,
        })
      })
      // Apply wrap styles to every title simultaneously. Also clear
      // any runtime translate so the measured rect reflects the
      // element's at-rest position, not a mid-slide one. Without this,
      // a ResizeObserver fire in the middle of Beat 6/7 (when
      // `blend > 0`) would sample the already-translated rect and
      // feed back into a compounding delta.
      wrapStateByCode.forEach(({ textEl, boxEl }) => {
        textEl.style.whiteSpace = "normal"
        textEl.style.textAlign = "center"
        textEl.style.maxWidth = `${maxLabelW}px`
        textEl.style.overflowWrap = "break-word"
        boxEl.style.justifyContent = "center"
        boxEl.style.overflow = "visible"
        boxEl.style.transform = ""
      })
      // Measure wrapped centers (panel-relative).
      const wrapGeom = wrappedTitleGeomRef.current
      wrapGeom.clear()
      wrapStateByCode.forEach(({ textEl }, code) => {
        const rText = textEl.getBoundingClientRect()
        wrapGeom.set(code, {
          textCenterX: (rText.left + rText.right) / 2 - panelRect.left,
          textCenterY: (rText.top + rText.bottom) / 2 - panelRect.top,
        })
      })
      // Revert wrap styles (but leave transforms cleared) so we can
      // measure each title's at-rest (unwrapped, Beat 2 home) rect.
      // Those rests feed the Beat 8 heatmap-label migration below: the
      // label's right edge has to land at the cell's left edge minus
      // a small gutter, and that target is easier to express against
      // the unwrapped text's right-edge x than against the wrapped
      // center.
      wrapStateByCode.forEach(
        ({
          textEl,
          prevWhiteSpace,
          prevTextAlign,
          prevMaxWidth,
          prevOverflowWrap,
          boxEl,
          prevBoxJustify,
          prevBoxOverflow,
        }) => {
          textEl.style.whiteSpace = prevWhiteSpace
          textEl.style.textAlign = prevTextAlign
          textEl.style.maxWidth = prevMaxWidth
          textEl.style.overflowWrap = prevOverflowWrap
          boxEl.style.justifyContent = prevBoxJustify
          boxEl.style.overflow = prevBoxOverflow
        },
      )
      const atRestGeom = new Map<
        string,
        { textCenterY: number; textRightX: number }
      >()
      wrapStateByCode.forEach(({ textEl }, code) => {
        const r = textEl.getBoundingClientRect()
        atRestGeom.set(code, {
          textCenterY: (r.top + r.bottom) / 2 - panelRect.top,
          textRightX: r.right - panelRect.left,
        })
      })
      // Now restore transforms so the next frame's tick handler can
      // keep animating from the position it was already at.
      wrapStateByCode.forEach(({ boxEl, prevBoxTransform }) => {
        boxEl.style.transform = prevBoxTransform
      })

      // Radar axis label positions: each label's center sits on the
      // `labelR` ring (`rMax + LABEL_PAD`), just outside the axis tip,
      // so labels don't crowd the outer polygon / tick ring.
      //
      // Angle indexing MUST match `OutcomeMorphOverlay.radarGeometry`,
      // which iterates `outcomes` (= `activeOutcomeGroups`) in
      // OUTCOME_CODE_ORDER. `beat2Layout.items` (and therefore
      // `activeItems`) re-orders the left column first (AG_REV,
      // CWS_DEL), so iterating `activeItems` here would silently put
      // each label on the wrong axis. We rebuild a radar-order list
      // (active codes filtered from OUTCOME_CODE_ORDER) so every code
      // gets the same i, and therefore the same angle, as its axis.
      const radarOrderCodes = OUTCOME_CODE_ORDER.filter((code) =>
        activeItems.some((it) => it.code === code),
      )
      const Nr = radarOrderCodes.length
      const delta = radarLabelDeltaRef.current
      delta.clear()
      if (Nr > 0) {
        for (let i = 0; i < Nr; i++) {
          const code = radarOrderCodes[i]!
          const wrapped = wrapGeom.get(code)
          if (!wrapped) continue
          const angle = (2 * Math.PI * i) / Nr - Math.PI / 2
          const lx = cx + labelR * Math.cos(angle)
          const ly = cy + labelR * Math.sin(angle)
          delta.set(code, {
            dx: lx - wrapped.textCenterX,
            dy: ly - wrapped.textCenterY,
          })
        }
      }

      // Heatmap y-axis label positions (Beat 8). Mirrors
      // `OutcomeMorphOverlay.heatmapGeometry`: a grid of
      // `1 + extraHydroclimateCount` hydroclimate columns centered
      // horizontally in the right third of the panel. Labels anchor to
      // the leftmost (primary) column, right-aligned to that column's
      // left edge minus `HEAT_LABEL_GAP`, vertically centered on each
      // row. Geometry constants MUST stay in sync with
      // `OutcomeMorphOverlay.heatmapGeometry` or labels will drift
      // when the extra columns fade in.
      // Geometry constants MUST stay in sync with
      // `OutcomeMorphOverlay.heatmapGeometry`. See that block for a
      // layout diagram. In short: the right third is
      //   [sidePad] [labelColW] [labelGap] [heatmap columns] [sidePad]
      // so label text wraps within a fixed `HEAT_LABEL_COL_W` and
      // heatmap cells left-align immediately to its right. Only the
      // leftmost column's left edge is needed for label right-alignment
      // here. Cell widths / inter-column gaps / extra-column positions
      // are irrelevant to labels and therefore omitted.
      const HEAT_SIDE_PAD = 24
      const HEAT_LABEL_COL_W = 110
      const HEAT_LABEL_GAP = 12
      // See `OutcomeMorphOverlay.heatmapGeometry`, same shift applied
      // here so labels translate with the heatmap block as one unit.
      const HEAT_BLOCK_SHIFT_X = -10

      const heatRightColLeft = panelLeft + HEAT_SIDE_PAD + HEAT_BLOCK_SHIFT_X
      const heatmapLeftX = heatRightColLeft + HEAT_LABEL_COL_W + HEAT_LABEL_GAP
      const heatAvailableH = panelH * 0.8
      const heatCellH = Math.min(44, heatAvailableH / Math.max(Nr, 1))
      const heatTotalH = Nr * heatCellH
      const heatColumnTop =
        panelH / 2 - heatTotalH / 2 - STORYBOARD_VISUAL_LIFT_PX
      // Fixed `targetRightX` for every label: labels are right-aligned
      // to the same x, so the right edges of every wrapped block line
      // up as a column just to the left of the primary heatmap
      // column's left edge.
      const targetRightX = heatmapLeftX - HEAT_LABEL_GAP
      const heatmap = heatmapLabelDeltaRef.current
      const heatmapMaxW = heatmapLabelMaxWRef.current
      heatmap.clear()
      heatmapMaxW.clear()
      if (Nr > 0) {
        wrapStateByCode.forEach(({ boxEl }) => {
          boxEl.style.transform = ""
        })
        for (let i = 0; i < Nr; i++) {
          const code = radarOrderCodes[i]!
          const targetCenterY = heatColumnTop + (i + 0.5) * heatCellH
          const state = wrapStateByCode.get(code)
          if (!state) continue
          const { textEl, boxEl } = state
          // Heatmap y-axis: right-aligned, wrapped, measured in the
          // final DOM state. `dx` / `dy` position the *wrapped* text
          // block so its right edge and vertical center land on
          // `targetRightX` and `targetCenterY` (labels fade in place
          // here, no slide from the radar).
          const prevJ = boxEl.style.justifyContent
          const prevWhite = textEl.style.whiteSpace
          const prevAlign = textEl.style.textAlign
          const prevMax = textEl.style.maxWidth
          const prevOW = textEl.style.overflowWrap
          const prevColor = textEl.style.color
          // Uniform max-width for every heatmap y-axis label: the
          // reserved label column on the left. Unlike the earlier
          // per-label `targetRightX - boxLeft` calc, this does not
          // depend on which two-column flex cell the label's origin
          // Box sits in, so labels wrap consistently regardless of
          // origin column.
          const maxW = HEAT_LABEL_COL_W
          heatmapMaxW.set(code, maxW)
          boxEl.style.justifyContent = "flex-end"
          textEl.style.whiteSpace = "normal"
          textEl.style.textAlign = "right"
          textEl.style.maxWidth = `${maxW}px`
          textEl.style.overflowWrap = "break-word"
          textEl.style.color = theme.palette.text.primary
          const rH = textEl.getBoundingClientRect()
          const cye = (rH.top + rH.bottom) / 2 - panelRect.top
          heatmap.set(code, {
            dx: targetRightX - (rH.right - panelRect.left),
            dy: targetCenterY - cye,
          })
          boxEl.style.justifyContent = prevJ
          textEl.style.whiteSpace = prevWhite
          textEl.style.textAlign = prevAlign
          textEl.style.maxWidth = prevMax
          textEl.style.overflowWrap = prevOW
          textEl.style.color = prevColor
        }
        wrapStateByCode.forEach(({ boxEl, prevBoxTransform }) => {
          boxEl.style.transform = prevBoxTransform
        })
      }
    }

    const ro = new ResizeObserver(() => {
      measure()
    })
    ro.observe(root)
    ro.observe(panel)
    placeholderRefsMap.current.forEach((el) => {
      if (el) ro.observe(el)
    })
    titleRefsMap.current.forEach((el) => {
      if (el) ro.observe(el)
    })
    measure()

    return () => ro.disconnect()
  }, [onGlyphLayoutChange, beat2Layout, heatmapExtraColumnCount, theme])

  const padding = theme.space.panel.padding
  const textColor = theme.palette.undertone.warm
  const shadow = theme.textShadow.displayBody

  const _beat1PanelWidth = {
    xs: "100%",
    sm: "340px",
    md: "380px",
    lg: "420px",
    xl: "460px",
  }

  return (
    <Box
      ref={panelRootRef}
      sx={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
      }}
    >
      {/* Left column - heading + body, matching ContentPanel layout */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          right: "33.33%",
          zIndex: 5,
          display: "flex",
          flexDirection: "column",
          pt: padding,
          px: padding,
          pb: padding,
        }}
      >
        {/* Heading + playback controls (same as ContentPanel heading) */}
        <motion.div
          style={{
            opacity: headingOpacity,
            display: "flex",
            alignItems: "center",
            gap: "12px",
            pointerEvents: "none",
            flexShrink: 0,
          }}
        >
          <Typography
            variant="h4"
            component="h4"
            fontWeight={300}
            color="text.secondary"
          >
            Visualizing key outcomes
          </Typography>
          {!hideControls && !hasPlayed && (
            /* ── Pre-play gate: inline Play button beside the title ──
             *
             * The rest of the storyboard chrome (Back / N-of-T / Next)
             * lives in a bottom control row inside `beat1Ref` once the
             * user has clicked Play. See below. In pre-play we show only
             * the Play button here so the title + subtitle read as an
             * invitation rather than an in-progress UI. */
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                pointerEvents: "auto",
              }}
            >
              <IconButton
                onClick={onPlay}
                size="small"
                aria-label="Play (→)"
                sx={{
                  width: 44,
                  height: 44,
                  backgroundColor: alpha(theme.palette.common.white, 0.2),
                  backdropFilter: "blur(8px)",
                  color: "text.secondary",
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.common.white, 0.35),
                  },
                }}
              >
                <PlayArrowIcon sx={{ fontSize: 24 }} />
              </IconButton>
            </Box>
          )}
        </motion.div>

        <motion.div style={{ opacity: headingOpacity, flexShrink: 0 }}>
          <Box
            ref={subtitleCollapseRef}
            sx={{ display: "grid", gridTemplateRows: "1fr" }}
          >
            <Box sx={{ overflow: "hidden" }}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ maxWidth: "66%", opacity: 0.85 }}
              >
                How are scenario results measured?
              </Typography>
            </Box>
          </Box>
        </motion.div>

        {/* Body content - same flow as ContentPanel children.
         *
         * `mt: theme.space.section.sm` (24 px) matches the project's
         * heading-to-content precedent (see e.g. `apps/main/app/data/page.tsx`).
         * It acts as the gap below the subtitle pre-collapse, and becomes
         * the gap directly below the page title post-collapse once the
         * subtitle + intro paragraphs both animate to height 0 via
         * `grid-template-rows: 1fr -> 0fr`. */}
        <Box
          ref={beat1Ref}
          sx={{
            mt: theme.space.section.sm,
            opacity: 0,
            width: "100%",
            maxWidth: theme.space.paragraphMaxWidth.compact,
            ...(hideControls && {
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              pointerEvents: "auto",
              pr: 1,
            }),
            "& .MuiTypography-root": {
              color: textColor,
              textShadow: shadow,
            },
          }}
        >
          {/* Intro paragraphs collapse + fade out after the tier legend's
           *  last row ("Critical") lands, freeing vertical space so the
           *  legend slides up to the top of the body. `pb: 2.5` absorbs
           *  the gap that used to live on `tierLegendRef` as `mt: 2.5`, so
           *  the whole spacing collapses together. */}
          <Box
            ref={introCollapseRef}
            sx={{ display: "grid", gridTemplateRows: "1fr" }}
          >
            <Box sx={{ overflow: "hidden", pb: 2.5 }}>
              <Typography variant="body2" component="p">
                Different scenarios change how water is allocated among
                different users and the environment.
              </Typography>
              <Box ref={beat2IntroRef} sx={{ mt: 2, opacity: 0 }}>
                <Typography variant="body2" component="p">
                  To compare results on a common scale, we group key outcomes
                  into levels:
                </Typography>
              </Box>
            </Box>
          </Box>
          <Box
            ref={tierLegendRef}
            sx={{
              display: "grid",
              gridTemplateColumns: "auto auto 1fr",
              columnGap: 1.5,
              rowGap: 1,
              alignItems: "center",
              "& .MuiTypography-root": {
                fontSize: theme.typography.body2.fontSize,
                lineHeight: 1.25,
              },
            }}
          >
            {(
              [
                {
                  color: theme.palette.tiers.tier1,
                  label: "Optimal",
                  description:
                    "Water supplies support strong, desired system performance.",
                },
                {
                  color: theme.palette.tiers.tier2,
                  label: "Acceptable",
                  description:
                    "Water supply shortages occur, but impacts remain manageable.",
                },
                {
                  color: theme.palette.tiers.tier3,
                  label: "At risk",
                  description:
                    "Water supply shortages lead to significant impacts.",
                },
                {
                  color: theme.palette.tiers.tier4,
                  label: "Critical",
                  description:
                    "Severe water supply shortages threaten long-term viability.",
                },
              ] as const
            ).map(({ color, label, description }, rowIdx) => (
              /* Each row is its own subgrid row so column widths stay
               * aligned (swatch | label badge | description) while we drive
               * a per-row opacity for the staggered fade-in. */
              <Box
                key={label}
                ref={(el: HTMLDivElement | null) => {
                  tierLegendRowRefs.current[rowIdx] = el
                }}
                sx={{
                  display: "grid",
                  gridColumn: "1 / -1",
                  gridTemplateColumns: "subgrid",
                  alignItems: "center",
                  columnGap: 1.5,
                  opacity: 0,
                }}
              >
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: 0.5,
                    backgroundColor: color,
                    flexShrink: 0,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                  }}
                />
                <Box
                  sx={{
                    px: 1.25,
                    py: 0.5,
                    borderRadius: theme.borderRadius.md,
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifySelf: "start",
                  }}
                >
                  <Typography
                    variant="body2"
                    component="span"
                    sx={{
                      fontWeight: 500,
                      textShadow: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {label}
                  </Typography>
                </Box>
                <Typography variant="body2" component="span">
                  {description}
                </Typography>
              </Box>
            ))}
          </Box>
          {/* Beat 1C + Beat 3 narrative lives in the left panel, directly
           *  below the tier legend, so the overlay panel can be dedicated
           *  to graphics. These blocks inherit `beat1Ref`'s `textColor` /
           *  `textShadow` automatically. Sizing comes from MUI's native
           *  `body2` variant, so this panel stays in lockstep with the
           *  other Get Started panels.
           *
           *  Each block is a single-row CSS grid whose `grid-template-rows`
           *  is driven from `0fr` (collapsed) to `1fr` (natural min-content)
           *  by the progress handler. Swaps share the same document-flow
           *  slot below the tier legend:
           *    - Beat 1C "example" / "delivery" fade in at 0.245 / 0.325,
           *      fade out together 0.365 -> 0.3675 at the start of beat 3.
           *    - Beat 3 "before" fades in 0.3675 -> 0.3725 in the freed
           *      slot, then fades out 0.39 -> 0.3925 once AG_REV ends.
           *    - Beat 3 "after" fades in 0.3925 -> 0.3975, lands as beat 3
           *      settles at 0.40, then fades out 0.40 -> 0.41 at the start
           *      of beat 4.
           *    - "For each scenario..." fades in 0.41 -> 0.42 before the
           *      remaining 8 outcome morphs play over [0.42, 0.50].
           *  The browser computes each block's min-content height from
           *  document flow - no measurement - so the bottom control row
           *  below naturally hugs the last text block that's actually
           *  visible. The top gap lives as `pt:` on the inner wrapper
           *  (which also carries `overflow: hidden`) so it collapses with
           *  the content when the row is `0fr`. */}
          <Box
            ref={beat1cExampleRef}
            sx={{
              display: "grid",
              gridTemplateRows: "0fr",
              opacity: 0,
            }}
          >
            <Box sx={{ overflow: "hidden", pt: 2.5 }}>
              <Typography variant="body2" component="p">
                For example, each colored location on the map represents an
                agricultural water district in the Central Valley receiving
                surface water deliveries.
              </Typography>
            </Box>
          </Box>
          <Box
            ref={beat1cDeliveryRef}
            sx={{
              display: "grid",
              gridTemplateRows: "0fr",
              opacity: 0,
            }}
          >
            <Box sx={{ overflow: "hidden", pt: 2 }}>
              <Typography variant="body2" component="p">
                The colors correspond to different water delivery outcome levels
                that affect{" "}
                <Box component="strong" sx={{ fontWeight: 600 }}>
                  agricultural revenue
                </Box>
                , ranging from optimal levels (blue) to critical levels (red).
              </Typography>
            </Box>
          </Box>
          <Box
            ref={beat3BeforeRef}
            sx={{
              display: "grid",
              gridTemplateRows: "0fr",
              opacity: 0,
            }}
          >
            <Box sx={{ overflow: "hidden", pt: 2 }}>
              <Typography variant="body2" component="p">
                These are the outcomes for the {displayScenarioLabel}.
              </Typography>
              <Typography variant="body2" component="p" sx={{ mt: 1.5 }}>
                Each location can be symbolized as a square colored with the
                outcome level.
              </Typography>
              <Typography variant="body2" component="p" sx={{ mt: 1 }}>
                These can be gathered together in a distribution view.
              </Typography>
            </Box>
          </Box>
          <Box
            ref={beat3AfterRef}
            sx={{
              display: "grid",
              gridTemplateRows: "0fr",
              opacity: 0,
            }}
          >
            <Box sx={{ overflow: "hidden", pt: 2 }}>
              <Typography variant="body2" component="p">
                The distribution shows how agricultural revenue plays out in
                this scenario across the Central Valley agricultural districts
                in CalSim at a glance.
              </Typography>
            </Box>
          </Box>
          <Box
            ref={allOtherOutcomesRef}
            sx={{
              display: "grid",
              gridTemplateRows: "0fr",
              opacity: 0,
            }}
          >
            <Box sx={{ overflow: "hidden", pt: 2 }}>
              <Typography variant="body2" component="p">
                For each scenario, outcome levels are calculated for all key
                outcomes across locations.
              </Typography>
            </Box>
          </Box>
          <Box
            ref={beat5LoiS1Ref}
            sx={{
              display: "grid",
              gridTemplateRows: "0fr",
              opacity: 0,
            }}
          >
            <Box sx={{ overflow: "hidden", pt: 2 }}>
              <Typography variant="body2" component="p">
                Outcomes can be displayed in different ways. The{" "}
                <strong>distribution view</strong> displays outcomes at
                individual locations of interest.
              </Typography>
            </Box>
          </Box>
          <Box
            ref={beat5LoiS2Ref}
            sx={{
              display: "grid",
              gridTemplateRows: "0fr",
              opacity: 0,
            }}
          >
            <Box sx={{ overflow: "hidden", pt: 1 }}>
              <Typography variant="body2" component="p">
                Locations of interest can be selected on the map or from the
                chart.
              </Typography>
            </Box>
          </Box>
          <Box
            ref={beat6ListRef}
            sx={{
              display: "grid",
              gridTemplateRows: "0fr",
              opacity: 0,
            }}
          >
            <Box sx={{ overflow: "hidden", pt: 2 }}>
              <Typography variant="body2" component="p">
                The <strong>list view</strong> summarizes key outcomes as bar
                charts.
              </Typography>
            </Box>
          </Box>
          <Box
            ref={beat7RadarRef}
            sx={{
              display: "grid",
              gridTemplateRows: "0fr",
              opacity: 0,
            }}
          >
            <Box sx={{ overflow: "hidden", pt: 2 }}>
              <Typography variant="body2" component="p">
                The <strong>radar chart</strong> displays the average values of
                key outcomes on a circular plot and is useful for scenario
                comparison.
              </Typography>
            </Box>
          </Box>
          <Box
            ref={beat8HeatmapRef}
            sx={{
              display: "grid",
              gridTemplateRows: "0fr",
              opacity: 0,
            }}
          >
            <Box sx={{ overflow: "hidden", pt: 2 }}>
              <Typography variant="body2" component="p">
                The <strong>heat map</strong> displays how key outcomes change
                under different hydroclimate futures.
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Bottom control row: Back / N-of-T / Next, plus Restart once
         *  the user has moved past the first beat. Rendered only after
         *  the user has clicked Play (`hasPlayed`) and not at all in
         *  reduced-motion mode (`hideControls`). Pulled out of the
         *  `beat1Ref` document flow and pinned at a fixed 600px from
         *  the panel top, horizontally centered in the left third of
         *  the viewport (panel inset is the full viewport, so the
         *  left third spans `0 -> 33.33vw`). Using `translateX(-50%)`
         *  on `left: 16.67vw` keeps the row's center on the third's
         *  midline. Stays fully visible for the entire run of the
         *  storyboard. Buttons are disabled while a tween is in flight
         *  (`playState === "playing"`) so the user cannot click
         *  mid-beat. */}
        {!hideControls && hasPlayed && (
          <motion.div
            style={{
              position: "absolute",
              top: 600,
              left: "16.6667vw",
              transform: "translateX(-50%)",
              display: "flex",
              gap: theme.spacing(0.75),
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "auto",
              opacity: 1,
            }}
          >
            {(() => {
              const isPlaying = playState === "playing"
              const atStart = beatIndex <= 0
              const atEnd = beatIndex >= totalBeats - 1
              const pillBg = alpha(theme.palette.common.white, 0.2)
              const pillHoverBg = alpha(theme.palette.common.white, 0.35)
              const pillDisabledBg = alpha(theme.palette.common.white, 0.08)
              const controlSx = {
                width: 44,
                height: 44,
                backgroundColor: pillBg,
                backdropFilter: "blur(8px)",
                color: "text.secondary",
                "&:hover": { backgroundColor: pillHoverBg },
                "&.Mui-disabled": {
                  backgroundColor: pillDisabledBg,
                  color: alpha(theme.palette.text.secondary, 0.35),
                },
              } as const
              return (
                <>
                  <IconButton
                    onClick={onBack}
                    size="small"
                    aria-label={
                      atStart ? "Back to intro (←)" : "Previous beat (←)"
                    }
                    disabled={isPlaying}
                    sx={controlSx}
                  >
                    <ChevronLeftIcon sx={{ fontSize: 24 }} />
                  </IconButton>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      minWidth: 32,
                      textAlign: "center",
                      fontVariantNumeric: "tabular-nums",
                      opacity: 0.7,
                      userSelect: "none",
                    }}
                  >
                    {beatIndex + 1} / {totalBeats}
                  </Typography>
                  <IconButton
                    onClick={onNext}
                    size="small"
                    aria-label="Next beat (→)"
                    disabled={atEnd || isPlaying}
                    sx={controlSx}
                  >
                    <ChevronRightIcon sx={{ fontSize: 24 }} />
                  </IconButton>
                  {!atStart && (
                    <IconButton
                      onClick={onRestart}
                      size="small"
                      aria-label="Restart storyboard (Home)"
                      disabled={isPlaying}
                      sx={{
                        ...controlSx,
                        width: 36,
                        height: 36,
                        ml: 1,
                        backgroundColor: alpha(
                          theme.palette.common.white,
                          0.15,
                        ),
                      }}
                    >
                      <ReplayIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  )}
                </>
              )
            })()}
          </motion.div>
        )}
      </Box>

      {/* Beat 2 - white backdrop on the right third.
       *
       * Top-aligned with the left panel's title bar (`top: padding`) so
       * tall content isn't visually cut off above the title line. Its
       * height is synced to `rightColumnRootRef`'s natural height via
       * a ResizeObserver below, so the backdrop tracks content size
       * without any extra empty space below the last row.
       *
       * Lives as a sibling at `zIndex: 3` (below the SVG morph overlay
       * at `zIndex: 4`) so the distribution squares render on top of
       * the white backdrop, not under it - otherwise the semi-opaque
       * white would wash out the polygon colors during their morph. */}
      <Box
        ref={beat2PanelRef}
        sx={{
          position: "absolute",
          top: `calc(${padding} - ${OVERLAY_TOP_LIFT_PX}px)`,
          right: 0,
          width: "33.33%",
          height: 0,
          zIndex: 3,
          backgroundColor: alpha(theme.palette.common.white, 0.75),
          borderRadius: 2,
          opacity: 0,
          pointerEvents: "none",
        }}
      />

      {/* Beat 2 - right-third content column.
       *
       * Top-aligned with the left panel's title bar (`top: padding`) so
       * the top eyebrows and outcome titles aren't clipped above the
       * panel's edge. Left edge aligns with `panelWidth * 2/3` -
       * the same origin the SVG overlay uses for `pos.x`. Bottom is
       * left unset so the column auto-sizes to its content (the two
       * column outcome grid has explicit row heights). A small bottom
       * padding gives the backdrop breathing room below the last row. */}
      <Box
        ref={rightColumnRootRef}
        sx={{
          position: "absolute",
          top: `calc(${padding} - ${OVERLAY_TOP_LIFT_PX}px)`,
          right: 0,
          width: "33.33%",
          zIndex: 5,
          display: "flex",
          flexDirection: "column",
          pt: 2.5,
          pb: 2,
          "& .MuiTypography-root": {
            color: theme.palette.text.primary,
          },
        }}
      >
        <Box
          ref={scenarioOverlayHeaderRef}
          sx={{
            px: 3,
            pb: 0.75,
            flexShrink: 0,
            minHeight: 20,
            pointerEvents: "none",
            opacity: 0,
          }}
        >
          <Typography
            variant="overline"
            component="h3"
            color="text.secondary"
            sx={{ letterSpacing: "0.08em", lineHeight: 1.3 }}
          >
            {displayScenarioLabel}
          </Typography>
        </Box>
        {/* Beat 1C narrative lives in the left panel below the tier
         *  legend. See `beat1Ref` above. The overlay panel is dedicated to
         *  graphics (outcome titles, glyph morphs, location captions). */}

        {/* Two-column flow layout for outcome rows. Each row is a vertical
         *  stack: Title -> GlyphPlaceholder -> Caption. Row/column spacing is
         *  handled entirely by flex + rowGap. No cursor math. */}
        {beat2Layout && (
          <Box sx={{ position: "relative" }}>
            {/* View-mode header for Beats 5-8. Absolutely positioned
             *  over the eyebrow row at the top of the two-column flex,
             *  so it occupies the slot vacated by "Consumptive uses /
             *  Non-consumptive uses" without affecting glyph layout.
             *  Four labels stack in the same slot. Each is driven by
             *  its own progress-keyed opacity ref in the main progress
             *  handler, so at most one is visible at a time. */}
            <Box
              aria-hidden
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                pt: 1.5,
                px: 3,
                pointerEvents: "none",
                textAlign: "center",
              }}
            >
              {(
                [
                  {
                    ref: distributionHeaderRef,
                    label: "Distribution view",
                    align: "left" as const,
                  },
                  {
                    ref: listHeaderRef,
                    label: "List view",
                    align: "left" as const,
                  },
                  {
                    ref: radarHeaderRef,
                    label: "Radar chart",
                    align: "left" as const,
                  },
                  {
                    ref: heatmapHeaderRef,
                    label: "Heat map",
                    align: "left" as const,
                  },
                ] as const
              ).map(({ ref, label, align }) => (
                <Box
                  key={label}
                  ref={ref}
                  sx={{
                    position: "absolute",
                    top: (t) => t.spacing(1.5),
                    left: 0,
                    right: 0,
                    px: 3,
                    opacity: 0,
                    textAlign: align,
                  }}
                >
                  <Typography variant="overline" component="p">
                    {label}
                  </Typography>
                </Box>
              ))}
            </Box>
            <Box
              sx={{
                display: "flex",
                gap: "12px",
                px: 3,
                pt: 1.5,
              }}
            >
              {[0, 1].map((col) => (
                <Box
                  key={col}
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    rowGap: 1.5,
                  }}
                >
                  {beat2Layout.eyebrows[col] && (
                    <Box
                      ref={(el: HTMLDivElement | null) => {
                        eyebrowRefs.current[col] = el
                      }}
                      sx={{ opacity: 0 }}
                    >
                      <Typography variant="smallSectionLabel" component="p">
                        {beat2Layout.eyebrows[col]!.label}
                      </Typography>
                    </Box>
                  )}
                  {beat2Layout.items
                    .filter((item) => item.column === col)
                    .map((item) => {
                      const isSelected = selectedOutcomeCode === item.code
                      const hasGlyph = item.isActive && item.targetHeight > 0
                      return (
                        <Box
                          key={item.code}
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          <Box
                            ref={(el: HTMLDivElement | null) => {
                              titleRefsMap.current.set(item.code, el)
                            }}
                            onClick={
                              interactive
                                ? () => onOutcomeClick?.(item.code, true)
                                : undefined
                            }
                            sx={{
                              opacity: 0,
                              pointerEvents: interactive ? "auto" : "none",
                              cursor: interactive ? "pointer" : "default",
                              borderRadius: 1,
                              px: 0.5,
                              mx: -0.5,
                              display: "flex",
                              alignItems: "center",
                              boxSizing: "border-box",
                              overflow: "hidden",
                              transition: "color 0.15s",
                              ...(interactive && {
                                "&:hover .MuiTypography-root": {
                                  color: theme.palette.blue.bright,
                                },
                              }),
                            }}
                          >
                            <Typography
                              variant="axisLabel"
                              noWrap
                              sx={{
                                fontWeight: isSelected ? 700 : 500,
                                transition: "color 0.15s",
                                color: theme.palette.grey[900],
                                lineHeight: 1.2,
                              }}
                            >
                              {item.label}
                            </Typography>
                          </Box>
                          {hasGlyph && (
                            <>
                              {/* Transparent placeholder reserving space for
                               *  the SVG morph landing rect. The parent
                               *  ResizeObserver reads its bounding rect and
                               *  forwards panel-relative coords to the SVG. */}
                              <Box
                                ref={(el: HTMLDivElement | null) => {
                                  placeholderRefsMap.current.set(item.code, el)
                                }}
                                data-outcome-code={item.code}
                                sx={{
                                  width: "100%",
                                  height: `${item.targetHeight}px`,
                                  mt: "12px",
                                  pointerEvents: "none",
                                }}
                              />
                              <Box
                                ref={(el: HTMLDivElement | null) => {
                                  captionRefsMap.current.set(item.code, el)
                                }}
                                sx={{ opacity: 0, mt: "4px" }}
                              >
                                <Typography
                                  component="span"
                                  sx={{
                                    fontSize: 11,
                                    lineHeight: 1.3,
                                    color: theme.palette.grey[700],
                                  }}
                                >
                                  {item.locationDescription}
                                </Typography>
                              </Box>
                            </>
                          )}
                        </Box>
                      )
                    })}
                  {/* eslint-disable-next-line no-constant-binary-expression */}
                  {col === 0 && false && (
                    /* "Add a location to track" CTA - disabled per design
                     *  direction, kept in-source for future reuse. */
                    <Box
                      ref={addLocationCtaRef}
                      sx={{
                        opacity: 0,
                        transition: "opacity 0.6s ease",
                        pointerEvents: interactive ? "auto" : "none",
                        mt: "auto",
                        pt: 3,
                      }}
                    >
                      <Box
                        component="button"
                        type="button"
                        onClick={onAddLocation}
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 0.5,
                          color: theme.palette.grey[600],
                          border: `1px solid ${theme.palette.grey[300]}`,
                          borderRadius: "4px",
                          background: "transparent",
                          textTransform: "none",
                          fontWeight: 500,
                          fontSize: "0.75rem",
                          letterSpacing: "0.02em",
                          fontFamily: "inherit",
                          px: 1.25,
                          py: 0.125,
                          cursor: "pointer",
                          transition: "background 0.15s, border-color 0.15s",
                          "&:hover": {
                            backgroundColor: theme.palette.grey[100],
                            borderColor: theme.palette.grey[400],
                          },
                          "&:focus-visible": {
                            outline: `2px solid ${theme.palette.blue.bright}`,
                            outlineOffset: "2px",
                          },
                        }}
                      >
                        Add a location to track
                        <ArrowForwardIcon sx={{ fontSize: "0.85rem" }} />
                      </Box>
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>

      {/* TODO(beat3): restore beat 3 text
      <Box
        sx={{
          position: "absolute",
          top: "25%",
          left: 0,
          p: padding,
          opacity: 0,
          width: _beat1PanelWidth,
        }}
      >
        <Typography variant="body1" component="p">
          Each outcome has a group of researchers behind it. Click here to
          learn more about their methodologies.
        </Typography>
      </Box>
      */}
    </Box>
  )
}

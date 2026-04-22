"use client"

import { useRef, useEffect, useLayoutEffect, useMemo, useCallback } from "react"
import {
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
  alpha,
  ArrowForwardIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  IconButton,
  PlayArrowIcon,
  ReplayIcon,
} from "@repo/ui/mui"
import { motion, useMotionValue, animate } from "@repo/motion"
import type { MotionValue } from "@repo/motion"
import type { EncodingMode } from "./OutcomeMorphOverlay"
import { HydroclimateChooser } from "../../scenarios/components/HydroclimateChooser"
import { HybridTooltip } from "@repo/ui"
import {
  getScenarioIconDefs,
  renderIconDef,
} from "../../scenarios/components/shared/opsIcons"
import { useDrawerStore } from "@repo/state/drawer"
import {
  PARAGRAPH_FADE_SEC,
  ITEM_FADE_SEC,
  ITEM_STAGGER_SEC,
  BLOCK_EXIT_SEC,
  secondsToProgress,
} from "./animationTiming"

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
  hydroclimate?: string
  onHydroclimateChange?: (value: string) => void
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
}

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v))
}

export default function BeatTextOverlay({
  progress,
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
  scenarioId,
  scenarioName,
  scenarioDescription,
  encodingMode,
  onEncodingChange,
  hydroclimate,
  onHydroclimateChange,
  onAddLocation,
  outcomeMorphWindows,
  onGlyphLayoutChange,
  hideControls = false,
}: BeatTextOverlayProps) {
  const theme = useTheme()
  const { setDrawerContent, openDrawer } = useDrawerStore()

  // NOTE: GLOSSARY_TERMS / handleGlossaryClick / glossaryLinkStyles /
  // descriptionWithLinks are kept live. They're only consumed by the
  // commented-out scenario-header JSX below (wrapped in `{false && ...}`),
  // which we preserve for later reuse.
  const GLOSSARY_TERMS = useMemo(
    () => [
      {
        pattern: /\bTUCPs?\b/g,
        glossaryTerm: "Temporary Urgent Change Petitions (TUCPs)",
      },
      {
        pattern: /\bSGMA\b/g,
        glossaryTerm: "Sustainable Groundwater Management Act (SGMA)",
      },
      {
        pattern: /\bDelta Conveyance Project\b/g,
        glossaryTerm: "Delta Conveyance Project",
      },
    ],
    [],
  )

  const handleGlossaryClick = useCallback(
    (term: string) => (e: React.MouseEvent) => {
      e.stopPropagation()
      setDrawerContent({ selectedTerm: term })
      openDrawer("glossary")
    },
    [setDrawerContent, openDrawer],
  )

  const glossaryLinkStyles = useMemo(
    () => ({
      color: theme.palette.blue.bright,
      borderBottom: `2px solid ${theme.palette.blue.bright}`,
      cursor: "pointer",
      background: "none",
      border: "none",
      borderBottomStyle: "solid" as const,
      borderBottomWidth: "2px",
      borderBottomColor: theme.palette.blue.bright,
      padding: 0,
      font: "inherit",
      "&:hover": { borderBottomWidth: "3px" },
      "&:focus-visible": {
        outline: `2px solid ${theme.palette.blue.bright}`,
        outlineOffset: "2px",
        borderRadius: "2px",
      },
    }),
    [theme.palette.blue.bright],
  )

  const descriptionWithLinks = useMemo(() => {
    if (!scenarioDescription) return null
    const combined = new RegExp(
      `(${GLOSSARY_TERMS.map((t) => t.pattern.source).join("|")})([.,;:!?]?)`,
      "g",
    )
    const result: React.ReactNode[] = []
    let lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = combined.exec(scenarioDescription)) !== null) {
      if (match.index > lastIndex)
        result.push(scenarioDescription.slice(lastIndex, match.index))
      const word = match[1] ?? ""
      const punct = match[2] ?? ""
      const term = GLOSSARY_TERMS.find((t) =>
        new RegExp(`^${t.pattern.source}$`).test(word),
      )
      if (term) {
        result.push(
          <Box
            component="button"
            type="button"
            key={`gl-${match.index}`}
            onClick={handleGlossaryClick(term.glossaryTerm)}
            tabIndex={0}
            aria-label={`Open glossary for ${term.glossaryTerm}`}
            sx={glossaryLinkStyles}
          >
            {word}
          </Box>,
        )
        if (punct) result.push(punct)
      }
      lastIndex = match.index + match[0].length
    }
    if (lastIndex < scenarioDescription.length)
      result.push(scenarioDescription.slice(lastIndex))
    return result
  }, [
    scenarioDescription,
    GLOSSARY_TERMS,
    handleGlossaryClick,
    glossaryLinkStyles,
  ])

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
  const eyebrowRefs = useRef<(HTMLDivElement | null)[]>([])
  const eyebrowDataRef = useRef<ColumnEyebrow[] | undefined>(undefined)
  eyebrowDataRef.current = beat2Layout?.eyebrows
  const beat2LayoutRef = useRef<Beat2Layout | null | undefined>(undefined)
  beat2LayoutRef.current = beat2Layout
  // NOTE: scenarioHeaderRef + addLocationCtaRef are kept live because their
  // JSX (current operations text, key-op icons, description, encoding toggle,
  // climate chooser, "Add a location" CTA) is preserved behind
  // `{false && ...}` guards below for future reuse. They're not rendered.
  const scenarioHeaderRef = useRef<HTMLDivElement>(null)
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
   * right panel. One ref per Beat 5-8; opacity is driven by the same
   * progress windows as the matching narration paragraph. */
  const distributionHeaderRef = useRef<HTMLDivElement>(null)
  const listHeaderRef = useRef<HTMLDivElement>(null)
  const radarHeaderRef = useRef<HTMLDivElement>(null)
  const heatmapHeaderRef = useRef<HTMLDivElement>(null)
  const addLocationCtaRef = useRef<HTMLDivElement>(null)
  /** Bottom Back / indicator / Next control row opacity.
   *
   *  The row is only visible when a text sequence has finished - i.e.,
   *  the parent is settled at a beat (`playState === "paused"` or
   *  `"finished"`) and the user has clicked Play. Any new sequence
   *  (Play, Next, Back between beats, Back-from-first-beat) flips `playState`
   *  to `"playing"` and fades the row back out until the tween
   *  completes. This keeps the controls out of the way during the
   *  animated storytelling and surfaces them only at the reading
   *  pauses between beats.
   *
   *  Animated via an imperative `animate()` on a local MotionValue in
   *  the effect below, rather than bound to `progress`, because the
   *  visibility rule is about *whether* an animation is running, not
   *  about any specific progress window. */
  const bottomControlsOpacity = useMotionValue(0)
  const textHiddenRef = useRef(textHidden)
  textHiddenRef.current = textHidden
  const outcomeMorphWindowsRef = useRef(outcomeMorphWindows)
  outcomeMorphWindowsRef.current = outcomeMorphWindows

  /* ── `beat1Ref` opacity: progress-driven fade-in × back-out fade-out ──
   *
   * We multiply the progress-derived fade-in (0.02 -> 0.06 window) by
   * `backOutOpacity` (default 1, animated to 0 on Back-from-first-beat) so the
   * entire text block (intro paragraphs, tier legend, beat 1C reveals,
   * bottom controls) fades out together during back-out instead of the
   * progress listener unwinding each reveal. Both `progress` and
   * `backOutOpacity` can change independently, so we listen to both and
   * recompute on either change. */
  useEffect(() => {
    const applyBeat1Opacity = () => {
      const el = beat1Ref.current
      if (!el) return
      const v = progress.get()
      const fadeIn = textHiddenRef.current ? 0 : clamp01((v - 0.01) / B0_PARA)
      const mult = backOutOpacity ? backOutOpacity.get() : 1
      el.style.opacity = String(fadeIn * mult)
    }
    applyBeat1Opacity()
    const uProgress = progress.on("change", applyBeat1Opacity)
    const uBackOut = backOutOpacity
      ? backOutOpacity.on("change", applyBeat1Opacity)
      : null
    return () => {
      uProgress()
      uBackOut?.()
    }
  }, [progress, backOutOpacity, textHidden])

  /* ── Bottom controls visibility follows `playState` ──
   *
   * Show only at reading pauses - i.e. when the parent has settled at
   * a beat (`paused` or `finished`) and the user has clicked Play.
   * Any new sequence (Play, Next, Back) flips `playState` to `playing`
   * and this effect fades the row back out. Pre-play (`idle`) and the
   * Back-from-first-beat completion (which sets `idle` + `hasPlayed=false`)
   * also keep the row hidden. */
  useEffect(() => {
    if (hideControls) return
    const settled = playState === "paused" || playState === "finished"
    const target = hasPlayed && settled ? 1 : 0
    const ctrl = animate(bottomControlsOpacity, target, {
      duration: 0.3,
      ease: "easeOut",
    })
    return () => ctrl.stop()
  }, [playState, hasPlayed, hideControls, bottomControlsOpacity])

  useEffect(() => {
    const unsub = progress.on("change", (v) => {
      // NOTE: `beat1Ref.opacity` is handled in the combined effect above
      // (it multiplies progress-driven fade-in by `backOutOpacity`).

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
            titleEl.style.opacity = String(
              clamp01((v - titleFadeStart) / TITLE_FADE),
            )
          }

          if (captionEl) {
            const rawFadeEnd = morphEnd + (CAPTION_FADE - CAPTION_LEAD)
            const captionFadeEnd = Math.min(
              rawFadeEnd,
              CAPTION_FADE_END_CEILING,
            )
            const captionFadeStart = captionFadeEnd - CAPTION_FADE
            captionEl.style.opacity = String(
              clamp01((v - captionFadeStart) / CAPTION_FADE),
            )
          }
        }
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
      // -> Critical) so the gap between "To compare results..." (0.10–0.12)
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
    })
    return unsub
  }, [progress])

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
    }

    const ro = new ResizeObserver(() => {
      measure()
    })
    ro.observe(root)
    ro.observe(panel)
    placeholderRefsMap.current.forEach((el) => {
      if (el) ro.observe(el)
    })
    measure()

    return () => ro.disconnect()
  }, [onGlyphLayoutChange, beat2Layout])

  // Kept live (unused while scenarioHeader JSX is disabled behind
  // `{false && ...}`). Restore usage in the JSX to re-enable.
  const opsIconDefs = useMemo(
    () => (scenarioId ? getScenarioIconDefs(scenarioId) : []),
    [scenarioId],
  )

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
                agricultural water district in the Central Valley receiving surface water deliveries.
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
                this scenario across the Central Valley agricultural districts in CalSim at a glance.
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

          {/* Bottom control row: Back / N-of-T / Next, plus Restart once
           *  the user has moved past the first beat. Rendered only
           *  after the user has clicked Play (`hasPlayed`) and not at
           *  all in reduced-motion mode (`hideControls`). Opacity is
           *  driven by `bottomControlsOpacity`, animated via a
           *  dedicated `playState` effect: visible only at the reading
           *  pauses between beats (`paused` / `finished`), faded out
           *  during any tween (`playing`) and during Back-from-first-beat
           *  (`idle` + `hasPlayed=false` unmounts this block anyway). */}
          {!hideControls && hasPlayed && (
            <motion.div
              style={{
                marginTop: theme.spacing(theme.space.section.sm),
                display: "flex",
                gap: theme.spacing(0.75),
                alignItems: "center",
                pointerEvents: "auto",
                opacity: bottomControlsOpacity,
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
          top: padding,
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
          top: padding,
          right: 0,
          width: "33.33%",
          zIndex: 5,
          display: "flex",
          flexDirection: "column",
          pb: 2,
          "& .MuiTypography-root": {
            color: theme.palette.text.primary,
          },
        }}
      >
        {/* Scenario header + encoding toggle.
         *  Disabled per design direction - kept in-source (wrapped in
         *  `{false && ...}`) so it can be re-enabled by flipping the guard. */}
        {false && (
          <Box
            ref={scenarioHeaderRef}
            sx={{
              px: 3,
              pt: 2,
              pb: 1.5,
              flexShrink: 0,
              pointerEvents: interactive ? "auto" : "none",
              opacity: 0,
              transition: "opacity 0.6s ease",
              borderBottom: interactive
                ? `1px solid ${theme.palette.grey[200]}`
                : "none",
            }}
          >
            {/* Two-column grid: title/toggle left, ops/climate right */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                rowGap: scenarioDescription ? 0.5 : 1.5,
                columnGap: 1.5,
                alignItems: "center",
              }}
            >
              {/* Top-left: title */}
              {scenarioName && (
                <Typography
                  variant="subtitle1"
                  component="h3"
                  sx={{ fontWeight: 600, gridColumn: 1 }}
                >
                  {scenarioName}
                </Typography>
              )}

              {/* Top-right: key operations */}
              {opsIconDefs.length > 0 && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    gridColumn: 2,
                    justifySelf: "end",
                  }}
                >
                  <Typography
                    component="span"
                    sx={{
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      letterSpacing: "0.02em",
                      color: theme.palette.grey[600],
                      whiteSpace: "nowrap",
                    }}
                  >
                    Key operations
                  </Typography>
                  {opsIconDefs.map((def) => (
                    <HybridTooltip
                      key={def.id}
                      content={
                        <>
                          <Typography variant="tooltipHeader" sx={{ mb: 0.5 }}>
                            {def.label}
                          </Typography>
                          {def.description}
                        </>
                      }
                    >
                      <Box
                        tabIndex={0}
                        aria-label={def.label}
                        sx={{
                          width: 26,
                          height: 26,
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "50%",
                          cursor: "default",
                          "&:focus-visible": {
                            outline: `2px solid ${theme.palette.blue.bright}`,
                            outlineOffset: "2px",
                          },
                        }}
                      >
                        {renderIconDef(def)}
                      </Box>
                    </HybridTooltip>
                  ))}
                </Box>
              )}

              {/* Description spanning both columns */}
              {scenarioDescription && (
                <Typography
                  variant="compactSubtitle"
                  component="p"
                  sx={{
                    color: theme.palette.grey[500],
                    gridColumn: "1 / -1",
                  }}
                >
                  {descriptionWithLinks}
                </Typography>
              )}

              {/* Bottom-left: encoding toggle */}
              {encodingMode && onEncodingChange && (
                <ToggleButtonGroup
                  value={encodingMode}
                  exclusive
                  onChange={(_, val) => {
                    if (val) onEncodingChange?.(val as EncodingMode)
                  }}
                  size="small"
                  sx={{
                    gridColumn: 1,
                    "& .MuiToggleButton-root": {
                      color: theme.palette.grey[600],
                      border: `1px solid ${theme.palette.grey[300]}`,
                      textTransform: "none",
                      fontWeight: 500,
                      fontSize: "0.75rem",
                      letterSpacing: "0.02em",
                      px: 1.25,
                      py: 0.125,
                      "&.Mui-selected": {
                        backgroundColor: theme.palette.blue.bright,
                        color: theme.palette.common.white,
                        borderColor: theme.palette.blue.bright,
                        "&:hover": {
                          backgroundColor: theme.palette.blue.dark,
                        },
                      },
                      "&:hover": {
                        backgroundColor: theme.palette.grey[100],
                      },
                    },
                  }}
                >
                  <ToggleButton value="distribution">Distribution</ToggleButton>
                  <ToggleButton value="bar">Bar</ToggleButton>
                  <ToggleButton value="average">Average</ToggleButton>
                </ToggleButtonGroup>
              )}

              {/* Bottom-right: hydroclimate chooser */}
              {onHydroclimateChange && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    gridColumn: 2,
                    justifySelf: "end",
                  }}
                >
                  <Typography
                    component="span"
                    sx={{
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      letterSpacing: "0.02em",
                      color: theme.palette.grey[600],
                      whiteSpace: "nowrap",
                    }}
                  >
                    View by climate
                  </Typography>
                  <HydroclimateChooser
                    value={hydroclimate}
                    onChange={onHydroclimateChange}
                    showTitle={false}
                    showLabels={false}
                    hideDisabled
                    iconSize="26px"
                    iconFontSize="0.95rem"
                  />
                </Box>
              )}
            </Box>
          </Box>
        )}

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
             *  Four labels stack in the same slot; each is driven by
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
                  { ref: distributionHeaderRef, label: "Distribution view" },
                  { ref: listHeaderRef, label: "List view" },
                  { ref: radarHeaderRef, label: "Radar chart" },
                  { ref: heatmapHeaderRef, label: "Heat map" },
                ] as const
              ).map(({ ref, label }) => (
                <Box
                  key={label}
                  ref={ref}
                  sx={{
                    position: "absolute",
                    top: (t) => t.spacing(1.5),
                    left: 0,
                    right: 0,
                    opacity: 0,
                  }}
                >
                  <Typography variant="smallSectionLabel" component="p">
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
                            variant="overline"
                            noWrap
                            sx={{
                              fontWeight: isSelected ? 700 : 500,
                              textTransform: "none",
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

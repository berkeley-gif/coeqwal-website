"use client"

import {
  useRef,
  useEffect,
  useLayoutEffect,
  useMemo,
  useCallback,
} from "react"
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
   *  storyboard; `totalBeats` is the length of that storyboard. Handlers
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
  /** Map of outcome code → Beat 2 morph progress window. `start` drives
   *  each outcome title's fade-in (just before its polygons begin morphing);
   *  `end` drives the caption fade-in (once the polygons settle as squares). */
  outcomeMorphWindows?: Record<string, { start: number; end: number }>
  /** Called by the ResizeObserver whenever per-outcome glyph placeholders
   *  are laid out (or resized). The parent uses these rects as landing
   *  coordinates for the SVG morph overlay. Coordinates are relative to
   *  the right-column root Box (its left edge == panelWidth * 2/3). */
  onGlyphLayoutChange?: (
    layout: Record<string, GlyphRect>,
  ) => void
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
  // descriptionWithLinks are kept live; they're only consumed by the
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
   *  visible — not some lower bound set by invisible-but-reserved
   *  blocks. We use the CSS grid `grid-template-rows: Xfr` trick:
   *  the ref points at a single-row grid whose row collapses at `0fr`
   *  and expands to its min-content size at `1fr`, so the browser
   *  computes the natural height itself from document flow — no
   *  measurement needed. */
  const beat1cExampleRef = useRef<HTMLDivElement>(null)
  const beat1cDeliveryRef = useRef<HTMLDivElement>(null)
  const allOtherOutcomesRef = useRef<HTMLDivElement>(null)
  const addLocationCtaRef = useRef<HTMLDivElement>(null)
  /** Bottom Back / indicator / Next control row opacity.
   *
   *  The row is only visible when a text sequence has finished — i.e.,
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
   * We multiply the progress-derived fade-in (0.02 → 0.06 window) by
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
      const fadeIn = textHiddenRef.current ? 0 : clamp01((v - 0.02) / 0.04)
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
   * Show only at reading pauses — i.e. when the parent has settled at
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
        const fadeIn = clamp01((v - 0.2) / 0.04)
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
      // outer wrapper; the browser interpolates each row's height from
      // the inner overflow-hidden child's natural `min-content` height
      // down to zero, so no JS measurement is needed (same pattern as
      // `beat1cExampleRef` / `beat1cDeliveryRef` / `allOtherOutcomesRef`
      // below).
      const introFadeOut = clamp01((v - 0.46) / 0.015)
      const introCollapse = clamp01((v - 0.475) / 0.015)
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
        // The fade completes by 0.78 (beat 3's settle point) so the
        // backdrop is fully present when the AG_REV morph lands.
        const fadeIn = clamp01((v - 0.755) / 0.02)
        beat2PanelRef.current.style.opacity = String(fadeIn)
      }

      // Outcome titles fade in per-slice, synced to each outcome's own morph.
      // Each title appears just before its polygons begin morphing so the
      // viewer can read the title while watching that slice animate.
      // Captions fade in at the *end* of each morph window, after the
      // polygons have settled as squares.
      const windows = outcomeMorphWindowsRef.current
      const TITLE_LEAD = 0.008
      const TITLE_FADE = 0.018
      const CAPTION_LEAD = 0.002
      const CAPTION_FADE = 0.012
      // Late morph slices (when activeOutcomeGroups is short) can push the
      // caption's natural fadeEnd past 1.0, leaving the caption partially
      // opaque at rest. Cap fadeEnd so every caption settles at opacity 1
      // before progress reaches the end of the animation.
      const CAPTION_FADE_END_CEILING = 0.99
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
          // 0.02 fade width matches the right-panel backdrop so both
          // land together just before beat 3 settles at 0.78.
          const fadeIn = clamp01((v - eyebrows[i]!.animationStart) / 0.02)
          el.style.opacity = String(fadeIn)
        }
      }

      // Tier legend staggers in row by row (Optimal → Acceptable → At risk
      // → Critical) so the gap between "To compare results..." (0.20–0.24)
      // and the map's Beat 1B collapse (0.50) fills with a meaningful
      // level-by-level reveal instead of a single 0.22-wide dead zone.
      const TIER_LEGEND_FIRST_START = 0.26
      const TIER_LEGEND_ROW_STEP = 0.05
      const TIER_LEGEND_ROW_FADE = 0.04
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
      // Beat 1C paragraphs fade in during beat 2 and then fade out at
      // the start of the merged final beat (0.78 → 0.80), freeing the
      // left-panel slot for "For each scenario, outcome levels...".
      // Their grid rows collapse once fully faded out so the new
      // paragraph slides cleanly into their former document-flow slot.
      if (beat1cExampleRef.current) {
        const el = beat1cExampleRef.current
        const fadeIn = clamp01((v - 0.49) / 0.03)
        const fadeOut = clamp01((v - 0.78) / 0.02)
        el.style.opacity = String(fadeIn * (1 - fadeOut))
        el.style.gridTemplateRows =
          v >= 0.485 && v < 0.80 ? "1fr" : "0fr"
      }

      if (beat1cDeliveryRef.current) {
        const el = beat1cDeliveryRef.current
        const fadeIn = clamp01((v - 0.65) / 0.03)
        const fadeOut = clamp01((v - 0.78) / 0.02)
        el.style.opacity = String(fadeIn * (1 - fadeOut))
        el.style.gridTemplateRows =
          v >= 0.645 && v < 0.80 ? "1fr" : "0fr"
      }

      // "For each scenario, outcome levels..." fades in during the
      // merged final beat, right after the two Beat 1C paragraphs
      // finish fading out (0.80 → 0.82). The remaining 8 outcome
      // morphs then play alongside this sentence over [0.84, 1.0].
      if (allOtherOutcomesRef.current) {
        const el = allOtherOutcomesRef.current
        el.style.opacity = String(clamp01((v - 0.80) / 0.02))
        el.style.gridTemplateRows = v >= 0.795 ? "1fr" : "0fr"
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
             * user has clicked Play; see below. In pre-play we show only
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
                Different scenarios change how water is allocated among different users and the environment.
              </Typography>
              <Box ref={beat2IntroRef} sx={{ mt: 2, opacity: 0 }}>
                <Typography variant="body2" component="p">
                  To compare results on a common scale, we group key outcomes into levels:
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
          {/* Beat 1C narrative lives in the left panel, directly below the
           *  tier legend, so the overlay panel can be dedicated to graphics.
           *  These blocks inherit `beat1Ref`'s `textColor` / `textShadow`
           *  automatically; sizing comes from MUI's native `body2` variant,
           *  so this panel stays in lockstep with the other Get Started
           *  panels.
           *
           *  Each block is a single-row CSS grid whose `grid-template-rows`
           *  is driven from `0fr` (collapsed) to `1fr` (natural min-content)
           *  by the progress handler (beat 1C paragraphs at 0.49 / 0.65,
           *  fading out at 0.78 → 0.80; "For each scenario..." fading in
           *  at 0.80 → 0.82), alongside an opacity fade. The browser
           *  computes the min-content height
           *  from document flow — no measurement — so the bottom control
           *  row below naturally hugs the last text block that's actually
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
                For example, each colored location on the map represents an agricultural water district receiving surface water deliveries.
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
                The colors correspond to different water delivery outcome levels that affect{" "}
                <Box component="strong" sx={{ fontWeight: 600 }}>
                  agricultural revenue
                </Box>
                , ranging from optimal levels (blue) to critical levels (red).
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
                For each scenario, outcome levels are calculated for all key outcomes across all locations of interest.
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
                        atStart
                          ? "Back to intro (←)"
                          : "Previous beat (←)"
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

      {/* Beat 2 - right-third column.
       *
       * Top-aligned with the left panel's title bar (`top: padding`) so
       * tall content isn't visually cut off above the title line. Its
       * left edge aligns with `panelWidth * 2/3`, which is the same
       * origin the SVG overlay uses. Bottom is left unset so the column
       * auto-sizes to its content (the two-column outcome grid which has
       * explicit row heights). A small bottom padding gives the backdrop
       * breathing room below the last row.
       *
       * The white backdrop (`beat2PanelRef`) lives inside as a sibling
       * absolutely-pinned to `inset: 0`, so it inherits the column's
       * natural height automatically — no JS height sync needed, and no
       * extra empty space below the last content row. */}
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
        <Box
          ref={beat2PanelRef}
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: -1,
            backgroundColor: alpha(theme.palette.common.white, 0.75),
            opacity: 0,
            pointerEvents: "none",
          }}
        />
        {/* Scenario header + encoding toggle.
         *  Disabled per design direction — kept in-source (wrapped in
         *  `{false && ...}`) so it can be re-enabled by flipping the guard. */}
        {false && (<Box
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
        </Box>)}

        {/* Beat 1C narrative lives in the left panel below the tier
         *  legend; see `beat1Ref` above. The overlay panel is dedicated to
         *  graphics (outcome titles, glyph morphs, location captions). */}

        {/* Two-column flow layout for outcome rows. Each row is a vertical
         *  stack: Title → GlyphPlaceholder → Caption. Row/column spacing is
         *  handled entirely by flex + rowGap; no cursor math. */}
        {beat2Layout && (
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
                  /* "Add a location to track" CTA — disabled per design
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

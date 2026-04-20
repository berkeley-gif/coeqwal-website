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
  IconButton,
  PlayArrowIcon,
  PauseIcon,
  ReplayIcon,
} from "@repo/ui/mui"
import { motion } from "@repo/motion"
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
  playState: "idle" | "playing" | "paused" | "finished"
  onRewind?: () => void
  onPlay?: () => void
  onPause?: () => void
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
  playState,
  onRewind,
  onPlay,
  onPause,
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
  /** Natural height of `introCollapseRef` (including padding), measured
   *  via ResizeObserver. Used as the animating max-height target. */
  const introCollapseHeightRef = useRef<number>(0)
  /** Root Box of the right-column (absolutely positioned at `right: 0`,
   *  `width: 33.33%`). Used as the reference frame for ResizeObserver
   *  measurements so glyph positions map 1:1 to the SVG's `pos.x`/`pos.y`. */
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
  const beat1cExampleRef = useRef<HTMLDivElement>(null)
  const beat1cDeliveryRef = useRef<HTMLDivElement>(null)
  const allOtherOutcomesRef = useRef<HTMLDivElement>(null)
  const addLocationCtaRef = useRef<HTMLDivElement>(null)
  const textHiddenRef = useRef(textHidden)
  textHiddenRef.current = textHidden
  const outcomeMorphWindowsRef = useRef(outcomeMorphWindows)
  outcomeMorphWindowsRef.current = outcomeMorphWindows

  useEffect(() => {
    if (!beat1Ref.current) return
    if (textHidden) {
      beat1Ref.current.style.opacity = "0"
    } else {
      const v = progress.get()
      beat1Ref.current.style.opacity = String(clamp01((v - 0.02) / 0.04))
    }
  }, [textHidden, progress])

  useEffect(() => {
    const unsub = progress.on("change", (v) => {
      if (beat1Ref.current) {
        const fadeIn = textHiddenRef.current ? 0 : clamp01((v - 0.02) / 0.04)
        beat1Ref.current.style.opacity = String(fadeIn)
      }

      if (beat2IntroRef.current) {
        const fadeIn = clamp01((v - 0.2) / 0.04)
        beat2IntroRef.current.style.opacity = String(fadeIn)
      }

      // Intro collapse group: after the Critical row lands (~0.45) and a
      // short hold, fade out the intro paragraphs first, then collapse
      // their height so the tier legend slides up into the vacated space
      // via document flow. Running the two sequentially (fade then slide)
      // reads more cleanly than overlapping them.
      if (introCollapseRef.current) {
        const fadeOut = clamp01((v - 0.49) / 0.03)
        const collapse = clamp01((v - 0.52) / 0.03)
        const el = introCollapseRef.current
        el.style.opacity = String(1 - fadeOut)
        el.style.maxHeight =
          introCollapseHeightRef.current * (1 - collapse) + "px"
      }

      if (beat2PanelRef.current) {
        // Beat 2 panel backdrop now serves purely as a reading surface for
        // outcome titles + location captions, since the narrative text
        // lives on the left panel. It fades in with AG_REV's solo morph
        // so the backdrop arrives together with the first graphics.
        const fadeIn = clamp01((v - 0.74) / 0.03)
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
          const morphStart = win?.start ?? 0.74
          const morphEnd = win?.end ?? 0.99

          const titleEl = titleRefsMap.current.get(item.code)
          if (titleEl) {
            const titleFadeStart = morphStart - TITLE_LEAD
            titleEl.style.opacity = String(
              clamp01((v - titleFadeStart) / TITLE_FADE),
            )
          }

          const captionEl = captionRefsMap.current.get(item.code)
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
          const fadeIn = clamp01((v - eyebrows[i]!.animationStart) / 0.03)
          el.style.opacity = String(fadeIn)
        }
      }

      // Tier legend staggers in row by row (Optimal → Acceptable → At risk
      // → Critical) so the gap between "To compare results..." (0.20–0.24)
      // and the map's Beat 1B collapse (0.55) fills with a meaningful
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

      // Beat 1C example text ("each polygon on the map represents..."):
      // kicks off the overlay narrative as soon as the AG-only filter +
      // blue→tier blend begins (0.60), so the text and the color change
      // register together.
      if (beat1cExampleRef.current) {
        const fadeIn = clamp01((v - 0.6) / 0.03)
        beat1cExampleRef.current.style.opacity = String(fadeIn)
      }

      // Beat 1C delivery-levels text: appears once the tier colors are
      // fully set and the example popups have had a moment to read.
      if (beat1cDeliveryRef.current) {
        const fadeIn = clamp01((v - 0.7) / 0.03)
        beat1cDeliveryRef.current.style.opacity = String(fadeIn)
      }

      // "All other key outcomes..." text: bridges AG_REV's solo morph
      // (ends at 0.765) and the remaining outcomes' fly-ins (start at
      // 0.80). Text is fully visible just as the next morph wave begins.
      if (allOtherOutcomesRef.current) {
        const fadeIn = clamp01((v - 0.77) / 0.03)
        allOtherOutcomesRef.current.style.opacity = String(fadeIn)
      }
    })
    return unsub
  }, [progress])

  /* ── Measure intro-collapse block ──
   *
   * The two intro paragraphs ("Different scenarios..." + "To compare
   * results...") live inside `introCollapseRef`. We measure its natural
   * `scrollHeight` (content + padding; `beat2IntroRef` is always in flow
   * even when `opacity: 0`, so scrollHeight reflects the expanded height)
   * and seed the element's initial `max-height` so the progress handler
   * has a closed-form value to animate toward zero. */
  useLayoutEffect(() => {
    const el = introCollapseRef.current
    if (!el) return

    const measure = () => {
      const h = el.scrollHeight
      introCollapseHeightRef.current = h
      if (!el.style.maxHeight || el.style.maxHeight === "0px") {
        el.style.maxHeight = h + "px"
      }
    }

    const ro = new ResizeObserver(() => measure())
    ro.observe(el)
    measure()

    return () => ro.disconnect()
  }, [])

  /* ── Report glyph placeholder rects up to the parent ──
   *
   * We measure each transparent placeholder relative to the right-column
   * root. Since the right-column is absolutely positioned at
   * `right: 0; width: 33.33%`, its left edge aligns with `panelWidth * 2/3`
   * — which is exactly the coordinate frame the SVG overlay uses
   * (`pos.x` is the offset into the right-third, `pos.y` is panel-top
   * relative). Measured rects can therefore be passed through to the SVG
   * without further transformation. */
  useLayoutEffect(() => {
    if (!onGlyphLayoutChange) return
    const root = rightColumnRootRef.current
    if (!root) return

    const measure = () => {
      const rootRect = root.getBoundingClientRect()
      const layout: Record<string, GlyphRect> = {}
      placeholderRefsMap.current.forEach((el, code) => {
        if (!el) return
        const r = el.getBoundingClientRect()
        layout[code] = {
          x: r.left - rootRect.left,
          y: r.top - rootRect.top,
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
          <Box
            sx={{
              display: "flex",
              gap: 0.75,
              alignItems: "center",
              pointerEvents: "auto",
            }}
          >
            {playState !== "idle" && (
              <IconButton
                onClick={onRewind}
                size="small"
                sx={{
                  width: 36,
                  height: 36,
                  backgroundColor: alpha(theme.palette.common.white, 0.15),
                  backdropFilter: "blur(8px)",
                  color: "text.secondary",
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.common.white, 0.3),
                  },
                }}
              >
                <ReplayIcon sx={{ fontSize: 18 }} />
              </IconButton>
            )}
            {playState === "playing" ? (
              <IconButton
                onClick={onPause}
                size="small"
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
                <PauseIcon sx={{ fontSize: 24 }} />
              </IconButton>
            ) : (
              <IconButton
                onClick={onPlay}
                size="small"
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
            )}
          </Box>
        </motion.div>

        <motion.div style={{ opacity: headingOpacity, flexShrink: 0 }}>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: "66%", mb: theme.space.section.md, opacity: 0.85 }}
          >
            How are scenario results measured?
          </Typography>
        </motion.div>

        {/* Body content - same flow as ContentPanel children */}
        <Box
          ref={beat1Ref}
          sx={{
            mt: 2,
            opacity: 0,
            width: "100%",
            maxWidth: theme.space.paragraphMaxWidth.compact,
            "& .MuiTypography-root": {
              color: textColor,
              textShadow: shadow,
              fontSize: theme.typography.storyBody.fontSize,
              lineHeight: theme.typography.storyBody.lineHeight,
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
            sx={{
              pb: 2.5,
              overflow: "hidden",
            }}
          >
            <Typography variant="body1" component="p">
              Different scenarios change how water is allocated among different users and the environment.
            </Typography>
            <Box ref={beat2IntroRef} sx={{ mt: 2, opacity: 0 }}>
              <Typography variant="body1" component="p">
                To compare results on a common scale, we group key outcomes into levels:
              </Typography>
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
           *  These blocks inherit `beat1Ref`'s `storyBody` font cascade and
           *  `textColor` / `textShadow` automatically. Each block's opacity
           *  is driven by the progress handler (0.60 / 0.70 / 0.82). */}
          <Box ref={beat1cExampleRef} sx={{ mt: 2.5, opacity: 0 }}>
            <Typography variant="body1" component="p">
              For example, each colored location on the map represents an agricultural water district receiving surface water deliveries.
            </Typography>
          </Box>
          <Box ref={beat1cDeliveryRef} sx={{ mt: 2, opacity: 0 }}>
            <Typography variant="body1" component="p">
              The colors correspond to different water delivery outcome levels that affect agricultural revenue, ranging from optimal levels (blue) to critical levels (red).
            </Typography>
          </Box>
          <Box ref={allOtherOutcomesRef} sx={{ mt: 2, opacity: 0 }}>
            <Typography variant="body1" component="p">
              All other key outcomes can be mapped and visualized in similar ways.
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Beat 2 - white backdrop on the right third */}
      <Box
        ref={beat2PanelRef}
        sx={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: "33.33%",
          zIndex: 3,
          backgroundColor: alpha(theme.palette.common.white, 0.75),
          opacity: 0,
        }}
      />

      {/* Beat 2 - text items in flow layout.
       *
       * This Box's left edge aligns with `panelWidth * 2/3`, which is the
       * same origin the SVG overlay uses. That's why we measure placeholder
       * positions relative to this root (see ResizeObserver above). */}
      <Box
        ref={rightColumnRootRef}
        sx={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: "33.33%",
          zIndex: 5,
          display: "flex",
          flexDirection: "column",
          "& .MuiTypography-root": {
            color: theme.palette.text.primary,
          },
        }}
      >
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
              flex: 1,
              minHeight: 0,
              overflow: "hidden",
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

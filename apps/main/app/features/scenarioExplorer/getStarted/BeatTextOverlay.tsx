"use client"

import { useRef, useEffect, useMemo, useCallback } from "react"
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
import { OUTCOME_CODE_ORDER } from "../../../content/outcomes"
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

interface Beat2Layout {
  items: {
    code: string
    label: string
    y: number
    x: number
    column: 0 | 1
    columnWidth: number
    isActive: boolean
    spaceBelow: number
  }[]
  eyebrows: ColumnEyebrow[]
  leftColumnBottom?: number
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
  onTourStart?: () => void
  onAddLocation?: () => void
}

function StoryCtaButton({
  label,
  onClick,
}: {
  label: string
  onClick?: () => void
}) {
  const theme = useTheme()
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.75,
        px: 2,
        py: 1,
        border: "none",
        borderRadius: 1.5,
        background: theme.palette.blue.bright,
        cursor: "pointer",
        transition: "background 0.15s",
        "&:hover": {
          background: theme.palette.blue.dark,
        },
        "&:focus-visible": {
          outline: `2px solid ${theme.palette.blue.bright}`,
          outlineOffset: "2px",
        },
        "& .MuiTypography-root": {
          color: theme.palette.text.secondary,
        },
      }}
    >
      <Typography variant="subtitle2" component="span" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
      <ArrowForwardIcon
        sx={{ fontSize: "1rem", color: theme.palette.text.secondary }}
      />
    </Box>
  )
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
  onTourStart,
  onAddLocation,
}: BeatTextOverlayProps) {
  const theme = useTheme()
  const { setDrawerContent, openDrawer } = useDrawerStore()

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
  const levelsLineRef = useRef<HTMLDivElement>(null)
  const tierLegendRef = useRef<HTMLDivElement>(null)
  const beat2ItemRefs = useRef<(HTMLDivElement | null)[]>([])
  const eyebrowRefs = useRef<(HTMLDivElement | null)[]>([])
  const eyebrowDataRef = useRef<ColumnEyebrow[] | undefined>(undefined)
  eyebrowDataRef.current = beat2Layout?.eyebrows
  const beat2LayoutRef = useRef<Beat2Layout | null | undefined>(undefined)
  beat2LayoutRef.current = beat2Layout
  const scenarioHeaderRef = useRef<HTMLDivElement>(null)
  const calsimTextRef = useRef<HTMLDivElement>(null)
  const tourCtaRef = useRef<HTMLDivElement>(null)
  const addLocationCtaRef = useRef<HTMLDivElement>(null)
  const textHiddenRef = useRef(textHidden)
  textHiddenRef.current = textHidden

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

      if (beat2PanelRef.current) {
        const fadeIn = clamp01((v - 0.22) / 0.04)
        beat2PanelRef.current.style.opacity = String(fadeIn)
      }

      for (let i = 0; i < OUTCOME_CODE_ORDER.length; i++) {
        const el = beat2ItemRefs.current[i]
        if (!el) continue
        const itemStart = 0.24 + i * 0.035
        const fadeIn = clamp01((v - itemStart) / 0.03)
        el.style.opacity = String(fadeIn)
      }

      // Spread items apart to make room for distribution charts
      const SPREAD_START = 0.63
      const SPREAD_END = 0.66
      const spreadT = clamp01((v - SPREAD_START) / (SPREAD_END - SPREAD_START))
      const layoutItems = beat2LayoutRef.current?.items
      if (layoutItems) {
        for (let i = 0; i < layoutItems.length; i++) {
          const el = beat2ItemRefs.current[i]
          if (!el) continue
          el.style.marginBottom = `${layoutItems[i]!.spaceBelow * spreadT}px`
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

      if (levelsLineRef.current) {
        const fadeIn = clamp01((v - 0.54) / 0.04)
        levelsLineRef.current.style.opacity = String(fadeIn)
      }

      if (tierLegendRef.current) {
        const fadeIn = clamp01((v - 0.58) / 0.04)
        tierLegendRef.current.style.opacity = String(fadeIn)
      }
    })
    return unsub
  }, [progress])

  useEffect(() => {
    if (!interactive) {
      if (calsimTextRef.current) calsimTextRef.current.style.opacity = "0"
      if (scenarioHeaderRef.current)
        scenarioHeaderRef.current.style.opacity = "0"
      if (tourCtaRef.current) tourCtaRef.current.style.opacity = "0"
      if (addLocationCtaRef.current)
        addLocationCtaRef.current.style.opacity = "0"
      return
    }
    const t1 = setTimeout(() => {
      if (calsimTextRef.current) calsimTextRef.current.style.opacity = "1"
    }, 400)
    const t2 = setTimeout(() => {
      if (scenarioHeaderRef.current)
        scenarioHeaderRef.current.style.opacity = "1"
      if (addLocationCtaRef.current)
        addLocationCtaRef.current.style.opacity = "1"
    }, 1800)
    const t3 = setTimeout(() => {
      if (tourCtaRef.current) tourCtaRef.current.style.opacity = "1"
    }, 2800)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [interactive])

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
            component="h2"
            fontWeight={300}
            color="text.secondary"
          >
            Key outcomes
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
          <Typography variant="body1" component="p">
            Different water management scenarios bring water to different parts
            of the system.
          </Typography>
          <Box ref={beat2IntroRef} sx={{ mt: 2, opacity: 0 }}>
            <Typography variant="body1" component="p">
              We can group these parts of the system into categories.
            </Typography>
          </Box>
          <Box ref={levelsLineRef} sx={{ mt: 2, opacity: 0 }}>
            <Typography variant="body1" component="p">
              We can create levels of outcomes per location within these groups.
            </Typography>
          </Box>
          <Box
            ref={tierLegendRef}
            sx={{
              mt: 2.5,
              opacity: 0,
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            {(
              [
                { color: theme.palette.tiers.tier1, label: "Thriving" },
                { color: theme.palette.tiers.tier2, label: "Functioning" },
                { color: theme.palette.tiers.tier3, label: "At risk" },
                { color: theme.palette.tiers.tier4, label: "Critical" },
              ] as const
            ).map(({ color, label }) => (
              <Box
                key={label}
                sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
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
                <Typography variant="body1" component="span">
                  {label}
                </Typography>
              </Box>
            ))}
          </Box>
          {/* Calsim data beat - appears after morph completes */}
          <Box
            ref={calsimTextRef}
            sx={{ mt: 2.5, opacity: 0, transition: "opacity 0.6s ease" }}
          >
            <Typography
              component="p"
              variant="overline"
              sx={{
                "&&": {
                  color: theme.palette.grey[600],
                  fontSize: "0.7rem",
                  lineHeight: 1,
                  textShadow: "none",
                },
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                mb: 1,
              }}
            >
              S0020
            </Typography>
            <Typography variant="body1" component="p">
              This is the CalSim water allocation data for these locations for
              the Current operations water management scenario.
            </Typography>
          </Box>
          {/* Tour CTA - appears after scenario header */}
          <Box
            ref={tourCtaRef}
            sx={{
              mt: 3,
              opacity: 0,
              transition: "opacity 0.6s ease",
              pointerEvents: "auto",
              "& .MuiTypography-root": { textShadow: "none" },
            }}
          >
            <StoryCtaButton
              label="Take a tour of the data"
              onClick={onTourStart}
            />
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

      {/* Beat 2 - text items in flow layout */}
      <Box
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
        {/* Scenario header + encoding toggle */}
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
                  if (val) onEncodingChange(val as EncodingMode)
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

        {/* Two-column flow layout for outcome labels */}
        {beat2Layout && (
          <Box
            sx={{
              display: "flex",
              gap: "12px",
              px: 3,
              pt: 1.5,
              flex: 1,
              minHeight: 0,
            }}
          >
            {/* Left column - Consumptive uses */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {beat2Layout.eyebrows[0] && (
                <Box
                  ref={(el: HTMLDivElement | null) => {
                    eyebrowRefs.current[0] = el
                  }}
                  sx={{ opacity: 0, mb: 0.5 }}
                >
                  <Typography variant="smallSectionLabel" component="p">
                    {beat2Layout.eyebrows[0].label}
                  </Typography>
                </Box>
              )}
              {beat2Layout.items
                .map((item, i) => ({ item, i }))
                .filter(({ item }) => item.column === 0)
                .map(({ item, i }) => {
                  const isSelected = selectedOutcomeCode === item.code
                  return (
                    <Box
                      key={item.code}
                      ref={(el: HTMLDivElement | null) => {
                        beat2ItemRefs.current[i] = el
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
                        height: 20, // must match LAYOUT_LINE_HEIGHT in TierAnimationSection
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
                  )
                })}
              {/* "Add a location to track" CTA */}
              <Box
                ref={addLocationCtaRef}
                sx={{
                  opacity: 0,
                  transition: "opacity 0.6s ease",
                  pointerEvents: interactive ? "auto" : "none",
                  mt: 6,
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
            </Box>

            {/* Right column - Non-consumptive uses */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {beat2Layout.eyebrows[1] && (
                <Box
                  ref={(el: HTMLDivElement | null) => {
                    eyebrowRefs.current[1] = el
                  }}
                  sx={{ opacity: 0, mb: 0.5 }}
                >
                  <Typography variant="smallSectionLabel" component="p">
                    {beat2Layout.eyebrows[1].label}
                  </Typography>
                </Box>
              )}
              {beat2Layout.items
                .map((item, i) => ({ item, i }))
                .filter(({ item }) => item.column === 1)
                .map(({ item, i }) => {
                  const isSelected = selectedOutcomeCode === item.code
                  return (
                    <Box
                      key={item.code}
                      ref={(el: HTMLDivElement | null) => {
                        beat2ItemRefs.current[i] = el
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
                        height: 20, // must match LAYOUT_LINE_HEIGHT in TierAnimationSection
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
                  )
                })}
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

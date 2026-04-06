"use client"

import { useRef, useEffect, useMemo, useCallback } from "react"
import {
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
} from "@repo/ui/mui"
import type { MotionValue } from "@repo/motion"
import { OUTCOME_CODE_ORDER } from "../../../content/outcomes"
import type { EncodingMode } from "./OutcomeMorphOverlay"
import { HydroclimateChooser } from "../../scenarios/components/HydroclimateChooser"
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
  }[]
  eyebrows: ColumnEyebrow[]
}

interface BeatTextOverlayProps {
  progress: MotionValue<number>
  beat2Layout?: Beat2Layout | null
  onOutcomeClick?: (code: string, force?: boolean) => void
  selectedOutcomeCode?: string | null
  interactive?: boolean
  textHidden?: boolean
  scenarioName?: string
  scenarioDescription?: string
  encodingMode?: EncodingMode
  onEncodingChange?: (mode: EncodingMode) => void
  hydroclimate?: string
  onHydroclimateChange?: (value: string) => void
}

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v))
}

export default function BeatTextOverlay({
  progress,
  beat2Layout,
  onOutcomeClick,
  selectedOutcomeCode,
  interactive,
  textHidden = false,
  scenarioName,
  scenarioDescription,
  encodingMode,
  onEncodingChange,
  hydroclimate,
  onHydroclimateChange,
}: BeatTextOverlayProps) {
  const theme = useTheme()
  const { setDrawerContent, openDrawer } = useDrawerStore()

  const GLOSSARY_TERMS = useMemo(
    () => [
      { pattern: /\bTUCPs?\b/g, glossaryTerm: "Temporary Urgent Change Petitions (TUCPs)" },
      { pattern: /\bSGMA\b/g, glossaryTerm: "Sustainable Groundwater Management Act (SGMA)" },
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
  }, [scenarioDescription, GLOSSARY_TERMS, handleGlossaryClick, glossaryLinkStyles])

  const beat1Ref = useRef<HTMLDivElement>(null)
  const beat2PanelRef = useRef<HTMLDivElement>(null)
  const beat2IntroRef = useRef<HTMLDivElement>(null)
  const levelsLineRef = useRef<HTMLDivElement>(null)
  const tierLegendRef = useRef<HTMLDivElement>(null)
  const beat2ItemRefs = useRef<(HTMLDivElement | null)[]>([])
  const eyebrowRefs = useRef<(HTMLDivElement | null)[]>([])
  const eyebrowDataRef = useRef<ColumnEyebrow[] | undefined>(undefined)
  eyebrowDataRef.current = beat2Layout?.eyebrows
  const scenarioHeaderRef = useRef<HTMLDivElement>(null)
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
        const fadeIn = textHiddenRef.current
          ? 0
          : clamp01((v - 0.02) / 0.04)
        beat1Ref.current.style.opacity = String(fadeIn)
      }

      if (beat2IntroRef.current) {
        const fadeIn = clamp01((v - 0.3) / 0.04)
        beat2IntroRef.current.style.opacity = String(fadeIn)
      }

      if (beat2PanelRef.current) {
        const fadeIn = clamp01((v - 0.32) / 0.04)
        beat2PanelRef.current.style.opacity = String(fadeIn)
      }

      for (let i = 0; i < OUTCOME_CODE_ORDER.length; i++) {
        const el = beat2ItemRefs.current[i]
        if (!el) continue
        const itemStart = 0.34 + i * 0.035
        const fadeIn = clamp01((v - itemStart) / 0.03)
        el.style.opacity = String(fadeIn)
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
        const fadeIn = clamp01((v - 0.66) / 0.04)
        levelsLineRef.current.style.opacity = String(fadeIn)
      }

      if (tierLegendRef.current) {
        const fadeIn = clamp01((v - 0.7) / 0.04)
        tierLegendRef.current.style.opacity = String(fadeIn)
      }

      // TODO(beat3): restore beat 3 text fade
    })
    return unsub
  }, [progress])

  const padding = theme.space.panel.padding
  const textColor = theme.palette.undertone.warm
  const shadow = theme.textShadow.displayBody

  const beat1PanelWidth = {
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
      {/* Beat 1 */}
      <Box
        ref={beat1Ref}
        sx={{
          position: "absolute",
          top: "25%",
          left: "10%",
          p: padding,
          opacity: 0,
          width: beat1PanelWidth,
          "& .MuiTypography-root": {
            color: textColor,
            textShadow: shadow,
          },
        }}
      >
        <Typography variant="storyBody" component="p">
          Different water management scenarios bring water to different parts of
          the system.
        </Typography>
        <Box ref={beat2IntroRef} sx={{ mt: 2, opacity: 0 }}>
          <Typography variant="storyBody" component="p">
            We can group these parts of the system into categories.
          </Typography>
        </Box>
        <Box ref={levelsLineRef} sx={{ mt: 2, opacity: 0 }}>
          <Typography variant="storyBody" component="p">
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
              <Typography variant="storyBody" component="span">
                {label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Beat 2 — white backdrop on the right third */}
      <Box
        ref={beat2PanelRef}
        sx={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: "33.33%",
          zIndex: 3,
          backgroundColor: "rgba(255, 255, 255, 0.75)",
          opacity: 0,
        }}
      />

      {/* Beat 2 — text items, absolutely positioned from shared layout */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: "33.33%",
          zIndex: 5,
          "& .MuiTypography-root": {
            color: theme.palette.text.primary,
          },
        }}
      >
        {/* Scenario header + encoding toggle — top of overlay panel */}
        <Box
          ref={scenarioHeaderRef}
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            px: 3,
            pt: 2,
            pb: 1.5,
            pointerEvents: interactive ? "auto" : "none",
            opacity: interactive ? 1 : 0,
            transition: "opacity 0.4s ease",
            borderBottom: interactive
              ? `1px solid ${theme.palette.grey[200]}`
              : "none",
          }}
        >
          {scenarioName && (
            <Typography
              variant="subtitle1"
              component="h3"
              sx={{
                fontWeight: 600,
                mb: scenarioDescription ? 0.5 : 1.5,
              }}
            >
              {scenarioName}
            </Typography>
          )}
          {scenarioDescription && (
            <Typography
              variant="compactSubtitle"
              component="p"
              sx={{
                color: theme.palette.grey[500],
                mb: 1.5,
              }}
            >
              {descriptionWithLinks}
            </Typography>
          )}
          {encodingMode && onEncodingChange && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                mb: 0.5,
              }}
            >
              <ToggleButtonGroup
                value={encodingMode}
                exclusive
                onChange={(_, val) => {
                  if (val) onEncodingChange(val as EncodingMode)
                }}
                size="small"
                sx={{
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
                      color: "#fff",
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
              {onHydroclimateChange && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, ml: 1.5 }}>
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
          )}
        </Box>

        {beat2Layout?.eyebrows.map((eb, i) => (
          <Box
            key={`eyebrow-${i}`}
            ref={(el: HTMLDivElement | null) => {
              eyebrowRefs.current[i] = el
            }}
            style={{
              position: "absolute",
              top: eb.y,
              left: eb.x,
              width: eb.columnWidth,
              opacity: 0,
            }}
          >
            <Typography
              variant="smallSectionLabel"
              component="p"
            >
              {eb.label}
            </Typography>
          </Box>
        ))}

        {beat2Layout && (
          <>
            {beat2Layout.items.map((item, i) => {
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
                  style={{
                    position: "absolute",
                    top: item.y,
                    left: item.x,
                    width: item.columnWidth,
                    opacity: 0,
                  }}
                  sx={{
                    pointerEvents: interactive ? "auto" : "none",
                    cursor: interactive ? "pointer" : "default",
                    borderRadius: 1,
                    px: 0.5,
                    mx: -0.5,
                    transition: "color 0.15s",
                    ...(interactive && {
                      "&:hover .MuiTypography-root": {
                        color: theme.palette.blue.bright,
                      },
                    }),
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      ...theme.scenarios.panelTitle,
                      fontWeight: isSelected ? 600 : 400,
                      transition: "color 0.15s",
                    }}
                  >
                    {item.label}
                  </Typography>
                </Box>
              )
            })}
          </>
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
          width: beat1PanelWidth,
        }}
      >
        <Typography variant="storyBody" component="p">
          Each outcome has a group of researchers behind it. Click here to
          learn more about their methodologies.
        </Typography>
      </Box>
      */}
    </Box>
  )
}

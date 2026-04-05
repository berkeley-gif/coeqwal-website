"use client"

import { useRef, useEffect } from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import type { MotionValue } from "@repo/motion"
import { OUTCOME_CODE_ORDER } from "../../../content/outcomes"

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
}

interface BeatTextOverlayProps {
  progress: MotionValue<number>
  beat2Layout?: Beat2Layout | null
  onOutcomeClick?: (code: string) => void
  selectedOutcomeCode?: string | null
  interactive?: boolean
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
}: BeatTextOverlayProps) {
  const theme = useTheme()
  const beat1Ref = useRef<HTMLDivElement>(null)
  const beat2PanelRef = useRef<HTMLDivElement>(null)
  const beat2IntroRef = useRef<HTMLDivElement>(null)
  const levelsLineRef = useRef<HTMLDivElement>(null)
  const tierLegendRef = useRef<HTMLDivElement>(null)
  const beat2ItemRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const unsub = progress.on("change", (v) => {
      if (beat1Ref.current) {
        const fadeIn = clamp01((v - 0.02) / 0.04)
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
        zIndex: 3,
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
          backgroundColor: theme.background.whiteOverlay[85],
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
          "& .MuiTypography-root": {
            color: theme.palette.text.primary,
          },
        }}
      >
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
                    interactive ? () => onOutcomeClick?.(item.code) : undefined
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
                  }}
                >
                  <Typography
                    variant="storyBody"
                    sx={{ fontWeight: isSelected ? 600 : undefined }}
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

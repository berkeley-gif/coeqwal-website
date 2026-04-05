"use client"

import { useRef, useEffect } from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import type { MotionValue } from "@repo/motion"
import { OUTCOME_CODE_ORDER, getOutcomeName } from "../../../content/outcomes"

interface BeatTextOverlayProps {
  progress: MotionValue<number>
}

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v))
}

export default function BeatTextOverlay({ progress }: BeatTextOverlayProps) {
  const theme = useTheme()
  const beat1Ref = useRef<HTMLDivElement>(null)
  const beat2PanelRef = useRef<HTMLDivElement>(null)
  const beat2IntroRef = useRef<HTMLDivElement>(null)
  const beat2ItemRefs = useRef<(HTMLDivElement | null)[]>([])
  const beat2LevelsRef = useRef<HTMLDivElement>(null)
  const beat3Ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const unsub = progress.on("change", (v) => {
      if (beat1Ref.current) {
        const fadeIn = clamp01((v - 0.02) / 0.04)
        beat1Ref.current.style.opacity = String(fadeIn)
      }

      if (beat2PanelRef.current) {
        const fadeIn = clamp01((v - 0.18) / 0.04)
        beat2PanelRef.current.style.opacity = String(fadeIn)
      }

      if (beat2IntroRef.current) {
        const fadeIn = clamp01((v - 0.20) / 0.04)
        // TODO(beat3): restore fadeOut at 0.70 for beat 3 transition
        beat2IntroRef.current.style.opacity = String(fadeIn)
      }

      for (let i = 0; i < OUTCOME_CODE_ORDER.length; i++) {
        const el = beat2ItemRefs.current[i]
        if (!el) continue
        const itemStart = 0.22 + i * 0.015
        const fadeIn = clamp01((v - itemStart) / 0.03)
        el.style.opacity = String(fadeIn)
      }

      if (beat2LevelsRef.current) {
        const fadeIn = clamp01((v - 0.38) / 0.04)
        beat2LevelsRef.current.style.opacity = String(fadeIn)
      }

      // TODO(beat3): restore beat 3 text fade
      // if (beat3Ref.current) {
      //   const fadeIn = clamp01((v - 0.76) / 0.05)
      //   beat3Ref.current.style.opacity = String(fadeIn)
      // }
    })
    return unsub
  }, [progress])

  const padding = theme.space.panel.padding

  const textColor = theme.palette.undertone.warm
  const shadow = theme.textShadow.displayBody

  const panelWidth = {
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
          top: "40%",
          left: 0,
          p: padding,
          opacity: 0,
          width: panelWidth,
          "& .MuiTypography-root": {
            color: textColor,
            textShadow: shadow,
          },
        }}
      >
        <Typography variant="storyBody" component="p">
          Different water management scenarios bring water to different parts
          of the system.
        </Typography>
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
      <Box
        sx={{
          position: "absolute",
          top: 0,
          right: 0,
          px: padding,
          pt: theme.space.displayBlock.padding,
          pb: theme.space.displayBlock.padding,
          width: panelWidth,
          overflowY: "auto",
          maxHeight: "100%",
          "& .MuiTypography-root": {
            color: theme.palette.text.primary,
          },
        }}
      >
        <Box ref={beat2IntroRef} sx={{ opacity: 0 }}>
          <Typography variant="storyBody" component="p">
            We can group these parts of the system into categories:
          </Typography>
        </Box>
        <Box sx={{ mt: 2 }}>
          {OUTCOME_CODE_ORDER.map((code, i) => (
            <Box
              key={code}
              ref={(el: HTMLDivElement | null) => {
                beat2ItemRefs.current[i] = el
              }}
              sx={{ opacity: 0, mt: 0.75, mb: 1.5 }}
            >
              <Typography variant="storyBody">
                {getOutcomeName(code)}
              </Typography>
            </Box>
          ))}
        </Box>
        <Box ref={beat2LevelsRef} sx={{ opacity: 0, mt: 3 }}>
          <Typography variant="storyBody" component="p">
            We can create levels of outcome for each location within these
            groups.
          </Typography>
        </Box>
      </Box>

      {/* TODO(beat3): restore beat 3 text
      <Box
        ref={beat3Ref}
        sx={{
          position: "absolute",
          top: "25%",
          left: 0,
          p: padding,
          opacity: 0,
          width: panelWidth,
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

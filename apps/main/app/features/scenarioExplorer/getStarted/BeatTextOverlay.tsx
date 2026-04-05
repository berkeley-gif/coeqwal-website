"use client"

import { useRef, useEffect } from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import type { MotionValue } from "@repo/motion"

const KEY_OUTCOMES = [
  "Community water system deliveries",
  "Agricultural revenues",
  "River ecology",
  "Bay Delta estuary ecology",
  "Winter-run salmon abundance",
  "Freshwater for in-Delta uses",
  "Freshwater for Delta exports",
  "Reservoir storage",
  "Groundwater storage",
] as const

interface BeatTextOverlayProps {
  progress: MotionValue<number>
}

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v))
}

export default function BeatTextOverlay({ progress }: BeatTextOverlayProps) {
  const theme = useTheme()
  const beat1Ref = useRef<HTMLDivElement>(null)
  const beat2IntroRef = useRef<HTMLDivElement>(null)
  const beat2ItemRefs = useRef<(HTMLDivElement | null)[]>([])
  const beat3Ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const unsub = progress.on("change", (v) => {
      if (beat1Ref.current) {
        const fadeIn = clamp01((v - 0.02) / 0.04)
        const fadeOut = 1 - clamp01((v - 0.24) / 0.06)
        beat1Ref.current.style.opacity = String(Math.min(fadeIn, fadeOut))
      }

      if (beat2IntroRef.current) {
        const fadeIn = clamp01((v - 0.30) / 0.04)
        const fadeOut = 1 - clamp01((v - 0.70) / 0.05)
        beat2IntroRef.current.style.opacity = String(Math.min(fadeIn, fadeOut))
      }

      for (let i = 0; i < KEY_OUTCOMES.length; i++) {
        const el = beat2ItemRefs.current[i]
        if (!el) continue
        const itemStart = 0.34 + i * 0.035
        const fadeIn = clamp01((v - itemStart) / 0.03)
        const fadeOut = 1 - clamp01((v - 0.70) / 0.05)
        el.style.opacity = String(Math.min(fadeIn, fadeOut))
      }

      if (beat3Ref.current) {
        const fadeIn = clamp01((v - 0.76) / 0.05)
        beat3Ref.current.style.opacity = String(fadeIn)
      }
    })
    return unsub
  }, [progress])

  const padding = theme.space.panel.padding

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
          left: 0,
          p: padding,
          opacity: 0,
        }}
      >
        <Typography
          variant="h4"
          component="p"
          fontWeight={300}
          color="text.secondary"
          sx={{ maxWidth: theme.space.paragraphMaxSize }}
        >
          Different water management scenarios bring water to different parts
          of the system.
        </Typography>
      </Box>

      {/* Beat 2 */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          p: padding,
          pt: `calc(${padding} + 4vh)`,
        }}
      >
        <Box ref={beat2IntroRef} sx={{ opacity: 0 }}>
          <Typography
            variant="h4"
            component="p"
            fontWeight={300}
            color="text.secondary"
            sx={{ maxWidth: theme.space.paragraphMaxSize }}
          >
            We can group these parts of the system into categories:
          </Typography>
        </Box>
        <Box sx={{ mt: 2 }}>
          {KEY_OUTCOMES.map((outcome, i) => (
            <Box
              key={outcome}
              ref={(el: HTMLDivElement | null) => {
                beat2ItemRefs.current[i] = el
              }}
              sx={{ opacity: 0, mt: 0.75 }}
            >
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ maxWidth: theme.space.paragraphMaxSize }}
              >
                {outcome}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Beat 3 */}
      <Box
        ref={beat3Ref}
        sx={{
          position: "absolute",
          top: "25%",
          left: 0,
          p: padding,
          opacity: 0,
        }}
      >
        <Typography
          variant="h4"
          component="p"
          fontWeight={300}
          color="text.secondary"
          sx={{ maxWidth: theme.space.paragraphMaxSize }}
        >
          Each outcome has a group of researchers behind it. Click here to
          learn more about their methodologies.
        </Typography>
      </Box>
    </Box>
  )
}

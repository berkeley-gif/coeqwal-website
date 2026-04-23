"use client"

/**
 * ToolIntroStrip. Lightweight per-chart intro banner rendered inside
 * each tool panel as the first child. Visual idiom matches WelcomeStrip
 * (subtle blue tint, rounded corners, expanded card with copy + actions)
 * but content is tool-specific.
 *
 * Lifecycle:
 *   - First visit (per tool, persisted): auto-expanded.
 *   - User clicks "Got it": collapses for the rest of the session and
 *     persists the dismissal so future visits stay collapsed.
 *   - The toolbar info chip can pulse `reopenToolIntroPulse[mode]` to
 *     re-expand the strip on demand without touching the persisted flag.
 */

import React, { useEffect, useRef, useState } from "react"
import { Box, Typography, Button, useTheme, alpha, icons } from "@repo/ui/mui"
import { useScenarioExplorerStore, type ToolIntroMode } from "../store"

export interface ToolIntroBullet {
  label: string
  body?: string
}

interface ToolIntroStripProps {
  mode: ToolIntroMode
  title: string
  summary: string
  bullets?: ToolIntroBullet[]
  /** Tour step to jump to when "Take a tour" is clicked. If omitted,
   *  the tour starts from the beginning. */
  tourStep?: number
}

export default function ToolIntroStrip({
  mode,
  title,
  summary,
  bullets,
  tourStep,
}: ToolIntroStripProps) {
  const theme = useTheme()

  const seenToolIntro = useScenarioExplorerStore((s) => s.seenToolIntro)
  const reopenPulse = useScenarioExplorerStore(
    (s) => s.reopenToolIntroPulse[mode],
  )
  const markToolIntroSeen = useScenarioExplorerStore(
    (s) => s.markToolIntroSeen,
  )
  const startTour = useScenarioExplorerStore((s) => s.startTour)
  const setTourStep = useScenarioExplorerStore((s) => s.setTourStep)

  // Track local expansion. Initialize to "expanded" if the user has
  // never seen this tool's intro. Subsequent re-opens come from the
  // pulse counter changing.
  const [expanded, setExpanded] = useState<boolean>(!seenToolIntro[mode])

  // Re-expand when the toolbar fires a pulse (counter changes). Skip
  // the initial mount to avoid double-toggling alongside the auto-open.
  const prevPulseRef = useRef(reopenPulse)
  useEffect(() => {
    if (prevPulseRef.current !== reopenPulse) {
      prevPulseRef.current = reopenPulse
      setExpanded(true)
    }
  }, [reopenPulse])

  if (!expanded) return null

  const handleDismiss = () => {
    setExpanded(false)
    markToolIntroSeen(mode)
  }

  const handleTour = () => {
    setExpanded(false)
    markToolIntroSeen(mode)
    if (typeof tourStep === "number") setTourStep(tourStep)
    startTour()
  }

  const mutedColor = theme.palette.grey[700]

  return (
    <Box
      role="region"
      aria-label={`${title} intro`}
      sx={{
        flexShrink: 0,
        px: 2,
        py: 1.5,
        borderBottom: `1px solid ${theme.palette.divider}`,
        background: `linear-gradient(135deg, ${alpha(
          theme.palette.blue.bright,
          0.06,
        )} 0%, ${theme.palette.background.paper} 70%)`,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", lg: "row" },
          alignItems: { xs: "stretch", lg: "flex-start" },
          gap: { xs: 1.5, lg: 2.5 },
        }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            sx={{
              fontSize: "0.9375rem",
              fontWeight: 600,
              color: theme.palette.text.primary,
              lineHeight: 1.3,
              mb: 0.5,
            }}
          >
            {title}
          </Typography>
          <Typography
            sx={{
              fontSize: "0.8125rem",
              color: theme.palette.text.primary,
              lineHeight: 1.45,
              mb: bullets && bullets.length > 0 ? 1 : 0,
            }}
          >
            {summary}
          </Typography>
          {bullets && bullets.length > 0 && (
            <Box
              component="ul"
              sx={{
                m: 0,
                pl: 2.25,
                display: "flex",
                flexDirection: "column",
                gap: 0.4,
              }}
            >
              {bullets.map((b) => (
                <Box
                  component="li"
                  key={b.label}
                  sx={{
                    fontSize: "0.8125rem",
                    lineHeight: 1.45,
                    color: theme.palette.text.primary,
                  }}
                >
                  <Box component="span" sx={{ fontWeight: 600 }}>
                    {b.label}
                  </Box>
                  {b.body ? (
                    <Box component="span" sx={{ color: mutedColor }}>
                      {" "}
                      {b.body}
                    </Box>
                  ) : null}
                </Box>
              ))}
            </Box>
          )}
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
            justifyContent: { xs: "flex-end", lg: "flex-end" },
            flexShrink: 0,
            pt: { xs: 0, lg: 0.25 },
          }}
        >
          <Button
            size="small"
            onClick={handleTour}
            startIcon={<icons.PlayCircleOutline sx={{ fontSize: "1rem" }} />}
            sx={{
              textTransform: "none",
              color: theme.palette.blue.bright,
              fontSize: "0.8125rem",
              px: 1.25,
            }}
          >
            Take a tour
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={handleDismiss}
            sx={{
              textTransform: "none",
              fontSize: "0.8125rem",
              px: 1.5,
            }}
          >
            Got it
          </Button>
        </Box>
      </Box>
    </Box>
  )
}

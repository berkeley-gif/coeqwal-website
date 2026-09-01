"use client"

/**
 * VisualizeRail. Full-height CTA rail on the right edge of the List view.
 *
 * Nudges the user toward Bar mode once they've selected at least one
 * scenario — active once there's
 * something to visualize.
 */

import React, { useEffect } from "react"
import { motion, useReducedMotion, useAnimationControls } from "@repo/motion"
import { Box, Typography, useTheme, ArrowForwardIcon } from "@repo/ui/mui"
import { useTourAnchor } from "../../tour"

const RAIL_WIDTH = 90

interface VisualizeRailProps {
  active: boolean
  onClick: () => void
}
export default function VisualizeRail({ active, onClick }: VisualizeRailProps) {
  const theme = useTheme()
  const visualizeRailAnchorRef = useTourAnchor("list.startVisualizing")

  const controls = useAnimationControls()
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    if (active && !prefersReducedMotion) {
      controls.start({
        x: [0, 4, 0],
        transition: { duration: 1.4, repeat: Infinity, ease: "easeInOut" },
      })
    } else {
      controls.start({ x: 0, transition: { duration: 0.2, ease: "easeOut" } })
    }
  }, [active, prefersReducedMotion, controls])

  return (
    <Box
      ref={visualizeRailAnchorRef}
      component="button"
      type="button"
      disabled={!active}
      onClick={onClick}
      aria-label="Start visualizing: switch to Bar mode"
      sx={{
        flexShrink: 0,
        width: active ? RAIL_WIDTH : 0,
        overflow: "hidden",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        border: "none",
        borderLeft: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.tabPanels.explore,
        color: theme.palette.common.white,
        cursor: active ? "pointer" : "default",
        transition: "width 220ms ease",
        "&:hover": active ? { filter: "brightness(1.15)" } : {},
        "&:focus-visible": {
          outline: `2px solid ${theme.palette.blue.bright}`,
          outlineOffset: -2,
        },
      }}
    >
      <motion.div animate={controls} style={{ display: "flex" }}>
        <ArrowForwardIcon sx={{ fontSize: "1.25rem" }} />
      </motion.div>
      <Typography
        component="span"
        sx={{
          fontSize: "0.72rem",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          writingMode: "vertical-rl",
          whiteSpace: "nowrap",
          color: "inherit",
        }}
      >
        Start visualizing
      </Typography>
    </Box>
  )
}

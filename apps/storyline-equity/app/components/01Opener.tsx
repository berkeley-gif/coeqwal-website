"use client"

import { Box, Typography } from "@repo/ui/mui"

export default function Opener() {
  return (
    <Box component="section" className="hero">
      <Box className="hero-grid">
        <Box className="hero-copy">
          <span className="hero-kicker">Scrollytelling demo</span>
          <Typography variant="h1" className="hero-title">
            Who carries the cost of scarcity?
          </Typography>
          <Box className="scroll-cue">Scroll</Box>
        </Box>
        {/* intentionally minimal panel */}
      </Box>
    </Box>
  )
}

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
          <Typography variant="body1" className="hero-text">
            This equity story uses sticky sections to show how water shortages
            can land differently across households, farms, and ecosystems.
            Scroll down to see the narrative lock into place and respond to
            progress.
          </Typography>
          <Box className="scroll-cue">Scroll to begin</Box>
        </Box>

        <Box className="hero-panel">
          <Box className="hero-stat">
            <Box className="hero-stat-row">
              <span className="hero-stat-label">Story pattern</span>
              <span className="hero-stat-value">
                One opener, two sticky sections
              </span>
            </Box>
            <Box className="hero-stat-row">
              <span className="hero-stat-label">Scroll behavior</span>
              <span className="hero-stat-value">
                Sticky runway + progress hooks
              </span>
            </Box>
            <Box className="hero-stat-row">
              <span className="hero-stat-label">Library used</span>
              <span className="hero-stat-value">@repo/scrollytelling</span>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

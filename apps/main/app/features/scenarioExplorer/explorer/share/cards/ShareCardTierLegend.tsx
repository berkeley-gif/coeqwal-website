"use client"

/**
 * Compact tier legend used inside share cards whose captured chart
 * does not include its own tier-color key. Mirrors the canonical
 * 1 = Optimal / 2 = Acceptable / 3 = At-risk / 4 = Critical scale,
 * pulled from the theme palette so it stays in lockstep with every
 * other tier-colored visual on the site.
 *
 * Cards whose underlying chart already paints a tier legend (radar
 * ring labels, resilience heatmap legend strip, small-multiples
 * shared legend) deliberately do NOT mount this component to avoid
 * a redundant second key.
 */

import React from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { TIER_LABELS, type TierLevel } from "../../../../../content/tiers"

export interface ShareCardTierLegendProps {
  /** Optional sx merged onto the outer container. */
  sx?: object
}

const TIER_LEVELS: TierLevel[] = [1, 2, 3, 4]

export default function ShareCardTierLegend({ sx }: ShareCardTierLegendProps) {
  const theme = useTheme()
  const tiers = theme.palette.tiers

  const swatchColors: Record<TierLevel, string> = {
    1: tiers.tier1,
    2: tiers.tier2,
    3: tiers.tier3,
    4: tiers.tier4,
  }

  return (
    <Box
      role="group"
      aria-label="Tier color legend"
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        rowGap: 0.25,
        columnGap: 0.875,
        mt: 0.75,
        ...sx,
      }}
    >
      <Typography
        component="span"
        sx={{
          fontSize: "0.5625rem",
          fontWeight: 600,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: theme.palette.grey[500],
        }}
      >
        Tier scale
      </Typography>
      {TIER_LEVELS.map((level) => (
        <Box
          key={level}
          sx={{ display: "inline-flex", alignItems: "center", gap: 0.375 }}
        >
          <Box
            aria-hidden="true"
            sx={{
              width: 9,
              height: 9,
              borderRadius: theme.borderRadius.xs,
              backgroundColor: swatchColors[level],
              flexShrink: 0,
            }}
          />
          <Typography
            component="span"
            sx={{
              fontSize: "0.625rem",
              lineHeight: 1.3,
              color: theme.palette.grey[700],
            }}
          >
            <Box component="span" sx={{ fontWeight: 600, mr: 0.25 }}>
              {level}
            </Box>
            {TIER_LABELS[level]}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}

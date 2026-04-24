"use client"

import React from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"

const TIER_LEGEND_ITEMS = [
  {
    level: 1,
    toneKey: "tier1" as const,
    label: "Optimal",
    description: "Water supplies support strong, desired system performance.",
  },
  {
    level: 2,
    toneKey: "tier2" as const,
    label: "Acceptable",
    description: "Water supply shortages occur, but impacts remain manageable.",
  },
  {
    level: 3,
    toneKey: "tier3" as const,
    label: "At risk",
    description: "Water supply shortages lead to significant impacts.",
  },
  {
    level: 4,
    toneKey: "tier4" as const,
    label: "Critical",
    description: "Severe water supply shortages threaten long-term viability.",
  },
] as const

export interface TourTierLegendProps {
  title?: string
  /** Bare renders without outer border, padding, or title. Used when
   *  the legend is composed inside another framed block (e.g. the bar
   *  illustration's two-column grid). */
  bare?: boolean
  /** Compact drops the per-tier description, keeping swatch + "Tier N" +
   *  short label. */
  compact?: boolean
}

export default function TourTierLegend({
  title = "Tier legend",
  bare = false,
  compact = false,
}: TourTierLegendProps) {
  const theme = useTheme()

  const content = (
    <Box
      component="dl"
      sx={{
        m: 0,
        display: "grid",
        gap: compact ? 0.625 : 1,
      }}
    >
      {TIER_LEGEND_ITEMS.map((item) => (
        <Box
          key={item.level}
          sx={{
            display: "grid",
            gridTemplateColumns: compact
              ? "12px minmax(0, auto) 1fr"
              : "14px minmax(0, auto) 1fr",
            alignItems: "start",
            columnGap: compact ? 0.75 : 0.875,
            rowGap: 0.125,
          }}
        >
          <Box
            aria-hidden
            sx={{
              width: compact ? 12 : 14,
              height: compact ? 12 : 14,
              borderRadius: 0.5,
              bgcolor: theme.palette.tiers[item.toneKey],
              mt: compact ? 0.375 : 0.25,
              boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)",
            }}
          />
          <Typography
            component="dt"
            sx={{
              color: theme.palette.text.primary,
              fontSize: "0.75rem",
              fontWeight: 700,
              lineHeight: 1.4,
              whiteSpace: "nowrap",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            Tier {item.level}
          </Typography>
          <Box component="dd" sx={{ m: 0, minWidth: 0 }}>
            <Typography
              component="div"
              sx={{
                color: theme.palette.text.primary,
                fontSize: "0.75rem",
                fontWeight: 600,
                lineHeight: 1.4,
              }}
            >
              {item.label}
            </Typography>
            {!compact ? (
              <Typography
                component="div"
                sx={{
                  color: theme.palette.grey[700],
                  fontSize: "0.75rem",
                  lineHeight: 1.4,
                  mt: 0.125,
                }}
              >
                {item.description}
              </Typography>
            ) : null}
          </Box>
        </Box>
      ))}
    </Box>
  )

  if (bare) {
    return content
  }

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1.5,
        bgcolor: theme.palette.common.white,
        p: 1.5,
      }}
    >
      <Typography
        component="div"
        sx={{
          color: theme.palette.text.primary,
          fontSize: "0.6875rem",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          mb: 1,
        }}
      >
        {title}
      </Typography>
      {content}
    </Box>
  )
}

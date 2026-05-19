"use client"

/**
 * Multi-line hydroclimate badge for share cards: label on top, description
 * below, accent-tinted shell. Pass the hydroclimate value (e.g. `"cc50"`)
 * and the rest is pulled from `hydroclimateOptions` + `HYDROCLIMATE_CONFIG`.
 *
 * For the single-line toolbar pill (title only, no description), use the
 * `HydroclimateBadge` from `@repo/ui` with `getHydroclimateBadgeDisplay(hc)`
 */

import React from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import {
  hydroclimateOptions,
  type HydroclimateOption,
} from "../../../../../content/scenarios"
import { HYDROCLIMATE_CONFIG } from "../../../../scenarios/hydroclimateConfig"

interface HydroclimateBadgeProps {
  hydroclimate?: string
}

export default function HydroclimateBadge({
  hydroclimate,
}: HydroclimateBadgeProps) {
  const theme = useTheme()

  const climateOption: HydroclimateOption | undefined = hydroclimate
    ? hydroclimateOptions.find((o) => o.value === hydroclimate)
    : undefined
  const climateConfig = hydroclimate
    ? HYDROCLIMATE_CONFIG[hydroclimate]
    : undefined

  if (!climateOption || !climateConfig) return null

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "flex-start",
        gap: 0.5,
        backgroundColor: `${climateConfig.bgColor}0F`,
        border: `1px solid ${climateConfig.bgColor}28`,
        borderRadius: theme.borderRadius.sm,
        px: 0.75,
        py: 0.375,
        mb: 0.5,
      }}
    >
      <Box
        sx={{
          width: 7,
          height: 7,
          borderRadius: theme.borderRadius.circle,
          backgroundColor: climateConfig.bgColor,
          flexShrink: 0,
          mt: "3px",
        }}
      />
      <Box>
        <Typography
          sx={{
            fontSize: "0.625rem",
            lineHeight: 1.3,
            fontWeight: 600,
            color: theme.palette.grey[800],
          }}
        >
          {climateOption.label} hydroclimate
        </Typography>
        <Typography
          sx={{
            fontSize: "0.5625rem",
            lineHeight: 1.3,
            color: theme.palette.grey[600],
          }}
        >
          {climateOption.description}
        </Typography>
      </Box>
    </Box>
  )
}

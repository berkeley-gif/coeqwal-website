"use client"

/**
 * HydroclimateIcons - Colored hydroclimate icons packed inside a category circle
 *
 * Renders the 6 hydroclimate MUI icons as small colored circles arranged
 * inside a container circle, matching the visual style of ScenarioDots.
 */

import React from "react"
import { Box, useTheme } from "@repo/ui/mui"
import { hydroclimateOptions } from "../content/scenarios"
import { HYDROCLIMATE_CONFIG } from "../features/scenarios/components/HydroclimateChooser"

interface HydroclimateIconsProps {
  /** Diameter of the container circle in px */
  size: number
}

export default function HydroclimateIcons({ size }: HydroclimateIconsProps) {
  const theme = useTheme()
  const iconSize = Math.max(14, size * 0.22)
  const gap = 3

  const cols = 3

  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, ${iconSize}px)`,
          gap: `${gap}px`,
        }}
      >
        {hydroclimateOptions.map((option) => {
          const config = HYDROCLIMATE_CONFIG[option.value]
          if (!config) return null
          const IconComponent = config.icon
          const bgColor = config.bgColor

          return (
            <Box
              key={option.value}
              sx={{
                width: iconSize,
                height: iconSize,
                borderRadius: "50%",
                backgroundColor: bgColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <IconComponent
                sx={{
                  color: theme.palette.common.white,
                  fontSize: iconSize * 0.6,
                }}
              />
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

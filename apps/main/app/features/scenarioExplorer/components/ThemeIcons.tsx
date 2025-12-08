/**
 * Placeholder theme icons for non-baseline strategies
 * These are simple SVG circles with theme abbreviations
 * Replace with designed icons when available
 */

import React from "react"
import { Box } from "@repo/ui/mui"

interface ThemeIconProps {
  size?: number | string
}

/**
 * SGMA (Sustainable Groundwater Management Act) icon
 */
export function SGMAIcon({ size = "100%" }: ThemeIconProps) {
  return (
    <Box component="svg" viewBox="0 0 40 40" sx={{ width: size, height: size }}>
      <circle cx="20" cy="20" r="20" fill="#4A90A4" />
      <text
        x="20"
        y="17"
        textAnchor="middle"
        fill="white"
        fontSize="8"
        fontWeight="600"
        fontFamily="sans-serif"
      >
        SGMA
      </text>
      <text
        x="20"
        y="27"
        textAnchor="middle"
        fill="white"
        fontSize="7"
        fontWeight="400"
        fontFamily="sans-serif"
      >
        limits
      </text>
    </Box>
  )
}

/**
 * Environmental/Functional Flows theme icon
 */
export function EnvironmentalIcon({ size = "100%" }: ThemeIconProps) {
  return (
    <Box component="svg" viewBox="0 0 40 40" sx={{ width: size, height: size }}>
      <circle cx="20" cy="20" r="20" fill="#5A8F5A" />
      <text
        x="20"
        y="24"
        textAnchor="middle"
        fill="white"
        fontSize="9"
        fontWeight="600"
        fontFamily="sans-serif"
      >
        ENV
      </text>
    </Box>
  )
}

export function getThemeIcon(theme: string): React.ReactNode {
  switch (theme) {
    case "groundwater":
      return <SGMAIcon />
    case "environmental":
      return <EnvironmentalIcon />
    default:
      return null
  }
}

export function getThemeIconDescription(
  theme: string,
  strategyValue: string,
): string {
  switch (theme) {
    case "groundwater":
      if (strategyValue === "sgma-sj-valley") {
        return "SGMA groundwater pumping limits applied to San Joaquin Valley region"
      }
      if (strategyValue === "sgma-central-valley") {
        return "SGMA groundwater pumping limits applied across entire Central Valley"
      }
      return "Groundwater management scenario with pumping limits"
    case "environmental":
      return "Functional flows: Environmental flow requirements on tributaries and Delta"
    default:
      return "Current operations baseline"
  }
}

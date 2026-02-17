"use client"

/**
 * HydroclimateList - Formatted list of hydroclimates for the Climate category column
 *
 * Shows each hydroclimate with its colored icon, name, and truncated description.
 * Includes an introductory sentence explaining the role of hydroclimates.
 */

import React from "react"
import { Box, Typography } from "@repo/ui/mui"
import { TruncatedText } from "@repo/ui"
import { hydroclimateOptions } from "../content/scenarios"
import { HYDROCLIMATE_CONFIG } from "../features/scenarios/components/HydroclimateChooser"

interface HydroclimateListProps {
  /** Text and border color (adapts to light/dark backgrounds) */
  color?: string
}

const ICON_SIZE = 16

export default function HydroclimateList({
  color = "inherit",
}: HydroclimateListProps) {
  return (
    <Box sx={{ width: "100%" }}>
      {/* Intro text */}
      <Typography
        variant="compactTitle"
        component="p"
        sx={{
          color,
          fontWeight: 400,
          lineHeight: 1.4,
          mb: 1.5,
        }}
      >
        All scenarios are calculated through our historical California climate
        and potential future climates.
      </Typography>

      {/* Hydroclimate list */}
      <Box
        component="ul"
        sx={{
          listStyle: "none",
          m: 0,
          p: 0,
          display: "flex",
          flexDirection: "column",
          gap: 0.75,
          width: "100%",
        }}
      >
        {hydroclimateOptions.map((option) => {
          const config = HYDROCLIMATE_CONFIG[option.value]
          if (!config) return null
          const IconComponent = config.icon
          const bgColor = config.bgColor

          return (
            <Box
              component="li"
              key={option.value}
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 0.5,
                borderBottom: "1px solid",
                borderColor: `${color}18`,
                pb: 1.5,
                mb: 0.5,
                "&:last-child": { borderBottom: "none", pb: 0, mb: 0 },
              }}
            >
              {/* Icon + Name row */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                }}
              >
                <Box
                  sx={{
                    width: ICON_SIZE,
                    height: ICON_SIZE,
                    minWidth: ICON_SIZE,
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
                      color: "#ffffff",
                      fontSize: ICON_SIZE * 0.65,
                    }}
                  />
                </Box>
                <Typography
                  variant="compactTitle"
                  component="span"
                  sx={{
                    color,
                    fontWeight: 500,
                  }}
                >
                  {option.label}
                </Typography>
              </Box>

              {/* Description - indented past icon */}
              <TruncatedText
                variant="compactTitle"
                lines={2}
                sx={{
                  color,
                  opacity: 0.75,
                  fontWeight: 400,
                  lineHeight: 1.3,
                  pl: `${ICON_SIZE + 6}px`,
                }}
              >
                {option.description}
              </TruncatedText>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

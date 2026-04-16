"use client"

import React from "react"
import { Box, Typography, IconButton, useTheme, icons } from "@repo/ui/mui"
import {
  hydroclimateOptions,
  type HydroclimateOption,
} from "../../../content/scenarios"
import { HYDROCLIMATE_CONFIG } from "../../scenarios/components/HydroclimateChooser"

interface ShareRadarCardProps {
  scenarioNames: string[]
  scenarioColors?: string[]
  hydroclimate?: string
  showRange: boolean
  highlightBaseline: boolean
  showDotsOnly: boolean
  cachedImageDataUrl?: string
  onRemove?: () => void
}

export default function ShareRadarCard({
  scenarioNames,
  scenarioColors,
  hydroclimate,
  showRange,
  highlightBaseline,
  showDotsOnly,
  cachedImageDataUrl,
  onRemove,
}: ShareRadarCardProps) {
  const theme = useTheme()

  const climateOption: HydroclimateOption | undefined = hydroclimate
    ? hydroclimateOptions.find((o) => o.value === hydroclimate)
    : undefined
  const climateConfig = hydroclimate
    ? HYDROCLIMATE_CONFIG[hydroclimate]
    : undefined

  const title =
    scenarioNames.length === 1 ? "Radar: Single Scenario" : "Radar Comparison"

  const toggleLabels: string[] = []
  if (showRange) toggleLabels.push("Range shown")
  if (highlightBaseline) toggleLabels.push("Baseline highlighted")
  if (showDotsOnly) toggleLabels.push("Dots only")

  return (
    <Box
      sx={{
        position: "relative",
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: theme.borderRadius.sm ?? "6px",
        backgroundColor: theme.palette.background.paper,
        p: 1.5,
        mb: 1,
      }}
    >
      {onRemove && (
        <IconButton
          size="small"
          onClick={onRemove}
          sx={{
            position: "absolute",
            top: 4,
            right: 4,
            p: 0.25,
            color: theme.palette.grey[400],
            "&:hover": { color: theme.palette.grey[700] },
          }}
        >
          <icons.Close sx={{ fontSize: "0.875rem" }} />
        </IconButton>
      )}

      {/* Title */}
      <Typography
        variant="body2"
        sx={{
          fontWeight: 600,
          lineHeight: 1.3,
          color: theme.palette.grey[900],
          pr: onRemove ? 2.5 : 0,
        }}
      >
        {title}
      </Typography>

      {/* Scenario legend */}
      <Box sx={{ mt: 0.5, display: "flex", flexDirection: "column", gap: 0.25 }}>
        {scenarioNames.map((name, i) => (
          <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor:
                  scenarioColors?.[i] ?? theme.palette.grey[400],
                flexShrink: 0,
              }}
            />
            <Typography
              sx={{
                fontSize: "0.6875rem",
                lineHeight: 1.3,
                color: theme.palette.grey[700],
              }}
            >
              {name}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Hydroclimate badge + toggle states */}
      <Box sx={{ mt: 0.75 }}>
        {climateOption && climateConfig && (
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "flex-start",
              gap: 0.5,
              backgroundColor: `${climateConfig.bgColor}0F`,
              border: `1px solid ${climateConfig.bgColor}28`,
              borderRadius: "4px",
              px: 0.75,
              py: 0.375,
              mb: 0.5,
            }}
          >
            <Box
              sx={{
                width: 7,
                height: 7,
                borderRadius: "50%",
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
        )}

        {toggleLabels.length > 0 && (
          <Typography
            sx={{
              fontSize: "0.6875rem",
              lineHeight: 1.3,
              color: theme.palette.grey[500],
              display: "block",
            }}
          >
            {toggleLabels.join(" · ")}
          </Typography>
        )}
      </Box>

      {/* Radar chart image */}
      {cachedImageDataUrl ? (
        <Box
          component="img"
          src={cachedImageDataUrl}
          alt={title}
          sx={{
            width: "100%",
            height: "auto",
            objectFit: "contain",
            borderRadius: "4px",
            backgroundColor: "#fff",
            mt: 1,
          }}
        />
      ) : (
        <Box
          sx={{
            mt: 1,
            minHeight: 80,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: theme.palette.grey[400],
            fontSize: "0.75rem",
            border: `1px dashed ${theme.palette.divider}`,
            borderRadius: "4px",
          }}
        >
          Radar image not available
        </Box>
      )}
    </Box>
  )
}

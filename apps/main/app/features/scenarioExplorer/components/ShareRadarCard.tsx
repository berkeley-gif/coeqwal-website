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
  scenarioDefinitions?: string[]
  scenarioColors?: string[]
  hydroclimate?: string
  showRange: boolean
  highlightBaseline: boolean
  showDotsOnly: boolean
  cachedImageDataUrl?: string
  /**
   * Live-rendered radar used when no cached PNG is available (e.g.
   * share items restored from a URL that cannot embed large images).
   * The parent decides whether to mount this fallback so we only pay
   * the hook / render cost when it is actually needed.
   */
  liveChart?: React.ReactNode
  onRemove?: () => void
}

export default function ShareRadarCard({
  scenarioNames,
  scenarioDefinitions,
  scenarioColors,
  hydroclimate,
  showRange,
  highlightBaseline,
  showDotsOnly,
  cachedImageDataUrl,
  liveChart,
  onRemove,
}: ShareRadarCardProps) {
  const theme = useTheme()

  const climateOption: HydroclimateOption | undefined = hydroclimate
    ? hydroclimateOptions.find((o) => o.value === hydroclimate)
    : undefined
  const climateConfig = hydroclimate
    ? HYDROCLIMATE_CONFIG[hydroclimate]
    : undefined

  const isSingle = scenarioNames.length === 1

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

      {isSingle ? (
        <>
          {/* Single scenario: name + definition, same style as bar chart scorecard */}
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              lineHeight: 1.3,
              color: theme.palette.grey[900],
              pr: onRemove ? 2.5 : 0,
            }}
          >
            {scenarioNames[0]}
          </Typography>

          {scenarioDefinitions?.[0] && (
            <Typography
              sx={{
                fontSize: "0.6875rem",
                lineHeight: 1.4,
                color: theme.palette.grey[600],
                mt: 0.25,
                pr: onRemove ? 2.5 : 0,
              }}
            >
              {scenarioDefinitions[0]}
            </Typography>
          )}
        </>
      ) : (
        <>
          {/* Multi-scenario: "Radar Comparison" title + colored legend */}
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              lineHeight: 1.3,
              color: theme.palette.grey[900],
              pr: onRemove ? 2.5 : 0,
            }}
          >
            Radar Comparison
          </Typography>

          <Box
            sx={{
              mt: 0.5,
              display: "flex",
              flexDirection: "column",
              gap: 0.25,
            }}
          >
            {scenarioNames.map((name, i) => (
              <Box
                key={i}
                sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
              >
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
        </>
      )}

      {/* Hydroclimate badge + chart type label + toggle states */}
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

        <Typography
          sx={{
            fontSize: "0.6875rem",
            lineHeight: 1.3,
            color: theme.palette.grey[500],
            display: "block",
          }}
        >
          Radar chart
          {toggleLabels.length > 0 ? ` · ${toggleLabels.join(" · ")}` : ""}
        </Typography>
      </Box>

      {/* Radar chart: cached PNG > live fallback > placeholder. */}
      {cachedImageDataUrl ? (
        <Box
          component="img"
          src={cachedImageDataUrl}
          alt={isSingle ? scenarioNames[0] : "Radar Comparison"}
          sx={{
            width: "100%",
            height: "auto",
            objectFit: "contain",
            borderRadius: "4px",
            backgroundColor: theme.palette.common.white,
            mt: 1,
          }}
        />
      ) : liveChart ? (
        liveChart
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

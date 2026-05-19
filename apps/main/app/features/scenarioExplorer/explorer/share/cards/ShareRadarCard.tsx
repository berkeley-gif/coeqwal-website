"use client"

import React from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import ShareCardShell from "../ShareCardShell"
import HydroclimateBadge from "./HydroclimateBadge"
import ChartThumbnail from "./ChartThumbnail"

interface ShareRadarCardProps {
  scenarioNames: string[]
  scenarioDefinitions?: string[]
  scenarioColors?: string[]
  hydroclimate?: string
  showRange: boolean
  showTierZones?: boolean
  highlightBaseline: boolean
  showDotsOnly: boolean
  /**
   * Vector thumbnail captured by the off-screen radar host. Preferred
   * over `cachedImageDataUrl` because the card stays sharp at any
   * zoom and the SVG can be downloaded directly without re-rasterizing.
   */
  cachedSvg?: string
  cachedImageDataUrl?: string
  /**
   * Live-rendered radar used when neither cachedSvg nor
   * cachedImageDataUrl is available (e.g. share items restored from a
   * URL that cannot embed visual cache). The parent decides whether
   * to mount this fallback so we only pay the hook and render cost
   * when it is actually needed.
   */
  liveChart?: React.ReactNode
  onRemove?: () => void
  note?: string
  onNoteChange?: (note: string) => void
}

export default function ShareRadarCard({
  scenarioNames,
  scenarioDefinitions,
  scenarioColors,
  hydroclimate,
  showRange,
  showTierZones = true,
  highlightBaseline,
  showDotsOnly,
  cachedSvg,
  cachedImageDataUrl,
  liveChart,
  onRemove,
  note,
  onNoteChange,
}: ShareRadarCardProps) {
  const theme = useTheme()

  const isSingle = scenarioNames.length === 1
  const thumbnailLabel = isSingle
    ? (scenarioNames[0] ?? "Radar")
    : "Radar comparison"

  const toggleLabels: string[] = []
  if (showRange) toggleLabels.push("Range shown")
  if (showTierZones === false) toggleLabels.push("Tier bands off")
  if (highlightBaseline) toggleLabels.push("Baseline highlighted")
  if (showDotsOnly) toggleLabels.push("Dots only")

  return (
    <ShareCardShell
      onRemove={onRemove}
      note={note}
      onNoteChange={onNoteChange}
      removeAriaLabel="Remove radar from share tray"
    >
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
          {/* Multi-scenario: "Radar comparison" title + colored legend */}
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              lineHeight: 1.3,
              color: theme.palette.grey[900],
              pr: onRemove ? 2.5 : 0,
            }}
          >
            Radar comparison
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
                    borderRadius: theme.borderRadius.circle,
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
        <HydroclimateBadge hydroclimate={hydroclimate} />

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

      <ChartThumbnail
        cachedSvg={cachedSvg}
        cachedImageDataUrl={cachedImageDataUrl}
        liveChart={liveChart}
        ariaLabel={thumbnailLabel}
        variant="whiteSurface"
        placeholderLabel="Radar image not available"
      />
    </ShareCardShell>
  )
}

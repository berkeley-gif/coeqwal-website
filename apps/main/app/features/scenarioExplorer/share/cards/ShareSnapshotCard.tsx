"use client"

/**
 * Share card used by the equity (Distribution) and resilience tools.
 * Renders the captured SVG thumbnail when present, falls back to a
 * raster PNG, and finally to text-only chips so URL-restored items
 * still convey what was saved.
 */

import React from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import ShareCardShell from "../ShareCardShell"
import HydroclimateBadge from "./HydroclimateBadge"
import ChartThumbnail from "./ChartThumbnail"

interface ShareSnapshotCardProps {
  id: string
  /** Tool label, e.g. "Distribution" or "Resilience heatmap". */
  toolLabel: string
  /** Short human description of what was captured. */
  title: string
  /**
   * Longer scenario definition shown below the title in the same
   * style the bar chart and radar cards use for their definition
   * line. Distribution and resilience scenario-solo cards pass the
   * scenario's `info.definition` here so every card type carries
   * the same context block.
   */
  scenarioDefinition?: string
  /** Additional context line shown under the title. */
  subtitle?: string
  /** Context chips, each a short phrase. */
  chips?: string[]
  /** Primary climate the snapshot was taken at, if any. */
  hydroclimate?: string
  /** Serialized SVG thumbnail. Preferred over cachedImageDataUrl. */
  cachedSvg?: string
  /** PNG fallback (used when no SVG is available). */
  cachedImageDataUrl?: string
  /**
   * Live-rendered chart to show when no cached SVG or PNG is
   * available (e.g. items restored from a URL that cannot embed
   * visual cache). The parent decides whether to mount this fallback
   * so we only pay the hook and render cost when it is actually
   * needed.
   */
  liveChart?: React.ReactNode
  note?: string
  onNoteChange?: (note: string) => void
  onRemove?: (id: string) => void
}

export default function ShareSnapshotCard({
  id,
  toolLabel,
  title,
  scenarioDefinition,
  subtitle,
  chips = [],
  hydroclimate,
  cachedSvg,
  cachedImageDataUrl,
  liveChart,
  note,
  onNoteChange,
  onRemove,
}: ShareSnapshotCardProps) {
  const theme = useTheme()

  return (
    <ShareCardShell
      onRemove={onRemove ? () => onRemove(id) : undefined}
      note={note}
      onNoteChange={onNoteChange}
      removeAriaLabel="Remove snapshot"
    >
      <Typography
        variant="caption"
        sx={{
          display: "block",
          color: theme.palette.blue.bright,
          fontWeight: 600,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          mb: 0.25,
        }}
      >
        {toolLabel}
      </Typography>

      <Typography
        variant="body2"
        sx={{
          fontWeight: 600,
          color: theme.palette.text.primary,
          pr: 3,
        }}
      >
        {title}
      </Typography>

      {scenarioDefinition && (
        <Typography
          sx={{
            fontSize: "0.6875rem",
            lineHeight: 1.4,
            color: theme.palette.grey[600],
            mt: 0.25,
            pr: 3,
          }}
        >
          {scenarioDefinition}
        </Typography>
      )}

      {subtitle && (
        <Typography
          variant="caption"
          sx={{
            display: "block",
            color: theme.palette.text.secondary,
            mt: 0.25,
          }}
        >
          {subtitle}
        </Typography>
      )}

      {hydroclimate && (
        <Box sx={{ mt: 0.75 }}>
          <HydroclimateBadge hydroclimate={hydroclimate} />
        </Box>
      )}

      <ChartThumbnail
        cachedSvg={cachedSvg}
        cachedImageDataUrl={cachedImageDataUrl}
        liveChart={liveChart}
        ariaLabel={title}
        variant="bordered"
      />

      {chips.length > 0 && (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 0.5,
            mt: 0.75,
          }}
        >
          {chips.map((chip) => (
            <Box
              key={chip}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                px: 0.75,
                py: 0.25,
                fontSize: "0.6875rem",
                fontWeight: 500,
                borderRadius: theme.borderRadius.lg,
                backgroundColor: theme.palette.grey[100],
                color: theme.palette.text.primary,
              }}
            >
              {chip}
            </Box>
          ))}
        </Box>
      )}
    </ShareCardShell>
  )
}

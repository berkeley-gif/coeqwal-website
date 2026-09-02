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
import type { ShareFigureFooter } from "../figureFooter"
import HydroclimateBadge from "./HydroclimateBadge"
import ChartThumbnail from "./ChartThumbnail"
import ShareCardTierLegend from "./ShareCardTierLegend"

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
  /**
   * When true, the card mounts a compact tier-color legend below the
   * thumbnail. Use for variants whose captured chart paints tier
   * colors but does not include its own legend (Distribution /
   * TierGrid). Skip for charts whose SVG already carries a tier
   * legend (resilience heatmap and small multiples) to avoid a
   * duplicated key.
   */
  showTierLegend?: boolean
  note?: string
  onNoteChange?: (note: string) => void
  onRemove?: (id: string) => void
  /** Color key for the plotted members: one labeled swatch per row. Give it
   *  to any variant whose captured chart draws several colored series but
   *  carries no legend of its own. */
  legend?: { label: string; color: string }[]
  /** Label and value rows naming exactly what the figure shows (variable,
   *  view, members, water years, units), so an exported figure reads without
   *  the surrounding page. */
  figureFacts?: { label: string; value: string }[]
  /** Provenance footer rendered by the shell inside the exported area. */
  figureFooter?: ShareFigureFooter
  /** Width over height of the captured chart; the thumbnail box takes it so
   *  the chart is not letterboxed. Default 1. */
  thumbnailAspectRatio?: number
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
  showTierLegend = false,
  legend,
  figureFacts,
  note,
  onNoteChange,
  onRemove,
  figureFooter,
  thumbnailAspectRatio = 1,
}: ShareSnapshotCardProps) {
  const theme = useTheme()

  return (
    <ShareCardShell
      figureFooter={figureFooter}
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
            // Not text.secondary: that token is the theme's white, which is
            // the card's own background, so the line rendered invisible.
            color: theme.palette.grey[600],
            mt: 0.25,
          }}
        >
          {subtitle}
        </Typography>
      )}

      {figureFacts && figureFacts.length > 0 && (
        <Box
          sx={{
            mt: 0.75,
            display: "flex",
            flexDirection: "column",
            gap: 0.25,
          }}
        >
          {figureFacts.map((fact) => (
            <Box key={fact.label} sx={{ display: "flex", gap: 0.5 }}>
              <Typography
                sx={{
                  fontSize: "0.6875rem",
                  lineHeight: 1.35,
                  color: theme.palette.grey[500],
                  minWidth: 76,
                  flexShrink: 0,
                }}
              >
                {fact.label}
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.6875rem",
                  lineHeight: 1.35,
                  color: theme.palette.grey[700],
                }}
              >
                {fact.value}
              </Typography>
            </Box>
          ))}
        </Box>
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
        aspectRatio={thumbnailAspectRatio}
      />

      {showTierLegend && <ShareCardTierLegend />}

      {legend && legend.length > 0 && (
        <Box
          sx={{
            mt: 0.75,
            display: "flex",
            flexDirection: "column",
            gap: 0.25,
          }}
        >
          {legend.map((row) => (
            <Box
              key={row.label}
              sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
            >
              <Box
                data-share-legend-swatch=""
                role="img"
                aria-label={`Legend: ${row.label}`}
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: theme.borderRadius.circle,
                  // A row without a color (an unknown compare scope) still
                  // paints a neutral swatch instead of an invisible one.
                  backgroundColor: row.color || theme.palette.grey[400],
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
                {row.label}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

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

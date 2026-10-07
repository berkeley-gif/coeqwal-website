"use client"

/**
 * ShareFigureCard - share card in the standardized figure-template layout:
 * tool eyebrow and chart kind, the held-dimension table, optional panel
 * headings (Stats), the chart, a legend headed by the compared dimension, and
 * a SOURCE footer. Exports rasterize this card, so the layout here IS the
 * exported figure. Rows come from `buildFigureTemplate` (../figureTemplate).
 */

import React from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import ShareCardShell from "../ShareCardShell"
import type { ShareFigureFooter } from "../figureFooter"
import type { FigureTemplate } from "../figureTemplate"
import ChartThumbnail from "./ChartThumbnail"
import ShareCardTierLegend from "./ShareCardTierLegend"
import FigureRows from "./FigureRows"

export interface ShareFigureCardProps {
  id: string
  template: FigureTemplate
  /** Stats plots: one heading per bar panel, left to right */
  panelHeadings?: string[]
  cachedSvg?: string
  cachedImageDataUrl?: string
  liveChart?: React.ReactNode
  /** Width over height of the captured chart or image. Default 1. */
  thumbnailAspectRatio?: number
  /** Color key for the compared members */
  legend?: { label: string; color: string }[]
  /** Tier-color key, for figures colored by tier (maps) */
  showTierLegend?: boolean
  figureFooter?: ShareFigureFooter
  /** Shown instead of a blank box when there is no image (URL-restored) */
  emptyImageText?: string
  note?: string
  onNoteChange?: (note: string) => void
  onRemove?: (id: string) => void
}

export default function ShareFigureCard({
  id,
  template,
  panelHeadings,
  cachedSvg,
  cachedImageDataUrl,
  liveChart,
  thumbnailAspectRatio = 1,
  legend,
  showTierLegend = false,
  figureFooter,
  emptyImageText,
  note,
  onNoteChange,
  onRemove,
}: ShareFigureCardProps) {
  const theme = useTheme()
  const hasImage = Boolean(cachedSvg || cachedImageDataUrl || liveChart)
  const ariaLabel = [
    template.toolLabel,
    template.chartKindLabel,
    ...template.rows.map((r) => r.value),
  ].join(", ")

  return (
    <ShareCardShell
      figureFooter={figureFooter}
      footerHeading="Source"
      onRemove={onRemove ? () => onRemove(id) : undefined}
      note={note}
      onNoteChange={onNoteChange}
      removeAriaLabel="Remove snapshot"
    >
      <Box
        data-share-figure-header=""
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 1,
          pr: 3,
          mb: 0.75,
        }}
      >
        <Typography
          sx={{
            fontSize: "0.875rem",
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: theme.palette.blue.bright,
          }}
        >
          {template.toolLabel}
        </Typography>
        <Typography
          sx={{
            fontSize: "0.625rem",
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: theme.palette.grey[600],
            whiteSpace: "nowrap",
          }}
        >
          {template.chartKindLabel}
        </Typography>
      </Box>

      <FigureRows rows={template.rows} />

      {panelHeadings && panelHeadings.length > 0 && (
        <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
          {panelHeadings.map((heading) => (
            <Typography
              key={heading}
              sx={{
                flex: 1,
                textAlign: "center",
                fontSize: "0.5625rem",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: theme.palette.grey[700],
              }}
            >
              {heading}
            </Typography>
          ))}
        </Box>
      )}

      {hasImage ? (
        <ChartThumbnail
          cachedSvg={cachedSvg}
          cachedImageDataUrl={cachedImageDataUrl}
          liveChart={liveChart}
          ariaLabel={ariaLabel}
          variant="bordered"
          aspectRatio={thumbnailAspectRatio}
        />
      ) : (
        <Typography
          role="note"
          sx={{
            mt: 1,
            p: 1.5,
            fontSize: "0.75rem",
            color: theme.palette.grey[700],
            border: `1px dashed ${theme.palette.divider}`,
            borderRadius: theme.borderRadius.sm,
            textAlign: "center",
          }}
        >
          {emptyImageText ?? "Image not available."}
        </Typography>
      )}

      {legend && legend.length > 0 && (
        <Box sx={{ mt: 0.75 }}>
          {template.legendHeading && (
            <Typography
              sx={{
                fontSize: "0.625rem",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: theme.palette.grey[700],
                mb: 0.25,
              }}
            >
              {template.legendHeading}
            </Typography>
          )}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
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
        </Box>
      )}

      {showTierLegend && <ShareCardTierLegend />}
    </ShareCardShell>
  )
}

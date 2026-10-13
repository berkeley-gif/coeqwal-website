"use client"

/**
 * MapFigureCaption - the map panel's header: when an outcome is mapped, a
 * compact figure-template card (Outcome, Strategy, Hydroclimate) plus a
 * tier-color legend; otherwise the hydroclimate badge alone, as before.
 */

import { Box, Typography, useTheme } from "@repo/ui/mui"
import { HydroclimateBadge } from "@repo/ui"
import { buildFigureTemplate } from "../../../share/figureTemplate"
import FigureRows from "../../../share/cards/FigureRows"
import ShareCardTierLegend from "../../../share/cards/ShareCardTierLegend"
import { useMapFigureSpec } from "./useMapFigureSpec"

export interface MapFigureCaptionProps {
  hydroBadge: { title: string; accentColor: string } | null
}

export default function MapFigureCaption({
  hydroBadge,
}: MapFigureCaptionProps) {
  const theme = useTheme()
  const spec = useMapFigureSpec()

  if (!spec) {
    return hydroBadge ? (
      <HydroclimateBadge
        title={hydroBadge.title}
        accentColor={hydroBadge.accentColor}
        surface="solid"
      />
    ) : null
  }

  const template = buildFigureTemplate(spec)
  return (
    <Box
      role="region"
      aria-label="Map description"
      sx={{
        width: "100%",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: theme.borderRadius.sm,
        boxShadow: theme.shadows[2],
        px: 1.5,
        py: 1,
        // Nothing here is interactive: let drags and marker hovers reach
        // the map underneath.
        pointerEvents: "none",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 1,
          mb: 0.5,
        }}
      >
        <Typography
          sx={{
            fontSize: "0.75rem",
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
            fontSize: "0.5625rem",
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
      <FigureRows rows={template.rows} compact />
      <ShareCardTierLegend sx={{ mt: 0.75 }} />
    </Box>
  )
}

"use client"

/**
 * MapFigureCaption - the map panel's header: when an outcome is mapped, a
 * compact figure-template card (Outcome, Strategy, Hydroclimate) plus a
 * tier-color legend and a "save map" button that stages the map in the
 * Share tray. With nothing mapped it renders nothing: the toolbar already
 * names the hydroclimate, and a caption over an empty map describes nothing.
 */

import { Box, Typography, useTheme } from "@repo/ui/mui"
import { buildFigureTemplate } from "../../../share/figureTemplate"
import FigureRows from "../../../share/cards/FigureRows"
import ShareCardTierLegend from "../../../share/cards/ShareCardTierLegend"
import { useMapFigureSpec } from "./useMapFigureSpec"
import { SaveSnapshotButton } from "../actions/SaveSnapshotButton"
import { useMapShareCapture } from "../../hooks/useMapShareCapture"

export default function MapFigureCaption() {
  const theme = useTheme()
  const spec = useMapFigureSpec()
  const { saveMap, canSave, error, clearError } = useMapShareCapture()

  if (!spec) return null

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
          alignItems: "center",
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
            ml: "auto",
          }}
        >
          {template.chartKindLabel}
        </Typography>
        <SaveSnapshotButton
          label="save map"
          disabled={!canSave}
          onClick={() => void saveMap()}
          // The caption lets pointer input through to the map; the button
          // opts back in.
          sx={{ pointerEvents: "auto" }}
        />
      </Box>
      <FigureRows rows={template.rows} compact />
      {error && (
        <Typography
          role="alert"
          sx={{
            mt: 0.5,
            fontSize: "0.6875rem",
            color: theme.palette.error.main,
            pointerEvents: "auto",
          }}
        >
          {error}{" "}
          <Box
            component="button"
            type="button"
            onClick={clearError}
            sx={{
              border: 0,
              background: "none",
              color: "inherit",
              textDecoration: "underline",
              cursor: "pointer",
              p: 0,
            }}
          >
            Dismiss
          </Box>
        </Typography>
      )}
      <ShareCardTierLegend sx={{ mt: 0.75 }} />
    </Box>
  )
}

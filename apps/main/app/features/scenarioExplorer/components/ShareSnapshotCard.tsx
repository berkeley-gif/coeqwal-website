"use client"

/**
 * ShareSnapshotCard. Text-forward share card for tools whose full
 * image capture isn't wired yet (equity, resilience). Renders the
 * important state (outcomes, scenarios, climate, encoding) as chips
 * so the saved context is readable at a glance, and supports inline
 * notes the user adds to explain why they saved it.
 *
 * When a cachedImageDataUrl becomes available in the future, callers
 * can pass it to render a thumbnail above the chip list; the card
 * gracefully degrades to text-only when it's absent.
 */

import React, { useState } from "react"
import {
  Box,
  Typography,
  IconButton,
  TextField,
  useTheme,
  icons,
  alpha,
} from "@repo/ui/mui"
import type { HydroclimateOption } from "../../../content/scenarios"
import { hydroclimateOptions } from "../../../content/scenarios"

interface ShareSnapshotCardProps {
  id: string
  /** Tool label, e.g. "Distribution" or "Resilience heatmap". */
  toolLabel: string
  /** Short human description of what was captured. */
  title: string
  /** Additional context line shown under the title. */
  subtitle?: string
  /** Context chips, each a short phrase. */
  chips?: string[]
  /** Primary climate the snapshot was taken at, if any. */
  hydroclimate?: string
  cachedImageDataUrl?: string
  /**
   * Live-rendered chart to show when no cached PNG is available (e.g.
   * items restored from a URL that cannot embed large images). The
   * parent decides whether to mount this fallback so we only pay the
   * hook / render cost when it is actually needed.
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
  subtitle,
  chips = [],
  hydroclimate,
  cachedImageDataUrl,
  liveChart,
  note,
  onNoteChange,
  onRemove,
}: ShareSnapshotCardProps) {
  const theme = useTheme()
  const [editing, setEditing] = useState(false)

  const climateOption: HydroclimateOption | undefined = hydroclimate
    ? hydroclimateOptions.find((o) => o.value === hydroclimate)
    : undefined

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
          onClick={() => onRemove(id)}
          sx={{
            position: "absolute",
            top: 4,
            right: 4,
            p: 0.25,
            color: theme.palette.grey[400],
            "&:hover": { color: theme.palette.grey[700] },
          }}
          aria-label="Remove snapshot"
        >
          <icons.Close sx={{ fontSize: "0.875rem" }} />
        </IconButton>
      )}

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

      {cachedImageDataUrl ? (
        <Box
          sx={{
            mt: 1,
            borderRadius: 1,
            overflow: "hidden",
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box
            component="img"
            src={cachedImageDataUrl}
            alt={title}
            sx={{
              display: "block",
              width: "100%",
              height: "auto",
            }}
          />
        </Box>
      ) : (
        (liveChart ?? null)
      )}

      {(chips.length > 0 || climateOption) && (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 0.5,
            mt: 0.75,
          }}
        >
          {climateOption && (
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                px: 0.75,
                py: 0.25,
                fontSize: "0.6875rem",
                fontWeight: 500,
                borderRadius: "10px",
                backgroundColor: alpha(theme.palette.blue.bright, 0.1),
                color: theme.palette.blue.dark,
              }}
            >
              {climateOption.label}
            </Box>
          )}
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
                borderRadius: "10px",
                backgroundColor: theme.palette.grey[100],
                color: theme.palette.text.primary,
              }}
            >
              {chip}
            </Box>
          ))}
        </Box>
      )}

      {/* Inline note editor. When a note exists it renders as a muted
          caption; clicking enters edit mode. The beginner flow is
          intentionally light here: no required fields, just an
          optional "why I saved this". */}
      <Box sx={{ mt: 1 }}>
        {editing ? (
          <TextField
            autoFocus
            multiline
            size="small"
            fullWidth
            minRows={2}
            maxRows={4}
            placeholder="Why did you save this? Your notes will show up on the Share page."
            value={note ?? ""}
            onChange={(e) => onNoteChange?.(e.target.value)}
            onBlur={() => setEditing(false)}
            sx={{ fontSize: "0.8125rem" }}
          />
        ) : note ? (
          <Box
            component="button"
            type="button"
            onClick={() => setEditing(true)}
            sx={{
              width: "100%",
              textAlign: "left",
              border: "none",
              background: "transparent",
              cursor: "text",
              p: 0,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.secondary,
                fontStyle: "italic",
                display: "block",
                whiteSpace: "pre-wrap",
                lineHeight: 1.4,
              }}
            >
              {note}
            </Typography>
          </Box>
        ) : (
          onNoteChange && (
            <Box
              component="button"
              type="button"
              onClick={() => setEditing(true)}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.25,
                fontSize: "0.75rem",
                border: "none",
                background: "transparent",
                color: theme.palette.blue.bright,
                cursor: "pointer",
                p: 0,
                "&:hover": { textDecoration: "underline" },
              }}
            >
              <icons.EditNote sx={{ fontSize: "0.875rem" }} />
              Add a note
            </Box>
          )
        )}
      </Box>
    </Box>
  )
}

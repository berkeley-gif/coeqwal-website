"use client"

/**
 * ShareCardShell
 *
 * Common chrome for every share card. Owns the outer Box (border,
 * radius, padding, margin), the optional close-button overlay in the
 * top-right corner, and the editable note block at the bottom.
 *
 * Per-variant cards render their header and thumbnail content as
 * children. Centralizing the chrome keeps spacing, colors, and the
 * remove-button affordance consistent across barChart, radar,
 * equity, and resilience cards.
 */

import React from "react"
import { Box, IconButton, useTheme, icons } from "@repo/ui/mui"
import ShareItemNoteBlock from "./note/ShareItemNoteBlock"

export interface ShareCardShellProps {
  children: React.ReactNode
  note?: string
  onNoteChange?: (note: string) => void
  /** When provided, renders the close-button overlay top-right. */
  onRemove?: () => void
  /** Accessible label for the close button. */
  removeAriaLabel?: string
}

export default function ShareCardShell({
  children,
  note,
  onNoteChange,
  onRemove,
  removeAriaLabel = "Remove from share tray",
}: ShareCardShellProps) {
  const theme = useTheme()
  return (
    <Box
      sx={{
        position: "relative",
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: theme.borderRadius.sm,
        backgroundColor: theme.palette.background.paper,
        p: 1.5,
        mb: 1,
      }}
    >
      {onRemove && (
        <IconButton
          size="small"
          onClick={onRemove}
          aria-label={removeAriaLabel}
          data-share-export-ignore=""
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
      {children}
      <ShareItemNoteBlock note={note} onNoteChange={onNoteChange} />
    </Box>
  )
}

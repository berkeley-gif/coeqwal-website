"use client"

import React, { useState } from "react"
import { Box, TextField, Typography, useTheme, icons } from "@repo/ui/mui"

export const SHARE_NOTE_PLACEHOLDER =
  "Why did you save this? (experimental feature)"

interface ShareItemNoteBlockProps {
  note?: string
  onNoteChange?: (note: string) => void
}

/**
 * Optional note for any share card. The tray card uses [data-share-note] so
 * clicks here do not toggle the card. We avoid wrapping handlers that could
 * interfere with the inner control.
 */
export default function ShareItemNoteBlock({
  note,
  onNoteChange,
}: ShareItemNoteBlockProps) {
  const theme = useTheme()
  const [editing, setEditing] = useState(false)

  if (!onNoteChange) {
    return null
  }

  const body2Sx = { ...theme.typography.body2 }
  const inputClassSx = {
    "& .MuiInputBase-input": { ...body2Sx },
  }

  // In this app `palette.text.secondary` is white (for use on dark/tinted
  // areas). On `background.paper` use explicit blues/greys, not text.secondary.
  const linkBlue =
    "blue" in theme.palette && theme.palette.blue
      ? theme.palette.blue.bright
      : theme.palette.primary.main

  return (
    <Box data-share-note="" sx={{ mt: 1 }}>
      {editing ? (
        <TextField
          autoFocus
          multiline
          size="small"
          fullWidth
          minRows={2}
          maxRows={4}
          placeholder={SHARE_NOTE_PLACEHOLDER}
          value={note ?? ""}
          onChange={(e) => onNoteChange(e.target.value)}
          onBlur={() => setEditing(false)}
          sx={inputClassSx}
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
            variant="body2"
            sx={{
              color: theme.palette.grey[800],
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
        <Box
          component="button"
          type="button"
          onClick={() => setEditing(true)}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.25,
            width: "100%",
            m: 0,
            p: 0,
            border: "none",
            background: "none",
            cursor: "pointer",
            textAlign: "left",
            textDecoration: "none",
            ...theme.typography.body2,
            color: linkBlue,
          }}
        >
          <icons.EditNote
            sx={{ fontSize: "1.125rem", flexShrink: 0, color: "currentColor" }}
          />
          <Typography
            component="span"
            variant="body2"
            sx={{ color: "currentColor" }}
          >
            Add a note
          </Typography>
        </Box>
      )}
    </Box>
  )
}

"use client"

/**
 * AddedEntityChips - the row of removable chips for entities a user has added
 * to a section (CWS demand units today, other entity types as sections grow).
 *
 * Presentational only: the parent owns the list and the remove handler.
 * Designed to sit inside a ChartGridProvider grid, so it spans all columns.
 */

import React from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"

export interface AddedEntityChipItem {
  id: string
  label: string
}

export function AddedEntityChips({
  items,
  onRemove,
  label = "Added:",
}: {
  items: AddedEntityChipItem[]
  onRemove: (id: string) => void
  /** Leading label for the row. */
  label?: string
}) {
  const theme = useTheme()

  if (items.length === 0) return null

  return (
    <Box
      sx={{
        gridColumn: "1 / -1",
        display: "flex",
        flexWrap: "wrap",
        gap: 1,
        mb: theme.space.component.sm,
      }}
    >
      <Typography
        variant="compactCaption"
        sx={{ color: theme.palette.grey[500], mr: 0.5, alignSelf: "center" }}
      >
        {label}
      </Typography>
      {items.map((item) => (
        <Box
          key={item.id}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            px: 1,
            py: 0.25,
            backgroundColor: theme.palette.grey[100],
            borderRadius: theme.borderRadius.sm,
            fontSize: "0.75rem",
          }}
        >
          {item.label}
          <Box
            component="button"
            onClick={() => onRemove(item.id)}
            sx={{
              border: "none",
              background: "none",
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
              color: theme.palette.grey[500],
              "&:hover": { color: theme.palette.grey[700] },
            }}
            aria-label={`Remove ${item.label}`}
          >
            ×
          </Box>
        </Box>
      ))}
    </Box>
  )
}

export default AddedEntityChips

"use client"

/**
 * SharePersistWarning - tells the user when the share tray could not be
 * saved in this browser (storage full), so saved cards are not lost
 * silently on reload. Reads the workspace flag set by the share
 * persistence subscriber.
 */

import { Typography, useTheme } from "@repo/ui/mui"
import { useWorkspaceSlice } from "../../store"

export default function SharePersistWarning() {
  const theme = useTheme()
  const failed = useWorkspaceSlice((s) => s.sharePersistFailed)
  if (!failed) return null
  return (
    <Typography
      role="alert"
      sx={{
        m: 1,
        p: 1,
        fontSize: "0.75rem",
        color: theme.palette.error.main,
        border: `1px solid ${theme.palette.error.main}`,
        borderRadius: theme.borderRadius.sm,
      }}
    >
      This browser could not save your share tray, so it will be lost on reload.
      The usual cause is a full tray: remove some cards, especially maps, then
      try again.
    </Typography>
  )
}

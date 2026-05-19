"use client"

/**
 * ShareUrlVersionNotice
 *
 * Inline banner shown at the top of the Share tab when the deep
 * link the user opened was created against a different schema
 * version than the one this build understands. The store flag is
 * set by `parseShareUrl` in `share/url.ts` whenever the URL's
 * `v=` parameter does not match `SHARE_URL_VERSION`.
 *
 * The banner is informational, not blocking. The share items have
 * already been hydrated from the URL (potentially with reduced
 * fidelity, e.g. an unknown variant prefix being skipped) and
 * users can interact with them as usual. The notice exists so the
 * recipient understands why a shared view may differ from what
 * the sender remembers seeing.
 *
 * Dismissable via `dismissShareUrlVersionMismatch`. The flag is
 * not persisted: if the user reloads the URL the banner returns,
 * which is the right behavior because the URL itself is the
 * source of the mismatch.
 */

import React from "react"
import { Box, Typography, IconButton, useTheme, icons } from "@repo/ui/mui"
import { useExplorerStore } from "../../store"

export default function ShareUrlVersionNotice() {
  const theme = useTheme()
  const shareUrlVersionMismatch = useExplorerStore(
    (s) => s.shareUrlVersionMismatch,
  )
  const dismiss = useExplorerStore((s) => s.dismissShareUrlVersionMismatch)

  if (!shareUrlVersionMismatch) return null

  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 1,
        px: 1.5,
        py: 1,
        mb: 1.5,
        borderRadius: theme.borderRadius.sm,
        border: `1px solid ${theme.palette.warning.main}40`,
        backgroundColor: `${theme.palette.warning.main}10`,
      }}
    >
      <icons.InfoOutlined
        sx={{
          mt: "2px",
          fontSize: "1rem",
          color: theme.palette.warning.dark,
          flexShrink: 0,
        }}
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: theme.palette.warning.dark,
            lineHeight: 1.3,
          }}
        >
          Share link from a different version
        </Typography>
        <Typography
          sx={{
            fontSize: "0.75rem",
            color: theme.palette.text.secondary,
            lineHeight: 1.4,
            mt: 0.25,
          }}
        >
          This URL was created with an older or newer version of COEQWAL than
          what is running here. The shared scenarios were loaded using the
          current schema, so a few details may render differently than the
          sender saw.
        </Typography>
      </Box>
      <IconButton
        size="small"
        onClick={dismiss}
        aria-label="Dismiss version notice"
        sx={{
          p: 0.25,
          color: theme.palette.grey[500],
          flexShrink: 0,
          "&:hover": { color: theme.palette.grey[800] },
        }}
      >
        <icons.Close sx={{ fontSize: "0.875rem" }} />
      </IconButton>
    </Box>
  )
}

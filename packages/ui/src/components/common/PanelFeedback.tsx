"use client"

/**
 * PanelFeedback - Reusable inline feedback for panels and tool areas
 *
 * Covers empty states, errors, info prompts, and loading indicators.
 * Use instead of ad-hoc Typography + Box combos scattered across features.
 *
 * @example
 * <PanelFeedback
 *   variant="empty"
 *   title="No scenarios chosen yet"
 *   message="Select scenarios using the checkboxes, then toggle 'chosen only' to filter"
 * />
 */

import { Box, Typography, Button, CircularProgress } from "@mui/material"
import type { SxProps, Theme } from "@mui/material"

export type PanelFeedbackVariant = "empty" | "error" | "info" | "loading"

export interface PanelFeedbackProps {
  /** Visual variant controlling color treatment */
  variant?: PanelFeedbackVariant
  /** Primary message */
  title?: string
  /** Secondary hint or detail text */
  message?: string
  /** Optional action button label */
  actionLabel?: string
  /** Called when the action button is clicked */
  onAction?: () => void
  /** Compact mode for inline use within grids/rows */
  compact?: boolean
  /** Additional sx overrides on the root container */
  sx?: SxProps<Theme>
}

export function PanelFeedback({
  variant = "empty",
  title,
  message,
  actionLabel,
  onAction,
  compact = false,
  sx,
}: PanelFeedbackProps) {
  const isLoading = variant === "loading"
  const isError = variant === "error"

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        py: compact ? 2 : 6,
        px: compact ? 1.5 : 3,
        gap: compact ? 0.5 : 1,
        ...sx,
      }}
    >
      {isLoading && <CircularProgress size={20} sx={{ mb: 1 }} />}

      {title && (
        <Typography
          variant={compact ? "caption" : "body2"}
          sx={{
            fontWeight: 500,
            color: isError ? "error.main" : "grey.500",
          }}
        >
          {title}
        </Typography>
      )}

      {message && (
        <Typography
          variant="caption"
          sx={{
            color: isError ? "error.main" : "grey.400",
            ...(compact && { fontSize: "0.6875rem" }),
          }}
        >
          {message}
        </Typography>
      )}

      {actionLabel && onAction && (
        <Button
          variant="text"
          size="small"
          onClick={onAction}
          sx={{ mt: compact ? 0.5 : 1, textTransform: "none" }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  )
}

export default PanelFeedback

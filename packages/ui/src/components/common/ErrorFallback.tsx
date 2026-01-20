"use client"

/**
 * ErrorFallback - Reusable error state UI
 *
 * Displays a user-friendly message when an error boundary catches an error.
 * Renders inline (replaces the crashed component).
 * Provides a retry action to help users recover.
 */

import { Box, Typography, Button } from "@mui/material"

export interface ErrorFallbackProps {
  /** Title displayed to the user */
  title?: string
  /** Descriptive message explaining what happened */
  message?: string
  /** Whether to show the refresh/retry button */
  showRefresh?: boolean
  /** Custom retry handler - defaults to page reload */
  onRetry?: () => void
  /** Text color */
  textColor?: string
}

export function ErrorFallback({
  title = "Something went wrong",
  message = "Please try refreshing the page.",
  showRefresh = true,
  onRetry,
  textColor,
}: ErrorFallbackProps) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry()
    } else {
      window.location.reload()
    }
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        p: 4,
        textAlign: "center",
        minHeight: 200,
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ color: textColor }}>
        {title}
      </Typography>
      <Typography sx={{ mb: 2, color: textColor || "text.primary" }}>
        {message}
      </Typography>
      {showRefresh && (
        <Button
          variant="outlined"
          onClick={handleRetry}
          sx={textColor ? { color: textColor, borderColor: textColor } : {}}
        >
          Try again
        </Button>
      )}
    </Box>
  )
}

export default ErrorFallback

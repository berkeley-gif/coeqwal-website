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
}

export function ErrorFallback({
  title = "Something went wrong",
  message = "Please try refreshing the page.",
  showRefresh = true,
  onRetry,
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
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Typography color="text.primary" sx={{ mb: 2 }}>
        {message}
      </Typography>
      {showRefresh && (
        <Button variant="outlined" onClick={handleRetry}>
          Try again
        </Button>
      )}
    </Box>
  )
}

export default ErrorFallback

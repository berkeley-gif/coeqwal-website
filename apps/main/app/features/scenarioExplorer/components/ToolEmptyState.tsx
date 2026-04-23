"use client"

/**
 * ToolEmptyState. Instructive empty state shown in Radar, Equity, and
 * Resilience when the user has not yet selected any scenarios.
 *
 * A beginner landing on these tools without a selection otherwise sees
 * a silent or minimal chart; this state explains the chart's purpose,
 * tells the user what to do next, and can deep-link back to the List
 * view where selections are naturally made.
 */

import React from "react"
import { Box, Typography, useTheme, icons } from "@repo/ui/mui"
import { useScenarioExplorerStore, type ExploreMode } from "../store"

interface ToolEmptyStateProps {
  mode: ExploreMode
  title: string
  body: string
  /** Optional extra paragraph for tool-specific nuance (e.g. Equity is single-select). */
  detail?: string
  /** If provided, renders as a background decoration behind the copy. */
  illustration?: React.ReactNode
}

export default function ToolEmptyState({
  mode,
  title,
  body,
  detail,
  illustration,
}: ToolEmptyStateProps) {
  const theme = useTheme()
  const setExploreMode = useScenarioExplorerStore((s) => s.setExploreMode)

  return (
    <Box
      sx={{
        position: "relative",
        flex: 1,
        width: "100%",
        height: "100%",
        minHeight: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        backgroundColor: theme.palette.grey[100],
      }}
    >
      {illustration && (
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0.14,
            pointerEvents: "none",
          }}
        >
          {illustration}
        </Box>
      )}

      <Box
        sx={{
          position: "relative",
          maxWidth: 520,
          textAlign: "center",
          px: 3,
          py: 4,
          borderRadius: 2,
          backgroundColor: theme.palette.background.paper,
          boxShadow: `0 2px 12px ${theme.palette.action.hover}`,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: theme.palette.text.primary,
            fontWeight: 600,
            mb: 1,
          }}
        >
          {title}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.text.secondary,
            lineHeight: 1.5,
            mb: detail ? 1 : 2,
          }}
        >
          {body}
        </Typography>
        {detail && (
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              lineHeight: 1.5,
              mb: 2,
              fontStyle: "italic",
            }}
          >
            {detail}
          </Typography>
        )}

        <Box
          sx={{
            display: "inline-flex",
            gap: 1,
            alignItems: "center",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {mode !== "list" && (
            <Box
              component="button"
              type="button"
              onClick={() => setExploreMode("list")}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                px: 1.5,
                py: 0.75,
                border: `1px solid ${theme.palette.blue.bright}`,
                borderRadius: "12px",
                background: "transparent",
                color: theme.palette.blue.bright,
                cursor: "pointer",
                fontSize: "0.8125rem",
                fontWeight: 600,
                lineHeight: 1.3,
                whiteSpace: "nowrap",
                transition: "all 150ms ease",
                "&:hover": {
                  background: theme.palette.interaction.selectedBackground,
                },
              }}
            >
              <icons.ArrowBack sx={{ fontSize: "1rem" }} />
              Go to List to pick scenarios
            </Box>
          )}
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.text.secondary,
              display: "block",
              width: "100%",
              mt: 0.5,
            }}
          >
            Or select scenarios from the sidebar on the left.
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

"use client"

/**
 * SearchBar - Strategy search input
 *
 * Provides search functionality for filtering strategies in the explorer.
 */

import React from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { StyledTextInput } from "@repo/ui"
import { useScenarioExplorerStore } from "../store"

interface SearchBarProps {
  placeholder?: string
  rightContent?: React.ReactNode
  /** Whether to show a label above the search input */
  showLabel?: boolean
}

/**
 * Reusable search bar for filtering scenarios
 */
export default function SearchBar({
  placeholder = "Search scenarios...",
  rightContent,
  showLabel = true,
}: SearchBarProps) {
  const theme = useTheme()
  const { searchQuery, setSearchQuery } = useScenarioExplorerStore()

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: theme.space.gap.xl,
        px: theme.space.component.xl,
        py: theme.space.component.lg,
        backgroundColor: theme.palette.background.paper,
        borderBottom: theme.border.medium,
      }}
    >
      {/* Search section */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          maxWidth: theme.spacing(40),
          display: "flex",
          flexDirection: "column",
          gap: theme.space.gap.md,
        }}
      >
        {showLabel && (
          <Typography
            variant="caption"
            sx={{
              fontWeight: theme.typography.fontWeightMedium,
              color: theme.palette.grey[900],
            }}
          >
            Search
          </Typography>
        )}
        <StyledTextInput
          size="small"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          showClearButton={!!searchQuery}
          onClear={() => setSearchQuery("")}
          fullWidth
        />
      </Box>
      {rightContent && (
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            flexShrink: 0,
            gap: theme.space.gap.xl,
          }}
        >
          {rightContent}
        </Box>
      )}
    </Box>
  )
}

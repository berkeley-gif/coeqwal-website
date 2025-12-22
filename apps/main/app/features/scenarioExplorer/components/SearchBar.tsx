"use client"

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
        gap: 3,
        px: theme.spacing(theme.cards.spacing.standard),
        py: theme.spacing(2),
        backgroundColor: theme.palette.common.white,
        borderBottom: theme.border.standard,
        borderColor: theme.palette.grey[300],
      }}
    >
      {/* Search section */}
      <Box sx={{ flex: 1, minWidth: 0, maxWidth: theme.spacing(40) }}>
        {showLabel && (
          <Typography
            variant="subtitle2"
            sx={{
              mb: 1,
              fontWeight: theme.typography.fontWeightMedium,
              fontSize: theme.typography.caption.fontSize,
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
            gap: 3,
          }}
        >
          {rightContent}
        </Box>
      )}
    </Box>
  )
}

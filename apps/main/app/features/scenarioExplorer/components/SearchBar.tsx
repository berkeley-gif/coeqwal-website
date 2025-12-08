"use client"

import React from "react"
import { Box, useTheme } from "@repo/ui/mui"
import { StyledTextInput } from "@repo/ui"
import { useScenarioExplorerStore } from "@repo/state"

interface SearchBarProps {
  placeholder?: string
}

/**
 * Reusable search bar for filtering scenarios
 */
export default function SearchBar({
  placeholder = "Search scenarios...",
}: SearchBarProps) {
  const theme = useTheme()
  const { searchQuery, setSearchQuery } = useScenarioExplorerStore()

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        px: theme.spacing(theme.cards.spacing.standard),
        py: theme.spacing(2),
        backgroundColor: theme.palette.common.white,
        borderBottom: theme.border.standard,
        borderColor: theme.palette.grey[300],
      }}
    >
      <Box sx={{ flex: 1, maxWidth: theme.spacing(50) }}>
        <StyledTextInput
          size="small"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          showClearButton={!!searchQuery}
          onClear={() => setSearchQuery("")}
        />
      </Box>
    </Box>
  )
}


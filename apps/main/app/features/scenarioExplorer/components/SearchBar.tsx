"use client"

import React from "react"
import { Box, useTheme } from "@repo/ui/mui"
import { StyledTextInput } from "@repo/ui"
import { useScenarioExplorerStore } from "@repo/state/scenarioExplorer"

interface SearchBarProps {
  placeholder?: string
  rightContent?: React.ReactNode
}

/**
 * Reusable search bar for filtering scenarios
 */
export default function SearchBar({
  placeholder = "Search scenarios...",
  rightContent,
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
      <Box sx={{ flex: 1, minWidth: 0, maxWidth: theme.spacing(40) }}>
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
        <Box sx={{ display: "flex", alignItems: "center", ml: 2, flexShrink: 0 }}>
          {rightContent}
        </Box>
      )}
    </Box>
  )
}

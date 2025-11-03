"use client"

import React from "react"
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  useTheme,
} from "@repo/ui/mui"
import { useScenarioExplorerStore, type SortOption } from "@repo/state"

interface SearchSortBarProps {
  placeholder?: string
  sortOptions?: { value: SortOption; label: string }[]
  showReset?: boolean
}

/**
 * Reusable search and sort interface
 * Used across different views with customizable options
 */
export default function SearchSortBar({
  placeholder = "Search scenarios...",
  sortOptions = [
    { value: "name-asc", label: "Name (A-Z)" },
    { value: "name-desc", label: "Name (Z-A)" },
    { value: "outcome-best-first", label: "Best Performing First" },
    { value: "outcome-worst-first", label: "Worst Performing First" },
  ],
  showReset = true,
}: SearchSortBarProps) {
  const theme = useTheme()
  const { searchQuery, sortBy, setSearchQuery, setSortBy, resetFilters } =
    useScenarioExplorerStore()

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(2),
        px: theme.spacing(theme.cards.spacing.standard),
        py: theme.spacing(2),
        backgroundColor: theme.palette.common.white,
        borderBottom: theme.border.standard,
        borderColor: theme.palette.grey[300],
      }}
    >
      {/* Search */}
      <TextField
        size="small"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{
          flex: 1,
          maxWidth: theme.spacing(50),
          "& .MuiOutlinedInput-root": {
            backgroundColor: theme.palette.common.white,
          },
        }}
      />

      {/* Sort */}
      <FormControl size="small" sx={{ minWidth: theme.spacing(25) }}>
        <InputLabel>Sort by</InputLabel>
        <Select
          value={sortBy}
          label="Sort by"
          onChange={(e) => setSortBy(e.target.value as SortOption)}
        >
          {sortOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Reset */}
      {showReset && (
        <Button
          variant="outlined"
          size="small"
          onClick={resetFilters}
          sx={{
            textTransform: "none",
            borderColor: theme.palette.grey[400],
            color: theme.palette.text.primary,
            "&:hover": {
              borderColor: theme.palette.blue.bright,
              backgroundColor: theme.palette.grey[50],
            },
          }}
        >
          Reset filters
        </Button>
      )}
    </Box>
  )
}


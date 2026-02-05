"use client"

/**
 * CompactSearchBar - Compact search input for tight ui
 *
 * A reusable search bar component with responsive layout:
 * - Stacks vertically under 700px
 * - Horizontal layout at 700px+
 *
 * Uses StyledTextInput internally for consistent styling.
 */

import React from "react"
import { Box, Typography, useTheme } from "@mui/material"
import { StyledTextInput } from "./StyledTextInput"

export interface CompactSearchBarProps {
  /** Current search value (controlled) */
  value: string
  /** Called when search value changes */
  onChange: (value: string) => void
  /** Placeholder text */
  placeholder?: string
  /** Content to render on the right side (e.g., filters, toggles) */
  rightContent?: React.ReactNode
  /** Whether to show a label above the search input */
  showLabel?: boolean
  /** Label text (defaults to "Search") */
  label?: string
  /** ID for the input element (for accessibility) */
  inputId?: string
  /** aria-label for the input when label is hidden */
  ariaLabel?: string
  /** Max width for the search input container (defaults to 330px) */
  inputMaxWidth?: string | number
}

/**
 * Compact search bar with responsive layout
 */
export function CompactSearchBar({
  value,
  onChange,
  placeholder = "Search...",
  rightContent,
  showLabel = true,
  label = "Search",
  inputId = "compact-search-input",
  ariaLabel,
  inputMaxWidth = "330px",
}: CompactSearchBarProps) {
  const theme = useTheme()

  return (
    <Box
      sx={{
        display: "flex",
        // Stack vertically under 700px, horizontal at 700px+
        flexDirection: "column",
        alignItems: "stretch",
        "@media (min-width: 700px)": {
          flexDirection: "row",
          alignItems: "flex-start",
        },
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
          width: "100%",
          maxWidth: inputMaxWidth,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: theme.space.gap.md,
        }}
      >
        {showLabel && (
          <Typography
            variant="caption"
            component="label"
            htmlFor={inputId}
            sx={{
              fontWeight: theme.typography.fontWeightMedium,
              color: theme.palette.grey[900],
            }}
          >
            {label}
          </Typography>
        )}
        {/* WCAG 1.3.1, 3.3.2: Properly labeled search input */}
        <StyledTextInput
          id={inputId}
          size="small"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          showClearButton={!!value}
          onClear={() => onChange("")}
          fullWidth
          aria-label={!showLabel ? ariaLabel || label : undefined}
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

export default CompactSearchBar

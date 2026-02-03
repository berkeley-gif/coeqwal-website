"use client"

/**
 * CompactSelect - Minimal styled select for display toggles
 *
 * A compact, subtle dropdown for switching between display modes.
 * Supports placeholder text and uses proper text hierarchy.
 *
 * WCAG 2.0 AA Compliance:
 * - WCAG 1.4.3: Contrast ratio maintained with text.primary on white
 * - WCAG 2.1.1: Full keyboard support via MUI Select
 * - WCAG 4.1.2: Proper ARIA labeling support
 */

import React from "react"
import { Select, MenuItem, useTheme } from "@mui/material"
import type { SelectChangeEvent } from "@mui/material/Select"

export interface CompactSelectOption<T extends string = string> {
  value: T
  label: string
}

export interface CompactSelectProps<T extends string = string> {
  /** Current selected value (empty string for placeholder) */
  value: T | ""
  /** Callback when selection changes */
  onChange: (value: T) => void
  /** Available options */
  options: CompactSelectOption<T>[]
  /** Placeholder text when no value selected */
  placeholder?: string
  /** Accessible label for screen readers */
  "aria-label"?: string
  /** Minimum width of the select (default: 160) */
  minWidth?: number
  /** Whether the select is disabled */
  disabled?: boolean
  /** Maximum height of the dropdown menu */
  maxMenuHeight?: number
}

export function CompactSelect<T extends string = string>({
  value,
  onChange,
  options,
  placeholder,
  "aria-label": ariaLabel,
  minWidth = 160,
  disabled = false,
  maxMenuHeight,
}: CompactSelectProps<T>) {
  const theme = useTheme()

  const handleChange = (event: SelectChangeEvent<T | "">) => {
    const newValue = event.target.value
    if (newValue !== "") {
      onChange(newValue as T)
    }
  }

  const hasValue = value !== ""

  return (
    <Select
      value={value}
      onChange={handleChange}
      displayEmpty={!!placeholder}
      size="small"
      disabled={disabled}
      aria-label={ariaLabel}
      sx={{
        minWidth,
        height: 32,
        "& .MuiSelect-select": {
          ...theme.typography.dashboard,
          py: 0.5,
          px: 1.5,
          color: hasValue
            ? theme.palette.text.primary
            : theme.palette.grey[500],
        },
        "& .MuiOutlinedInput-notchedOutline": {
          borderColor: theme.palette.grey[300],
        },
        "&:hover .MuiOutlinedInput-notchedOutline": {
          borderColor: theme.palette.grey[400],
        },
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
          borderColor: theme.palette.grey[500],
          borderWidth: 1,
        },
      }}
      MenuProps={{
        PaperProps: {
          sx: {
            mt: 0.5,
            boxShadow: theme.shadow.sm,
            border: `1px solid ${theme.palette.grey[200]}`,
            ...(maxMenuHeight && { maxHeight: maxMenuHeight }),
            "& .MuiMenuItem-root": {
              ...theme.typography.dashboard,
              py: 0.75,
              "&:hover": {
                backgroundColor: theme.palette.grey[100],
              },
              "&.Mui-selected": {
                backgroundColor: theme.palette.grey[100],
                "&:hover": {
                  backgroundColor: theme.palette.grey[200],
                },
              },
            },
          },
        },
      }}
    >
      {placeholder && (
        <MenuItem value="" disabled>
          {placeholder}
        </MenuItem>
      )}
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </Select>
  )
}

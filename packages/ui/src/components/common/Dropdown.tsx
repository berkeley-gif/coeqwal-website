"use client"

import { Select, MenuItem, FormControl, InputLabel } from "../.."
import type { SelectProps, MenuItemProps, Theme } from "@mui/material"

export interface DropdownOption {
  value: string
  label: string
  disabled?: boolean
}

export interface DropdownProps
  extends Omit<SelectProps, "children" | "variant"> {
  /** Array of dropdown options */
  options: DropdownOption[]
  /** Optional label for the dropdown */
  label?: string
  /** Placeholder text when no value is selected */
  placeholder?: string
  /** Compact variant for inline usage */
  variant?: "standard" | "compact"
  /** Custom menu item props */
  menuItemProps?: Partial<MenuItemProps>
}

/**
 * Custom dropdown component
 *
 * Features:
 * - Standard and compact variants
 * - Theme-integrated styling
 * - Accessible and keyboard navigable
 */
export function Dropdown({
  options,
  label,
  placeholder,
  variant = "standard",
  value,
  onChange,
  size = "small",
  menuItemProps = {},
  sx = {},
  ...props
}: DropdownProps) {
  const isCompact = variant === "compact"

  const selectSx = {
    // Base styling following form control conventions
    fontSize: isCompact ? "0.875rem" : "1rem",
    minWidth: isCompact ? 80 : 120,
    backgroundColor: (theme: Theme) => theme.palette.common.white,

    // Use theme border radius
    "& .MuiOutlinedInput-notchedOutline": {
      borderRadius: (theme: Theme) => theme.borderRadius.rounded,
    },

    // Compact variant styling
    ...(isCompact && {
      "& .MuiSelect-select": {
        py: 0.5,
        px: 1,
        backgroundColor: (theme: Theme) => theme.palette.common.white,
      },
      "& .MuiOutlinedInput-notchedOutline": {
        borderColor: (theme: Theme) => theme.palette.text.secondary,
        borderRadius: (theme: Theme) => theme.borderRadius.rounded,
      },
      "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: (theme: Theme) => theme.palette.blue.medium,
      },
      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderColor: (theme: Theme) => theme.palette.blue.bright,
        borderWidth: 1, // Keep thin border even when focused
      },
    }),

    // Standard variant styling
    ...(!isCompact && {
      "& .MuiSelect-select": {
        backgroundColor: (theme: Theme) => theme.palette.common.white,
      },
      "& .MuiOutlinedInput-notchedOutline": {
        borderColor: (theme: Theme) => theme.palette.text.primary,
        borderRadius: (theme: Theme) => theme.borderRadius.rounded,
      },
      "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: (theme: Theme) => theme.palette.blue.medium,
      },
      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderColor: (theme: Theme) => theme.palette.blue.bright,
        borderWidth: 2,
      },
    }),

    // Merge instance sx
    ...sx,
  }

  return (
    <FormControl size={size} sx={{ minWidth: isCompact ? 80 : 120 }}>
      {label && !isCompact && (
        <InputLabel
          sx={{
            fontSize: "0.875rem",
            color: (theme: Theme) => theme.palette.text.secondary,
            backgroundColor: (theme: Theme) => theme.palette.common.white,
            borderRadius: (theme: Theme) => theme.borderRadius.pill,
            px: 1.5,
            py: 0.5,
            border: (theme: Theme) => `1px solid ${theme.palette.divider}`,
            position: "relative",
            transform: "none",
            left: 0,
            top: 0,
            mb: 1,
          }}
        >
          {label}
        </InputLabel>
      )}
      <Select
        value={value || ""}
        onChange={onChange}
        displayEmpty={!!placeholder}
        sx={selectSx}
        MenuProps={{
          PaperProps: {
            sx: {
              backgroundColor: (theme: Theme) => theme.palette.common.white,
              boxShadow: (theme: Theme) => theme.shadows[8],
              borderRadius: (theme: Theme) => theme.borderRadius.rounded,
              border: (theme: Theme) => `1px solid ${theme.palette.divider}`,
              mt: 0.5,
              "& .MuiMenuItem-root": {
                fontSize: isCompact ? "0.875rem" : "1rem",
                py: 1,
                px: 1.5,
                color: (theme: Theme) => theme.palette.text.primary,
                backgroundColor: (theme: Theme) => theme.palette.common.white,
                "&:hover": {
                  backgroundColor: (theme: Theme) =>
                    theme.palette.blue.bright + "15",
                  color: (theme: Theme) => theme.palette.blue.darkest,
                },
                "&.Mui-selected": {
                  backgroundColor: (theme: Theme) =>
                    theme.palette.blue.bright + "15",
                  color: (theme: Theme) => theme.palette.blue.darkest,
                  "&:hover": {
                    backgroundColor: (theme: Theme) =>
                      theme.palette.blue.bright + "15",
                    color: (theme: Theme) => theme.palette.blue.darkest,
                  },
                },
              },
            },
          },
        }}
        {...props}
      >
        {placeholder && (
          <MenuItem
            value=""
            disabled
            sx={{
              fontStyle: "italic",
              color: (theme: Theme) => theme.palette.text.secondary,
              backgroundColor: (theme: Theme) => theme.palette.common.white,
              ...menuItemProps,
            }}
          >
            {placeholder}
          </MenuItem>
        )}
        {options.map((option) => (
          <MenuItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            {...menuItemProps}
          >
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

export default Dropdown

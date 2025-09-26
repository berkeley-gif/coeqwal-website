"use client"

import React from "react"
import { Select, MenuItem, FormControl, SelectChangeEvent } from "@mui/material"
import { styled } from "@mui/material/styles"

export interface SimpleSelectOption {
  value: string
  label: string
}

export interface SimpleSelectProps {
  value: string
  options: SimpleSelectOption[]
  onChange: (event: SelectChangeEvent<unknown>) => void
  onHover?: (value: string) => void
  onLeave?: () => void
  onClose?: () => void
  placeholder?: string
  disabled?: boolean
  fullWidth?: boolean
  fontSize?: string
  sx?: React.CSSProperties
}

const StyledSelect = styled(Select)(({ theme }) => ({
  "& .MuiSelect-select": {
    backgroundColor: "transparent",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.divider,
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.divider,
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.primary.main,
    borderWidth: "1px",
  },
}))

export function SimpleSelect({
  value,
  options,
  onChange,
  onHover,
  onLeave,
  onClose,
  placeholder,
  disabled = false,
  fullWidth = false,
  fontSize,
  sx,
}: SimpleSelectProps) {
  return (
    <FormControl fullWidth={fullWidth} sx={sx}>
      <StyledSelect
        value={value}
        onChange={onChange}
        disabled={disabled}
        displayEmpty
        onClose={onClose}
        sx={{
          fontSize: fontSize,
        }}
        MenuProps={{
          PaperProps: {
            sx: {
              "& .MuiMenuItem-root": {
                fontSize: fontSize,
                backgroundColor: "transparent !important",
                "&.Mui-selected": {
                  backgroundColor: "transparent !important",
                  "&:hover": {
                    backgroundColor: "rgba(0, 0, 0, 0.04) !important",
                  },
                },
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.04) !important",
                },
                "&.Mui-focusVisible": {
                  backgroundColor: "rgba(0, 0, 0, 0.04) !important",
                },
              },
            },
          },
          autoFocus: false,
          disableAutoFocusItem: true,
        }}
      >
        {placeholder && (
          <MenuItem value="" disabled sx={{ display: "none" }}>
            {placeholder}
          </MenuItem>
        )}
        {options.map((option) => (
          <MenuItem
            key={option.value}
            value={option.value}
            onMouseEnter={() => onHover?.(option.value)}
            onMouseLeave={onLeave}
          >
            {option.label}
          </MenuItem>
        ))}
      </StyledSelect>
    </FormControl>
  )
}

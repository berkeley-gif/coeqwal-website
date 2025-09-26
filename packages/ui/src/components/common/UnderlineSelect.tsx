"use client"

import React from "react"
import {
  Select,
  MenuItem,
  FormControl,
  SelectChangeEvent,
  InputBase,
  Box,
} from "@mui/material"
import { styled } from "@mui/material/styles"

export interface UnderlineSelectOption {
  value: string
  label: string
}

export interface UnderlineSelectProps {
  value: string
  options: UnderlineSelectOption[]
  onChange: (event: SelectChangeEvent<string>) => void
  onHover?: (value: string) => void
  onLeave?: () => void
  onClose?: () => void
  placeholder?: string
  disabled?: boolean
  fullWidth?: boolean
  fontSize?: string
  underlineColor?: string
  textColor?: string
  sx?: React.CSSProperties
}

const UnderlineInput = styled(InputBase, {
  shouldForwardProp: (prop) =>
    prop !== "underlineColor" && prop !== "textColor",
})<{ underlineColor: string; textColor: string }>(
  ({ underlineColor, textColor }) => ({
    "& .MuiInputBase-input": {
      borderRadius: 0,
      position: "relative",
      backgroundColor: "transparent",
      border: "none",
      fontSize: "inherit",
      color: textColor,
      padding: "8px 32px 8px 0",
      transition: "border-color 0.2s ease",
      borderBottom: `2px solid ${underlineColor}`,
      marginRight: "24px", // Pull underline away from triangle
      "&:focus": {
        borderRadius: 0,
        borderBottom: `3px solid ${textColor}`,
        backgroundColor: "transparent",
      },
      "&:hover": {
        borderBottom: `3px solid ${textColor}`,
      },
    },
    "& .MuiSelect-icon": {
      color: textColor,
      right: 0,
      top: "50%",
      transform: "translateY(-50%) scale(1.3)", // Make triangle bigger
      fontSize: "1.5rem",
      pointerEvents: "auto",
      cursor: "pointer",
    },
    // Ensure the entire select area is clickable
    "& .MuiSelect-select": {
      cursor: "pointer",
    },
  }),
)

export function UnderlineSelect({
  value,
  options,
  onChange,
  onHover,
  onLeave,
  onClose,
  placeholder,
  disabled = false,
  fullWidth = false,
  fontSize = "1rem",
  underlineColor = "#cbd5e0",
  textColor = "#3a4574",
  sx,
}: UnderlineSelectProps) {
  const selectRef = React.useRef<HTMLSelectElement>(null)

  const handleContainerClick = () => {
    if (!disabled && selectRef.current) {
      // Focus the select to open it
      const selectElement = selectRef.current.querySelector(
        '[role="combobox"]',
      ) as HTMLElement
      if (selectElement) {
        selectElement.click()
      }
    }
  }

  return (
    <Box
      onClick={handleContainerClick}
      sx={{
        ...sx,
        position: "relative",
        cursor: "pointer",
        width: fullWidth ? "100%" : "auto",
      }}
    >
      <FormControl fullWidth={fullWidth}>
        <Select
          ref={selectRef}
          value={value}
          onChange={onChange}
          disabled={disabled}
          displayEmpty
          input={
            <UnderlineInput
              underlineColor={underlineColor}
              textColor={textColor}
            />
          }
          onClose={onClose}
          sx={{
            fontSize: fontSize,
            cursor: "pointer",
            pointerEvents: "none", // Disable direct clicks, let parent handle
            "& .MuiSelect-select": {
              paddingRight: "32px !important",
            },
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
        </Select>
      </FormControl>
    </Box>
  )
}

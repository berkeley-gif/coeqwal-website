"use client"

import { Box } from "@mui/material"

export interface SimpleCheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  size?: number
  checkedColor?: string
  uncheckedColor?: string
  borderColor?: string
}

export function SimpleCheckbox({
  checked,
  onChange,
  disabled = false,
  size = 20,
  checkedColor = "#449cd9",
  uncheckedColor = "transparent",
  borderColor = "#4a5568",
}: SimpleCheckboxProps) {
  const handleClick = () => {
    if (!disabled) {
      onChange(!checked)
    }
  }

  return (
    <Box
      onClick={handleClick}
      sx={{
        width: `${size}px`,
        height: `${size}px`,
        border: `1px solid ${borderColor}`,
        borderRadius: "2px",
        backgroundColor: checked ? checkedColor : uncheckedColor,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s ease",
        "&:hover": disabled
          ? {}
          : {
              backgroundColor: checked ? checkedColor : "rgba(0, 0, 0, 0.04)",
            },
      }}
    >
      {checked && (
        <Box
          sx={{
            color: "white",
            fontSize: `${size * 0.6}px`,
            fontWeight: "bold",
            lineHeight: 1,
          }}
        >
          ✓
        </Box>
      )}
    </Box>
  )
}

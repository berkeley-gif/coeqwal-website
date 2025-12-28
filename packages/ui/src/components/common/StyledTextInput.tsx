"use client"

/**
 * StyledTextInput - Custom styled text input with clear button
 *
 * A styled input component with optional clear button, icons, and loading state.
 * Supports small and medium sizes with consistent theme styling.
 */

import React, { forwardRef } from "react"
import { Box, useTheme } from "@mui/material"
import type { SxProps, Theme } from "@mui/material/styles"

export interface StyledTextInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Full width of container */
  fullWidth?: boolean
  /** Size variant */
  size?: "small" | "medium"
  /** Additional sx styles */
  sx?: SxProps<Theme>
  /** Show clear button when has value */
  showClearButton?: boolean
  /** Clear button click handler */
  onClear?: () => void
  /** Start icon/element */
  startIcon?: React.ReactNode
  /** Show loading spinner */
  loading?: boolean
}

/**
 * Styled text input form element
 */
export const StyledTextInput = forwardRef<
  HTMLInputElement,
  StyledTextInputProps
>(function StyledTextInput(
  {
    fullWidth = true,
    size = "medium",
    sx = {},
    showClearButton = false,
    onClear,
    value,
    startIcon,
    loading = false,
    ...props
  },
  ref,
) {
  const theme = useTheme()

  const hasValue = Boolean(value)
  const padding = size === "small" ? theme.spacing(1) : theme.spacing(1.5)
  const fontSize = size === "small" ? "13px" : "14px"
  const iconSize = size === "small" ? 18 : 20
  const showEndContent = hasValue && (showClearButton || loading)

  return (
    <Box sx={{ position: "relative", width: fullWidth ? "100%" : "auto" }}>
      {/* Start icon */}
      {startIcon && (
        <Box
          sx={{
            position: "absolute",
            left: padding,
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: theme.palette.grey[500],
            pointerEvents: "none",
            "& svg": {
              width: iconSize,
              height: iconSize,
            },
          }}
        >
          {startIcon}
        </Box>
      )}

      <Box
        component="input"
        ref={ref}
        type="text"
        value={value}
        {...props}
        sx={{
          width: "100%",
          padding,
          paddingLeft: startIcon
            ? `calc(${padding} + ${iconSize}px + ${theme.spacing(1)})`
            : padding,
          paddingRight: showEndContent ? theme.spacing(5) : padding,
          fontSize,
          fontFamily: theme.typography.fontFamily,
          border: `1px solid ${theme.palette.grey[300]}`,
          borderRadius: theme.borderRadius?.md || "8px",
          backgroundColor: theme.palette.common.white,
          color: theme.palette.text.primary,
          outline: "none",
          transition: "border-color 0.3s ease, box-shadow 0.3s ease", // theme.transition.default timing
          "&:focus": {
            borderColor: theme.palette.primary.main,
            boxShadow: `0 0 0 2px ${theme.palette.primary.main}20`,
          },
          "&:hover:not(:focus)": {
            borderColor: theme.palette.grey[400],
          },
          "&::placeholder": {
            color: theme.palette.grey[500],
          },
          "&:disabled": {
            backgroundColor: theme.palette.grey[100],
            color: theme.palette.grey[500],
            cursor: "not-allowed",
          },
          ...sx,
        }}
      />

      {/* Loading spinner or Clear button */}
      {showEndContent && (
        <Box
          sx={{
            position: "absolute",
            right: theme.spacing(1),
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            alignItems: "center",
            gap: theme.space.gap.xs,
          }}
        >
          {loading && (
            <Box
              sx={{
                width: 16,
                height: 16,
                border: `2px solid ${theme.palette.grey[300]}`,
                borderTopColor: theme.palette.primary.main,
                borderRadius: theme.borderRadius.circle,
                animation: "spin 0.6s linear infinite",
                "@keyframes spin": {
                  to: { transform: "rotate(360deg)" },
                },
              }}
            />
          )}
          {!loading && showClearButton && onClear && (
            <Box
              component="button"
              type="button"
              onClick={onClear}
              aria-label="Clear input"
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 20,
                height: 20,
                padding: 0,
                ...theme.typography.nav,
                border: "none",
                borderRadius: theme.borderRadius.circle,
                backgroundColor: theme.palette.grey[200],
                color: theme.palette.grey[600],
                cursor: "pointer",
                transition: "background-color 0.3s ease, color 0.3s ease", // theme.transition.default timing
                lineHeight: 1,
                "&:hover": {
                  backgroundColor: theme.palette.grey[300],
                  color: theme.palette.grey[700],
                },
                "&:focus": {
                  outline: `2px solid ${theme.palette.primary.main}`,
                  outlineOffset: 1,
                },
              }}
            >
              ×
            </Box>
          )}
        </Box>
      )}
    </Box>
  )
})

export default StyledTextInput

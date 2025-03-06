"use client"

import React from "react"
import { ToggleButtonGroup, ToggleButton } from "@mui/material"
import { useUiLocale } from "./context/UiLocaleContext"
import { useTheme, alpha } from "@mui/material/styles"

export function LanguageSwitcher() {
  const { locale, setLocale } = useUiLocale()
  const theme = useTheme()

  const handleChange = (
    _event: React.MouseEvent<HTMLElement>,
    newLocale: "en" | "es" | null,
  ) => {
    // Only update if user picks a valid locale (not null)
    if (newLocale) {
      setLocale(newLocale)
    }
  }

  return (
    <ToggleButtonGroup
      value={locale}
      exclusive
      onChange={handleChange}
      sx={{
        borderRadius: 999, // capsule shape
      }}
    >
      <ToggleButton
        value="en"
        sx={{
          borderRadius: 999,
          px: 3,
          color: theme.palette.text.primary,
          fontSize: theme.typography.button.fontSize,
          fontWeight:
            locale === "en"
              ? theme.typography.fontWeightBold
              : theme.typography.button.fontWeight,
          backgroundColor:
            locale === "en"
              ? alpha(theme.palette.primary.main, 0.8)
              : "transparent",
          "&:hover": {
            backgroundColor:
              locale === "en"
                ? alpha(theme.palette.primary.light, 0.8)
                : "transparent",
          },
        }}
      >
        English
      </ToggleButton>
      <ToggleButton
        value="es"
        sx={{
          borderRadius: 999,
          px: 3,
          color: theme.palette.text.primary,
          fontSize: theme.typography.button.fontSize,
          fontWeight:
            locale === "es"
              ? theme.typography.fontWeightBold
              : theme.typography.button.fontWeight,
          backgroundColor:
            locale === "es"
              ? alpha(theme.palette.primary.main, 0.8)
              : "transparent",
          "&:hover": {
            backgroundColor:
              locale === "es"
                ? alpha(theme.palette.primary.light, 0.8)
                : "transparent",
          },
        }}
      >
        Español
      </ToggleButton>
    </ToggleButtonGroup>
  )
}

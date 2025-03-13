"use client"

import React from "react"
import { ToggleButtonGroup, ToggleButton } from "@mui/material"
import { useTranslation } from "@repo/i18n"
import { useTheme, alpha } from "@mui/material/styles"

export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation()
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
        borderRadius: 999, // pill shape
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
          textTransform: "none",
          lineHeight: 1,
          margin: "0.25rem 0",
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
          textTransform: "none",
          lineHeight: 1,
          margin: "0.25rem 0.25rem 0.25rem 0",
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

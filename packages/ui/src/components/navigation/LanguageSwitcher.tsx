"use client"

import React from "react"
import { ToggleButtonGroup, ToggleButton, SxProps, Theme } from "@mui/material"
import { useTranslation } from "@repo/i18n"

interface LanguageSwitcherProps {
  sx?: SxProps<Theme>
}

export function LanguageSwitcher({ sx }: LanguageSwitcherProps) {
  const { locale, setLocale } = useTranslation()

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
        height: "40px",
        fontWeight: 600,
        fontFamily:
          '"neue-haas-grotesk-display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        ...sx,
      }}
    >
      <ToggleButton
        value="en"
        sx={{
          height: "40px",
          minHeight: "40px",
          fontWeight: 600,
          fontFamily:
            '"neue-haas-grotesk-display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        }}
      >
        English
      </ToggleButton>
      <ToggleButton
        value="es"
        sx={{
          height: "40px",
          minHeight: "40px",
          borderLeft: "1px solid #274472",
          fontWeight: 600,
          fontFamily:
            '"neue-haas-grotesk-display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        }}
      >
        Español
      </ToggleButton>
    </ToggleButtonGroup>
  )
}

"use client"

import React from "react"
import { ToggleButtonGroup, ToggleButton } from "@mui/material"
import { useUiLocale } from "./context/UiLocaleContext"

export function LanguageSwitcher() {
  const { locale, setLocale } = useUiLocale()

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
        }}
      >
        English
      </ToggleButton>
      <ToggleButton
        value="es"
        sx={{
          borderRadius: 999,
          px: 3,
        }}
      >
        Español
      </ToggleButton>
    </ToggleButtonGroup>
  )
}

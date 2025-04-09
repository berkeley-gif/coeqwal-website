"use client"

import React from "react"
import { ToggleButtonGroup, ToggleButton } from "@mui/material"
import { useTranslation } from "@repo/i18n"

export function LanguageSwitcher() {
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
    <ToggleButtonGroup value={locale} exclusive onChange={handleChange}>
      <ToggleButton value="en">English</ToggleButton>
      <ToggleButton
        value="es"
        sx={{
          borderLeft: "1px solid black",
        }}
      >
        Español
      </ToggleButton>
    </ToggleButtonGroup>
  )
}

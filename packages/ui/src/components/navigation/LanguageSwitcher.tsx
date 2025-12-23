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
        height: 36,
        "& .MuiToggleButton-root": {
          height: 36,
          minHeight: 36,
          fontSize: (theme) => theme.typography.body2.fontSize,
          fontWeight: (theme) => theme.typography.fontWeightRegular,
          textTransform: "none",
        },
      }}
    >
      <ToggleButton value="en">English</ToggleButton>
      <ToggleButton value="es">Español</ToggleButton>
    </ToggleButtonGroup>
  )
}

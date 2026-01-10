"use client"

/**
 * LanguageSwitcher - Toggle between English and Spanish
 *
 * Uses ToggleButtonGroup for language selection.
 *
 * WCAG 2.0 AA Compliance:
 * - WCAG 1.3.1: role="group" with aria-label for screen readers
 * - WCAG 2.4.7: Focus-visible styles on toggle buttons
 * - WCAG 2.5.5: Minimum 44px touch targets on mobile
 * - WCAG 4.1.2: aria-pressed managed by MUI ToggleButton
 */

import React from "react"
import { ToggleButtonGroup, ToggleButton, useMediaQuery } from "@mui/material"
import { useTranslation } from "@repo/i18n"

// Minimum touch target size for WCAG 2.5.5
const MIN_TOUCH_TARGET = 44
const DESKTOP_HEIGHT = 36

export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation()
  // WCAG 2.5.5: Larger touch targets on mobile
  const isMobile = useMediaQuery("(max-width: 749px)")
  const buttonHeight = isMobile ? MIN_TOUCH_TARGET : DESKTOP_HEIGHT

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
      // WCAG 1.3.1: Descriptive label for screen readers
      aria-label="Select language"
      sx={{
        height: buttonHeight,
        "& .MuiToggleButton-root": {
          height: buttonHeight,
          minHeight: buttonHeight,
          // WCAG 2.5.5: Minimum width for touch targets on mobile
          minWidth: isMobile ? MIN_TOUCH_TARGET : "auto",
          fontSize: (theme) => theme.typography.body2.fontSize,
          fontWeight: (theme) => theme.typography.fontWeightRegular,
          textTransform: "none",
          // WCAG 2.4.7: Focus visible indicator
          "&:focus-visible": {
            outline: "2px solid currentColor",
            outlineOffset: 2,
            zIndex: 1,
          },
        },
      }}
    >
      <ToggleButton value="en" aria-label="English">
        English
      </ToggleButton>
      <ToggleButton value="es" aria-label="Español">
        Español
      </ToggleButton>
    </ToggleButtonGroup>
  )
}

"use client"

/**
 * LanguageSwitcher - Toggle between English and Spanish
 *
 * Uses ToggleButtonGroup for language selection.
 * 
 * MIGRATION NOTE (2026):
 * Previously read locale directly from @repo/i18n context.
 * Now accepts locale state and change handler as props, making this
 * component translation-system agnostic.
 *
 * WCAG 2.0 AA Compliance:
 * - WCAG 1.3.1: role="group" with aria-label for screen readers
 * - WCAG 2.4.7: Focus-visible styles on toggle buttons
 * - WCAG 2.5.5: Minimum 44px touch targets on mobile
 * - WCAG 4.1.2: aria-pressed managed by MUI ToggleButton
 */

import React from "react"
import { ToggleButtonGroup, ToggleButton, useMediaQuery } from "@mui/material"

// Minimum touch target size for WCAG 2.5.5
const MIN_TOUCH_TARGET = 44
const DESKTOP_HEIGHT = 36

export interface LocaleOption {
  value: string
  label: string
}

// Default options so existing callers that don't need
// custom locales don't have to pass this prop at all.
const DEFAULT_LOCALE_OPTIONS: LocaleOption[] = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
]

interface LanguageSwitcherProps {
  /** The currently active locale. */
  currentLocale: string
  /**
  * Called when the user selects a new locale.
  */
  onLocaleChange: (locale: string) => void
  /**
   * Override locale options for apps that support more than en/es.
   * Defaults to English + Español.
   */
  localeOptions?: LocaleOption[]
}

export function LanguageSwitcher({
  currentLocale,
  onLocaleChange,
  localeOptions = DEFAULT_LOCALE_OPTIONS,
}: LanguageSwitcherProps) {
  // WCAG 2.5.5: Larger touch targets on mobile
  const isMobile = useMediaQuery("(max-width: 749px)")
  const buttonHeight = isMobile ? MIN_TOUCH_TARGET : DESKTOP_HEIGHT

  function handleChange(
    _event: React.MouseEvent<HTMLElement>,
    newLocale: string | null,
  ) {
    
    // MUI ToggleButtonGroup passes null when the user clicks the
    // already-selected option. Guard here to avoid a no-op navigation
    // or unnecessary state update in the caller.
    if (newLocale && newLocale !== currentLocale) {
      onLocaleChange(newLocale)
    }
  }

  return (
    <ToggleButtonGroup
      value={currentLocale}
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
      {/* Render buttons dynamically from localeOptions */}
      {localeOptions.map((option) => (
        <ToggleButton
          key={option.value}
          value={option.value}
          aria-label={option.label}
        >
          {option.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  )
}

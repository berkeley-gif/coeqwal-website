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
        height: (theme) => theme.spacing(5),
        fontSize: (theme) => theme.typography.button.fontSize,
        fontWeight: (theme) => theme.typography.button.fontWeight,
        fontFamily: (theme) => theme.typography.fontFamily,
        border: "none",
        "& .MuiToggleButtonGroup-grouped": {
          border: "none !important",
          "&:not(:first-of-type)": {
            borderLeft: "none !important",
            marginLeft: "0 !important",
          },
          "&.Mui-disabled": {
            border: "none !important",
          },
        },
        ...sx,
      }}
    >
      <ToggleButton
        value="en"
        sx={{
          height: (theme) => theme.spacing(5),
          minHeight: (theme) => theme.spacing(5),
          border: "none !important",
          boxShadow: (theme) =>
            `inset 0 0 0 1px ${theme.palette.overlay.water} !important`,
          fontSize: (theme) => theme.typography.button.fontSize,
          fontWeight: (theme) => theme.typography.button.fontWeight,
          fontFamily: (theme) => theme.typography.fontFamily,
          position: "relative",
          overflow: "hidden",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            backgroundColor: (theme) => theme.palette.common.white,
            color: (theme) => theme.palette.blue.darkest,
            border: "none !important",
            boxShadow: (theme) =>
              `inset 0 0 0 1px ${theme.palette.overlay.water} !important`,
          },
          "&.Mui-selected": {
            backgroundColor: (theme) => theme.palette.overlay.water,
            color: (theme) => theme.palette.common.white,
            border: "none !important",
            boxShadow: (theme) =>
              `inset 0 0 0 1px ${theme.palette.overlay.waterLight} !important`,
            "&:hover": {
              backgroundColor: (theme) => theme.palette.overlay.water,
              border: "none !important",
              boxShadow: (theme) =>
                `inset 0 0 0 1px ${theme.palette.overlay.waterLight} !important`,
            },
          },
        }}
      >
        English
      </ToggleButton>
      <ToggleButton
        value="es"
        sx={{
          height: (theme) => theme.spacing(5),
          minHeight: (theme) => theme.spacing(5),
          border: "none !important",
          boxShadow: (theme) =>
            `inset 0 0 0 1px ${theme.palette.overlay.water} !important`,
          fontSize: (theme) => theme.typography.button.fontSize,
          fontWeight: (theme) => theme.typography.button.fontWeight,
          fontFamily: (theme) => theme.typography.fontFamily,
          position: "relative",
          overflow: "hidden",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            backgroundColor: (theme) => theme.palette.common.white,
            color: (theme) => theme.palette.blue.darkest,
            border: "none !important",
            boxShadow: (theme) =>
              `inset 0 0 0 1px ${theme.palette.overlay.water} !important`,
          },
          "&.Mui-selected": {
            backgroundColor: (theme) => theme.palette.overlay.water,
            color: (theme) => theme.palette.common.white,
            border: "none !important",
            boxShadow: (theme) =>
              `inset 0 0 0 1px ${theme.palette.overlay.waterLight} !important`,
            "&:hover": {
              backgroundColor: (theme) => theme.palette.overlay.water,
              border: "none !important",
              boxShadow: (theme) =>
                `inset 0 0 0 1px ${theme.palette.overlay.waterLight} !important`,
            },
          },
        }}
      >
        Español
      </ToggleButton>
    </ToggleButtonGroup>
  )
}

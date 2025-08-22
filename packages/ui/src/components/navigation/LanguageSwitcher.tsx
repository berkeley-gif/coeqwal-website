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
        fontSize: (theme) => theme.typography.button.fontSize,
        fontWeight: (theme) => theme.typography.button.fontWeight,
        fontFamily: (theme) => theme.typography.fontFamily,
        border: "none",
        "& .MuiToggleButtonGroup-grouped": {
          border: "none",
          "&:not(:first-of-type)": {
            borderLeft: (theme) => `1px solid ${theme.palette.blue.darkest}`,
          },
          "&.Mui-disabled": {
            border: "none",
          },
        },
        ...sx,
      }}
    >
      <ToggleButton
        value="en"
        sx={{
          height: "40px",
          minHeight: "40px",
          border: "none",
          boxShadow: (theme) => `inset 0 0 0 1px ${theme.palette.blue.darkest}`,
          fontSize: (theme) => theme.typography.button.fontSize,
          fontWeight: (theme) => theme.typography.button.fontWeight,
          fontFamily: (theme) => theme.typography.fontFamily,
          position: "relative",
          overflow: "hidden",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            backgroundColor: (theme) => theme.palette.common.white,
            color: (theme) => theme.palette.blue.darkest,
            border: "none",
            transform: "translateY(-1px)",
            boxShadow: (theme) =>
              `0 4px 12px ${theme.palette.blue.darkest}66, inset 0 0 0 1px ${theme.palette.blue.darkest}`,
            "&::before": {
              opacity: 1,
            },
          },
          "&.Mui-selected": {
            backgroundColor: (theme) => theme.palette.blue.darkest,
            color: (theme) => theme.palette.common.white,
            border: "none",
            boxShadow: (theme) => `inset 0 0 0 1px ${theme.palette.blue.dark}`,
            "&:hover": {
              backgroundColor: (theme) => theme.palette.blue.dark,
              border: "none",
              transform: "translateY(-1px)",
              boxShadow: (theme) =>
                `0 4px 12px ${theme.palette.blue.darkest}66, inset 0 0 0 1px ${theme.palette.blue.dark}`,
            },
          },
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: "-100%",
            width: "100%",
            height: "100%",
            background: (theme) =>
              `linear-gradient(90deg, transparent, ${theme.palette.blue.darkest}1a, transparent)`,
            transition: "left 0.5s ease",
            opacity: 0,
          },
          "&:hover::before": {
            left: "100%",
          },
        }}
      >
        English
      </ToggleButton>
      <ToggleButton
        value="es"
        sx={{
          height: "40px",
          minHeight: "40px",
          border: "none",
          boxShadow: (theme) => `inset 0 0 0 1px ${theme.palette.blue.darkest}`,
          fontSize: (theme) => theme.typography.button.fontSize,
          fontWeight: (theme) => theme.typography.button.fontWeight,
          fontFamily: (theme) => theme.typography.fontFamily,
          position: "relative",
          overflow: "hidden",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            backgroundColor: (theme) => theme.palette.common.white,
            color: (theme) => theme.palette.blue.darkest,
            border: "none",
            transform: "translateY(-1px)",
            boxShadow: (theme) =>
              `0 4px 12px ${theme.palette.blue.darkest}66, inset 0 0 0 1px ${theme.palette.blue.darkest}`,
            "&::before": {
              opacity: 1,
            },
          },
          "&.Mui-selected": {
            backgroundColor: (theme) => theme.palette.blue.darkest,
            color: (theme) => theme.palette.common.white,
            border: "none",
            boxShadow: (theme) => `inset 0 0 0 1px ${theme.palette.blue.dark}`,
            "&:hover": {
              backgroundColor: (theme) => theme.palette.blue.dark,
              border: "none",
              transform: "translateY(-1px)",
              boxShadow: (theme) =>
                `0 4px 12px ${theme.palette.blue.darkest}66, inset 0 0 0 1px ${theme.palette.blue.dark}`,
            },
          },
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: "-100%",
            width: "100%",
            height: "100%",
            background: (theme) =>
              `linear-gradient(90deg, transparent, ${theme.palette.blue.darkest}1a, transparent)`,
            transition: "left 0.5s ease",
            opacity: 0,
          },
          "&:hover::before": {
            left: "100%",
          },
        }}
      >
        Español
      </ToggleButton>
    </ToggleButtonGroup>
  )
}

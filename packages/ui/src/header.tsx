"use client"

import React from "react"
import { AppBar, Toolbar, Typography, Stack, Button } from "@mui/material"
import { useTheme } from "@mui/material/styles"
import { useMediaQuery } from "@mui/material"
import { LanguageSwitcher } from "./language-switcher"
import { useUiLocale } from "./context/UiLocaleContext"
import en from "../public/locales/english.json"
import es from "../public/locales/spanish.json"

export const useResponsiveButtonVariant = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  return isMobile ? "text" : "outlined"
}

export function Header() {
  const buttonVariant = useResponsiveButtonVariant()
  const { locale } = useUiLocale()

  // Determine localized text
  const text = locale === "en"
    ? en.header.buttons
    : es.header.buttons

  return (
    <AppBar position="fixed" role="banner">
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Typography variant="h6">COEQWAL</Typography>
        <Stack direction="row" spacing={2}>
          <LanguageSwitcher />
          <Button
            variant={buttonVariant}
            sx={{
              border: buttonVariant === "text" ? "none" : undefined,
            }}
          >
            {text.getData}
          </Button>
          <Button
            variant={buttonVariant}
            sx={{
              border: buttonVariant === "text" ? "none" : undefined,
            }}
          >
            {text.aboutCOEQWAL}
          </Button>
        </Stack>
      </Toolbar>
    </AppBar>
  )
}

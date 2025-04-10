"use client"

import { AppBar, Toolbar, Stack, Button, Box } from "@mui/material"
import { useTheme } from "@mui/material/styles"
import { useMediaQuery } from "@mui/material"
import { useTranslation } from "@repo/i18n"
import { LanguageSwitcher } from "../index"
import { Logo } from "../common/Logo"
import { alpha } from "@mui/material/styles"

type HeaderTranslations = {
  title: string
  buttons: {
    getData: string
    about: string
  }
}

type TranslationsMap = {
  en: HeaderTranslations
  es: HeaderTranslations
}

const translations: TranslationsMap = {
  en: {
    title: "COEQWAL",
    buttons: {
      getData: "Raw Data",
      about: "About COEQWAL",
    },
  },
  es: {
    title: "COEQWAL",
    buttons: {
      getData: "Datos sin procesar",
      about: "Sobre COEQWAL",
    },
  },
}

export function Header() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const buttonVariant = isMobile ? "text" : "standard"
  const buttonStyle = {} // No need for additional styles since they're in the theme
  const { locale, isLoading } = useTranslation()

  // Use 'en' as default until client-side hydration is complete
  const safeLocale = !locale || isLoading ? "en" : locale
  const componentText =
    translations[safeLocale as keyof TranslationsMap] || translations.en

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: theme.zIndex.appBar,
        backgroundColor: theme.background.transparent,
        borderBottom: theme.border.standard,
        color: theme.palette.text.primary,
        borderRadius: theme.borderRadius.none,
        boxShadow: "none",
      }}
      elevation={0}
    >
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", paddingLeft: 1 }}>
          <Logo />
        </Box>
        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant={buttonVariant}
            sx={{
              ...buttonStyle,
            }}
          >
            {componentText.buttons.getData}
          </Button>
          <Button
            variant={buttonVariant}
            sx={{
              ...buttonStyle,
            }}
          >
            {componentText.buttons.about}
          </Button>
          <LanguageSwitcher />
        </Stack>
      </Toolbar>
    </AppBar>
  )
}

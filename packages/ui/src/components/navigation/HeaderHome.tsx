"use client"

import { AppBar, Toolbar, Stack, Button, Box } from "@mui/material"
import { useTheme } from "@mui/material/styles"
import { useMediaQuery } from "@mui/material"
import { useTranslation } from "@repo/i18n"
import { LanguageSwitcher } from "../index"
import { Logo } from "../common/Logo"
import PlayArrowIcon from "@mui/icons-material/PlayArrow"
import { useState, useEffect, useRef } from "react"
import { motion } from "@repo/motion"
export interface HeaderProps {
  onGlossaryClick?: () => void
  isGlossaryActive?: boolean
  onDataClick?: () => void
}

// Transition

const MotionAppBar = motion.create(AppBar)
const MotionStack = motion.create(Stack)

// Translation

type HeaderTranslations = {
  title: string
  buttons: {
    getData: string
    about: string
    glossary: string
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
      getData: "Data",
      about: "About COEQWAL",
      glossary: "Glossary",
    },
  },
  es: {
    title: "COEQWAL",
    buttons: {
      getData: "Datos sin procesar",
      about: "Sobre COEQWAL",
      glossary: "Glosario",
    },
  },
}

// NEW SIMPLIFIED HEADER
export function HeaderHome({
  onGlossaryClick,
  isGlossaryActive = false,
  onDataClick,
}: HeaderProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const { locale, isLoading } = useTranslation()

  // Use 'en' as default until client-side hydration is complete
  const safeLocale = !locale || isLoading ? "en" : locale
  const componentText =
    translations[safeLocale as keyof TranslationsMap] || translations.en

  const buttonVariant = isMobile ? "text" : "standard"
  const buttonStyle = {
    lineHeight: 1.1,
    height: "40px",
    minHeight: "40px",
    fontFamily: theme.typography.fontFamily,
    fontWeight: 500,
    color: "white",
  }

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: theme.zIndex.appBar,
        backgroundColor: "rgba(42, 82, 135, 0.2)", // Blue decorative circle color
        borderRadius: theme.borderRadius.card,
        margin: "16px",
        width: "calc(100% - 32px)",
        boxShadow: "none",
        border: "none",
      }}
      elevation={0}
    >
      <Toolbar
        sx={{
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", paddingLeft: 1 }}>
          <Logo />
        </Box>

        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          sx={{
            paddingRight: "8px",
          }}
        >
          <Button
            variant={buttonVariant}
            onClick={onDataClick}
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
          <Button
            variant={buttonVariant}
            onClick={onGlossaryClick}
            sx={{
              ...buttonStyle,
              backgroundColor: isGlossaryActive ? theme.palette.blue.medium : undefined,
              "&:hover": {
                backgroundColor: isGlossaryActive ? theme.palette.blue.bright : undefined,
              },
            }}
          >
            {componentText.buttons.glossary}
          </Button>
          <LanguageSwitcher />
        </Stack>
      </Toolbar>
    </AppBar>
  )
}

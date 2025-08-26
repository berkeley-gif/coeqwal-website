"use client"

import {
  AppBar,
  Toolbar,
  Stack,
  Button,
  Box,
} from "@mui/material"
import { useTheme } from "@mui/material/styles"
import { useMediaQuery } from "@mui/material"
import { useTranslation } from "@repo/i18n"
import { LanguageSwitcher } from "../index"
import { Logo } from "../common/Logo"
import { NavDropdown } from "./NavDropdown"
import type { NavDropdownOption } from "./NavDropdown"
import { motion, useMotionValueEvent, useScroll } from "@repo/motion"
import { useRef, useState } from "react"

const MotionAppBar = motion.create(AppBar)
export interface HeaderProps {
  onDataClick?: () => void
  onToolsClick?: (tool: "scenario-explorer" | "needs-search") => void
}

// Translation

type HeaderTranslations = {
  title: string
  buttons: {
    getData: string
    about: string
    tools: string
  }
  toolsDropdown: {
    scenarioExplorer: string
    needsSearch: string
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
      tools: "Tools",
    },
    toolsDropdown: {
      scenarioExplorer: "Scenario data explorer",
      needsSearch: "Needs-based search",
    },
  },
  es: {
    title: "COEQWAL",
    buttons: {
      getData: "Datos",
      about: "Sobre COEQWAL",
      tools: "Herramientas",
    },
    toolsDropdown: {
      scenarioExplorer: "Explorador de datos de escenarios",
      needsSearch: "Búsqueda basada en necesidades",
    },
  },
}

export function MainHeader({ onDataClick, onToolsClick }: HeaderProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const { locale, isLoading } = useTranslation()

  // Scroll-based hide/show functionality
  const [isHidden, setIsHidden] = useState(false)
  const { scrollY } = useScroll()
  const lastYRef = useRef(0)

  useMotionValueEvent(scrollY, "change", (latest) => {
    const difference = latest - lastYRef.current
    if (Math.abs(difference) > 10) {
      setIsHidden(difference > 0)
    }
    lastYRef.current = latest
  })

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
    fontWeight: theme.typography.button.fontWeight,
    color: "white",
  }

  const toolsOptions: NavDropdownOption[] = [
    {
      key: "scenario-explorer",
      label: componentText.toolsDropdown.scenarioExplorer,
      onClick: () => onToolsClick?.("scenario-explorer"),
    },
    {
      key: "needs-search", 
      label: componentText.toolsDropdown.needsSearch,
      onClick: () => onToolsClick?.("needs-search"),
    },
  ]

  return (
    <MotionAppBar
      animate={isHidden ? "hidden" : "visible"}
      whileHover="visible"
      onFocusCapture={() => setIsHidden(false)} // Accessibility: show header when focused
      variants={{
        hidden: {
          y: "calc(-100% - 16px)", // Account for 16px top margin
        },
        visible: {
          y: "0%",
        },
      }}
      transition={{ duration: 0.3 }}
      position="fixed"
      sx={{
        zIndex: theme.zIndex.appBar,
        backgroundColor: theme.palette.overlay.water,
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
          <NavDropdown
            label={componentText.buttons.tools}
            options={toolsOptions}
            variant={buttonVariant}
            sx={buttonStyle}
          />
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
          <LanguageSwitcher />
        </Stack>
      </Toolbar>
    </MotionAppBar>
  )
}

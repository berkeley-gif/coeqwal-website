"use client"

import { AppBar, Toolbar, Stack, Button, Box, Typography } from "@mui/material"
import { useTheme } from "@mui/material/styles"
import { useMediaQuery } from "@mui/material"
import { useTranslation } from "@repo/i18n"
import { LanguageSwitcher } from "../index"
import { Logo } from "../common/Logo"
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown"

type HeaderTranslations = {
  title: string
  buttons: {
    getData: string
    about: string
  }
  navigation: {
    home: string
    californiaWater: string
    managingWater: string
    challenges: string
    calsim: string
    explore: string
    scenarioSearch: string
  }
}

type TranslationsMap = {
  en: HeaderTranslations
  es: HeaderTranslations
}

interface HeaderProps {
  drawerOpen?: boolean
  drawerPosition?: "left" | "right"
  activeSection?: string
  onSectionClick?: (sectionId: string) => void
}

const translations: TranslationsMap = {
  en: {
    title: "COEQWAL",
    buttons: {
      getData: "Raw Data",
      about: "About COEQWAL",
    },
    navigation: {
      home: "HOME",
      californiaWater: "CALIFORNIA WATER",
      managingWater: "MANAGING WATER",
      challenges: "GROWING CHALLENGES",
      calsim: "CALSIM",
      explore: "EXPLORE",
      scenarioSearch: "SCENARIO SEARCH",
    },
  },
  es: {
    title: "COEQWAL",
    buttons: {
      getData: "Datos sin procesar",
      about: "Sobre COEQWAL",
    },
    navigation: {
      home: "INICIO",
      californiaWater: "AGUA DE CALIFORNIA",
      managingWater: "GESTIÓN DEL AGUA",
      challenges: "DESAFÍOS CRECIENTES",
      calsim: "CALSIM",
      explore: "EXPLORAR",
      scenarioSearch: "BÚSQUEDA DE ESCENARIOS",
    },
  },
}

// Map navigation items to their corresponding section IDs
const navigationSectionMap = {
  home: "hero", // Assuming "hero" is the ID for the HeroSection
  californiaWater: "california-water",
  managingWater: "managing-water",
  challenges: "challenges",
  calsim: "calsim",
  explore: "invitation",
  scenarioSearch: "combined-panel", // Assuming this is the ID for CombinedPanel
}

export function Header({
  drawerOpen = false,
  drawerPosition = "right",
  activeSection,
  onSectionClick,
}: HeaderProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const isTablet = useMediaQuery(theme.breakpoints.down("md"))
  const buttonVariant = isMobile ? "text" : "standard"
  const buttonStyle = {}
  const { locale, isLoading } = useTranslation()

  // Use 'en' as default until client-side hydration is complete
  const safeLocale = !locale || isLoading ? "en" : locale
  const componentText =
    translations[safeLocale as keyof TranslationsMap] || translations.en

  // Skip rendering navigation on mobile
  const showNavigation = !isMobile

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

        {/* Navigation Menu */}
        {showNavigation && (
          <Stack
            direction="row"
            spacing={1}
            sx={{
              flexGrow: 1,
              justifyContent: "center",
              display: { xs: "none", md: "flex" },
              mx: 2,
            }}
          >
            {Object.entries(componentText.navigation).map(([key, label]) => {
              const sectionId =
                navigationSectionMap[key as keyof typeof navigationSectionMap]
              const isActive = activeSection === sectionId

              return (
                <Button
                  key={key}
                  variant="text"
                  onClick={() => onSectionClick?.(sectionId)}
                  sx={{
                    color: "white",
                    minWidth: "auto",
                    px: isTablet ? 1 : 2,
                    fontSize: isTablet ? "0.75rem" : "0.875rem",
                    position: "relative",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {label}
                  {isActive && (
                    <ArrowDropDownIcon
                      sx={{
                        position: "absolute",
                        bottom: -12,
                        left: "50%",
                        transform: "translateX(-50%)",
                        fontSize: 24,
                      }}
                    />
                  )}
                </Button>
              )
            })}
          </Stack>
        )}

        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          sx={(theme) => ({
            // If drawer is on the right side
            ...(drawerPosition === "right" && {
              paddingRight: drawerOpen
                ? `calc(${theme.layout.drawer.width}px + 16px)` // Wide padding when drawer is open
                : `calc(${theme.layout.drawer.closedWidth}px + 16px)`, // Narrower padding when drawer is closed
            }),
            // If drawer is on the left side
            ...(drawerPosition === "left" && {
              paddingRight: "16px", // Fixed padding for left drawer
            }),
            transition: theme.transitions.create("padding", {
              easing: theme.transitions.easing.sharp,
              duration: drawerOpen
                ? theme.transitions.duration.enteringScreen
                : theme.transitions.duration.leavingScreen,
            }),
          })}
        >
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

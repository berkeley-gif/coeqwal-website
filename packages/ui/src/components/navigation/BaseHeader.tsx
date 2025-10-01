"use client"

import { AppBar, Toolbar, Stack, Button, Box } from "@mui/material"
import { useMediaQuery } from "@mui/material"
import { useTranslation } from "@repo/i18n"
import { LanguageSwitcher } from "./LanguageSwitcher"
import { Logo } from "../common/Logo"
import { NavDropdown } from "./NavDropdown"
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown"
import { motion, useMotionValueEvent, useScroll } from "@repo/motion"
import { useRef, useState } from "react"

const MotionAppBar = motion.create(AppBar)

// Translation types
type HeaderTranslations = {
  title: string
  buttons: {
    tools: string
    getData: string
    about: string
  }
  tools: {
    scenarioExplorer: string
    needsSearch: string
  }
}

type TranslationsMap = {
  en: HeaderTranslations
  es: HeaderTranslations
}

// Secondary nav option (optional)
export interface SecondaryNavItem {
  key: string
  label: string
  sectionId: string
}

// Main props interface
export interface BaseHeaderProps {
  // Navigation props
  activeSection?: string
  onSectionClick?: (sectionId: string) => void
  showSecondaryNav?: boolean
  secondaryNavItems?: SecondaryNavItem[]

  // Action handlers
  onDataClick?: () => void
  onToolsClick?: (tool: "scenario-explorer" | "needs-search") => void
  onAboutClick?: () => void

  // Styling props (theme-agnostic)
  backgroundColor?: string
  textColor?: string
  zIndex?: number
  borderRadius?: string | number
  boxShadow?: string

  // Layout props
  hideOnScroll?: boolean
  showLanguageSwitcher?: boolean
}

const translations: TranslationsMap = {
  en: {
    title: "COEQWAL",
    buttons: {
      tools: "Tools",
      getData: "Download data",
      about: "About COEQWAL",
    },
    tools: {
      scenarioExplorer: "Scenario data explorer",
      needsSearch: "Needs-based search",
    },
  },
  es: {
    title: "COEQWAL",
    buttons: {
      tools: "Herramientas",
      getData: "Descargar datos",
      about: "Sobre COEQWAL",
    },
    tools: {
      scenarioExplorer: "Explorador de datos de escenarios",
      needsSearch: "Búsqueda basada en necesidades",
    },
  },
}

// This maps sections to their parent section in the UI
// Used for arrow display when scrolling through combined sections
const sectionParentMap: Record<string, string | undefined> = {
  challenges: "managing-water", // Map challenges section to managing-water button
  calsim: "managing-water",
}

export function BaseHeader({
  activeSection,
  onSectionClick,
  showSecondaryNav = false,
  secondaryNavItems = [],
  onDataClick,
  onToolsClick,
  onAboutClick,
  backgroundColor = "rgba(255, 255, 255, 0.95)",
  textColor = "#000000",
  zIndex = 1100,
  borderRadius = 0,
  boxShadow = "none",
  hideOnScroll = true,
  showLanguageSwitcher = true,
}: BaseHeaderProps) {
  // Responsive breakpoints (using standard MUI breakpoints)
  const isMobile = useMediaQuery("(max-width:600px)")
  const isTablet = useMediaQuery("(max-width:900px)")

  const buttonVariant = isMobile ? "text" : "standard"
  const buttonStyle = {
    lineHeight: 1.1,
    height: 36,
    minHeight: 36,
    letterSpacing: "0.75px",
    fontSize: "0.95rem",
    fontWeight: 500,
    color: textColor,
  }

  const { locale, isLoading } = useTranslation()

  // Scroll-based hide/show functionality
  const [isHidden, setIsHidden] = useState(false)
  const { scrollY } = useScroll()
  const lastYRef = useRef(0)

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (!hideOnScroll) return

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

  // Only show secondary navigation if explicitly enabled and not on mobile
  const displaySecondaryNav =
    showSecondaryNav && !isMobile && secondaryNavItems.length > 0

  return (
    <MotionAppBar
      animate={hideOnScroll ? (isHidden ? "hidden" : "visible") : "visible"}
      whileHover="visible"
      onFocusCapture={() => setIsHidden(false)} // Accessibility: show header when focused
      variants={{
        hidden: {
          y: "-100%",
        },
        visible: {
          y: "0%",
        },
      }}
      transition={{ duration: 0.3 }}
      position="fixed"
      sx={{
        zIndex,
        backgroundColor,
        color: textColor,
        borderRadius,
        boxShadow,
      }}
      elevation={0}
    >
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", pl: 2 }}>
          <Logo />
        </Box>

        {/* Optional secondary navigation menu */}
        {displaySecondaryNav && (
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
            {secondaryNavItems.map((item) => {
              // Check if this section is directly active or if it's the parent of the active section
              const isActive =
                activeSection === item.sectionId ||
                sectionParentMap[activeSection || ""] === item.sectionId

              return (
                <Button
                  key={item.key}
                  variant="text"
                  disableRipple
                  onClick={() => onSectionClick?.(item.sectionId)}
                  sx={{
                    color: textColor,
                    minWidth: "auto",
                    px: isTablet ? 1 : 2,
                    fontSize: "0.875rem",
                    position: "relative",
                    letterSpacing: "0.03rem",
                    fontWeight: isActive ? 600 : 500,
                    transition: "color 0.3s ease",
                    lineHeight: 1.1,
                    "&:hover": {
                      backgroundColor: "transparent",
                    },
                    "&.MuiButtonBase-root:hover": {
                      backgroundColor: "transparent",
                    },
                  }}
                >
                  {item.label}
                  {isActive && (
                    <ArrowDropDownIcon
                      sx={{
                        position: "absolute",
                        bottom: -12,
                        left: "50%",
                        transform: "translateX(-50%)",
                        fontSize: 24,
                        color: textColor,
                        animation: "fadeIn 0.3s ease-in-out",
                        "@keyframes fadeIn": {
                          "0%": {
                            opacity: 0,
                            transform: "translateX(-50%) translateY(-5px)",
                          },
                          "100%": {
                            opacity: 1,
                            transform: "translateX(-50%) translateY(0)",
                          },
                        },
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
          sx={{
            pr: 2,
          }}
        >
          {/* Tools dropdown */}
          {onToolsClick && (
            <NavDropdown
              label={componentText.buttons.tools}
              options={[
                {
                  key: "scenario-explorer",
                  label: componentText.tools.scenarioExplorer,
                  onClick: () => onToolsClick("scenario-explorer"),
                },
                {
                  key: "needs-search",
                  label: componentText.tools.needsSearch,
                  onClick: () => onToolsClick("needs-search"),
                },
              ]}
              variant={buttonVariant}
              sx={buttonStyle}
            />
          )}

          {/* Data button */}
          {onDataClick && (
            <Button
              variant={buttonVariant}
              onClick={onDataClick}
              sx={{
                ...buttonStyle,
                color: textColor,
                position: "relative",
                overflow: "hidden",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  "&::before": {
                    opacity: 1,
                  },
                },
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: "-100%",
                  width: "100%",
                  height: "100%",
                  background:
                    "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)",
                  transition: "left 0.5s ease",
                  opacity: 0,
                },
                "&:hover::before": {
                  left: "100%",
                },
              }}
            >
              {componentText.buttons.getData}
            </Button>
          )}

          {/* About button */}
          <Button
            variant={buttonVariant}
            onClick={onAboutClick}
            sx={{
              ...buttonStyle,
              color: textColor,
              position: "relative",
              overflow: "hidden",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                "&::before": {
                  opacity: 1,
                },
              },
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: "-100%",
                width: "100%",
                height: "100%",
                background:
                  "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)",
                transition: "left 0.5s ease",
                opacity: 0,
              },
              "&:hover::before": {
                left: "100%",
              },
            }}
          >
            {componentText.buttons.about}
          </Button>

          {/* Language switcher */}
          {showLanguageSwitcher && <LanguageSwitcher />}
        </Stack>
      </Toolbar>
    </MotionAppBar>
  )
}

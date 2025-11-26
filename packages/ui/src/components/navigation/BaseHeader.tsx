"use client"

import { AppBar, Toolbar, Stack, Button, Box } from "@mui/material"
import { useMediaQuery } from "@mui/material"
import { useTranslation } from "@repo/i18n"
import { LanguageSwitcher } from "./LanguageSwitcher"
import { Logo } from "../common/Logo"
import { NavDropdown } from "./NavDropdown"
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown"
import { motion, useMotionValueEvent, useScroll, useTransform } from "@repo/motion"
import { useMemo, useRef, useState } from "react"

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

export const HEADER_SHRUNK_H = 40

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
  variant?: "fixed" | "overlay" | "static" | "sticky"
  hideOnScroll?: boolean
  shrinkOnScroll?: boolean
  showLanguageSwitcher?: boolean
}

const translations: TranslationsMap = {
  en: {
    title: "COEQWAL",
    buttons: {
      tools: "Tools",
      getData: "Get data",
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
  variant = "fixed",
  hideOnScroll = true,
  shrinkOnScroll = true,
  showLanguageSwitcher = true,
}: BaseHeaderProps) {
  // Responsive breakpoints (using standard MUI breakpoints)
  const isMobile = useMediaQuery("(max-width:600px)")
  const isTablet = useMediaQuery("(max-width:900px)")

  const buttonStyle = {
    fontSize: "1.125rem",
    fontWeight: 500,
    color: textColor,
    textTransform: "none" as const,
    padding: "8px 16px",
    transition: "opacity 0.2s ease",
    "&:hover": {
      backgroundColor: "transparent",
      opacity: 0.7,
    },
    "&:active": {
      backgroundColor: "transparent", // Hack for capsule shape it wants to make
    },
    "&.MuiButton-root": {
      minWidth: "auto",
    },
  }

  // i18n code
  const { locale, isLoading } = useTranslation()
  // Use 'en' as default until client-side hydration is complete
  const safeLocale = !locale || isLoading ? "en" : locale
  const componentText =
    translations[safeLocale as keyof TranslationsMap] || translations.en

  // Scroll-based hide/show functionality
  const { scrollY } = useScroll()

  // hide on scroll direction
  const [isHidden, setIsHidden] = useState(false)
  const lastYRef = useRef(0)

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (!hideOnScroll) return

    const difference = latest - lastYRef.current
    if (Math.abs(difference) > 10) {
      setIsHidden(difference > 0)
    }
    lastYRef.current = latest
  })



  // Map variant to CSS position
  const positionMap = {
    fixed: "fixed" as const,
    overlay: "absolute" as const,
    static: "static" as const,
    sticky: "sticky" as const,
  }
  const position = positionMap[variant]

  // Only show secondary navigation if explicitly enabled and not on mobile
  const displaySecondaryNav =
    showSecondaryNav && !isMobile && secondaryNavItems.length > 0

  const shrink = useTransform(scrollY, [0, 120, 240], [0, 0.5, 1])
  const headerHeight = shrinkOnScroll
    ? useTransform(shrink, [0, 1], ["70px", `${HEADER_SHRUNK_H}px`])
    : ({} as any) // we'll set a literal below
  const padY = shrinkOnScroll
    ? useTransform(shrink, [0, 1], ["12px", "4px"])
    : ({} as any)
  const logoScale = useTransform(shrink, [0, 1], [1, 0.65])

  // Static fallbacks if shrink is disabled
  const staticHeaderH = "70px"
  const staticPadY = "8px"

  return (
    <>
      <MotionAppBar
        animate={hideOnScroll ? (isHidden ? "hidden" : "visible") : "visible"}
        variants={{
          hidden: {
            y: "-100%",
          },
          visible: {
            y: "0%",
          },
        }}
        transition={{ duration: 0.3 }}
        position={position}
        sx={{
          zIndex,
          backgroundColor,
          color: textColor,
          borderRadius,
          boxShadow,
          ...(position !== "sticky" ? { top: 0, left: 0, right: 0 } : null),
          height: "var(--header-h)",
        }}
        style={{
          ["--header-h" as any]: shrinkOnScroll ? headerHeight : staticHeaderH,
          ["--pad-y" as any]: shrinkOnScroll ? padY : staticPadY,
          height: shrinkOnScroll ? headerHeight : staticHeaderH,
        }}
        whileHover="visible"
        onFocusCapture={() => setIsHidden(false)} // Accessibility: show header when focused
        elevation={0}
      >
        <Toolbar
          sx={{
            py: "var(--pad-y) !important",
            px: 2,
            minHeight: "var(--header-h) !important",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
          style={{ minHeight: "var(--header-h)" }}
        >
          <Box
            component={motion.div}
            style={{
              scale: logoScale,
              originX: 0,
              originY: 0.5,
              willChange: "transform",
            }}
            sx={{
              display: "flex",
              alignItems: "center",
              pl: 2,
              width: 168
            }}>
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
                variant="text"
                sx={buttonStyle}
              />
            )}

            {/* Data button */}
            {onDataClick && (
              <Button
                variant="text"
                disableRipple
                onClick={onDataClick}
                sx={buttonStyle}
              >
                {componentText.buttons.getData}
              </Button>
            )}

            {/* About button */}
            <Button
              variant="text"
              disableRipple
              onClick={onAboutClick}
              sx={buttonStyle}
            >
              {componentText.buttons.about}
            </Button>

            {/* Language switcher */}
            {showLanguageSwitcher && <LanguageSwitcher />}
          </Stack>
        </Toolbar>
      </MotionAppBar >
    </>
  )
}

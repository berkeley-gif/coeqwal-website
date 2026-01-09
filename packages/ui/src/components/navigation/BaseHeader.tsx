"use client"

/**
 * BaseHeader - Shared header component with navigation and branding
 *
 * Provides a responsive header with logo, navigation links, optional language switcher,
 * optional secondary navigation, optional scroll-based shrinking animation, and optional hide on scroll.
 *
 * Header dimensions (from theme.layout):
 * - Expanded: 70px (theme.layout.headerHeight)
 * - Collapsed: 40px (theme.layout.collapsedHeaderHeight)
 * - Shrink starts: 120px scroll (theme.layout.headerShrinkStart)
 * - Shrink ends: 240px scroll (theme.layout.headerShrinkEnd)
 *
 * WCAG 2.0 AA Compliance:
 * - WCAG 1.3.1: Semantic nav element for navigation region
 * - WCAG 2.4.1: Skip link for keyboard users to bypass navigation
 * - WCAG 2.4.7: Focus-visible styles on all interactive elements
 * - WCAG 4.1.2: Proper ARIA attributes on controls
 */

/* ========================================
 * IMPORTS
 * ======================================== */
import { AppBar, Toolbar, Stack, Button, Box, useTheme } from "@mui/material"
import { useMediaQuery } from "@mui/material"
import { useTranslation } from "@repo/i18n"
import { LanguageSwitcher } from "./LanguageSwitcher"
import { Logo } from "../common/Logo"
import { NavDropdown } from "./NavDropdown"
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown"
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "@repo/motion"
import { useRef, useState, useEffect } from "react"
import { themeValues } from "../../themes/theme"

/* ========================================
 * CONSTANTS & TYPES
 * ======================================== */
const MotionAppBar = motion.create(AppBar)

// Header height constants (exported for components that need static values)
// Prefer using theme.layout.headerHeight / theme.layout.collapsedHeaderHeight when possible
export const HEADER_EXPANDED_H = themeValues.layout.headerHeight // 70px
export const HEADER_SHRUNK_H = themeValues.layout.collapsedHeaderHeight // 40px

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
  onLogoClick?: () => void
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

  // Border props
  borderBottom?: string

  // Logo variant
  logoVariant?: "color" | "white"
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
  onLogoClick,
  onDataClick,
  onToolsClick,
  onAboutClick,
  backgroundColor = "rgba(255, 255, 255, 0.95)",
  textColor = "#000000",
  zIndex = 1100,
  borderRadius = 0,
  boxShadow = "none",
  variant = "fixed",
  hideOnScroll = false, // Optional: slides header out of view when scrolling down
  shrinkOnScroll = true, // Default: shrinks header from 70px to 40px on scroll
  showLanguageSwitcher = true,
  borderBottom,
  logoVariant = "color",
}: BaseHeaderProps) {
  /* ========================================
   * THEME & LAYOUT
   * ======================================== */
  const theme = useTheme()
  const isMobile = useMediaQuery("(max-width:600px)")
  const isTablet = useMediaQuery("(max-width:900px)")

  // Header dimensions from theme
  const expandedHeight = theme.layout.headerHeight // 70px
  const collapsedHeight = theme.layout.collapsedHeaderHeight // 40px
  const shrinkStart = theme.layout.headerShrinkStart // 120px
  const shrinkEnd = theme.layout.headerShrinkEnd // 240px

  /* ========================================
   * SCROLL-BASED SHRINK ANIMATION
   * Animates header from expanded to collapsed as user scrolls
   * ======================================== */
  const { scrollY } = useScroll()

  // Shrink progress: 0 (top) to 0.5 (shrinkStart) to 1 (shrinkEnd)
  const shrinkProgress = useTransform(
    scrollY,
    [0, shrinkStart, shrinkEnd],
    [0, 0.5, 1],
  )

  // Animated values driven by scroll
  const headerHeightMotion = useTransform(
    shrinkProgress,
    [0, 1],
    [`${expandedHeight}px`, `${collapsedHeight}px`],
  )
  const padYMotion = useTransform(shrinkProgress, [0, 1], ["12px", "4px"])
  const logoScale = useTransform(shrinkProgress, [0, 1], [1, 0.85])

  // Static fallbacks when shrinkOnScroll is disabled
  const staticHeaderH = `${expandedHeight}px`
  const staticPadY = "8px"

  /* ========================================
   * HIDE ON SCROLL (optional)
   * ======================================== */
  const [isMounted, setIsMounted] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const lastYRef = useRef(0)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (!hideOnScroll || !isMounted) return

    const difference = latest - lastYRef.current
    if (Math.abs(difference) > 10) {
      setIsHidden(difference > 0)
    }
    lastYRef.current = latest
  })

  /* ========================================
   * POSITION VARIANT
   * ======================================== */
  const positionMap = {
    fixed: "fixed" as const,
    overlay: "absolute" as const,
    static: "static" as const,
    sticky: "sticky" as const,
  }
  const position = positionMap[variant]

  /* ========================================
   * SECONDARY NAVIGATION (optional)
   * ======================================== */
  const displaySecondaryNav =
    showSecondaryNav && !isMobile && secondaryNavItems.length > 0

  /* ========================================
   * BUTTON STYLING
   * ======================================== */
  const buttonStyle = {
    ...theme.typography.nav, // Uses nav variant from theme (display font, 1.1rem, 600, capitalize)
    color: textColor,
    padding: "8px 20px",
    transition: "color 0.2s ease-out, text-shadow 0.2s ease-out",
    textShadow: theme.textShadow.nav, // lighter shadow for nav text
    "&:hover": {
      backgroundColor: "transparent",
      color: "#FFFFFF",
      textShadow: theme.textShadow.navHover,
    },
    "&:active": {
      backgroundColor: "transparent",
    },
    "&.MuiButton-root": {
      minWidth: "auto",
    },
    // WCAG 2.4.7: Focus visible indicator - DO NOT REMOVE
    "&:focus-visible": {
      outline: "2px solid currentColor",
      outlineOffset: 2,
    },
  }

  /* ========================================
   * TRANSLATIONS (i18n)
   * ======================================== */
  const { locale, isLoading } = useTranslation()
  const safeLocale = !locale || isLoading ? "en" : locale
  const componentText =
    translations[safeLocale as keyof TranslationsMap] || translations.en

  /* ========================================
   * RENDER
   * ======================================== */
  return (
    <>
      {/* WCAG 2.4.1: Skip link for keyboard users - DO NOT REMOVE */}
      <Box
        component="a"
        href="#main-content"
        sx={{
          position: "absolute",
          left: "-9999px",
          top: "auto",
          width: "1px",
          height: "1px",
          overflow: "hidden",
          zIndex: zIndex + 1,
          "&:focus": {
            position: "fixed",
            top: 8,
            left: 8,
            width: "auto",
            height: "auto",
            padding: "12px 24px",
            backgroundColor: theme.palette.common.white,
            color: theme.palette.common.black,
            fontWeight: 600,
            borderRadius: theme.borderRadius.md,
            boxShadow: theme.shadow.lg,
            outline: "2px solid",
            outlineColor: theme.palette.blue.bright,
            textDecoration: "none",
          },
        }}
      >
        Skip to main content
      </Box>
      <MotionAppBar
        initial="visible" // Prevent hydration mismatch for SSG
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
          borderBottom,
          ...(position !== "sticky" ? { top: 0, left: 0, right: 0 } : null),
          height: "var(--header-h)",
        }}
        style={
          {
            "--header-h": shrinkOnScroll ? headerHeightMotion : staticHeaderH,
            "--pad-y": shrinkOnScroll ? padYMotion : staticPadY,
            height: shrinkOnScroll ? headerHeightMotion : staticHeaderH,
          } as React.CSSProperties
        }
        whileHover={isMounted ? "visible" : undefined}
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
            justifyContent: "space-between",
          }}
          style={{ minHeight: "var(--header-h)" }}
        >
          <Box
            component={motion.button}
            type="button"
            onClick={() => {
              if (onLogoClick) {
                onLogoClick()
              } else {
                window.scrollTo({ top: 0, behavior: "smooth" })
              }
            }}
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
              width: 168,
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "pointer",
              "&:focus-visible": {
                outline: "2px solid currentColor",
                outlineOffset: "4px",
                borderRadius: "6px", // Special case: between sm (4px) and md (8px)
              },
            }}
            aria-label="Scroll to top"
          >
            <Logo variant={logoVariant} />
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
                    // WCAG 4.1.2: aria-current for active state
                    aria-current={isActive ? "page" : undefined}
                    sx={{
                      color: textColor,
                      minWidth: "auto",
                      px: isTablet ? 1 : 2,
                      fontSize: "0.875rem",
                      position: "relative",
                      letterSpacing: "0.03rem",
                      fontWeight: isActive ? 600 : 500,
                      transition: "color 0.3s ease", // theme.transition.color equivalent
                      lineHeight: 1.1,
                      "&:hover": {
                        backgroundColor: "transparent",
                      },
                      "&.MuiButtonBase-root:hover": {
                        backgroundColor: "transparent",
                      },
                      // WCAG 2.4.7: Focus visible indicator - DO NOT REMOVE
                      "&:focus-visible": {
                        outline: "2px solid currentColor",
                        outlineOffset: 2,
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

          {/* WCAG 1.3.1: Semantic nav element - DO NOT REMOVE */}
          <Box component="nav" aria-label="Main navigation">
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
          </Box>
        </Toolbar>
      </MotionAppBar>
    </>
  )
}

"use client"

/**
 * BaseHeader - Shared header component with navigation and branding
 *
 * Provides a responsive header with logo, navigation links, optional language switcher,
 * optional tools dropdown, and scroll-based shrinking animation.
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
import { useTranslation } from "@repo/i18n"
import { LanguageSwitcher } from "./LanguageSwitcher"
import { Logo } from "../common/Logo"
import { NavDropdown } from "./NavDropdown"
import { motion, useScroll, useTransform } from "@repo/motion"

/* ========================================
 * CONSTANTS & TYPES
 * ======================================== */
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

// Main props interface
export interface BaseHeaderProps {
  // Action handlers
  onLogoClick?: () => void
  onDataClick?: () => void
  onToolsClick?: (tool: "scenario-explorer" | "needs-search") => void
  onAboutClick?: () => void

  // Styling props
  backgroundColor?: string
  textColor?: string
  zIndex?: number

  // Layout props
  shrinkOnScroll?: boolean
  showLanguageSwitcher?: boolean

  // Border props
  borderBottom?: string

  // Logo variant
  logoVariant?: "color" | "light"
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

export function BaseHeader({
  onLogoClick,
  onDataClick,
  onToolsClick,
  onAboutClick,
  backgroundColor = "rgba(255, 255, 255, 0.95)",
  textColor = "#000000",
  zIndex = 1100,
  shrinkOnScroll = true, // Default: shrinks header from expanded to collapsed on scroll
  showLanguageSwitcher = true,
  borderBottom,
  logoVariant = "color",
}: BaseHeaderProps) {
  /* ========================================
   * THEME & LAYOUT
   * ======================================== */
  const theme = useTheme()

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
        position="fixed"
        sx={{
          zIndex,
          backgroundColor,
          color: textColor,
          borderRadius: theme.borderRadius.none,
          boxShadow: "none",
          borderBottom,
          inset: "0 0 auto 0",
          height: "var(--header-h)",
        }}
        style={
          {
            "--header-h": shrinkOnScroll ? headerHeightMotion : staticHeaderH,
            "--pad-y": shrinkOnScroll ? padYMotion : staticPadY,
            height: shrinkOnScroll ? headerHeightMotion : staticHeaderH,
          } as React.CSSProperties
        }
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

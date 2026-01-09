"use client"

/**
 * BaseHeader - Shared header component with navigation and branding
 *
 * Provides a responsive header with logo, navigation links, optional language switcher,
 * and scroll-based shrinking animation.
 *
 * Header dimensions (from theme.layout):
 * - Expanded: 70px (theme.layout.headerHeight)
 * - Collapsed: 40px (theme.layout.collapsedHeaderHeight)
 * - Shrink starts: 120px scroll (theme.layout.headerShrinkStart)
 * - Shrink ends: 240px scroll (theme.layout.headerShrinkEnd)
 *
 * Navigation links (left to right):
 * - Water stories dropdown: links to flow.coeqwal.org, climate.coeqwal.org
 * - Get data: links to dev.coeqwal.org/data
 * - About COEQWAL: placeholder (no link yet)
 * - Language switcher (optional)
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
import { useEffect, useState } from "react"
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

// Active water story - determined by current URL hostname
type ActiveWaterStory = "flow" | "climate" | null

// Translation types
type HeaderTranslations = {
  title: string
  buttons: {
    waterStories: string
    getData: string
    about: string
  }
  waterStories: {
    flow: string
    climate: string
  }
}

type TranslationsMap = {
  en: HeaderTranslations
  es: HeaderTranslations
}

// Main props interface
export interface BaseHeaderProps {
  // Action handlers (optional overrides)
  onLogoClick?: () => void

  // Styling props (theme tokens used as defaults)
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
      waterStories: "Water stories",
      getData: "Get data",
      about: "About COEQWAL",
    },
    waterStories: {
      flow: "How water flows through California",
      climate: "Climate change",
    },
  },
  es: {
    title: "COEQWAL",
    buttons: {
      waterStories: "Historias del agua",
      getData: "Descargar datos",
      about: "Sobre COEQWAL",
    },
    waterStories: {
      flow: "Cómo fluye el agua a través de California",
      climate: "Cambio climático",
    },
  },
}

/* ========================================
 * URL CONFIGURATION
 * ======================================== */
const URLS = {
  flow: "https://flow.coeqwal.org",
  climate: "https://climate.coeqwal.org",
  data: "https://dev.coeqwal.org/data",
  // TODO: Add about URL when available
  // about: "https://coeqwal.org/about",
}

export function BaseHeader({
  onLogoClick,
  backgroundColor = "transparent",
  textColor, // Default set after theme is available
  zIndex,
  shrinkOnScroll = true,
  showLanguageSwitcher = false,
  borderBottom, // Default set after theme is available
  logoVariant = "light",
}: BaseHeaderProps) {
  /* ========================================
   * THEME & LAYOUT
   * ======================================== */
  const theme = useTheme()

  // Use theme tokens for defaults
  const resolvedTextColor = textColor ?? theme.palette.common.white
  const resolvedBorderBottom = borderBottom ?? theme.border.rule
  const resolvedZIndex = zIndex ?? theme.zIndex.appBar

  // Header dimensions from theme
  const expandedHeight = theme.layout.headerHeight // 70px
  const collapsedHeight = theme.layout.collapsedHeaderHeight // 40px
  const shrinkStart = theme.layout.headerShrinkStart // 120px
  const shrinkEnd = theme.layout.headerShrinkEnd // 240px

  /* ========================================
   * ACTIVE WATER STORY DETECTION
   * Auto-detect which water story site we're on based on hostname
   * ======================================== */
  const [activeWaterStory, setActiveWaterStory] = useState<ActiveWaterStory>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    const hostname = window.location.hostname

    // Detect which water story site we're on (production only)
    if (hostname.includes("flow.coeqwal")) {
      setActiveWaterStory("flow")
    } else if (hostname.includes("climate.coeqwal")) {
      setActiveWaterStory("climate")
    }
    // Note: On localhost, no water story is active (dev environment)
  }, [])

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
    color: resolvedTextColor,
    padding: "8px 20px",
    transition: "color 0.2s ease-out, text-shadow 0.2s ease-out",
    textShadow: theme.textShadow.nav,
    "&:hover": {
      backgroundColor: "transparent",
      color: resolvedTextColor,
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
  const t = translations[safeLocale as keyof TranslationsMap] || translations.en

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
          zIndex: resolvedZIndex + 1,
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
          zIndex: resolvedZIndex,
          backgroundColor,
          color: resolvedTextColor,
          borderRadius: theme.borderRadius.none,
          boxShadow: "none",
          borderBottom: resolvedBorderBottom,
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
          {/* ----------------------------------------
           * LOGO
           * ---------------------------------------- */}
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
              // Reset default button styles
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "pointer",
              // WCAG 2.4.7: Focus visible indicator with rounded corners
              "&:focus-visible": {
                outline: "2px solid currentColor",
                outlineOffset: "4px",
                borderRadius: theme.borderRadius.sm,
              },
            }}
            aria-label="Scroll to top"
          >
            <Logo variant={logoVariant} />
          </Box>

          {/* ----------------------------------------
           * NAVIGATION
           * WCAG 1.3.1: Semantic nav element - DO NOT REMOVE
           * ---------------------------------------- */}
          <Box component="nav" aria-label="Main navigation">
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              sx={{ pr: 2 }}
            >
              {/* Water stories dropdown */}
              <NavDropdown
                label={t.buttons.waterStories}
                disableRipple
                options={[
                  {
                    key: "flow",
                    label: t.waterStories.flow,
                    onClick: () => (window.location.href = URLS.flow),
                    active: activeWaterStory === "flow",
                  },
                  {
                    key: "climate",
                    label: t.waterStories.climate,
                    onClick: () => (window.location.href = URLS.climate),
                    active: activeWaterStory === "climate",
                  },
                ]}
                variant="text"
                sx={buttonStyle}
              />

              {/* Get data */}
              <Button
                variant="text"
                disableRipple
                onClick={() => (window.location.href = URLS.data)}
                sx={buttonStyle}
              >
                {t.buttons.getData}
              </Button>

              {/* TODO: Add URLS.about when available and enable onClick */}
              <Button
                variant="text"
                disableRipple
                sx={buttonStyle}
              >
                {t.buttons.about}
              </Button>

              {/* OPTIONAL: Language switcher */}
              {showLanguageSwitcher && <LanguageSwitcher />}
            </Stack>
          </Box>
        </Toolbar>
      </MotionAppBar>
    </>
  )
}

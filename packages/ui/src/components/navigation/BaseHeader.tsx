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
 * Responsive behavior:
 * - Desktop (≥750px): Horizontal nav links
 * - Mobile (<750px): Hamburger menu with drawer from right
 *   - Language switcher (if enabled) stays visible, left of hamburger
 *
 * Background color modes:
 * 1. Static: Pass `backgroundColor` for a fixed color
 * 2. Scroll-based: Pass `backgroundColorScrolled` to transition from `backgroundColor`
 *    to a new color after scrolling past `backgroundScrollThreshold` (default: 200px)
 * 3. Custom: Main app uses its own scroll detection (isInTabsArea) and passes
 *    dynamic `backgroundColor` directly
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
import {
  AppBar,
  Toolbar,
  Stack,
  Button,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery,
} from "@mui/material"
import MenuIcon from "@mui/icons-material/Menu"
import CloseIcon from "@mui/icons-material/Close"
import { useTranslation } from "@repo/i18n"
import { LanguageSwitcher } from "./LanguageSwitcher"
import { Logo } from "../common/Logo"
import { NavDropdown } from "./NavDropdown"
import { motion, useScroll, useTransform, useMotionValueEvent } from "@repo/motion"

/* ========================================
 * CONSTANTS & TYPES
 * ======================================== */
const MotionAppBar = motion.create(AppBar)

// Mobile breakpoint - below this width, show hamburger menu
const MOBILE_BREAKPOINT = 750

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

/* ========================================
 * PROPS INTERFACE
 * ======================================== */
export interface BaseHeaderProps {
  /* --- Styling (theme tokens used as defaults) --- */
  backgroundColor?: string
  textColor?: string
  borderBottom?: string
  zIndex?: number
  logoVariant?: "color" | "light"

  /* --- Scroll-based background color (optional) --- */
  // If set, header auto-switches from backgroundColor → backgroundColorScrolled
  // after user scrolls past backgroundScrollThreshold pixels.
  // Leave unset if you want to control background color yourself (like main app does).
  backgroundColorScrolled?: string
  backgroundScrollThreshold?: number // default: 200px

  /* --- Optional features --- */
  shrinkOnScroll?: boolean // default: true
  showLanguageSwitcher?: boolean // default: false

  /* --- Action handlers (optional overrides) --- */
  onLogoClick?: () => void
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
  backgroundColorScrolled,
  backgroundScrollThreshold = 200,
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
   * RESPONSIVE: Mobile detection & drawer state
   * ======================================== */
  const isMobile = useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleMobileMenuOpen = () => setMobileMenuOpen(true)
  const handleMobileMenuClose = () => setMobileMenuOpen(false)

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
   * SCROLL EFFECTS
   * - Shrink animation: header shrinks from 70px to 40px as user scrolls
   * - Background color: optionally transitions to backgroundColorScrolled
   * ======================================== */
  const { scrollY } = useScroll()

  // --- Background color on scroll ---
  // Only active when backgroundColorScrolled prop is provided
  const [isScrolled, setIsScrolled] = useState(false)

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (backgroundColorScrolled) {
      setIsScrolled(latest > backgroundScrollThreshold)
    }
  })

  // Use scrolled color if we're past threshold, otherwise use base color
  const effectiveBackgroundColor =
    backgroundColorScrolled && isScrolled
      ? backgroundColorScrolled
      : backgroundColor

  // --- Shrink animation ---
  const shrinkProgress = useTransform(
    scrollY,
    [0, shrinkStart, shrinkEnd],
    [0, 0.5, 1],
  )

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
    ...theme.typography.nav,
    color: resolvedTextColor,
    padding: "8px 20px",
    transition: `color ${theme.transition.fast} ease-out, text-shadow ${theme.transition.fast} ease-out`,
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
   * Structure:
   * - Skip link (accessibility)
   * - AppBar container
   *   - Toolbar
   *     - Logo (left)
   *     - Desktop: Water stories | Get data | About | Language switcher
   *     - Mobile: Language switcher (optional) | Hamburger → Drawer
   * - Mobile drawer (slides from right)
   * ======================================== */
  return (
    <>
      {/* ----------------------------------------
       * ACCESSIBILITY: Skip link
       * WCAG 2.4.1 - DO NOT REMOVE
       * Allows keyboard users to bypass navigation
       * ---------------------------------------- */}
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

      {/* ----------------------------------------
       * HEADER CONTAINER
       * ---------------------------------------- */}
      <MotionAppBar
        position="fixed"
        sx={{
          zIndex: resolvedZIndex,
          backgroundColor: effectiveBackgroundColor,
          color: resolvedTextColor,
          // Smooth background color transition when scrolling past threshold
          transition: backgroundColorScrolled
            ? `background-color ${theme.transition.standard} ease`
            : undefined,
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
           * NAVIGATION - Desktop
           * WCAG 1.3.1: Semantic nav element - DO NOT REMOVE
           * ---------------------------------------- */}
          {!isMobile && (
            <Box component="nav" aria-label="Main navigation">
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                sx={{ pr: 2 }}
              >
                {/* 1. Water stories dropdown */}
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

                {/* 2. Get data */}
                <Button
                  variant="text"
                  disableRipple
                  onClick={() => (window.location.href = URLS.data)}
                  sx={buttonStyle}
                >
                  {t.buttons.getData}
                </Button>

                {/* 3. About COEQWAL - TODO: Add URLS.about when available */}
                <Button
                  variant="text"
                  disableRipple
                  sx={buttonStyle}
                >
                  {t.buttons.about}
                </Button>

                {/* 4. Language switcher (OPTIONAL) */}
                {showLanguageSwitcher && <LanguageSwitcher />}
              </Stack>
            </Box>
          )}

          {/* ----------------------------------------
           * NAVIGATION - Mobile
           * Language switcher (if enabled) + hamburger menu
           * ---------------------------------------- */}
          {isMobile && (
            <Stack direction="row" spacing={1} alignItems="center">
              {/* Language switcher stays visible on mobile (if enabled) */}
              {showLanguageSwitcher && <LanguageSwitcher />}

              {/* Hamburger menu button */}
              <IconButton
                onClick={handleMobileMenuOpen}
                aria-label="Open navigation menu"
                aria-expanded={mobileMenuOpen}
                aria-haspopup="true"
                sx={{
                  color: resolvedTextColor,
                  // WCAG 2.4.7: Focus visible indicator
                  "&:focus-visible": {
                    outline: "2px solid currentColor",
                    outlineOffset: 2,
                  },
                }}
              >
                <MenuIcon />
              </IconButton>
            </Stack>
          )}
        </Toolbar>
      </MotionAppBar>

      {/* ----------------------------------------
       * MOBILE DRAWER
       * Slides from right, rounded corners on top-left and bottom-right
       * ---------------------------------------- */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={handleMobileMenuClose}
        sx={{
          "& .MuiDrawer-paper": {
            width: "auto",
            minWidth: 280,
            maxWidth: "80vw",
            backgroundColor: theme.palette.common.white,
            borderTopLeftRadius: theme.borderRadius.lg,
            borderBottomRightRadius: theme.borderRadius.lg,
          },
        }}
      >
        {/* Header row: MENU label + close button */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: 2,
            pt: 2,
            pb: 1,
          }}
        >
          <Box
            component="span"
            sx={{
              ...theme.typography.overline,
              color: theme.palette.text.primary,
            }}
          >
            Menu
          </Box>
          <IconButton
            onClick={handleMobileMenuClose}
            aria-label="Close navigation menu"
            size="small"
            sx={{
              color: theme.palette.text.primary,
              "&:focus-visible": {
                outline: "2px solid currentColor",
                outlineOffset: 2,
              },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Divider />

        {/* Navigation links */}
        <Box
          component="nav"
          aria-label="Main navigation"
          sx={{ color: theme.palette.text.primary, pt: 1 }}
        >
          <List disablePadding>
            {/* Water Stories section */}
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => {
                  // Water Stories is a parent - clicking it could go to flow by default
                  window.location.href = URLS.flow
                  handleMobileMenuClose()
                }}
                sx={{ px: 2 }}
              >
                <ListItemText
                  primary={t.buttons.waterStories}
                  slotProps={{ primary: { sx: theme.typography.nav } }}
                />
              </ListItemButton>
            </ListItem>

            {/* Water story sub-items - indented */}
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => {
                  window.location.href = URLS.flow
                  handleMobileMenuClose()
                }}
                selected={activeWaterStory === "flow"}
                sx={{ pl: 4, pr: 2 }}
              >
                <ListItemText
                  primary={t.waterStories.flow}
                  slotProps={{ primary: { sx: theme.typography.caption } }}
                />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => {
                  window.location.href = URLS.climate
                  handleMobileMenuClose()
                }}
                selected={activeWaterStory === "climate"}
                sx={{ pl: 4, pr: 2 }}
              >
                <ListItemText
                  primary={t.waterStories.climate}
                  slotProps={{ primary: { sx: theme.typography.caption } }}
                />
              </ListItemButton>
            </ListItem>

            {/* Spacing between sections */}
            <Box sx={{ height: theme.spacing(2) }} />

            {/* Get data */}
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => {
                  window.location.href = URLS.data
                  handleMobileMenuClose()
                }}
                sx={{ px: 2 }}
              >
                <ListItemText
                  primary={t.buttons.getData}
                  slotProps={{ primary: { sx: theme.typography.nav } }}
                />
              </ListItemButton>
            </ListItem>

            {/* About COEQWAL */}
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => {
                  // TODO: Add URLS.about when available
                  handleMobileMenuClose()
                }}
                sx={{ px: 2 }}
              >
                <ListItemText
                  primary={t.buttons.about}
                  slotProps={{ primary: { sx: theme.typography.nav } }}
                />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </>
  )
}

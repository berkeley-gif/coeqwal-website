"use client"

/**
 * BaseHeader - Shared header component with navigation and branding
 *
 * Provides a responsive header with logo, navigation links, optional language switcher,
 * and scroll-based shrinking animation.
 *
 * Header dimensions (from theme.layout):
 * - Expanded: 56px (theme.layout.headerHeight)
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
 * WCAG 2.0 AA Compliance:
 * - WCAG 1.3.1: Semantic nav element, heading structure, role="group" for nav sections
 * - WCAG 1.4.1: Active states use bold text + bullet indicator (not color alone)
 * - WCAG 1.4.3: Ensure 4.5:1 contrast ratio for text (verify with runtime colors)
 * - WCAG 2.1.1: All interactive elements keyboard accessible
 * - WCAG 2.1.2: No keyboard traps (MUI Drawer handles focus trap correctly)
 * - WCAG 2.3.3: Respects prefers-reduced-motion for animations
 * - WCAG 2.4.1: Skip link is a separate <SkipLink /> component that must be
 *               placed FIRST in the page, before any other content including this header.
 *               See: packages/ui/src/components/navigation/SkipLink.tsx
 * - WCAG 2.4.3: Focus returns to trigger when drawer/dropdown closes
 * - WCAG 2.4.6: Descriptive labels on all interactive elements
 * - WCAG 2.4.7: Focus-visible styles on all interactive elements
 * - WCAG 2.4.8: aria-current="page" on active navigation items
 * - WCAG 2.5.5: Minimum 44x44px touch targets on mobile
 * - WCAG 4.1.2: aria-expanded, aria-haspopup, aria-controls, aria-labelledby on menus
 */

/* ========================================
 * IMPORTS
 * ======================================== */
import { useEffect, useState, useRef } from "react"
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
import type { NavDropdownOption } from "./NavDropdown"
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
} from "@repo/motion"

/* ========================================
 * CONSTANTS & TYPES
 * ======================================== */
const MotionAppBar = motion.create(AppBar)

// Mobile breakpoint - below this width, show hamburger menu
const MOBILE_BREAKPOINT = 750
// WCAG: Minimum touch target size (44x44px)
const MIN_TOUCH_TARGET = 44
// ID for drawer (used by aria-controls)
const MOBILE_DRAWER_ID = "mobile-nav-drawer"
// Active water story - determined by current URL hostname
type ActiveWaterStory = "flow" | "climate" | null

// Translation types
type HeaderTranslations = {
  buttons: {
    waterStories: string
    waterThemes: string
    getData: string
    about: string
  }
  waterStories: {
    flow: string
    climate: string
    managed: string
    equity: string
  }
}

type TranslationsMap = {
  en: HeaderTranslations
  es: HeaderTranslations
}

// Active state bullet indicator (WCAG 1.4.1: non-color indicator)
const ActiveBullet = ({ color }: { color: string }) => (
  <Box
    component="span"
    aria-hidden="true"
    sx={{
      width: 6,
      height: 6,
      borderRadius: "50%",
      backgroundColor: color,
      mr: 1,
      flexShrink: 0,
    }}
  />
)

/* ========================================
 * PROPS INTERFACE
 * ======================================== */
export interface BaseHeaderProps {
  /* --- Styling (theme tokens used as defaults) --- */
  backgroundColor?: string
  textColor?: string
  borderBottom?: string
  navTextShadow?: string
  zIndex?: number
  logoVariant?: "color" | "light"

  /* --- Scroll-based background color (optional) --- */
  // If set, header auto-switches from backgroundColor to backgroundColorScrolled
  // after user scrolls past backgroundScrollThreshold pixels.
  // Leave unset if you want to control background color yourself (like main app does).
  backgroundColorScrolled?: string
  backgroundScrollThreshold?: number // default: 200px

  /** Text color to transition to when header shrinks (default: same as textColor) */
  textColorScrolled?: string

  /* --- Optional features --- */
  shrinkOnScroll?: boolean // default: true
  showLanguageSwitcher?: boolean // default: false

  /* --- Action handlers (optional overrides) --- */
  onLogoClick?: () => void
  onGetDataClick?: () => void
  onAboutClick?: () => void

  /** Options for the Water Themes dropdown. When provided, a dropdown is rendered after Water Stories. */
  waterThemesOptions?: NavDropdownOption[]

  /** Optional offset from the top of the viewport. Used by apps whose
   *  rounded-panel layout keeps a visible frame strip above the header
   *  (so the header sits on the panel surface rather than over the frame).
   *
   *  Accepts a number (interpreted as px) or a raw CSS string such as
   *  `"24px"` or `"var(--panel-inset-y, clamp(16px, 3vw, 32px))"`.
   *  Defaults to `0` — behavior is identical to today for any consumer
   *  that does not pass this prop (e.g. storyline-flow). */
  topOffset?: string | number

  /** Optional symmetric inset from the left and right edges of the
   *  viewport. Lets the header pull in to match a rounded-panel side
   *  frame (typically `tunerInsetX()`). Defaults to `0` — behavior is
   *  identical to today for any consumer that does not pass this. */
  sideOffset?: string | number
}

/** Resolve an offset prop to a CSS-ready string; `undefined` → `"0"` so
 *  that the composed `inset` shorthand matches the previous literal
 *  exactly for consumers that don't opt in. */
const resolveOffset = (v: string | number | undefined): string =>
  v === undefined ? "0" : typeof v === "number" ? `${v}px` : v

const translations: TranslationsMap = {
  en: {
    buttons: {
      waterStories: "Guides",
      waterThemes: "Water themes",
      getData: "Get data",
      about: "About COEQWAL",
    },
    waterStories: {
      flow: "How water flows through California",
      climate: "How climate affects California water",
      managed: "How California water is managed",
      equity: "How equity shapes California water",
    },
  },
  es: {
    buttons: {
      waterStories: "Historias del agua",
      waterThemes: "Temas del agua",
      getData: "Descargar datos",
      about: "Sobre COEQWAL",
    },
    waterStories: {
      flow: "Cómo fluye el agua a través de California",
      climate: "Cómo el clima afecta el agua de California",
      managed: "Cómo se gestiona el agua en California",
      equity: "Cómo la equidad moldea el agua de California",
    },
  },
}

/* ========================================
 * URL CONFIGURATION
 * ======================================== */
const URLS = {
  flow: "https://flow.coeqwal.org",
  climate: "https://climate.coeqwal.org",
}

export function BaseHeader({
  onLogoClick,
  onGetDataClick,
  onAboutClick,
  waterThemesOptions,
  backgroundColor = "transparent",
  textColor, // Default set after theme is available
  navTextShadow = "none",
  zIndex,
  backgroundColorScrolled,
  backgroundScrollThreshold = 200,
  textColorScrolled,
  shrinkOnScroll = true,
  showLanguageSwitcher = false,
  borderBottom, // Default set after theme is available
  logoVariant = "light",
  topOffset,
  sideOffset,
}: BaseHeaderProps) {
  /* ========================================
   * THEME & LAYOUT
   * ======================================== */
  const theme = useTheme()

  // Use theme tokens for defaults (resolvedTextColor set after isScrolled)
  const baseTextColor = textColor ?? theme.palette.common.white
  const baseBorderBottom = borderBottom ?? theme.border.rule
  const resolvedZIndex = zIndex ?? theme.zIndex.appBar

  // Header dimensions from theme
  const expandedHeight = theme.layout.headerHeight // 56px
  const collapsedHeight = theme.layout.collapsedHeaderHeight // 40px
  const shrinkStart = theme.layout.headerShrinkStart // 120px
  const shrinkEnd = theme.layout.headerShrinkEnd // 240px

  /* ========================================
   * RESPONSIVE & MOTION PREFERENCES
   * ======================================== */
  const isMobile = useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
  const isWideDesktop = useMediaQuery("(min-width: 1200px)")
  // WCAG 2.3.3: Respect user's motion preferences
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // WCAG: Ref for focus return when drawer closes
  const hamburgerButtonRef = useRef<HTMLButtonElement>(null)

  /* ========================================
   * NAV LEFT EDGE → CSS VARIABLE
   * Publish the left viewport coordinate of the first nav item to
   * `--coeqwal-nav-left` on :root so other parts of the page
   * (e.g. hero body copy) can horizontally align to it. Updates on
   * resize and whenever the nav's size changes (hydration, fonts,
   * language switcher toggles, etc.).
   * ======================================== */
  const navRef = useRef<HTMLElement | null>(null)
  useEffect(() => {
    if (typeof window === "undefined") return
    const el = navRef.current
    if (!el) return

    const root = document.documentElement
    const update = () => {
      const left = el.getBoundingClientRect().left
      root.style.setProperty("--coeqwal-nav-left", `${left}px`)
    }
    update()

    const ro = new ResizeObserver(update)
    ro.observe(el)
    window.addEventListener("resize", update)
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", update)
    }
    // Re-bind whenever the nav mounts/unmounts (mobile ↔ desktop)
    // so the CSS variable stays in sync with the live DOM element.
  }, [isMobile])

  const handleMobileMenuOpen = () => setMobileMenuOpen(true)
  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false)
    // WCAG 2.4.3: Return focus to hamburger button when drawer closes
    setTimeout(() => hamburgerButtonRef.current?.focus(), 0)
  }

  /* ========================================
   * ACTIVE WATER STORY DETECTION
   * Auto-detect which water story site we're on based on hostname
   * ======================================== */
  const [activeWaterStory, setActiveWaterStory] =
    useState<ActiveWaterStory>(null)

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
    if (backgroundColorScrolled || textColorScrolled) {
      setIsScrolled(latest > backgroundScrollThreshold)
    }
  })

  // Use scrolled color if we're past threshold, otherwise use base color
  const effectiveBackgroundColor =
    backgroundColorScrolled && isScrolled
      ? backgroundColorScrolled
      : backgroundColor

  // Resolve text color, border, text shadow, and logo (transitions when scrolled)
  const resolvedTextColor =
    textColorScrolled && isScrolled ? textColorScrolled : baseTextColor
  const resolvedBorderBottom =
    textColorScrolled && isScrolled
      ? `${theme.strokeWidth.rule}px solid ${textColorScrolled}CC`
      : baseBorderBottom
  const resolvedLogoVariant =
    textColorScrolled && isScrolled ? ("color" as const) : logoVariant

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

  // Static fallbacks when shrinkOnScroll is disabled or user prefers reduced motion
  const staticHeaderH = `${expandedHeight}px`
  const staticPadY = "8px"

  // WCAG 2.3.3: Disable animations if user prefers reduced motion
  const shouldAnimate = shrinkOnScroll && !prefersReducedMotion

  /* ========================================
   * BUTTON STYLING
   * ======================================== */
  const buttonStyle = {
    ...theme.typography.nav,
    color: resolvedTextColor,
    padding: "0 10px",
    height: "100%",
    minHeight: 28,
    borderRadius: 0,
    textShadow: navTextShadow,
    position: "relative" as const,
    "&:hover": {
      backgroundColor: "transparent",
      color: resolvedTextColor,
      opacity: 0.7,
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
   *     - Mobile: Language switcher (optional) | Hamburger -> Drawer
   * - Mobile drawer (slides from right)
   * ======================================== */
  return (
    <>
      {/* ----------------------------------------
       * HEADER CONTAINER
       * Note: Skip link (WCAG 2.4.1) is now a separate component <SkipLink />
       * that should be placed FIRST in the page, before any other content.
       * See: packages/ui/src/components/navigation/SkipLink.tsx
       * ---------------------------------------- */}
      <MotionAppBar
        position="fixed"
        sx={{
          zIndex: resolvedZIndex,
          backgroundColor: effectiveBackgroundColor,
          color: resolvedTextColor,
          // Smooth color transitions when background/text change
          transition: `background-color ${theme.transition.standard} ease, color ${theme.transition.standard} ease, border-bottom ${theme.transition.standard} ease, top ${theme.transition.standard} ease, left ${theme.transition.standard} ease, right ${theme.transition.standard} ease`,
          borderRadius: theme.borderRadius.none,
          boxShadow: "none",
          borderBottom: resolvedBorderBottom,
          inset: `${resolveOffset(topOffset)} ${resolveOffset(sideOffset)} auto ${resolveOffset(sideOffset)}`,
          // MUI AppBar defaults to width: 100%, which would ignore the
          // `right` side of our `inset` shorthand and just shift the whole
          // 100%-wide bar to the right. Force width:auto so that
          // `left` + `right` together constrain the header's width,
          // letting it pull in symmetrically from both viewport edges.
          width: "auto",
          height: "var(--header-h)",
          overflow: "hidden",
        }}
        style={
          {
            "--header-h": shouldAnimate ? headerHeightMotion : staticHeaderH,
            "--pad-y": shouldAnimate ? padYMotion : staticPadY,
            height: shouldAnimate ? headerHeightMotion : staticHeaderH,
          } as React.CSSProperties
        }
        elevation={0}
      >
        <Toolbar
          sx={{
            py: "var(--pad-y) !important",
            px: isWideDesktop ? theme.space.panel.padding : 2,
            height: "var(--header-h) !important",
            minHeight: "unset !important",
            display: isWideDesktop ? "grid" : "flex",
            gridTemplateColumns: isWideDesktop ? "auto 1fr" : undefined,
            columnGap: isWideDesktop ? theme.spacing(4) : undefined,
            alignItems: "center",
            justifyContent: isWideDesktop ? undefined : "space-between",
          }}
          style={{ height: "var(--header-h)", minHeight: "unset" }}
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
              // WCAG 2.3.3: Only animate if user hasn't requested reduced motion
              scale: shouldAnimate ? logoScale : 1,
              originX: 0,
              originY: 0.5,
              willChange: shouldAnimate ? "transform" : "auto",
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
            aria-label={
              onLogoClick ? "COEQWAL home" : "COEQWAL - Scroll to top"
            }
          >
            <Logo variant={resolvedLogoVariant} />
          </Box>

          {/* ----------------------------------------
           * NAVIGATION - Desktop
           * WCAG 1.3.1: Semantic nav element - DO NOT REMOVE
           * ---------------------------------------- */}
          {!isMobile && (
            <Box
              component="nav"
              ref={navRef}
              aria-label="Main navigation"
              sx={{
                justifySelf: isWideDesktop ? "end" : undefined,
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
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
                    {
                      key: "managed",
                      label: t.waterStories.managed,
                      onClick: () => {},
                      disabled: true,
                    },
                    {
                      key: "equity",
                      label: t.waterStories.equity,
                      onClick: () => {},
                      disabled: true,
                    },
                  ]}
                  variant="text"
                  sx={buttonStyle}
                />

                {/* 2. Water themes dropdown (rendered when options are provided) */}
                {waterThemesOptions && waterThemesOptions.length > 0 && (
                  <NavDropdown
                    label={t.buttons.waterThemes}
                    disableRipple
                    options={waterThemesOptions}
                    variant="text"
                    sx={buttonStyle}
                  />
                )}

                {/* 3. Get data */}
                <Button
                  variant="text"
                  disableRipple
                  onClick={onGetDataClick ? onGetDataClick : undefined}
                  sx={buttonStyle}
                >
                  {t.buttons.getData}
                </Button>

                {/* 4. About COEQWAL */}
                <Button
                  variant="text"
                  disableRipple
                  onClick={onAboutClick ? onAboutClick : undefined}
                  sx={buttonStyle}
                >
                  {t.buttons.about}
                </Button>

                {/* Language switcher (OPTIONAL) */}
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
                ref={hamburgerButtonRef}
                onClick={handleMobileMenuOpen}
                aria-label="Open navigation menu"
                aria-expanded={mobileMenuOpen}
                aria-haspopup="dialog"
                aria-controls={MOBILE_DRAWER_ID}
                sx={{
                  color: resolvedTextColor,
                  // WCAG 2.5.5: Minimum 44x44px touch target
                  minWidth: MIN_TOUCH_TARGET,
                  minHeight: MIN_TOUCH_TARGET,
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
        id={MOBILE_DRAWER_ID}
        anchor="right"
        open={mobileMenuOpen}
        onClose={handleMobileMenuClose}
        // WCAG 2.4.6: Descriptive label for screen readers
        aria-label="Navigation menu"
        // WCAG: MUI Drawer handles focus trap, Escape key, and aria-modal automatically
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
          {/* WCAG 1.3.1: Heading for screen reader structure */}
          <Box
            component="h2"
            sx={{
              ...theme.typography.overline,
              color: theme.palette.text.primary,
              margin: 0,
            }}
          >
            Menu
          </Box>
          <IconButton
            onClick={handleMobileMenuClose}
            aria-label="Close navigation menu"
            sx={{
              color: theme.palette.text.primary,
              // WCAG 2.5.5: Minimum 44x44px touch target
              minWidth: MIN_TOUCH_TARGET,
              minHeight: MIN_TOUCH_TARGET,
              "&:focus-visible": {
                outline: "2px solid currentColor",
                outlineOffset: 2,
              },
            }}
          >
            <CloseIcon />
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
            {/* WCAG 1.3.1: Water Stories section with group semantics */}
            <ListItem
              disablePadding
              component="div"
              role="group"
              aria-labelledby="water-stories-label"
              sx={{ flexDirection: "column", alignItems: "stretch" }}
            >
              {/* Section header - non-interactive label */}
              <Box
                id="water-stories-label"
                component="span"
                sx={{
                  ...theme.typography.nav,
                  display: "block",
                  px: 2,
                  py: 1,
                }}
              >
                {t.buttons.waterStories}
              </Box>

              {/* Water story sub-items */}
              <List disablePadding>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => {
                      window.location.href = URLS.flow
                      handleMobileMenuClose()
                    }}
                    selected={activeWaterStory === "flow"}
                    // WCAG 2.4.8: Current page indication
                    aria-current={
                      activeWaterStory === "flow" ? "page" : undefined
                    }
                    sx={{
                      pl: 4,
                      pr: 2,
                      // WCAG 2.5.5: Minimum 44px touch target
                      minHeight: MIN_TOUCH_TARGET,
                      // WCAG 2.4.7: Focus visible indicator
                      "&:focus-visible": {
                        outline: `2px solid ${theme.palette.text.primary}`,
                        outlineOffset: -2,
                      },
                      // WCAG 1.4.1: Active state uses bold text (not just color)
                      ...(activeWaterStory === "flow" && {
                        fontWeight: theme.typography.fontWeightBold,
                      }),
                    }}
                  >
                    {activeWaterStory === "flow" && (
                      <ActiveBullet color={theme.palette.text.primary} />
                    )}
                    <ListItemText
                      primary={t.waterStories.flow}
                      slotProps={{
                        primary: {
                          sx: {
                            ...theme.typography.caption,
                            // Bold when active (non-color indicator)
                            fontWeight:
                              activeWaterStory === "flow"
                                ? theme.typography.fontWeightBold
                                : theme.typography.fontWeightRegular,
                          },
                        },
                      }}
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
                    aria-current={
                      activeWaterStory === "climate" ? "page" : undefined
                    }
                    sx={{
                      pl: 4,
                      pr: 2,
                      minHeight: MIN_TOUCH_TARGET,
                      "&:focus-visible": {
                        outline: `2px solid ${theme.palette.text.primary}`,
                        outlineOffset: -2,
                      },
                    }}
                  >
                    {activeWaterStory === "climate" && (
                      <ActiveBullet color={theme.palette.text.primary} />
                    )}
                    <ListItemText
                      primary={t.waterStories.climate}
                      slotProps={{
                        primary: {
                          sx: {
                            ...theme.typography.caption,
                            fontWeight:
                              activeWaterStory === "climate"
                                ? theme.typography.fontWeightBold
                                : theme.typography.fontWeightRegular,
                          },
                        },
                      }}
                    />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton
                    disabled
                    sx={{
                      pl: 4,
                      pr: 2,
                      minHeight: MIN_TOUCH_TARGET,
                    }}
                  >
                    <ListItemText
                      primary={t.waterStories.managed}
                      slotProps={{
                        primary: {
                          sx: { ...theme.typography.caption },
                        },
                      }}
                    />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton
                    disabled
                    sx={{
                      pl: 4,
                      pr: 2,
                      minHeight: MIN_TOUCH_TARGET,
                    }}
                  >
                    <ListItemText
                      primary={t.waterStories.equity}
                      slotProps={{
                        primary: {
                          sx: { ...theme.typography.caption },
                        },
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              </List>
            </ListItem>

            {/* Water themes section (mobile) */}
            {waterThemesOptions && waterThemesOptions.length > 0 && (
              <>
                <Box sx={{ height: theme.spacing(2) }} aria-hidden="true" />
                <ListItem
                  disablePadding
                  component="div"
                  role="group"
                  aria-labelledby="water-themes-label"
                  sx={{ flexDirection: "column", alignItems: "stretch" }}
                >
                  <Box
                    id="water-themes-label"
                    component="span"
                    sx={{
                      ...theme.typography.nav,
                      display: "block",
                      px: 2,
                      py: 1,
                    }}
                  >
                    {t.buttons.waterThemes}
                  </Box>
                  <List disablePadding>
                    {waterThemesOptions.map((option) => (
                      <ListItem key={option.key} disablePadding>
                        <ListItemButton
                          disabled={option.disabled}
                          onClick={() => {
                            option.onClick()
                            handleMobileMenuClose()
                          }}
                          sx={{
                            pl: 4,
                            pr: 2,
                            minHeight: MIN_TOUCH_TARGET,
                            "&:focus-visible": {
                              outline: `2px solid ${theme.palette.text.primary}`,
                              outlineOffset: -2,
                            },
                          }}
                        >
                          <ListItemText
                            primary={option.label}
                            slotProps={{
                              primary: {
                                sx: { ...theme.typography.caption },
                              },
                            }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </ListItem>
              </>
            )}

            {/* Spacing between sections */}
            <Box sx={{ height: theme.spacing(2) }} aria-hidden="true" />

            {/* Get data */}
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => {
                  onGetDataClick?.()
                  handleMobileMenuClose()
                }}
                sx={{
                  px: 2,
                  // WCAG 2.5.5: Minimum 44px touch target
                  minHeight: MIN_TOUCH_TARGET,
                  // WCAG 2.4.7: Focus visible indicator
                  "&:focus-visible": {
                    outline: `2px solid ${theme.palette.text.primary}`,
                    outlineOffset: -2,
                  },
                }}
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
                  onAboutClick?.()
                  handleMobileMenuClose()
                }}
                sx={{
                  px: 2,
                  minHeight: MIN_TOUCH_TARGET,
                  "&:focus-visible": {
                    outline: `2px solid ${theme.palette.text.primary}`,
                    outlineOffset: -2,
                  },
                }}
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

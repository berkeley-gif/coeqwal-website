/**
 * Theme Panel — A Panel that comes up from the bottom of the screen to display theme narratives
 * Renders when a theme is active (theme-prop is non-null)
 *
 * Structure:
 * - Sticky hero image
 * - Scrollable body
 *
 * WCAG:
 * - role="dialog" + aria-modal on the panel
 * - Escape key closes
 * - Body scroll locked while open
 */
"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import { motion, AnimatePresence } from "@repo/motion"
import { Box, useTheme, Typography, useMediaQuery } from "@repo/ui/mui"
import { ScrollToButton } from "@repo/ui"
import { Panel } from "@repo/ui"
import type { Theme, SectionContent } from "../content/themes"
import { MixedSectionRenderer } from "./themePanels/MixedSectionRenderer"
import { BoxSectionRenderer } from "./themePanels/BoxSectionRenderer"
import { CenteredTextSection } from "./CenteredTextSection"
import { useWhichScrollSection } from "../hooks/useWhichScrollSection"
import { usePanelRoute } from "../hooks/usePanelRoute"
import { themeValues } from "@repo/ui/themes/theme"

interface ThemePanelProps {
  // All the theme content and information
  theme: Theme | null
}

// Order matches THEME_SECTION_IDS exactly.
const SECTION_LABELS: Record<string, { long: string; short: string }> = {
  intro: {
    long: "Intro",
    short: "Intro",
  },
  "why-this-matters": {
    long: "Why this matters",
    short: "Importance",
  },
  "what-this-theme-focuses-on": {
    long: "What this theme focuses on",
    short: "Focus",
  },
  "what-to-keep-in-mind": {
    long: "What to keep in mind",
    short: "Keep in mind",
  },
  "what-management-strategies-are-explored": {
    long: "What management strategies are explored",
    short: "Management strategies",
  },
  "what-the-models-show": {
    long: "What the models show",
    short: "Model results",
  },
  "how-to-explore-further": {
    long: "How to explore further",
    short: "Explore further",
  },
}

/* Section content dispatcher
 * Dispatches to the correct renderer by content type.
 * Adding a new section type = adding one case here + a new renderer
 */
function SectionContentRenderer({ content }: { content: SectionContent }) {
  switch (content.type) {
    case "mixed":
      return <MixedSectionRenderer content={content} />
    case "boxes":
      return <BoxSectionRenderer content={content} />
    default: {
      // Exhaustive check — TypeScript will error here if a new
      // SectionContent type is added but not handled
      const _exhaustive: never = content
      return null
    }
  }
}


/**
 * Tracks whether a scroll container has scrolled past a threshold.
 */
function useScrollCollapse(
  containerRef: React.RefObject<HTMLElement | null>,
  threshold: number,
  enabled: boolean,
): boolean {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    // Don't attach the listener if the panel isn't open yet 
    if (!enabled) {
      // Reset so the hero starts expanded every time the panel opens
      setIsCollapsed(false)
      return
    }

    const el = containerRef.current
    if (!el) return

    const handleScroll = () => {
      // Only update state when the boolean changes 
      const shouldCollapse = el.scrollTop > threshold
      setIsCollapsed((prev) => (prev === shouldCollapse ? prev : shouldCollapse))
    }

    // passive: true, for mobile scroll performance
    el.addEventListener("scroll", handleScroll, { passive: true })
    return () => el.removeEventListener("scroll", handleScroll)
  }, [containerRef, threshold, enabled])

  return isCollapsed
}

export function ThemePanel({ theme }: ThemePanelProps) {
  const { closeThemePanel } = usePanelRoute()
  const muiTheme = useTheme()

  const duration = useMemo(() => ({
    fast: parseFloat(themeValues.transition.fast),
    standard: parseFloat(themeValues.transition.standard),
  }), [])



  const isOpen = theme !== null

  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"))

  // Ref for the scrollable content container
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Look for the sections that are active
  const activeSectionIds = useMemo(
    () => theme?.sections.map((s) => s.id as string) ?? [],
    [theme?.sections],
  )
  const activeSection = useWhichScrollSection(
    activeSectionIds,
    scrollContainerRef,
  )

  // Ref for the tab bar scroll container
  const tabBarRef = useRef<HTMLDivElement>(null)

  // Auto-scroll the active tab into view when the section changes
  useEffect(() => {
    if (!tabBarRef.current || !activeSection) return

    const tabBar = tabBarRef.current
    const activeTab = tabBar.querySelector<HTMLElement>(
      `[data-section-id="${activeSection}"]`
    )
    if (!activeTab) return

    // Center the active tab in the tab bar.
    // offsetLeft gives the tab's position relative to its parent (the tab bar).
    // We subtract half the bar width and add half the tab width to center it.
    const scrollTarget =
      activeTab.offsetLeft - tabBar.offsetWidth / 2 + activeTab.offsetWidth / 2

    tabBar.scrollTo({ left: scrollTarget, behavior: "smooth" })
  }, [activeSection])

  // Hero collapse state - driven by the panel's own scroll container
  // Resets automatically when isOpen flips to false (panel closes)
  const isHeroCollapsed = useScrollCollapse(
    scrollContainerRef,
    themeValues.layout.heroCollapseThreshold,
    isOpen,
  )

  // Lock scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  // WCAG 2.1.1: Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) closeThemePanel()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, closeThemePanel])

  // Scroll to section inside the panel container — not window
  const scrollToSection = (sectionId: string) => {
    const el = scrollContainerRef.current?.querySelector(`#${sectionId}`)
    el?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <AnimatePresence>
      {isOpen && theme && (
        <>
          <motion.div
            key={theme.id}
            role="dialog"
            aria-modal="true"
            aria-label={`${theme.shortLabel} theme`}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 250, damping: 35 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: muiTheme.zIndex.modal,
              display: "flex",
              flexDirection: "column",
              backgroundColor: muiTheme.palette.background.default,
              height: "100dvh",
            }}
          >
            {
              // Sticky hero
              // position: sticky only works when parent is flex + flexDirection: column
            }
            <Box sx={{ position: "sticky", top: 0, zIndex: 1, flexShrink: 0 }}>
              {/* Hero */}
              <motion.div
                animate={{
                  paddingTop: isHeroCollapsed ?
                    (isMobile ? 8 : 10) :
                    (isMobile ? 14 : 25),
                  paddingBottom: isHeroCollapsed ?
                    (isMobile ? 8 : 10) :
                    (isMobile ? 14 : 25),
                }}
                transition={{ duration: duration.standard, ease: [0.4, 0, 0.2, 1] }}
                style={{
                  display: "flex",
                  position: "relative",
                  flexDirection: isMobile ? "column" : "row",
                  alignItems: isMobile ? "flex-start" : "center",
                  gap: isMobile ? muiTheme.spacing(1) : muiTheme.space.listGap.lg,
                  overflow: "hidden",
                  backgroundColor: muiTheme.palette.grey[200],
                  paddingLeft: muiTheme.space.panel.padding,
                  paddingRight: muiTheme.space.panel.padding,
                }}
              >
                {theme.heroImage && (
                  <Box
                    component="img"
                    src={theme.heroImage}
                    // Decorative — title is rendered as text below
                    alt=""
                    aria-hidden="true"
                    sx={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                      filter: isHeroCollapsed ? "brightness(0.4)" : "brightness(0.6)",
                      zIndex: muiTheme.zIndex.heroBackground,
                    }}
                  />
                )}
                {/* Close button + Mobile Title 
                top left, arrow pointing left */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 1,
                    zIndex: muiTheme.zIndex.pageContent,
                    width: isMobile ? "100%" : "auto",
                    minWidth: 0,
                  }}
                >
                  <ScrollToButton
                    onClick={closeThemePanel}
                    // 180deg = arrow points left (back/close affordance)
                    rotation="90deg"
                    size={45}
                    axis="horizontal"
                    color={muiTheme.palette.common.white}
                    ariaLabel="Close theme panel"
                    animationComplete={true}
                    delay={0}
                  />

                  {/*
                 * Mobile-only title — always shows the compact h5 variant.
                 * Desktop has the animated h3 - h5 collapse below.
                 */}

                  {isMobile && (
                    <Typography
                      variant="h5"
                      sx={{
                        color: muiTheme.palette.common.white,
                        zIndex: muiTheme.zIndex.pageContent,
                        flex: 1,
                        minWidth: 0,
                        // Prevent long theme names from overflowing on small screens
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {theme.label.replace(/\n/g, " ")}
                    </Typography>
                  )}
                </Box>
                {/* Title + inquiry - title always visible, inquiry collapses */}
                {!isMobile && (
                  <Box
                    sx={{
                      color: muiTheme.palette.common.white,
                      zIndex: muiTheme.zIndex.pageContent,
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {isHeroCollapsed ? (
                        <motion.div
                          key="title-collapsed"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: duration.fast }}
                        >
                          <Typography
                            variant="h5"
                            sx={{ textTransform: "capitalize" }}
                          >
                            {theme.label.replace(/\n/g, " ")}
                          </Typography>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="title-expanded"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: duration.fast }}
                        >
                          <Typography
                            variant="h3"
                            sx={{ textTransform: "capitalize" }}
                          >
                            {theme.label.replace(/\n/g, " ")}
                          </Typography>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <AnimatePresence initial={false}>
                      {!isHeroCollapsed && (
                        <motion.div
                          key="inquiry"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: duration.standard, ease: [0.4, 0, 0.2, 1] }}
                          style={{ overflow: "hidden" }}
                        >
                          <Typography
                            variant="body1"
                            sx={{ maxWidth: themeValues.spacing.paragraphMaxSize, mt: 0.5 }}
                          >
                            {theme.inquiry}
                          </Typography>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Box>
                )}
              </motion.div>

              {/* Horizontal Scroll Tab Index */}
              <Box
                ref={tabBarRef}
                component="nav"
                role="tablist"
                aria-label="Index for the theme sections"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: isMobile ? "flex-start" : "space-evenly",
                  width: "100%",
                  height: muiTheme.layout.collapsedTabHeight,
                  background: muiTheme.palette.brand.panelMedium,
                  overflowX: "auto",
                  // Hide the scrollbar visually but keep it functional.
                  // scrollbarWidth targets Firefox; ::-webkit-scrollbar targets Chrome/Safari.
                  scrollbarWidth: "none",
                  "&::-webkit-scrollbar": { display: "none" },
                  px: isMobile ? 1 : 0,
                  gap: isMobile ? 0.5 : 0,
                  // Prevent tab bar from being taller than its declared height
                  flexShrink: 0,
                }}
              >
                {theme.sections
                  .filter((s) => SECTION_LABELS[s.id]?.short !== "")
                  .map((section) => {
                    const isActive = activeSection === section.id
                    return (
                      <Box
                        key={section.id}
                        component="button"
                        data-section-id={section.id}
                        onClick={() => scrollToSection(section.id)}
                        aria-pressed={isActive}
                        aria-label={SECTION_LABELS[section.id]?.long}
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          flexShrink: 0,
                          px: isMobile ? 1 : 1.25,
                          py: 0.5,
                          border: "none",
                          minHeight: muiTheme.layout.collapsedTabHeight,
                          borderRadius: muiTheme.borderRadius.sm ?? "4px",
                          cursor: "pointer",
                          background: "transparent",
                          color: muiTheme.palette.common.white,
                          textShadow: "none",
                          transition: "background-color 0.15s",
                          // WCAG 2.4.7: focus visible indicator
                          "&:focus-visible": {
                            outline: `2px solid ${muiTheme.palette.common.white}`,
                            outlineOffset: -2,
                          },
                        }}
                      >
                        <Typography
                          component="span"
                          variant="subtitle2"
                          sx={{
                            lineHeight: 1,
                            whiteSpace: "nowrap",
                            color: "inherit",
                            textShadow: "none",
                            fontWeight: 600,
                            opacity: isActive ? 1 : 0.5,
                            transition: "opacity 0.15s ease",
                          }}
                        >
                          {SECTION_LABELS[section.id]?.short}
                        </Typography>
                      </Box>
                    )
                  })}
              </Box>
            </Box>

            {/* Scrollable body */}
            <Box
              ref={scrollContainerRef}
              sx={{
                flex: 1,
                overflowY: "auto",
                width: "100%",
              }}
            >
              {theme.sections.map((section) => (
                <Panel
                  id={section.id}
                  key={section.id}
                  ariaLabel={section.id}
                  fullHeight={false}
                  includeNavbarPadding={false}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: muiTheme.space.gap.xl,
                  }}
                >
                  {SECTION_LABELS[section.id] && (
                    <Typography
                      variant="h4"
                      sx={{
                        textTransform: "capitalize",
                      }}
                    >
                      {SECTION_LABELS[section.id]?.long}
                    </Typography>
                  )}
                  <SectionContentRenderer content={section.content} />
                </Panel>
              ))}
              <CenteredTextSection
                id="conclusion"
                ariaLabel="Conclusion"
                text="Together, these views make trade-offs, equity, and resilience visible, providing a shared, data-grounded basis for comparison, discussion, and learning."
                bgColor={muiTheme.palette.brand.water}
                textColor={muiTheme.palette.text.secondary}
              />
            </Box>
          </motion.div>
        </>
      )
      }
    </AnimatePresence >
  )
}

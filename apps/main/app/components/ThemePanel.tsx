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

import { useEffect, useRef, useMemo } from "react"
import { motion, AnimatePresence } from "@repo/motion"
import { Box, useTheme, Typography } from "@repo/ui/mui"
import { usePanelRoute } from "../hooks/usePanelRoute"
import type { Theme, ThemeSectionId, SectionContent } from "../../../../packages/data/src/coeqwal/themes"
import { MixedSectionRenderer } from "./themePanels/MixedSectionRenderer"
import { BoxSectionRenderer } from "./themePanels/BoxSectionRenderer"
import { ScrollToButton } from "@repo/ui"
import { useWhichScrollSection } from "../hooks/useWhichScrollSection"

interface ThemePanelProps {
    // All the theme content and information
    theme: Theme | null
}

// Order matches THEME_SECTION_IDS exactly.
const SECTION_LABELS: Record<string, string> = {
    "intro": "Intro",
    "why-this-matters": "Why this matters",
    "what-this-theme-focuses-on": "What this theme focuses on",
    "what-to-keep-in-mind": "What to keep in mind",
    "what-management-strategies-are-explored": "Management strategies",
    "what-the-models-show": "What the models show",
    "how-to-explore-further": "How to explore further",
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

export function ThemePanel({ theme }: ThemePanelProps) {
    const { closeThemePanel } = usePanelRoute()
    const muiTheme = useTheme()

    const isOpen = theme !== null

    // Ref for the scrollable content container 
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    // Look for the sections that are active
    const activeSectionIds = useMemo(
        () => theme?.sections.map((s) => s.id as string) ?? [],
        [theme?.id] // only recompute when the theme changes, not on every render
    )
    const activeSection = useWhichScrollSection(activeSectionIds, scrollContainerRef)
    console.log("activeSection:", activeSection)
    console.log("activeSectionIds:", activeSectionIds)

    // Lock scroll when open
    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : ""
        return () => { document.body.style.overflow = "" }
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
                            // dvh handles mobile browser chrome correctly —
                            // vh would be clipped by the browser address bar on mobile
                            height: "100dvh",

                        }}
                    >
                        {// Sticky hero
                            // position: sticky only works when parent is flex + flexDirection: column
                        }
                        <Box sx={{ position: "sticky", top: 0, zIndex: 1, flexShrink: 0, }}>
                            {/* Hero */}
                            <Box
                                sx={{
                                    display: "flex",
                                    position: "relative",
                                    flexDirection: "row",
                                    alignItems: "flex-start",
                                    gap: muiTheme.space.gap.md,
                                    height: "auto",
                                    overflow: "hidden",
                                    backgroundColor: muiTheme.palette.grey[200],
                                    padding: `25px ${muiTheme.space.panel.padding}`
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
                                            filter: "brightness(0.6)",
                                            zIndex: muiTheme.zIndex.heroBackground,
                                        }}
                                    />
                                )}
                                {/* Close button — top left, arrow pointing left */}
                                <Box
                                    sx={{
                                        zIndex: muiTheme.zIndex.pageContent,
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
                                </Box>

                                {/* Theme title + inquiry overlaid on hero */}
                                <Box
                                    sx={{
                                        color: muiTheme.palette.common.white,
                                        zIndex: muiTheme.zIndex.pageContent,
                                    }}
                                >
                                    <Typography
                                        variant="h2"
                                        sx={{
                                            textTransform: "capitalize",

                                        }}
                                    >
                                        {theme.label.replace(/\n/g, " ")}
                                    </Typography>
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            maxWidth: "100%"
                                        }}
                                    >
                                        {theme.inquiry}
                                    </Typography>
                                </Box>


                            </Box>

                            {/* Horizontal Scroll Index */}
                            <Box
                                component="nav"
                                role="tablist"
                                aria-label="Index for the theme sections"
                                sx={{
                                    position: "sticky",
                                    top: 0,
                                    zIndex: muiTheme.zIndex.appBar,
                                    flexShrink: 0,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-evenly",
                                    width: "100%",
                                    height: muiTheme.layout.collapsedTabHeight,
                                    ...muiTheme.typography.nav,
                                    background: muiTheme.palette.waterThemes.delta.background,
                                    lineHeight: 1,
                                    overflowX: "auto",
                                    scrollBarWIdth: "none",
                                }}
                            >
                                {theme.sections
                                    .filter((s) => SECTION_LABELS[s.id] !== "")
                                    .map((section) => {
                                        const isActive = activeSection === section.id
                                        return (
                                            <Box
                                                key={section.id}
                                                component="button"
                                                onClick={() => scrollToSection(section.id)}
                                                aria-pressed={isActive}
                                                aria-label={SECTION_LABELS[section.id]}
                                                sx={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    px: 1.25,
                                                    py: 0.5,
                                                    border: "none",
                                                    borderRadius: muiTheme.borderRadius.sm ?? "4px",
                                                    cursor: "pointer",
                                                    background: "transparent",
                                                    color: muiTheme.palette.waterThemes.delta.text,
                                                    textShadow: "none",
                                                    transition: "background-color 0.15s",
                                                    // Use data attribute for active — more specific than :hover
                                                    '&[data-active="true"]': {
                                                        background: "rgba(255,255,255,0.2)",
                                                    },
                                                    "&:hover": {
                                                        background: "rgba(255,255,255,0.1)",
                                                    },
                                                    '&[data-active="true"]:hover': {
                                                        background: "rgba(255,255,255,0.25)",
                                                    },
                                                    "&:focus-visible": {
                                                        outline: "2px solid rgba(255,255,255,0.8)",
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
                                                        opacity: isActive ? 1 : 0.6,
                                                        transition: "opacity 0.15s ease",
                                                    }}
                                                >
                                                    {SECTION_LABELS[section.id]}
                                                </Typography>
                                            </Box>
                                        )
                                    })}

                            </Box>
                        </Box>

                        {// Scrollable body
                        }
                        <Box
                            ref={scrollContainerRef}
                            sx={{
                                flex: 1,
                                overflowY: "auto",
                                padding: { xs: 3, md: 6 },
                                width: "100%",
                                mx: "auto",
                            }}
                        >
                            {theme.sections.map((section) => (
                                <Box
                                    key={section.id}
                                    component="section"
                                    // id is the scrollspy anchor — must match what useScrollSpy observes
                                    id={section.id}
                                    sx={{ marginBottom: 8 }}
                                >
                                    {/* Skip heading for intro — it has no label */}
                                    {SECTION_LABELS[section.id] && (
                                        <Typography
                                            variant="h3"
                                            sx={{
                                                textTransform: "capitalize",

                                            }}
                                        >
                                            {SECTION_LABELS[section.id]}
                                        </Typography>

                                    )}
                                    <SectionContentRenderer content={section.content} />
                                </Box>
                            ))}
                        </Box>
                    </motion.div>
                </>
            )
            }
        </AnimatePresence >
    )
}
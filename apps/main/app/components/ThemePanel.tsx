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

import { useEffect, useRef } from "react"
import { motion, AnimatePresence } from "@repo/motion"
import { Box, useTheme } from "@repo/ui/mui"
import { usePanelRoute } from "../hooks/usePanelRoute"
import type { Theme, ThemeSectionId, SectionContent } from "../../../../packages/data/src/coeqwal/themes"
import { THEME_SECTION_IDS } from "../../../../packages/data/src/coeqwal/themes"
import { MixedSectionRenderer } from "./themePanels/MixedSectionRenderer"
import { BoxSectionRenderer } from "./themePanels/BoxSectionRenderer"

interface ThemePanelProps {
    // All the theme content and information
    theme: Theme | null
}

// Order matches THEME_SECTION_IDS exactly.
const SECTION_LABELS: Record<string, string> = {
    "intro": "",
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

    const activeSectionIds = theme?.sections.map((s) => s.id as string) ?? []
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
                        transition={{ type: "spring", stiffness: 300, damping: 35 }}
                        onClick={closeThemePanel}
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
                        Something here
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
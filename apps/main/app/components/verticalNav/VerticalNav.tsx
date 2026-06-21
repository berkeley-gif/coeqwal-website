
/**
 * VerticalNav.tsx
 *
 * Collapsible left sidebar navigation.
 *
 * Structure:
 * - Expanded: full-width sidebar with first-level items and nested
 *   second-level sub-section items for the active first-level item.
 * - Collapsed: narrow slit showing only the toggle button.
 *
 * First-level items: clicking navigates to that section (routing via onNavigate).
 * Second-level items: auto-highlighted by scroll position; clicking scrolls there.
 *
 * FLAG: Wire `onNavigate` to your actual routing system (usePanelRoute,
 * Next.js router, mapMode store action, etc.) when routing is confirmed.
 * The current stub logs to console so the component renders and is testable.
 */

import { useState, useCallback } from "react"
import {
    Box,
    Typography,
    IconButton,
    useTheme,
} from "@repo/ui/mui"
import { MenuIcon, ChevronLeftIcon } from "@repo/ui/mui"
import { NAV_SECTIONS, type NavSection } from "./VerticalNavSections"
import { useVerticalNavScroll } from "./../../hooks/useVerticalNavScroll"

// ============================================================================
// Constants
// ============================================================================

const NAV_WIDTH_EXPANDED = 240
const NAV_WIDTH_COLLAPSED = 40



// ============================================================================
// Sub-types
// ============================================================================

interface VerticalNavProps {
    /**
     * Called when a first-level nav item is clicked.
     * Receives the section id — wire this to your routing system.
     * FLAG: replace the console.log stub in the component body.
     */
    onNavigate?: (sectionId: string) => void
    /**
     * The currently active first-level section id.
     * Controls which section's sub-items are shown and which item is highlighted.
     * FLAG: drive this from your router or mapMode store.
     */
    activeSectionId?: string
}

/**
 * A single first-level nav item button.
 * Active state is indicated by a left accent bar + full opacity text.
 * Inactive items are dimmed but readable.
 */
function FirstLevelItem({
    section,
    isActive,
    onClick,
}: {
    section: NavSection
    isActive: boolean
    onClick: () => void
}) {
    const theme = useTheme()

    return (
        <Box
            component="button"
            onClick={onClick}
            aria-pressed={isActive}
            aria-label={section.label}
            sx={{
                // Reset button defaults
                background: "none",
                border: "none",
                p: 0,
                cursor: "pointer",
                width: "100%",
                textAlign: "left",

                // Layout: left accent bar + label side by side
                display: "flex",
                alignItems: "center",
                gap: theme.space.component.sm,
                py: theme.space.component.xs,
                pr: theme.space.component.md,

                // Active accent bar via left border on the inner label box
                borderLeft: `2px solid ${isActive
                    ? theme.palette.blue.darkest
                    : "transparent"
                    }`,
                pl: theme.space.component.sm,

                transition: "border-color 0.15s ease, opacity 0.15s ease",

                "&:focus-visible": {
                    outline: `2px solid ${theme.palette.blue.darkest}`,
                    outlineOffset: 2,
                },
            }}
        >
            <Typography
                variant="subtitle2"
                sx={{
                    color: theme.palette.blue.darkest,
                    opacity: isActive ? 1 : 0.5,
                    fontWeight: isActive ? 700 : 500,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    transition: "opacity 0.15s ease, font-weight 0.15s ease",
                    lineHeight: 1.4,
                }}
            >
                {section.label}
            </Typography>
        </Box>
    )
}

/**
 * A single second-level sub-section item.
 * Active state driven by scroll position (from useVerticalNavScroll).
 * Clicking scrolls the page to the element with that id.
 */
function SubSectionItem({
    id,
    label,
    isActive,
    onClick,
}: {
    id: string
    label: string
    isActive: boolean
    onClick: () => void
}) {
    const theme = useTheme()

    return (
        <Box
            component="button"
            data-subsection-id={id}
            onClick={onClick}
            aria-label={label}
            sx={{
                background: "none",
                border: "none",
                p: 0,
                cursor: "pointer",
                width: "100%",
                textAlign: "left",

                display: "flex",
                alignItems: "center",

                // Indent to visually nest under first-level item.
                // The 2px left border on the first-level item is at pl=sm,
                // so we push sub-items further right for clear hierarchy.
                pl: theme.space.component.sm,
                pr: theme.space.component.md,
                py: "3px",

                "&:focus-visible": {
                    outline: `2px solid ${theme.palette.blue.darkest}`,
                    outlineOffset: 2,
                },
            }}
        >
            {/* Active dot indicator */}
            <Box
                sx={{
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    backgroundColor: theme.palette.blue.darkest,
                    opacity: isActive ? 1 : 0,
                    flexShrink: 0,
                    mr: theme.space.component.xs,
                    transition: "opacity 0.15s ease",
                }}
            />
            <Typography
                variant="caption"
                sx={{
                    color: theme.palette.blue.darkest,
                    opacity: isActive ? 0.9 : 0.4,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    transition: "opacity 0.15s ease",
                    lineHeight: 1.5,
                }}
            >
                {label}
            </Typography>
        </Box>
    )
}

// ============================================================================
// Main component
// ============================================================================
export default function VerticalNav({
    onNavigate,
    activeSectionId,
}: VerticalNavProps) {
    const theme = useTheme()
    const [isExpanded, setIsExpanded] = useState(false)

    // How far from the top the nav sits. Should clear your sticky header stack.
    // FLAG: replace with theme.layout.collapsedHeaderHeight + theme.layout.collapsedTabHeight
    // once you confirm the correct theme tokens.
    const NAV_TOP_OFFSET_PX =
        theme.layout.collapsedHeaderHeight +
        theme.layout.collapsedTabHeight * 2

    // Derive the active first-level section object
    const activeSection =
        NAV_SECTIONS.find((s) => s.id === activeSectionId) ?? NAV_SECTIONS[0]

    // Sub-section ids for the currently active first-level section.
    // Only pass ids that exist — the hook skips missing DOM elements gracefully.
    const subSectionIds = activeSection?.subSections.map((s) => s.id) ?? []

    // Track scroll position to highlight the current sub-section.
    // Null when no sub-section is intersecting (e.g. between sections).
    const activeSubSectionId = useVerticalNavScroll(subSectionIds)

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleFirstLevelClick = useCallback(
        (sectionId: string) => {
            // FLAG: replace this with your actual routing call, e.g.:
            //   router.push(`/${sectionId}`)
            //   mapActions.setMapMode(sectionId)
            //   openSection(sectionId)
            // The `onNavigate` prop is the escape hatch for the parent to handle routing.
            if (onNavigate) {
                onNavigate(sectionId)
            } else {
                console.warn(
                    `[VerticalNav] No onNavigate handler. Tried to navigate to: ${sectionId}`,
                )
            }
        },
        [onNavigate],
    )

    const handleSubSectionClick = useCallback((subSectionId: string) => {
        // Scroll the element with this id into view.
        // `block: "start"` aligns the top of the element with the top of the viewport.
        // If your scroll container is not window, you'll need to scope this query.
        const el = document.getElementById(subSectionId)
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" })
        }
    }, [])

    // ── Layout values ──────────────────────────────────────────────────────────
    // Sidebar background: matches the dark wash used in GetStartedView.
    // Using a semi-transparent dark color so the map shows through slightly.
    // FLAG: swap for a specific theme token if one is added for sidebar backgrounds.
    const sidebarBg = theme.palette.common.white

    const navWidth = isExpanded ? NAV_WIDTH_EXPANDED : NAV_WIDTH_COLLAPSED

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <Box
            component="nav"
            aria-label="Learn navigation"
            sx={{
                position: "fixed",
                top: NAV_TOP_OFFSET_PX,
                left: 0,
                // Full height minus the top offset
                height: `calc(100vh - ${NAV_TOP_OFFSET_PX}px)`,
                width: navWidth,
                zIndex: theme.zIndex.modal - 1,

                backgroundColor: sidebarBg,
                backdropFilter: "blur(8px)",

                display: "flex",
                flexDirection: "column",

                // Smooth width transition for collapse/expand
                transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                overflow: "hidden",

                // Prevent text from wrapping during the width transition
                whiteSpace: "nowrap",
            }}
        >
            {/* ── Toggle button ── */}
            {/* Always visible regardless of expanded state.
          Sits at the top of the slit when collapsed. */}
            <Box
                sx={{
                    display: "flex",
                    // When expanded: push toggle to the right edge of the sidebar.
                    // When collapsed: center it in the slit.
                    justifyContent: isExpanded ? "flex-end" : "center",
                    flexShrink: 0,
                    px: isExpanded ? theme.space.component.sm : 0,
                    pt: theme.space.component.sm,
                    pb: theme.space.component.xs,
                }}
            >
                <IconButton
                    onClick={() => setIsExpanded((prev) => !prev)}
                    aria-label={isExpanded ? "Collapse navigation" : "Expand navigation"}
                    size="small"
                    sx={{
                        color: theme.palette.blue.darkest,
                        opacity: 0.7,
                        "&:hover": { opacity: 1, backgroundColor: theme.palette.blue.darkest },
                        "&:focus-visible": {
                            outline: `2px solid ${theme.palette.blue.darkest}`,
                            outlineOffset: 2,
                        },
                    }}
                >
                    {isExpanded ? (
                        <ChevronLeftIcon fontSize="small" />
                    ) : (
                        <MenuIcon fontSize="small" />
                    )}
                </IconButton>
            </Box>

            {/* ── Nav content (hidden when collapsed) ── */}
            {/* opacity + pointerEvents instead of display:none so the transition
          doesn't cut content off mid-animation */}
            <Box
                sx={{
                    flex: 1,
                    overflowY: "auto",
                    overflowX: "hidden",
                    // Hide scrollbar visually, keep functional (matches ThemePanel tab bar pattern)
                    scrollbarWidth: "none",
                    "&::-webkit-scrollbar": { display: "none" },

                    opacity: isExpanded ? 1 : 0,
                    pointerEvents: isExpanded ? "auto" : "none",
                    transition: "opacity 0.15s ease",

                    display: "flex",
                    flexDirection: "column",
                    gap: theme.space.component.xs,
                    px: 0,
                    pb: theme.space.component.lg,
                }}
            >
                {NAV_SECTIONS.map((section) => {
                    const isSectionActive = section.id === activeSection?.id

                    return (
                        <Box key={section.id}>
                            {/* First-level item */}
                            <FirstLevelItem
                                section={section}
                                isActive={isSectionActive}
                                onClick={() => handleFirstLevelClick(section.id)}
                            />

                            {/* Second-level items — only rendered for the active section.
                  Collapsed/hidden for inactive sections to keep the nav scannable.
                  When a section has no sub-sections, nothing renders here. */}
                            {isSectionActive && section.subSections.length > 0 && (
                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        // Small gap between sub-items; tighter than first-level
                                        gap: "4px",
                                        mt: "4px",
                                        mb: theme.space.component.xs,
                                        ml: theme.space.component.md,
                                    }}
                                >
                                    {section.subSections.map((sub) => (
                                        <SubSectionItem
                                            key={sub.id}
                                            id={sub.id}
                                            label={sub.label}
                                            isActive={activeSubSectionId === sub.id}
                                            onClick={() => handleSubSectionClick(sub.id)}
                                        />
                                    ))}
                                </Box>
                            )}
                        </Box>
                    )
                })}
            </Box>
        </Box>
    )
}
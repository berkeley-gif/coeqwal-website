
/**
 * useVerticalNavScroll.ts
 *
 * Tracks which sub-section is currently in view using IntersectionObserver.
 * Returns the id of the active sub-section, or null if none is visible.
 *
 * WHY IntersectionObserver instead of reading from the map store:
 * The map store's activeSection is driven by react-scrollama, which only
 * covers the Learn map sections. Get Started panels are not yet wired to
 * that store. Using IntersectionObserver here means the nav works for both
 * systems without coupling to either — it only cares about DOM ids.
 * ASSUMPTION: sub-section elements are in the window scroll context (not
 * inside an overflow:auto container). If GetStartedView ends up scrolling
 * inside a container, pass that container's ref as `scrollRoot`.
 */

import { useState, useEffect, useRef } from "react"

interface UseVerticalNavScrollOptions {
    /**
     * The IntersectionObserver root. Defaults to the viewport (null).
     * Pass a container ref if the page scrolls inside a div instead of window.
     */
    scrollRoot?: React.RefObject<Element | null>
    /**
     * How much of the element must be visible before it's considered "active".
     * 0.2 = 20% visible. Lower = activates sooner (better for tall sections).
     */
    threshold?: number
    /**
     * Negative top margin applied to the root. Shrinks the detection zone
     * from the top so the active item updates before the section reaches
     * the very top of the viewport. "-20%" fires when section is 20% from top.
     */
    rootMarginTop?: string
}

export function useVerticalNavScroll(
    subSectionIds: string[],
    options: UseVerticalNavScrollOptions = {},
): string | null {
    const {
        scrollRoot,
        threshold = 0.15,
        rootMarginTop = "-10%",
    } = options

    const [activeId, setActiveId] = useState<string | null>(null)

    // Store the latest activeId in a ref so the IntersectionObserver callback
    // can read it without being re-created on every state change.
    // Re-creating the observer on every render would cause it to lose its
    // tracked entries briefly, producing flicker.
    const activeIdRef = useRef<string | null>(null)
    activeIdRef.current = activeId

    useEffect(() => {
        // Nothing to observe if there are no sub-sections
        if (subSectionIds.length === 0) return

        // Collect all target elements. Some may not be in the DOM yet
        // (e.g. Get Started panels before PanelShell ids are added).
        // We only observe what exists.
        const elements = subSectionIds
            .map((id) => document.getElementById(id))
            .filter((el): el is HTMLElement => el !== null)

        if (elements.length === 0) return

        // Track intersection ratios per element so we can pick the most-visible
        // one when multiple are partially in view simultaneously (common with
        // tall ~100vh sections that overlap the detection zone).
        const ratioMap = new Map<string, number>(
            subSectionIds.map((id) => [id, 0]),
        )

        const observer = new IntersectionObserver(
            (entries) => {
                // Update ratio for each observed entry
                entries.forEach((entry) => {
                    const id = entry.target.id
                    ratioMap.set(id, entry.intersectionRatio)
                })

                // Pick the id with the highest intersection ratio.
                // This handles the transition between two tall sections gracefully:
                // the one more visible wins rather than toggling rapidly.
                let bestId: string | null = null
                let bestRatio = 0

                ratioMap.forEach((ratio, id) => {
                    if (ratio > bestRatio) {
                        bestRatio = ratio
                        bestId = id
                    }
                })

                // Only update state if something is actually visible.
                // Don't clear the active item when nothing is intersecting —
                // that would cause the nav to deselect while scrolling between
                // two sections, which looks like a bug.
                if (bestRatio > 0) {
                    setActiveId(bestId)
                    activeIdRef.current = bestId
                }
            },
            {
                root: scrollRoot?.current ?? null,
                // rootMargin: shrink detection zone from top so activation is timely
                rootMargin: `${rootMarginTop} 0px 0px 0px`,
                threshold,
            },
        )

        elements.forEach((el) => observer.observe(el))

        return () => observer.disconnect()

        // Re-run if the list of ids changes (e.g. navigating to a different
        // first-level section with different sub-sections)
    }, [subSectionIds, scrollRoot, threshold, rootMarginTop])

    return activeId
}
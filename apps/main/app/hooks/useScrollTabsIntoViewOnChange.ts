'use client'

import { useEffect, useRef } from "react"
import { useTabs } from '../context/Tabs'

type Options = {
    behavior?: ScrollBehavior
    offsetPx?: number
}

export function useScrollTabsIntoViewOnChange({
    behavior = 'smooth',
    offsetPx = 0
}: Options) {
    const { state, tabsRef, panelRef, scrollIntentRef } = useTabs()
    const { activeTab } = state

    // Track first run so we don't scroll to the tabs on initial page load
    const hasMountedRef = useRef(false)

    useEffect(() => {
        // First effect after mount? Don't scroll
        if (!hasMountedRef.current) {
            hasMountedRef.current = true
            scrollIntentRef.current = 'none'
            return
        }

        // Only scroll to the tabs when the last change was user-initiated
        if (scrollIntentRef.current !== 'user') return

        // Clear intent immediately so re-renders don't retrigger
        scrollIntentRef.current = 'none'

        const raf = requestAnimationFrame(() => {
            const tabsEl = tabsRef.current
            const panelEl = panelRef.current
            if (!tabsEl || !panelEl) return

            const panelDocY = panelEl.getBoundingClientRect().top + window.scrollY
            const tabsHeight = tabsEl.offsetHeight
            const totalOffset = tabsHeight + offsetPx

            // Where the document should scroll to:
            const targetY = Math.max(0, panelDocY - totalOffset)  // put tabs' top at top of viewport

            // Micro-scroll guard: avoid jitter if already aligned
            const epsilon = 2
            if (Math.abs(window.scrollY - targetY) > epsilon) {
                window.scrollTo({ top: targetY, behavior })
            }
        })

        return () => cancelAnimationFrame(raf)
    }, [activeTab, behavior, offsetPx, tabsRef, panelRef, scrollIntentRef])
}
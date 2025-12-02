"use client"

import { useEffect } from "react"
import { useTabs } from "../context/Tabs"

export function useMarkTabsInView(stickyOffsetPx: number = 0) {
    const { tabsRef, setIsInTabsArea } = useTabs()

    useEffect(() => {
        const tabsEl = tabsRef.current
        if (!tabsEl) return

        const update = () => {
            const tabsRect = tabsEl.getBoundingClientRect()

            // ✅ Tabs are "in view" if they are stuck at their sticky offset
            const inArea = Math.abs(tabsRect.top - stickyOffsetPx) <= 1

            setIsInTabsArea(inArea)
        }

        // Run once in case we load mid-page
        update()

        window.addEventListener("scroll", update, { passive: true })
        window.addEventListener("resize", update)

        return () => {
            console.log("useMarkTabsInView cleanup")
            window.removeEventListener("scroll", update)
            window.removeEventListener("resize", update)
        }
    }, [tabsRef, stickyOffsetPx, setIsInTabsArea])
}
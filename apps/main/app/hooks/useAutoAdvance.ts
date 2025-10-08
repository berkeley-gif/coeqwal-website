'use client'

import { useEffect, useMemo, useRef } from "react"
import { useTabs } from '../context/Tabs'
import { TAB_ORDER, TabKey } from '../types/tabs'
import { useScrollDirection } from "./useScrollDirection"

type Options = {
    container?: HTMLElement | null
    idleMs?: number
    fastPathShortPanels?: boolean
}

export function useAutoAdvanceTabs({ container, idleMs = 260, fastPathShortPanels = false }: Options = {}) {
    const { activeTab, setActiveTab, autoAdvanceEnabled, interactionLock } = useTabs()

    const dir = useScrollDirection(container ?? (typeof window !== 'undefined' ? window : undefined))
    const timeOutRef = useRef<number | null>(null)

    // Derive next tab once per activeTab change
    const nextTab = useMemo<TabKey | null>(() => {
        const idx = TAB_ORDER.indexOf(activeTab)
        return TAB_ORDER[idx + 1] ?? null // null when on last tab
    }, [activeTab])

    useEffect(() => {
        if (!autoAdvanceEnabled || interactionLock || !nextTab) return

        const root: Element | Document = container ?? document
        const panel = root.querySelector<HTMLElement>(`#panel-${activeTab}`)
        if (!panel) return

        if (fastPathShortPanels && panel.scrollHeight <= panel.clientHeight && dir === "down") {
            setActiveTab(nextTab)
            history.replaceState({}, '', `/${nextTab}`)
            document.getElementById(`panel-${nextTab}`)?.focus?.()
            return
        }

        const bottom = panel.querySelector<HTMLElement>('[data-sentinel="bottom"]')
        if (!bottom) return

        const io = new IntersectionObserver(
            (entries) => {
                const entry = entries[0]
                const visible = entry?.isIntersecting || entry.intersectionRatio > 0

                if (visible && dir === "down") {
                    if (timeOutRef.current) window.clearTimeout(timeOutRef.current)
                    timeOutRef.current = window.setTimeout(() => {
                        setActiveTab(nextTab)
                        history.replaceState({}, '', `/${nextTab}`)
                        document.getElementById(`panel-${nextTab}`)?.focus?.()
                    }, idleMs)
                } else if (timeOutRef.current) {
                    window.clearTimeout(timeOutRef.current)
                    timeOutRef.current = null
                }
            },
            { root: container ?? null, threshold: 0.01 }
        )

        io.observe(bottom)

        return () => {
            io.disconnect()
            if (timeOutRef.current) window.clearTimeout(timeOutRef.current)
        }
    }, [activeTab, nextTab, autoAdvanceEnabled, interactionLock, dir, container, idleMs, fastPathShortPanels, setActiveTab])
}
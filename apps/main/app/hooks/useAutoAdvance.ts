'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useTabs, setActiveTab, nextTab, clamp } from '../context/Tabs'
import { TAB_ORDER } from '../types/tabs'

type Options = {
    rootMarginBottom?: number
    intentThreshold?: number
    intentWindowMs?: number
    cooldownMs?: number
    minDwellMs?: number
    /** If content scrolls in a custom container, pass it here; otherwise leave null for window. */
    rootEl?: Element | null
    /** Turn on console logs to tune behavior */
    debug?: boolean
}

export function useAutoAdvanceTabs({
    rootMarginBottom = -128,   // start bottom-zone a bit early
    intentThreshold = 1.0,
    intentWindowMs = 450,
    cooldownMs = 1000,
    minDwellMs = 600,
    rootEl = null,
    debug = true,
}: Options = {}) {
    const { state, dispatch, scrollIntentRef, panelRef } = useTabs()
    const { activeTab } = state

    const [showHint, setShowHint] = useState(false)
    const showHintRef = useRef(showHint)
    useEffect(() => { showHintRef.current = showHint }, [showHint])

    const enteredAtRef = useRef<number>(Date.now())
    useEffect(() => { enteredAtRef.current = Date.now() }, [activeTab])

    const scoreRef = useRef(0)
    const lastEventsRef = useRef<number[]>([])
    const lastAdvanceAtRef = useRef(0)

    // Fallback: near-bottom detection via scroll + RAF
    useEffect(() => {
        let raf = 0
        const check = () => {
            const panelEl = panelRef.current
            if (!panelEl) return
            const sentinel = panelEl.querySelector<HTMLElement>('[data-auto-advance-sentinel]')
            if (!sentinel) return

            const rect = sentinel.getBoundingClientRect()
            const vh = (rootEl instanceof HTMLElement ? rootEl.clientHeight : window.innerHeight)
            const inZone = rect.top < vh * 0.8 // bottom 20%
            if (debug) console.log('[fallback] sentinel top, vh, inZone:', rect.top, vh, inZone)
            setShowHint(inZone)
        }

        const scroller: any = rootEl ?? window
        const onScroll = () => {
            cancelAnimationFrame(raf)
            raf = requestAnimationFrame(check)
        }

        scroller.addEventListener('scroll', onScroll, { passive: true })
        // seed once
        onScroll()
        return () => {
            scroller.removeEventListener('scroll', onScroll)
            cancelAnimationFrame(raf)
        }
    }, [panelRef, rootEl, activeTab, debug])

    // Fallback: near-bottom detection via scroll + RAF
    useEffect(() => {
        let raf = 0

        const check = () => {
            const panelEl = panelRef.current
            if (!panelEl) return

            // 1) Prefer sentinel if present
            const sentinel = panelEl.querySelector<HTMLElement>('[data-auto-advance-sentinel]')
            const vh =
                rootEl instanceof HTMLElement ? rootEl.clientHeight : window.innerHeight

            let inZoneBySentinel = false
            if (sentinel) {
                const rect = sentinel.getBoundingClientRect()
                // More generous: consider "in zone" if top of sentinel is anywhere in viewport
                // (or within the last ~2% near the bottom).
                inZoneBySentinel = rect.top < vh * 0.98
                if (debug) {
                    console.log(
                        '[fallback] sentinel check:',
                        { top: rect.top, vh, inZoneBySentinel }
                    )
                }
            }

            // 2) Backup: distance-to-bottom of the whole page (ignores sentinel completely)
            const root = document.scrollingElement || document.documentElement
            const scrollY = window.scrollY || window.pageYOffset
            const docHeight = root.scrollHeight
            const distanceToBottom = Math.max(0, docHeight - (scrollY + vh))

            // tweak this px value to taste; 240–400px works well
            const inZoneByDistance = distanceToBottom <= 320
            if (debug) {
                console.log('[fallback] distanceToBottom:', distanceToBottom, '→', inZoneByDistance)
            }

            // 3) Decide: if either method says “in zone”, we’re in the bottom zone
            const inZone = inZoneBySentinel || inZoneByDistance
            setShowHint(inZone)
        }

        const scroller: any = rootEl ?? window
        const onScroll = () => {
            cancelAnimationFrame(raf)
            raf = requestAnimationFrame(check)
        }

        scroller.addEventListener('scroll', onScroll, { passive: true })
        // seed once
        onScroll()
        return () => {
            scroller.removeEventListener('scroll', onScroll)
            cancelAnimationFrame(raf)
        }
    }, [panelRef, rootEl, activeTab, debug])


    // Gesture scoring when in bottom-zone
    useEffect(() => {
        const now = () => performance.now()

        function maybeAdvance() {
            const t = now()
            if (t - lastAdvanceAtRef.current < cooldownMs) return
            if (t - enteredAtRef.current < minDwellMs) return

            const fresh = lastEventsRef.current.filter(ts => t - ts <= intentWindowMs)
            lastEventsRef.current = fresh
            const score = clamp(fresh.length / 3, 0, 1.5)
            scoreRef.current = score
            if (debug) console.log('[fallback] score:', score, 'events:', fresh.length)

            if (score >= intentThreshold) {
                lastAdvanceAtRef.current = t
                scrollIntentRef.current = 'user'
                const nxt = nextTab(TAB_ORDER, activeTab)!
                if (debug) console.log('[fallback] ADVANCE →', nxt)
                dispatch(setActiveTab(nxt))
                scoreRef.current = 0
                lastEventsRef.current = []
            }
        }

        const onWheel = (e: WheelEvent) => {
            if (!showHintRef.current) return
            if (e.deltaY <= 0) return
            lastEventsRef.current.push(now())
            if (debug) console.log('[fallback] wheel +down')
            maybeAdvance()
        }

        let lastTouchY = 0
        const onTouchStart = (e: TouchEvent) => { if (e.touches.length) lastTouchY = e.touches[0].clientY }
        const onTouchMove = (e: TouchEvent) => {
            if (!showHintRef.current || !e.touches.length) return
            const y = e.touches[0].clientY
            const dy = lastTouchY - y
            lastTouchY = y
            if (dy > 4) {
                lastEventsRef.current.push(now())
                if (debug) console.log('[fallback] touch +down')
                maybeAdvance()
            }
        }

        window.addEventListener('wheel', onWheel, { passive: true })
        window.addEventListener('touchstart', onTouchStart, { passive: true })
        window.addEventListener('touchmove', onTouchMove, { passive: true })
        return () => {
            window.removeEventListener('wheel', onWheel)
            window.removeEventListener('touchstart', onTouchStart)
            window.removeEventListener('touchmove', onTouchMove)
        }
    }, [activeTab, dispatch, intentThreshold, intentWindowMs, cooldownMs, minDwellMs, debug, scrollIntentRef])

    return useMemo(() => ({ showHint }), [showHint])
}

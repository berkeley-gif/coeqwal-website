/**
 * useScrollRightIndicator - Tracks whether a horizontally-scrollable element
 * currently has more content hidden to the right than what's visible, so a
 * caller can show a "there's more, scroll right" affordance instead of
 * leaving users to discover overflow by accident.
 *
 * Re-checks on every scroll event and whenever the element itself resizes.
 * A ResizeObserver alone isn't enough: it only fires when the observed
 * element's own box changes size, not when content *inside* an
 * `overflow: auto` box grows past what's visible (the element's own size
 * stays put; only its scrollWidth changes). Pass anything that can grow the
 * content width in `deps` (an item count, a filter, a view mode) so the
 * check re-runs in that case too.
 */

import { KeyboardReturnSharp } from "@mui/icons-material"
import { useCallback, useEffect, useRef, useState } from "react"
import type { DependencyList } from "react"

export function useScrollRightIndicator<T extends HTMLElement = HTMLDivElement>(
    deps: DependencyList = [],
) {
    const scrollRef = useRef<T>(null)
    const [canScrollRight, setCanScrollRight] = useState(false)

    const checkOverflow = useCallback(() => {
        const el = scrollRef.current
        if (!el) return
        setCanScrollRight(el.scrollWidth - el.clientWidth - el.scrollLeft > 1)
    }, [])

    useEffect(() => {
        const el = scrollRef.current
        if (!el) return
        checkOverflow()
        const observer = new ResizeObserver(checkOverflow)
        observer.observe(el)
        return () => observer.disconnect()

        // deps is a caller-supplied list we can't statically verify; that's the point.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [checkOverflow, ...deps])

    return { scrollRef, canScrollRight, checkOverflow }
}
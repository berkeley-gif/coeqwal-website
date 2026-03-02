/**
 * usePanelRoute is a hook for when you need to pull up a panel and change the URL
 */

"use client"

import { useRouter, usePathname } from "next/navigation"
import { useCallback } from "react"

export function usePanelRoute() {
    const router = useRouter()
    const pathname = usePathname()

    const activeThemeKey = pathname.startsWith("/themes/")
        ? pathname.split("/themes/")[1]
        : null

    const openThemePanel = useCallback((key: string) => {
        router.push(`/themes/${key}`, { scroll: false })
    }, [router])

    const closeThemePanel = useCallback((key: string) => {
        router.push("/", { scroll: false })
    }, [router])

    return { activeThemeKey, openThemePanel, closeThemePanel }
}
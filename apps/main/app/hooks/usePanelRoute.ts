/**
 * usePanelRoute.manages the ?theme= URL parameter for theme panels.
 *
 * Uses router.push (not replace) so the browser back button closes/reopens
 * the panel, giving users a familiar "back to dismiss" interaction.
 */

"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useCallback } from "react"

export function usePanelRoute() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const activeThemeKey = searchParams.get("theme")

  const openThemePanel = useCallback(
    (key: string) => {
      router.push(`${pathname}?theme=${key}`, { scroll: false })
    },
    [router, pathname],
  )

  const closeThemePanel = useCallback(() => {
    router.push(pathname, { scroll: false })
  }, [router, pathname])

  return { activeThemeKey, openThemePanel, closeThemePanel }
}

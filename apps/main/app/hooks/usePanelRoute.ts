/**
 * usePanelRoute is a hook for when you need to pull up a panel and change the URL
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
      // Add theme query param
      router.push(`${pathname}?theme=${key}`, { scroll: false })
    },
    [router, pathname],
  )

  const closeThemePanel = useCallback(() => {
    // Remove the theme param
    router.push(pathname, { scroll: false })
  }, [router, searchParams])

  return { activeThemeKey, openThemePanel, closeThemePanel }
}

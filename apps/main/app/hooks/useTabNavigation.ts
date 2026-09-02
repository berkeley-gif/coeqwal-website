/**
 * useTabNavigation — single entry point for changing tabs.
 * Updates context state AND the URL path (`/${tab}`) so the two never
 * drift apart. Use this instead of dispatching setActiveTab directly.
 */
"use client"

import { useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useTabs, setActiveTab } from "../context/Tabs"
import { normalizePathname } from "../lib/routePath"
import type { TabKey } from "../types/tabs"

const TAB_PATHS = new Set(["/learn", "/explore", "/share"])

export function useTabNavigation() {
  const router = useRouter()
  const pathname = normalizePathname(usePathname())
  const { dispatch } = useTabs()

  const navigateToTab = useCallback(
    (tab: TabKey) => {
      // Entering the tools area from outside it (home, /about, /data)
      // forces a full page load instead of a client-side transition.
      // A full load hands the map bundle to the browser's native
      // preload scanner and loading UI - the same path that already
      // works fine when someone opens /explore directly - instead of
      // Next's client-side router holding an already-interactive page
      // hostage while ~1MB of new JS downloads and executes, which is
      // what trips Chrome's "page unresponsive" watchdog.
      //
      // Switching tabs *within* the tools area keeps the fast
      // client-side path: the map bundle is already loaded by then,
      // and a hard reload there would tear down the persistent map
      // state DynamicMap.tsx relies on staying mounted across tabs.
      if (!TAB_PATHS.has(pathname)) {
        window.location.href = `/${tab}/`
        return
      }

      window.dispatchEvent(
        new CustomEvent("explore:navigating", { detail: { tab } }),
      )
      dispatch(setActiveTab(tab))
      router.replace(`/${tab}`)
    },
    [dispatch, pathname, router],
  )
  return { navigateToTab }
}

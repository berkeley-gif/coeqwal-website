/**
 * useTabNavigation — single entry point for changing tabs.
 * Updates context state AND the URL path (`/${tab}`) so the two never
 * drift apart. Use this instead of dispatching setActiveTab directly.
 */
"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { useTabs, setActiveTab } from "../context/Tabs"
import type { TabKey } from "../types/tabs"

export function useTabNavigation() {
  const router = useRouter()
  const { dispatch } = useTabs()

  const navigateToTab = useCallback(
    (tab: TabKey) => {
      dispatch(setActiveTab(tab))
      router.replace(`/${tab}`, { scroll: false })
    },
    [dispatch, router],
  )

  return { navigateToTab }
}

/**
 * useTabNavigation.dispatches tab changes to context state
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

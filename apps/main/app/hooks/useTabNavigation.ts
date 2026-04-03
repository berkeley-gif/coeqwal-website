/**
 * useTabNavigation.dispatches tab changes to context state.
 *
 * URL responsibility: this hook does NOT write ?tab= to the URL.
 * TabPanels owns the ?tab= parameter because it needs to add/remove it
 * based on scroll position (isInTabsArea), not just on click events.
 * See the useEffect in TabPanels.tsx that reacts to [isInTabsArea, activeTab].
 */
"use client"

import { useCallback } from "react"
import { useTabs, setActiveTab } from "../context/Tabs"
import type { TabKey } from "../types/tabs"

export function useTabNavigation() {
  const { state, dispatch } = useTabs()
  const { activeTab } = state

  const navigateToTab = useCallback(
    (tab: TabKey) => {
      if (tab !== activeTab) {
        dispatch(setActiveTab(tab))
      }
    },
    [activeTab, dispatch],
  )

  return { navigateToTab }
}

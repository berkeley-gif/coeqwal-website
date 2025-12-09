"use client"

/**
 * useActiveTabFromURL
 *
 * Reads the active tab from the URL query parameter (?tab=learn).
 * This allows components outside the TabsProvider to know which tab is active.
 */

import { useSearchParams } from "next/navigation"
import type { TabKey } from "../types/tabs"

const DEFAULT_TAB: TabKey = "learn"

/**
 * Returns the active tab based on the URL query parameter.
 * Falls back to "learn" if no tab is specified.
 */
export function useActiveTabFromURL(): TabKey {
  const searchParams = useSearchParams()
  const urlTab = searchParams.get("tab") as TabKey | null
  return urlTab || DEFAULT_TAB
}

/**
 * Returns whether the Learn tab is currently active.
 */
export function useIsLearnTabActive(): boolean {
  const activeTab = useActiveTabFromURL()
  return activeTab === "learn"
}

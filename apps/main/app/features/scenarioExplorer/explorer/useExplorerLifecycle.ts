"use client"

/**
 *  useExplorerLifecycle - Explore-tab mount effects. Called once from ScenarioExplorer.
 *
 * Warms SWR tier caches for all tools.
 */

import { usePrefetchTiers } from "./tools/hooks/usePrefetchTiers"

export function useExplorerLifecycle(): void {
  // Warms SWR tier caches for all scenarios in all hydroclimates as soon as scenario list
  // mappings are available. Runs once per Explore tab mount so tool panels
  // get cache hits instead of loading spinners on first render.
  usePrefetchTiers()
}

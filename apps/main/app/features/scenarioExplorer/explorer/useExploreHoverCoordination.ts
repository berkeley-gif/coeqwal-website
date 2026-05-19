"use client"

/**
 * useExploreHoverCoordination - transient hover coordination between the scenario sidebar and explore charts.
 *
 * Two directions:
 * - Sidebar -> chart: `onSidebarRowHover` writes `highlightedIds`. Charts
 *   emphasize rows, traces, tiles, or columns for those scenario ids.
 * - Chart -> sidebar: `onChartHover` writes `hoveredInteraction`. The sidebar
 *   scrolls to the scenario row and optionally shows details.
 *
 * Each tool decides what is hoverable and what payload to emit. Only one
 * explore tool mounts at a time, so they share the same callbacks.
 */

import { startTransition, useCallback, useState } from "react"

/** Chart element currently under the pointer */
export type HoveredInteraction = {
  // payloads
  scenarioId: string // scenario id of the hovered scenario
  outcome?: string // optional: which outcome you hovered
  tierValue?: number // optional: that scenario's tier on that outcome (1–4) (we may decide not to use this)
}

export type ExploreHover = {
  highlightedIds: Set<string> | null
  hoveredInteraction: HoveredInteraction | null
  onSidebarRowHover: (ids: string[] | null) => void
  onChartHover: (info: HoveredInteraction | null) => void
}

export function useExploreHoverCoordination(): ExploreHover {
  const [highlightedIds, setHighlightedIds] = useState<Set<string> | null>(null)
  const [hoveredInteraction, setHoveredInteraction] =
    useState<HoveredInteraction | null>(null)

  const onSidebarRowHover = useCallback((ids: string[] | null) => {
    startTransition(() => {
      setHighlightedIds(ids ? new Set(ids) : null)
    })
  }, [])

  const onChartHover = useCallback((info: HoveredInteraction | null) => {
    startTransition(() => {
      setHoveredInteraction(info)
    })
  }, [])

  return {
    highlightedIds,
    hoveredInteraction,
    onSidebarRowHover,
    onChartHover,
  }
}

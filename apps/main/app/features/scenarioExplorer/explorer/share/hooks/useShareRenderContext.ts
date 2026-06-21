"use client"

import { useMemo } from "react"
import { useResolvedScenarioTiers } from "../../tools/hooks/useResolvedScenarioTiers"
import { useShareRadarLive } from "../ShareRadarLiveProvider"

/**
 * Display info a share card needs about one scenario. Built from the
 * resolved sibling groups and keyed by scenario id.
 */
export type ShareScenarioInfo = {
  name: string
  description: string
  definition: string
  shortLabel: string
}

export type ShareScenarioLookup = Map<string, ShareScenarioInfo>

/**
 * Shared render context for the share surfaces.
 *
 * Both the Explore-tab `ShareDrawer` and the Share-tab `SharePanel`
 * render the same cards through `ShareItemView`, so they both need the
 * same three things: a scenario id to display-label lookup, the live
 * radar data per hydroclimate, and the outcome name list. This hook
 * builds all of them once so the two surfaces stay in sync.
 *
 * The live radar data comes from `useShareRadarLive`, supplied by the
 * `ShareRadarLiveProvider` that wraps each share surface. That provider
 * fetches every hydroclimate and scales with the 
 * `HYDROCLIMATES` list, so nothing here changes when a climate is added.
 */
export function useShareRenderContext() {
  const { siblingGroups, allChartData, outcomeNames } =
    useResolvedScenarioTiers()

  const radarLiveByHydro = useShareRadarLive()

  const scenarioLookup = useMemo<ShareScenarioLookup>(() => {
    const map: ShareScenarioLookup = new Map()
    siblingGroups.forEach((s) => {
      map.set(s.scenarioId, {
        name: s.shortLabel,
        description: s.label,
        definition: s.description,
        shortLabel: s.shortLabel,
      })
    })
    return map
  }, [siblingGroups])

  const typedAllChartData = allChartData as Record<
    string,
    Record<string, unknown> | undefined
  >

  return {
    scenarioLookup,
    radarLiveByHydro,
    outcomeNames,
    allChartData: typedAllChartData,
  }
}

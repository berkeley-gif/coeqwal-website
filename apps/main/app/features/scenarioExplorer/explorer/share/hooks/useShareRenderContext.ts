"use client"

import { useMemo } from "react"
import { useResolvedScenarioTiers } from "../../tools/hooks/useResolvedScenarioTiers"
import { useTierChartData } from "../../tools/hooks/useTierChartData"
import {
  buildShareRadarLiveDataFields,
  type ShareRadarHydroKey,
  type ShareRadarLiveDataFields,
} from "../utils/shareRadarLiveData"

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
 */
export function useShareRenderContext() {
  const { siblingGroups, allChartData, outcomeNames } =
    useResolvedScenarioTiers()

  // One `useTierChartData(period, true)` per supported hydroclimate so
  // share items can resolve `item.hydroclimate` to full parallel rows
  // (not showOnlyChosen-filtered) for URL / mixed-tray rehydration.
  //
  // These calls are unrolled on purpose. `useTierChartData` is a hook,
  // so the Rules of Hooks forbid calling it in a variable-length loop.
  // Calling it inside a `HYDROCLIMATES.map(...)` over the list would
  // change the number of hook calls per render. Each hydroclimate
  // therefore gets its own static call, and the `satisfies Record<
  // ShareRadarHydroKey, ...>` below turns a forgotten entry into a
  // compile error. To add a hydroclimate: extend HYDROCLIMATES in
  // content/scenarios (the single source of truth), add a
  // `useTierChartData` line here, and add the matching record entry.
  // See the share README "Hydroclimates" section.
  const compHistorical = useTierChartData("historical", true)
  const compCc50 = useTierChartData("cc50", true)
  const compCc95 = useTierChartData("cc95", true)

  const radarLiveByHydro = useMemo(
    () =>
      ({
        historical: buildShareRadarLiveDataFields(compHistorical),
        cc50: buildShareRadarLiveDataFields(compCc50),
        cc95: buildShareRadarLiveDataFields(compCc95),
      }) satisfies Record<ShareRadarHydroKey, ShareRadarLiveDataFields>,
    [compHistorical, compCc50, compCc95],
  )

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

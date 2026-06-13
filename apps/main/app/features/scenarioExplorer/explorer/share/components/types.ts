/**
 * Shared props for the share card components (tray + story).
 * Both cards render through `ShareItemView`, so they need the same
 * render context: the outcome name list, the scenario lookup, the live
 * radar data per hydroclimate, and the loose chart-data record.
 */

import type { ShareScenarioLookup } from "../hooks/useShareRenderContext"
import type {
  ShareRadarHydroKey,
  ShareRadarLiveDataFields,
} from "../utils/shareRadarLiveData"

export type ShareOutcomeNames = { shortCode: string; displayName: string }[]

export type ShareRadarLiveByHydro = Record<
  ShareRadarHydroKey,
  ShareRadarLiveDataFields
>

export type ShareAllChartData = Record<
  string,
  Record<string, unknown> | undefined
>

export interface ShareCardRenderProps {
  outcomeNames: ShareOutcomeNames
  scenarioLookup: ShareScenarioLookup
  allChartData: ShareAllChartData
  radarLiveByHydro: ShareRadarLiveByHydro
}

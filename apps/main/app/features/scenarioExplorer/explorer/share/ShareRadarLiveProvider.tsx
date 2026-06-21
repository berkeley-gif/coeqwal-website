"use client"

/**
 * ShareRadarLiveProvider
 *
 * Holds the live radar data for every hydroclimate at once and makes it
 * available to the share surfaces through context. A shared URL or a
 * mixed tray can contain cards from any hydroclimate, so share fetches
 * them all up front rather than just the one selected in the toolbar.
 *
 * Why a provider with child fetchers instead of a plain hook:
 * the fetch is `useTierChartData`, a hook, and the React Rules of Hooks
 * forbid calling it in a loop over the hydroclimate list. The number of
 * hook calls must be the same on every render. So this provider renders
 * one invisible `RadarLiveFetcher` per hydroclimate. Each fetcher calls
 * `useTierChartData` exactly once and lifts its shaped fields up to the
 * provider. Mapping over `HYDROCLIMATES` to render components is allowed,
 * unlike calling a hook in that same loop, so the share radar data scales
 * with the canonical list with no hand edits when a hydroclimate is added.
 *
 * This mirrors the `ShareDataRehydrationHost` pattern, which already
 * renders one child per variant to keep its hook calls stable.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { HYDROCLIMATES } from "../../../../content/scenarios"
import { useTierChartData } from "../tools/hooks/useTierChartData"
import {
  buildShareRadarLiveDataFields,
  type ShareRadarHydroKey,
  type ShareRadarLiveDataFields,
} from "./utils/shareRadarLiveData"
import type { ShareRadarLiveByHydro } from "./components/types"

/**
 * Empty fields for a hydroclimate whose tier fetch has not landed yet.
 * The record always carries every key so card code can read
 * `radarLiveByHydro[hc]` without a null check before the fetch resolves.
 */
function emptyRadarFields(): ShareRadarLiveDataFields {
  return {
    radarPlotData: [],
    radarBaseline: null,
    radarAxisRange: {},
    radarLineColorByScenario: new Map(),
    morphGeneration: 0,
  }
}

function buildEmptyByHydro(): ShareRadarLiveByHydro {
  const record = {} as ShareRadarLiveByHydro
  for (const hc of HYDROCLIMATES) record[hc] = emptyRadarFields()
  return record
}

const FALLBACK_BY_HYDRO = buildEmptyByHydro()

const ShareRadarLiveContext =
  createContext<ShareRadarLiveByHydro>(FALLBACK_BY_HYDRO)

/**
 * One fetcher per hydroclimate. Calls `useTierChartData` once, shapes the
 * live radar fields, and reports them to the provider. Renders no UI.
 *
 * The fields it depends on (`data`, `baselineScenario`, `axisRange`,
 * `scenarios`, `morphGeneration`) are each memoized inside
 * `useTierChartData` with stable inputs, so their identity only changes
 * when the underlying tier data changes. The effect therefore reports
 * once on load and again only on real data changes, not on every render.
 */
function RadarLiveFetcher({
  hydroclimate,
  onData,
}: {
  hydroclimate: ShareRadarHydroKey
  onData: (hc: ShareRadarHydroKey, fields: ShareRadarLiveDataFields) => void
}) {
  const comp = useTierChartData(hydroclimate, true)
  const { data, baselineScenario, axisRange, scenarios, morphGeneration } = comp
  const fields = useMemo(
    () =>
      buildShareRadarLiveDataFields({
        data,
        baselineScenario,
        axisRange,
        scenarios,
        morphGeneration,
      }),
    [data, baselineScenario, axisRange, scenarios, morphGeneration],
  )

  useEffect(() => {
    onData(hydroclimate, fields)
  }, [hydroclimate, fields, onData])

  return null
}

/**
 * Wraps a share surface and supplies live radar data for every
 * hydroclimate through context. Read it with `useShareRadarLive`.
 */
export function ShareRadarLiveProvider({ children }: { children: ReactNode }) {
  const [byHydro, setByHydro] =
    useState<ShareRadarLiveByHydro>(buildEmptyByHydro)

  const handleData = useCallback(
    (hc: ShareRadarHydroKey, fields: ShareRadarLiveDataFields) => {
      setByHydro((prev) =>
        prev[hc] === fields ? prev : { ...prev, [hc]: fields },
      )
    },
    [],
  )

  return (
    <ShareRadarLiveContext.Provider value={byHydro}>
      {HYDROCLIMATES.map((hc) => (
        <RadarLiveFetcher key={hc} hydroclimate={hc} onData={handleData} />
      ))}
      {children}
    </ShareRadarLiveContext.Provider>
  )
}

/**
 * Live radar data per hydroclimate for the current share surface.
 * Returns a complete record. Missing climates fall back to empty fields
 * until their fetch lands, so consumers never index into `undefined`.
 */
export function useShareRadarLive(): ShareRadarLiveByHydro {
  return useContext(ShareRadarLiveContext)
}

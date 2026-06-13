"use client"

import { useCallback, useMemo } from "react"
import { type CsvLookups } from "../variants"
import type { ShareScenarioLookup } from "./useShareRenderContext"

/**
 * Build the scenario / outcome label lookups the share export helpers
 * and filename builders need.
 *
 * Filenames, CSV column headers, and the per-card "Download data"
 * action all resolve internal ids (`s0042`) and outcome codes to the
 * same display labels users see in the share UI (`current-ops`). This
 * hook bundles those three lookups (plus the `csvLookups` object the
 * variant registry expects) so the panel does not rebuild them inline.
 *
 * Each lookup falls back to the raw id / code so callers never emit an
 * empty cell or a bare code when a display name is available.
 */
export function useCsvLookups(
  outcomeNames: { shortCode: string; displayName: string }[],
  scenarioLookup: ShareScenarioLookup,
) {
  const outcomeNameByCode = useMemo(() => {
    const map = new Map<string, string>()
    for (const o of outcomeNames) map.set(o.shortCode, o.displayName)
    return map
  }, [outcomeNames])

  const outcomeNameLookup = useCallback(
    (code: string) => outcomeNameByCode.get(code) ?? code,
    [outcomeNameByCode],
  )

  const scenarioNameLookup = useCallback(
    (id: string) =>
      scenarioLookup.get(id)?.description ?? scenarioLookup.get(id)?.name ?? id,
    [scenarioLookup],
  )

  const scenarioShortLabelLookup = useCallback(
    (id: string) => scenarioLookup.get(id)?.shortLabel ?? id,
    [scenarioLookup],
  )

  const csvLookups = useMemo<CsvLookups>(
    () => ({
      scenarioNameLookup,
      scenarioShortLabelLookup,
      outcomeNameLookup,
    }),
    [scenarioNameLookup, scenarioShortLabelLookup, outcomeNameLookup],
  )

  return {
    outcomeNameLookup,
    scenarioNameLookup,
    scenarioShortLabelLookup,
    csvLookups,
  }
}

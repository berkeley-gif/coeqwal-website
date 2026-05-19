"use client"

/**
 * useResilienceLoiDistribution
 *
 * Per-LOI tier distributions for the resilience heatmap's "Distribution /
 * by location" cell encoding. Fans out `fetchTierLocationAssignments`
 * across the scope scenarios for the requested outcomes + hydroclimates
 * and assembles, per (outcome, hc), a list of `ResilienceGlyphEntry`
 * objects - one per LOI, with the tier level aggregated across scope.
 *
 * Preloads SWR keys and dedupes in-flight requests. Gated by `enabled`
 * so we only fetch when the user is actually looking at this encoding.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { preload } from "swr"
import { fetchTierLocationAssignmentsBatch } from "@repo/data/coeqwal"
import type {
  TierLocationAssignmentsResponse,
  TierLocationAssignmentsBatchResponse,
} from "@repo/data/coeqwal"
import { CACHE_KEYS } from "@repo/data/cache"
import type { ResilienceGlyphEntry } from "@repo/viz"
import { useScenarioList } from "../../../../scenarios/hooks/useScenarioList"
import { useResolvedIdMappings } from "../../../../scenarios/hooks/useResolvedIdMapping"
import {
  RESILIENCE_HYDROCLIMATES,
  type ResilienceHydroclimate,
} from "./useResilienceMatrix"

export interface UseResilienceLoiDistributionOptions {
  /** Outcome codes to compute per-LOI distributions for. */
  outcomeCodes: readonly string[]
  /** Hydroclimates to compute columns for. Defaults to all three. */
  hydroclimates?: readonly ResilienceHydroclimate[]
  /** Scope scenario ids (sibling-group ids). Defaults to all 24. */
  scopeScenarioIds?: readonly string[]
  /** Only fetches while true; flips between modes without spamming SWR. */
  enabled: boolean
}

export type LoiDistributionByCell = Record<
  string,
  Partial<Record<ResilienceHydroclimate, ReadonlyArray<ResilienceGlyphEntry>>>
>

export interface UseResilienceLoiDistributionResult {
  /** byCell[outcomeCode][hc] = one ResilienceGlyphEntry per LOI,
   *  aggregated across `scopeScenarioIds`. */
  byCell: LoiDistributionByCell
  /** Re-aggregate over an arbitrary subset of the fetched scope. Used by
   *  the by-scenario small-multiples tiles to compute per-tile (single
   *  scenario) distributions without triggering a separate fetch. */
  buildEntriesForScope: (
    outcomeCode: string,
    hc: ResilienceHydroclimate,
    scope: readonly string[],
  ) => ReadonlyArray<ResilienceGlyphEntry>
  isLoading: boolean
  error: string | null
  hasData: boolean
}

type PerScenarioByHcByOutcome = Record<
  string, // outcomeCode
  Record<
    string, // sibling-group scenarioId
    Partial<Record<ResilienceHydroclimate, TierLocationAssignmentsResponse>>
  >
>

const EMPTY_BY_CELL: LoiDistributionByCell = {}

export function useResilienceLoiDistribution({
  outcomeCodes,
  hydroclimates = RESILIENCE_HYDROCLIMATES,
  scopeScenarioIds,
  enabled,
}: UseResilienceLoiDistributionOptions): UseResilienceLoiDistributionResult {
  const { siblingGroups } = useScenarioList()
  const allMappings = useResolvedIdMappings()

  const [data, setData] = useState<PerScenarioByHcByOutcome>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastKeyRef = useRef<string | null>(null)

  const siblingGroupIds = useMemo(
    () => siblingGroups.map((s) => s.scenarioId),
    [siblingGroups],
  )

  const scopeIds = useMemo<readonly string[]>(() => {
    if (scopeScenarioIds && scopeScenarioIds.length > 0) return scopeScenarioIds
    return siblingGroupIds
  }, [scopeScenarioIds, siblingGroupIds])

  const outcomeKey = outcomeCodes.join(",")
  const hcKey = hydroclimates.join(",")
  const scopeKey = scopeIds.join(",")

  useEffect(() => {
    if (!enabled || outcomeCodes.length === 0 || scopeIds.length === 0) {
      setData({})
      setIsLoading(false)
      setError(null)
      lastKeyRef.current = null
      return
    }

    const fetchKey = `${outcomeKey}|${hcKey}|${scopeKey}`
    if (fetchKey === lastKeyRef.current) return
    lastKeyRef.current = fetchKey

    let cancelled = false
    setIsLoading(true)
    setError(null)

    const mappings: Record<
      ResilienceHydroclimate,
      Record<string, string | null>
    > = {
      historical: allMappings.historical?.idMapping ?? {},
      cc50: allMappings.cc50?.idMapping ?? {},
      cc95: allMappings.cc95?.idMapping ?? {},
    }

    // Batch per (scenario, hc): one HTTP call covers every outcomeCode
    // instead of one call per outcome. For 24 scenarios × 3 hcs × 9 outcomes
    // this reduces 648 requests to 72. Preload with a stable batch key so
    // in-flight requests are shared with any useTierLocationAssignmentsBatch
    // hook that mounts with the same (scenario, codes) pair.
    const outcomeCodesArr: string[] = [...outcomeCodes]

    const tasks: Array<
      Promise<{
        sid: string
        hc: ResilienceHydroclimate
        batch: TierLocationAssignmentsBatchResponse | null
      }>
    > = []

    for (const hc of hydroclimates) {
      for (const sid of scopeIds) {
        const mapped = mappings[hc][sid]
        if (!mapped) continue
        const cacheKey = CACHE_KEYS.tierLocationsBatch(mapped, outcomeCodesArr)
        const p = preload(cacheKey, () =>
          fetchTierLocationAssignmentsBatch(mapped, outcomeCodesArr),
        )
          .then((r) => ({ sid, hc, batch: r }))
          .catch(() => ({
            sid,
            hc,
            batch: null as TierLocationAssignmentsBatchResponse | null,
          }))
        tasks.push(p)
      }
    }

    Promise.all(tasks)
      .then((results) => {
        if (cancelled) return
        const next: PerScenarioByHcByOutcome = {}
        for (const { sid, hc, batch } of results) {
          if (!batch) continue
          for (const [outcomeCode, response] of Object.entries(batch.results)) {
            const perOutcome = next[outcomeCode] ?? (next[outcomeCode] = {})
            const perScenario = perOutcome[sid] ?? (perOutcome[sid] = {})
            perScenario[hc] = response
          }
        }
        setData(next)
        setIsLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setError(String(err?.message ?? err))
        setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [
    enabled,
    outcomeKey,
    hcKey,
    scopeKey,
    outcomeCodes,
    hydroclimates,
    scopeIds,
    allMappings,
  ])

  const byCell = useMemo<LoiDistributionByCell>(() => {
    if (!enabled) return EMPTY_BY_CELL
    if (outcomeCodes.length === 0 || scopeIds.length === 0) return EMPTY_BY_CELL

    const result: LoiDistributionByCell = {}

    for (const outcomeCode of outcomeCodes) {
      const perScenario = data[outcomeCode]
      if (!perScenario) continue

      // Collect the union of LOIs seen across any (scope scenario × hc).
      // Preserve display_order from the first response that mentions an LOI.
      const loiOrder: string[] = []
      const loiSeen = new Set<string>()
      const loiMeta = new Map<string, { label: string; order: number }>()

      for (const sid of scopeIds) {
        const perHc = perScenario[sid]
        if (!perHc) continue
        for (const hc of hydroclimates) {
          const resp = perHc[hc]
          if (!resp) continue
          for (const loc of resp.locations) {
            if (!loiSeen.has(loc.location_id)) {
              loiSeen.add(loc.location_id)
              loiOrder.push(loc.location_id)
              loiMeta.set(loc.location_id, {
                label: loc.location_name,
                order: loc.display_order ?? loiOrder.length,
              })
            }
          }
        }
      }

      loiOrder.sort((a, b) => {
        const ao = loiMeta.get(a)?.order ?? 0
        const bo = loiMeta.get(b)?.order ?? 0
        return ao - bo
      })

      const perHcResult: Partial<
        Record<ResilienceHydroclimate, ReadonlyArray<ResilienceGlyphEntry>>
      > = {}

      for (const hc of hydroclimates) {
        const entries: ResilienceGlyphEntry[] = []
        for (const loiId of loiOrder) {
          const meta = loiMeta.get(loiId)
          if (!meta) continue
          let sum = 0
          let count = 0
          for (const sid of scopeIds) {
            const loc = perScenario[sid]?.[hc]?.locations.find(
              (l) => l.location_id === loiId,
            )
            if (loc && typeof loc.tier_level === "number") {
              sum += loc.tier_level
              count += 1
            }
          }
          if (count === 0) {
            entries.push({
              tierLevel: null,
              loiId,
              locationName: meta.label,
              label: meta.label,
            })
            continue
          }
          const mean = sum / count
          const tierLevel = Math.min(4, Math.max(1, Math.round(mean)))
          entries.push({
            tierLevel,
            tierValue: mean,
            loiId,
            locationName: meta.label,
            label: meta.label,
          })
        }
        if (entries.length > 0) perHcResult[hc] = entries
      }

      if (Object.keys(perHcResult).length > 0) {
        result[outcomeCode] = perHcResult
      }
    }

    return result
  }, [enabled, outcomeCodes, hydroclimates, scopeIds, data])

  const hasData = useMemo(() => {
    for (const oc of Object.keys(byCell)) {
      const perHc = byCell[oc]
      if (!perHc) continue
      for (const hc of Object.keys(perHc) as ResilienceHydroclimate[]) {
        if ((perHc[hc]?.length ?? 0) > 0) return true
      }
    }
    return false
  }, [byCell])

  // Arbitrary-scope re-aggregation for per-tile distributions in the
  // by-scenario small-multiples view. Reuses the already-fetched raw
  // data so no SWR traffic is generated on tile hover / selection.
  const buildEntriesForScope = useCallback(
    (
      outcomeCode: string,
      hc: ResilienceHydroclimate,
      scope: readonly string[],
    ): ReadonlyArray<ResilienceGlyphEntry> => {
      if (!enabled || scope.length === 0) return []
      const perScenario = data[outcomeCode]
      if (!perScenario) return []

      // Collect LOIs in display order.
      const loiOrder: string[] = []
      const loiSeen = new Set<string>()
      const loiMeta = new Map<string, { label: string; order: number }>()

      for (const sid of scope) {
        const resp = perScenario[sid]?.[hc]
        if (!resp) continue
        for (const loc of resp.locations) {
          if (!loiSeen.has(loc.location_id)) {
            loiSeen.add(loc.location_id)
            loiOrder.push(loc.location_id)
            loiMeta.set(loc.location_id, {
              label: loc.location_name,
              order: loc.display_order ?? loiOrder.length,
            })
          }
        }
      }

      loiOrder.sort((a, b) => {
        const ao = loiMeta.get(a)?.order ?? 0
        const bo = loiMeta.get(b)?.order ?? 0
        return ao - bo
      })

      const entries: ResilienceGlyphEntry[] = []
      for (const loiId of loiOrder) {
        const meta = loiMeta.get(loiId)
        if (!meta) continue
        let sum = 0
        let count = 0
        for (const sid of scope) {
          const loc = perScenario[sid]?.[hc]?.locations.find(
            (l) => l.location_id === loiId,
          )
          if (loc && typeof loc.tier_level === "number") {
            sum += loc.tier_level
            count += 1
          }
        }
        if (count === 0) {
          entries.push({
            tierLevel: null,
            loiId,
            locationName: meta.label,
            label: meta.label,
          })
          continue
        }
        const mean = sum / count
        const tierLevel = Math.min(4, Math.max(1, Math.round(mean)))
        entries.push({
          tierLevel,
          tierValue: mean,
          loiId,
          locationName: meta.label,
          label: meta.label,
        })
      }
      return entries
    },
    [enabled, data],
  )

  return { byCell, buildEntriesForScope, isLoading, error, hasData }
}

"use client"

/**
 * useResilienceLoiSensitivity
 *
 * Per-LOI climate sensitivity and operational leverage for a single outcome.
 *
 * Fans out `fetchTierLocationAssignments` across all 24 siblings × 3 HCs
 * for the chosen outcome (72 SWR keys, deduplicated by SWR's cache). Calls
 * are kicked off lazily via `preload` so multiple callers share a single
 * in-flight request, and results are reassembled into per-LOI rows with:
 *
 *   - climateDelta: mean tier level at `climateRefHc` minus mean tier level
 *                   at historical, across the scenario scope.
 *   - opsRange:     max - min of tier levels at `opsRefHc` across the scope.
 *   - tierAtRefHc:  mean tier level at `opsRefHc`, across the scope.
 *
 * Aggregate scope can narrow the "scope" to a selected subset; the default
 * is all sibling groups.
 */

import { useEffect, useMemo, useRef, useState } from "react"
import { preload } from "swr"
import { fetchTierLocationAssignmentsBatch } from "@repo/data/coeqwal"
import type {
  TierLocationAssignmentsResponse,
  TierLocationAssignmentsBatchResponse,
} from "@repo/data/coeqwal"
import { CACHE_KEYS } from "@repo/data/cache"
import { useScenarioList } from "../../scenarios/hooks/useScenarioList"
import { useResolvedIdMappings } from "../../scenarios/hooks/useResolvedIdMapping"
import {
  RESILIENCE_HYDROCLIMATES,
  type ResilienceHydroclimate,
} from "./useResilienceMatrix"

export interface ResilienceLoiRow {
  loiId: string
  label: string
  locationType: string
  /** Shift in mean tier level (climateRefHc vs historical) across scope. */
  climateDelta: number | null
  /** Spread of tier levels across scope at opsRefHc. */
  opsRange: number | null
  /** Mean tier level at opsRefHc across scope (colors the dot). */
  tierAtRefHc: number | null
  /** Number of scope-scenarios with a tier value at opsRefHc. */
  coverageAtRefHc: number
}

export interface UseResilienceLoiSensitivityOptions {
  outcomeCode: string | null
  /** Reference HC for climate sensitivity denominator. Default: cc95. */
  climateRefHc?: ResilienceHydroclimate
  /** HC at which operational spread is computed. Default: climateRefHc. */
  opsRefHc?: ResilienceHydroclimate
  /** Optional scope restriction (sibling-group IDs). Default: all 24. */
  scopeScenarioIds?: readonly string[]
}

export interface UseResilienceLoiSensitivityResult {
  rows: ResilienceLoiRow[]
  isLoading: boolean
  error: string | null
  /** True when we have at least one LOI across scope x HCs. */
  hasData: boolean
}

type PerScenarioByHc = Record<
  string,
  Partial<Record<ResilienceHydroclimate, TierLocationAssignmentsResponse>>
>

export function useResilienceLoiSensitivity({
  outcomeCode,
  climateRefHc = "cc95",
  opsRefHc,
  scopeScenarioIds,
}: UseResilienceLoiSensitivityOptions): UseResilienceLoiSensitivityResult {
  const effectiveOpsRefHc = opsRefHc ?? climateRefHc
  const { siblingGroups } = useScenarioList()
  const allMappings = useResolvedIdMappings()

  const [perScenario, setPerScenario] = useState<PerScenarioByHc>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const lastKeyRef = useRef<string | null>(null)

  // Snapshot mapping per HC once and iterate. allMappings is stable
  // across renders as long as variantMap is stable (it is memoized in
  // useResolvedIdMappings), so we memoize only the things that actually change.
  const siblingGroupIds = useMemo(
    () => siblingGroups.map((s) => s.scenarioId),
    [siblingGroups],
  )

  useEffect(() => {
    if (!outcomeCode || siblingGroupIds.length === 0) {
      setPerScenario({})
      setIsLoading(false)
      setError(null)
      lastKeyRef.current = null
      return
    }

    const fetchKey = `${outcomeCode}|${siblingGroupIds.join(",")}`
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

    // Use the batch endpoint even for a single outcome so the resulting
    // cache key lines up with `CACHE_KEYS.tierLocationsBatch`. That way
    // any `useTierLocationAssignmentsBatch` / prefetch that requested the
    // same (scenario, [outcomeCode]) combination shares in-flight requests
    // and cached results with this hook.
    const codes: string[] = [outcomeCode]

    const tasks: Array<
      Promise<{
        sid: string
        hc: ResilienceHydroclimate
        batch: TierLocationAssignmentsBatchResponse | null
      }>
    > = []

    for (const hc of RESILIENCE_HYDROCLIMATES) {
      for (const sid of siblingGroupIds) {
        const mapped = mappings[hc][sid]
        if (!mapped) continue
        const cacheKey = CACHE_KEYS.tierLocationsBatch(mapped, codes)
        const p = preload(cacheKey, () =>
          fetchTierLocationAssignmentsBatch(mapped, codes),
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
        const next: PerScenarioByHc = {}
        for (const { sid, hc, batch } of results) {
          if (!batch) continue
          const resp = batch.results[outcomeCode]
          if (!resp) continue
          if (!next[sid]) next[sid] = {}
          next[sid]![hc] = resp
        }
        setPerScenario(next)
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
  }, [outcomeCode, siblingGroupIds, allMappings])

  const scopeIds = useMemo<readonly string[]>(() => {
    if (scopeScenarioIds && scopeScenarioIds.length > 0) return scopeScenarioIds
    return siblingGroupIds
  }, [scopeScenarioIds, siblingGroupIds])

  const rows = useMemo<ResilienceLoiRow[]>(() => {
    if (!outcomeCode || scopeIds.length === 0) return []

    // Collect the union of LOI IDs we've seen anywhere in the data.
    // Preserve the display order of the first response that mentions it.
    const loiOrder: string[] = []
    const loiSeen = new Set<string>()
    const loiMeta = new Map<
      string,
      { label: string; locationType: string; order: number }
    >()

    for (const sid of scopeIds) {
      const perHc = perScenario[sid]
      if (!perHc) continue
      for (const hc of RESILIENCE_HYDROCLIMATES) {
        const resp = perHc[hc]
        if (!resp) continue
        for (const loc of resp.locations) {
          if (!loiSeen.has(loc.location_id)) {
            loiSeen.add(loc.location_id)
            loiOrder.push(loc.location_id)
            loiMeta.set(loc.location_id, {
              label: loc.location_name,
              locationType: loc.location_type,
              order: loc.display_order ?? loiOrder.length,
            })
          }
        }
      }
    }

    // Sort by the first-seen display_order so rows read in a stable order.
    loiOrder.sort((a, b) => {
      const ao = loiMeta.get(a)?.order ?? 0
      const bo = loiMeta.get(b)?.order ?? 0
      return ao - bo
    })

    // Build lookup: per (sid, hc, loiId) → tier_level.
    const getTier = (
      sid: string,
      hc: ResilienceHydroclimate,
      loiId: string,
    ): number | null => {
      const loc = perScenario[sid]?.[hc]?.locations.find(
        (l) => l.location_id === loiId,
      )
      return loc ? loc.tier_level : null
    }

    const result: ResilienceLoiRow[] = []
    for (const loiId of loiOrder) {
      const meta = loiMeta.get(loiId)
      if (!meta) continue

      // Climate delta: mean over scope of (tier[climateRefHc] - tier[historical]).
      let climateSum = 0
      let climateCount = 0
      for (const sid of scopeIds) {
        const ref = getTier(sid, climateRefHc, loiId)
        const hist = getTier(sid, "historical", loiId)
        if (ref != null && hist != null) {
          climateSum += ref - hist
          climateCount += 1
        }
      }
      const climateDelta = climateCount > 0 ? climateSum / climateCount : null

      // Ops range / mean tier at opsRefHc.
      const opsTiers: number[] = []
      for (const sid of scopeIds) {
        const t = getTier(sid, effectiveOpsRefHc, loiId)
        if (t != null) opsTiers.push(t)
      }
      const opsRange =
        opsTiers.length >= 2
          ? Math.max(...opsTiers) - Math.min(...opsTiers)
          : opsTiers.length === 1
            ? 0
            : null
      const tierAtRefHc =
        opsTiers.length > 0
          ? opsTiers.reduce((a, b) => a + b, 0) / opsTiers.length
          : null

      result.push({
        loiId,
        label: meta.label,
        locationType: meta.locationType,
        climateDelta,
        opsRange,
        tierAtRefHc,
        coverageAtRefHc: opsTiers.length,
      })
    }

    return result
  }, [outcomeCode, scopeIds, perScenario, climateRefHc, effectiveOpsRefHc])

  const hasData = rows.length > 0

  return { rows, isLoading, error, hasData }
}

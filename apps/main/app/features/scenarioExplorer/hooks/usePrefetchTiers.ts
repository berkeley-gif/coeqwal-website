import { useEffect, useRef } from "react"
import { preload } from "swr"
import {
  fetchAllScenarioTiers,
  fetchTierLocationAssignmentsBatch,
} from "@repo/data/coeqwal"
import { CACHE_KEYS } from "@repo/data/cache"
import { useScenarioList } from "../../scenarios/hooks/useScenarioList"
import { HYDROCLIMATE_ID_MAP } from "../../../content/scenarios"
import { OUTCOME_CODE_ORDER } from "../../../content/outcomes"

const ALL_HYDROCLIMATES = Object.keys(HYDROCLIMATE_ID_MAP)

// Normalize once at module scope so the prefetch cache key and any consumer
// that passes OUTCOME_CODE_ORDER straight through resolve to the same SWR key.
const ALL_OUTCOME_CODES = Array.from(new Set(OUTCOME_CODE_ORDER)).sort()

/**
 * Prefetches tier data for ALL hydroclimates as soon as the scenario list is
 * available.  This warms the SWR cache so that switching hydroclimates in the
 * toolbar is instant instead of showing a loading spinner.
 *
 * Also prefetches per-location tier assignments for every visible scenario
 * across all OUTCOME_CODE_ORDER outcomes using the batch endpoint. One SQL
 * query per scenario serves panels that would otherwise trigger 9+ parallel
 * single-outcome requests (equity heatmaps, tier animations, etc.).
 *
 * Uses SWR's `preload()` so that in-flight requests are shared with any
 * `useSWR` hook that mounts with the same cache key (proper deduplication).
 *
 * Call this once near the top of the Explore tab tree (e.g. ScenarioExplorer).
 */
export function usePrefetchTiers() {
  const { buildIdMapping } = useScenarioList()
  const didPrefetch = useRef(false)

  useEffect(() => {
    if (didPrefetch.current) return

    const mappings = ALL_HYDROCLIMATES.map((hc) => buildIdMapping(hc))
    const allEmpty = mappings.every((m) => Object.keys(m).length === 0)
    if (allEmpty) return

    didPrefetch.current = true

    // Deduplicate scenario ids across hydroclimates so we don't re-preload the
    // same (scenario, codes) batch for sibling scenarios that share an id.
    const allScenarioIds = new Set<string>()

    for (const mapping of mappings) {
      const ids = Object.values(mapping)
      if (ids.length === 0) continue

      const key = CACHE_KEYS.allScenarioTiers(ids)
      preload(key, () => fetchAllScenarioTiers(ids))

      for (const id of ids) allScenarioIds.add(id)
    }

    // Warm the batch location-assignments cache for every visible scenario.
    // Each call is one HTTP request (batched server-side), so this scales to
    // 24 scenarios × 1 request, not 24 × 9.
    for (const id of allScenarioIds) {
      const key = CACHE_KEYS.tierLocationsBatch(id, ALL_OUTCOME_CODES)
      preload(key, () =>
        fetchTierLocationAssignmentsBatch(id, ALL_OUTCOME_CODES),
      )
    }
  }, [buildIdMapping])
}

import { useEffect, useRef } from "react"
import { preload } from "swr"
import { fetchAllScenarioTiers } from "@repo/data/coeqwal"
import { CACHE_KEYS } from "@repo/data/cache"
import { useScenarioList } from "../../scenarios/hooks/useScenarioList"
import { HYDROCLIMATE_ID_MAP } from "../../../content/scenarios"

const ALL_HYDROCLIMATES = Object.keys(HYDROCLIMATE_ID_MAP)

/**
 * Prefetches tier data for ALL hydroclimates as soon as the scenario list is
 * available.  This warms the SWR cache so that switching hydroclimates in the
 * toolbar is instant instead of showing a loading spinner.
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

    for (const mapping of mappings) {
      const ids = Object.values(mapping)
      if (ids.length === 0) continue

      const key = CACHE_KEYS.allScenarioTiers(ids)
      preload(key, () => fetchAllScenarioTiers(ids))
    }
  }, [buildIdMapping])
}

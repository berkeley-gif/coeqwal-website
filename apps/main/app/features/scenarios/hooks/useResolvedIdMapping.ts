/**
 * Hydroclimate id resolution.
 *
 * The UI works with *sibling-group ids* (one row per strategy, e.g.
 * `"s0020"`), but the API stores three variants per group, i.e. one per
 * hydroclimate (like historical / cc50 / cc95, etc), each with its own scenario
 * `short_code`. To fetch data for the active hydroclimate, sibling-group
 * ids must be translated into the matching variant's short_code.
 *
 * This module is the place that translation happens. Components
 * call {@link useResolvedIdMapping} (or {@link useResolvedIdMappings} for
 * all three climates at once) and pass the resolved ids to fetchers like
 * `useMultipleScenarioTiers` or `/api/statistics/batch`.
 */

import { useMemo } from "react"
import { useScenarioList, type Scenario } from "./useScenarioList"
import { useExplorerStore } from "../../scenarioExplorer/explorer/store"
import {
  ALL_HYDROCLIMATES,
  HYDROCLIMATE_ID_MAP,
} from "../../../content/scenarios"

const HISTORICAL_HC_ID = 2

/**
 * Resolved scenario ids for one active hydroclimate
 *
 * Pick the field that matches what your call site needs:
 * - {@link idMapping} - full lookup table, including `null` for missing
 *   variants. Use when you want to render every sibling group and show a
 *   placeholder for the missing ones.
 * - {@link resolvedIds} - flat array of non-null short_codes, ready to
 *   pass to a fetcher (e.g. `useMultipleScenarioTiers`, batch endpoints).
 * - {@link missingScenarioIds} - sibling-group ids with no variant for
 *   this hydroclimate. Drive a "data not available" placeholder off of
 *   this list.
 * - {@link reverseMap} - short_code -> sibling-group id. Use when an API
 *   response comes back keyed by short_code and your component wants it
 *   re-keyed by group id.
 */
export interface ResolvedIdMapping {
  /** The hydroclimate this mapping was resolved for (e.g. `"historical"`) */
  hydroclimate: string
  /** sibling-group id -> resolved short_code, or `null` if the variant is missing */
  idMapping: Record<string, string | null>
  /** Non-null resolved short_codes, ready to pass to fetchers */
  resolvedIds: string[]
  /** Sibling-group ids with no variant for this hydroclimate */
  missingScenarioIds: string[]
  /** Resolved short_code -> sibling-group id (for re-keying API responses) */
  reverseMap: Map<string, string>
}

/**
 * Pure resolver: sibling-group id -> variant short_code, or `null` if no
 * variant exists for this hydroclimate
 *
 * Callers must treat `null` as "data not available for this hydroclimate"
 * and render a placeholder. Do not substitute another variant's data.
 */
function resolveMapping(
  siblingGroups: readonly Scenario[],
  variantMap: ReadonlyMap<string, Record<number, string>>,
  hydroclimate: string,
): Record<string, string | null> {
  const hcId = HYDROCLIMATE_ID_MAP[hydroclimate] ?? HISTORICAL_HC_ID
  const mapping: Record<string, string | null> = {}
  for (const group of siblingGroups) {
    const variants = variantMap.get(group.siblingGroup)
    if (!variants) continue
    mapping[group.scenarioId] = variants[hcId] ?? null
  }
  return mapping
}

/**
 * Run the resolver, then derive the four consumer views of the
 * result (resolvedIds, missingScenarioIds, reverseMap) in one pass.
 */
function buildResolved(
  hydroclimate: string,
  siblingGroups: readonly Scenario[],
  variantMap: ReadonlyMap<string, Record<number, string>>,
): ResolvedIdMapping {
  const idMapping = resolveMapping(siblingGroups, variantMap, hydroclimate)
  const resolvedIds: string[] = []
  const missingScenarioIds: string[] = []
  const reverseMap = new Map<string, string>()
  for (const [groupId, resolved] of Object.entries(idMapping)) {
    if (resolved == null) {
      missingScenarioIds.push(groupId)
    } else {
      resolvedIds.push(resolved)
      reverseMap.set(resolved, groupId)
    }
  }
  return {
    hydroclimate,
    idMapping,
    resolvedIds,
    missingScenarioIds,
    reverseMap,
  }
}

/**
 * Resolve sibling-group ids to scenario short_codes for the **active**
 * hydroclimate.
 *
 * Reads `hydroclimate` from the scenario explorer store. Pass
 * `hydroclimateOverride` for tools that need to pin a specific climate
 * (e.g. share-card captures rendered out of band).
 *
 * @example
 * ```ts
 * const { resolvedIds, reverseMap } = useResolvedIdMapping()
 * const { data } = useSWR(["/statistics/batch", resolvedIds], fetcher)
 * // re-key the response back to sibling-group ids for the component
 * const byGroup = data?.map((row) => ({ ...row, groupId: reverseMap.get(row.scenarioId) }))
 * ```
 */
export function useResolvedIdMapping(
  hydroclimateOverride?: string,
): ResolvedIdMapping {
  const storeHydroclimate = useExplorerStore((s) => s.hydroclimate)
  const hydroclimate = hydroclimateOverride ?? storeHydroclimate
  const { siblingGroups, variantMap } = useScenarioList()

  return useMemo(
    () => buildResolved(hydroclimate, siblingGroups, variantMap),
    [hydroclimate, siblingGroups, variantMap],
  )
}

/**
 * Resolve sibling-group ids for **every** configured hydroclimate at once.
 *
 * Use this when a single render needs all climates side by side (the
 * Resilience matrix renders historical / cc50 / cc95 in parallel), or
 * when warming caches across all climates up front (see
 * `usePrefetchTiers`).
 *
 * Returns a record keyed by hydroclimate string (`"historical"`,
 * `"cc50"`, `"cc95"`). Each value is a full {@link ResolvedIdMapping}.
 */
export function useResolvedIdMappings(): Record<string, ResolvedIdMapping> {
  const { siblingGroups, variantMap } = useScenarioList()

  return useMemo(() => {
    const result: Record<string, ResolvedIdMapping> = {}
    for (const hc of ALL_HYDROCLIMATES) {
      result[hc] = buildResolved(hc, siblingGroups, variantMap)
    }
    return result
  }, [siblingGroups, variantMap])
}

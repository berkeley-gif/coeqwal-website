/**
 * Hydroclimate resolution for the user's selected scenarios.
 *
 * Composes `useResolvedIdMapping` (which resolves the full library)
 * with the explorer store's `selectedScenarios`, returning only the
 * primitives a Data in Depth section needs to fetch and re-key its
 * data:
 *
 * - {@link resolvedIds}: pass directly to `useBatchStatistics` or
 *   `useMultipleScenarioTiers`. Missing-variant groups are dropped.
 * - {@link resolvedToGroup}: re-key an API response keyed by
 *   `short_code` back to sibling-group ids before handing it to
 *   chart components.
 * - {@link missingGroupIds}: drive the "no variant for this
 *   hydroclimate" placeholder for the affected columns.
 */

import { useMemo } from "react"
import { useWorkspaceSlice } from "../../../../store"
import { useResolvedIdMapping } from "../../../../../../scenarios/hooks"

export interface ResolvedSelectedScenarios {
  /** The hydroclimate this mapping was resolved for (e.g. `"historical"`) */
  hydroclimate: string
  /** The user's currently selected sibling-group ids (input to the hook) */
  selectedGroupIds: string[]
  /**
   * Resolved short_codes for the active hydroclimate, missing dropped.
   * Pass directly into `useBatchStatistics` / `useMultipleScenarioTiers`
   */
  resolvedIds: string[]
  /** sibling-group id -> resolved short_code, or `null` if no variant */
  groupToResolved: Record<string, string | null>
  /** Resolved short_code -> sibling-group id, for re-keying API responses */
  resolvedToGroup: Map<string, string>
  /** Selected sibling-group ids with no variant for this hydroclimate */
  missingGroupIds: string[]
}

/**
 * Resolve the user's currently selected scenarios against the active
 * hydroclimate.
 *
 * @example
 * ```ts
 * const { resolvedIds, resolvedToGroup, missingGroupIds } =
 *   useResolvedSelectedScenarios()
 *
 * const { data } = useBatchStatistics(resolvedIds, { types: ["cws"] })
 * const byGroup: Record<string, CwsRow> = {}
 * for (const [shortCode, row] of Object.entries(data?.cws ?? {})) {
 *   const groupId = resolvedToGroup.get(shortCode)
 *   if (groupId) byGroup[groupId] = row
 * }
 * // render `byGroup` for resolved selections, placeholder for `missingGroupIds`
 * ```
 */
export function useResolvedSelectedScenarios(): ResolvedSelectedScenarios {
  const selectedGroupIds = useWorkspaceSlice((s) => s.selectedScenarios)
  const { hydroclimate, idMapping } = useResolvedIdMapping()

  return useMemo(() => {
    const groupToResolved: Record<string, string | null> = {}
    const resolvedIds: string[] = []
    const missingGroupIds: string[] = []
    const resolvedToGroup = new Map<string, string>()

    for (const groupId of selectedGroupIds) {
      const resolved = idMapping[groupId] ?? null
      groupToResolved[groupId] = resolved
      if (resolved == null) {
        missingGroupIds.push(groupId)
      } else {
        resolvedIds.push(resolved)
        resolvedToGroup.set(resolved, groupId)
      }
    }

    return {
      hydroclimate,
      selectedGroupIds: [...selectedGroupIds],
      resolvedIds,
      groupToResolved,
      resolvedToGroup,
      missingGroupIds,
    }
  }, [selectedGroupIds, idMapping, hydroclimate])
}

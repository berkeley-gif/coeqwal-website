/**
 * climateAxis - pure helpers for the "compare by climates" live path.
 *
 * The climates axis holds one strategy (sibling group) constant and draws one
 * member per hydroclimate. Because a climate future is baked into the scenario
 * id (each sibling group has one concrete scenario per hydroclimate), the live
 * fetch for this axis is the SAME per-scenario fan-out the scenarios axis
 * uses; only the id list differs. These helpers compute that list:
 *
 * - `comparedClimateKeys`: which climate keys are compared, mirroring the
 *   member-spec behavior in `useVariableData` exactly (a non-empty selection
 *   is filtered to known keys and may legitimately come out empty; an empty
 *   selection means "all configured hydroclimates").
 * - `climateFanoutIds`: the held strategy's variant short_code per compared
 *   climate, index-aligned with the member specs so each member's `slotIndex`
 *   reads its own climate's series. `null` marks "no variant for this
 *   climate" and MUST fall back to mock for that member only, never to
 *   another climate's data.
 *
 * Pure functions over `content/scenarios` data; no registry, store, or hook
 * imports, so the module is unit-testable node-side
 * (e2e/did-climate-axis-pure.spec.ts).
 */

import {
  HYDROCLIMATES,
  HYDROCLIMATE_ID_MAP,
} from "../../../../../../../content/scenarios"

/**
 * Climate keys compared on the climates axis, in member order.
 *
 * Inputs: the store's `selectedClimates` multi-select. Output: the valid
 * selection in its original order, or every configured hydroclimate when the
 * selection is empty. A non-empty selection of only unknown keys yields an
 * empty list (no members), matching the existing member-spec semantics.
 */
export function comparedClimateKeys(
  selectedClimates: readonly string[],
): string[] {
  return selectedClimates.length > 0
    ? selectedClimates.filter((k) => k in HYDROCLIMATE_ID_MAP)
    : [...HYDROCLIMATES]
}

/**
 * Whether the given compare axis can adopt live series.
 *
 * Input: the active compare axis. Output: true for the three axes the tool
 * offers. Every axis resolves its scenario ids through the PINNED
 * hydroclimate (the scenarios and locations axes take each scenario's
 * variant under the held climate; the climates axis takes the held
 * scenario's variant under every compared climate), so no axis depends on
 * the climate the workspace resolver ran for. The earlier rule, which made
 * the scenarios and locations axes live only when the pin matched the
 * workspace climate, dropped the whole chart to sample data whenever a user
 * pinned a different climate, and drew a fabricated series for a scenario
 * the model does not cover. An unknown axis is never live.
 */
export function liveAxisEligible(compareBy: string): boolean {
  return (
    compareBy === "scenarios" ||
    compareBy === "climates" ||
    compareBy === "locations"
  )
}

/**
 * Resolved scenario short_code (or null) per compared climate, index-aligned
 * with `climateKeys`.
 *
 * Inputs: `idMappingByClimate` (each climate's sibling-group-id ->
 * short_code mapping, i.e. `useResolvedIdMappings()[k].idMapping`), the
 * compared climate keys, and the held strategy's sibling-group id. Output:
 * one short_code per climate key, `null` when the climate or its variant is
 * missing (the caller renders that member from mock data).
 */
export function climateFanoutIds(
  idMappingByClimate: Readonly<
    Record<string, Readonly<Record<string, string | null>> | undefined>
  >,
  climateKeys: readonly string[],
  heldScenarioGroupId: string,
): (string | null)[] {
  return climateKeys.map(
    (k) => idMappingByClimate[k]?.[heldScenarioGroupId] ?? null,
  )
}

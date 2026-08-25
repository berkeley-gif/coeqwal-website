/**
 * displayNames - the project lead's display-name overrides for Data in Depth,
 * keyed by the site's own ids so the endpoints and the rest of the site are
 * untouched:
 *
 *  - `scenarios`: sibling-group scenario id -> the name the sentences and
 *    chips use instead of the site-wide short label ("SGMA: SJ pumping");
 *  - `locations`: entity code -> the label shown after the code instead of
 *    the generated one ("24_NU2 - <label>").
 *
 * The table is `displayNames.table.ts`, produced from the shared sheet's CSV
 * exports by `scripts/did-display-names/import.mjs`; an empty table changes
 * nothing. Pure lookups; the registry applies the location overrides once
 * at build time and the label helpers read the scenario ones.
 */

import { getScenarioShortLabel } from "../../../../../../../content/scenarios"
import { DISPLAY_NAME_TABLE } from "./displayNames.table"

export interface DisplayNameTable {
  scenarios: Record<string, string>
  locations: Record<string, string>
}

export const DISPLAY_NAMES: DisplayNameTable = DISPLAY_NAME_TABLE

/** Scenario label for Data in Depth prose and chips: override, then the
 *  site-wide short label, then the id. Pure. */
export function didScenarioLabel(
  id: string,
  overrides: Record<string, string> = DISPLAY_NAMES.scenarios,
): string {
  return overrides[id] ?? getScenarioShortLabel(id) ?? id
}

/** Entity display name: the code keeps its place as the key ("CODE - label")
 *  and only the label after it is replaced when the table has one. Pure. */
export function didLocationName(
  id: string,
  generatedName: string,
  overrides: Record<string, string> = DISPLAY_NAMES.locations,
): string {
  const label = overrides[id]
  return label ? `${id} - ${label}` : generatedName
}

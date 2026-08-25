/**
 * locationOptions - pure builders for the location pickers in CompareControls.
 *
 * Groups with many members (the 132 agricultural demand units, the 74 and 63
 * community water systems, the 44 groundwater basins) are picked from a
 * grouped select rather than a chip cloud. This module decides which groups
 * use the picker and shapes their option groups: aggregates first, then
 * North of Delta, then South of Delta (then any Delta or system-wide items),
 * with optional exclusions (members already selected) and disabled ids
 * (members a view cannot show). No React, no store reads.
 */

import type { LocationDef, LocationGroup } from "../config/variableRegistry"

/** Groups with more members than this render as a picker, not chips. */
export const CHIP_CLOUD_MAX = 12

/** Whether a location group is picked from a grouped select. */
export function usesLocationPicker(group: LocationGroup): boolean {
  return group.items.length > CHIP_CLOUD_MAX
}

export interface LocationOption {
  value: string
  label: string
  disabled?: boolean
}

export interface LocationOptionGroup {
  label: string
  options: LocationOption[]
}

const REGION_LABELS: ReadonlyArray<{
  label: string
  match: (l: LocationDef) => boolean
}> = [
  { label: "Aggregates", match: (l) => !!l.aggregate },
  { label: "North of Delta", match: (l) => !l.aggregate && l.region === "NOD" },
  { label: "South of Delta", match: (l) => !l.aggregate && l.region === "SOD" },
  { label: "Delta", match: (l) => !l.aggregate && l.region === "Delta" },
  { label: "System-wide", match: (l) => !l.aggregate && l.region === "ALL" },
]

/**
 * Option groups for a location group, in registry order within each
 * heading. `exclude` drops members (already-selected ids on the Locations
 * axis); `disabled` marks members unavailable without hiding them. Empty
 * headings are dropped. Pure.
 */
export function locationOptionGroups(
  group: LocationGroup,
  opts: { exclude?: readonly string[]; disabled?: readonly string[] } = {},
): LocationOptionGroup[] {
  const exclude = new Set(opts.exclude ?? [])
  const disabled = new Set(opts.disabled ?? [])
  const items = group.items.filter((l) => !exclude.has(l.id))
  const toOption = (l: LocationDef): LocationOption => ({
    value: l.id,
    label: l.name,
    ...(disabled.has(l.id) ? { disabled: true } : {}),
  })
  return REGION_LABELS.map(({ label, match }) => ({
    label,
    options: items.filter(match).map(toOption),
  })).filter((g) => g.options.length > 0)
}

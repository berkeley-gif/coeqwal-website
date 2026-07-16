/**
 * seriesColorAssignment - sticky palette-slot assignment for comparison
 * members, so a member (a reservoir, a scenario, a climate future) keeps one
 * dedicated color instead of colors reshuffling whenever the selection
 * changes (the old color-by-selection-position behavior).
 *
 * Assignment rules, per scope (a scope is one comparison axis namespace,
 * e.g. "scenarios", "climates", or "locations:reservoirs"):
 *  - a member keeps its assigned palette slot for the lifetime of the page
 *    (module-level memory; resets on reload, never persisted);
 *  - a new member takes the lowest palette slot not used by the members it
 *    is currently shown with, so concurrent members always get distinct
 *    colors (selections are capped at SERIES_PALETTE.length = 6 members, so
 *    a free slot always exists);
 *  - if two previously-assigned members meet holding the same slot (possible
 *    when they were first shown in different combinations), the later one in
 *    the list is re-assigned to a free slot, which it then keeps.
 *
 * Side effect: getStableSeriesColors mutates the module-level assignment
 * map. The mutation is idempotent for identical inputs, so repeated renders
 * (StrictMode double-render, static-export prerender followed by hydration
 * from an equally empty map) produce identical colors.
 */

import { getSeriesColor, SERIES_PALETTE } from "@repo/viz"

/** scope -> (member id -> palette slot). Module-level session memory. */
const assignmentsByScope = new Map<string, Map<string, number>>()

/**
 * Colors (hex strings) for `memberIds`, aligned by index.
 *
 * Input order matters only for first assignment and collision repair
 * (earlier members win); an already-assigned member gets the same color
 * whatever its position.
 */
export function getStableSeriesColors(
  scope: string,
  memberIds: string[],
): string[] {
  let slots = assignmentsByScope.get(scope)
  if (!slots) {
    slots = new Map()
    assignmentsByScope.set(scope, slots)
  }

  // Pass 1: earlier members keep their remembered slot; a later member whose
  // slot is already claimed in this combination is queued for re-assignment.
  const claimed = new Set<number>()
  for (const id of memberIds) {
    const slot = slots.get(id)
    if (slot === undefined) continue
    if (claimed.has(slot)) slots.delete(id)
    else claimed.add(slot)
  }

  // Pass 2: assign every unassigned member the lowest free slot. The while
  // loop stops at the palette length as a guard; getSeriesColor cycles past
  // the palette end, which only matters beyond the 6-member selection caps.
  for (const id of memberIds) {
    if (slots.has(id)) continue
    let slot = 0
    while (claimed.has(slot) && slot < SERIES_PALETTE.length) slot += 1
    slots.set(id, slot)
    claimed.add(slot)
  }

  return memberIds.map((id) => getSeriesColor(slots.get(id) as number))
}

/** Clears all remembered assignments (test isolation only). */
export function resetSeriesColorAssignments(): void {
  assignmentsByScope.clear()
}

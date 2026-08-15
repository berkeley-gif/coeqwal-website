/**
 * wytFilter - water-year-type vocabulary and pure helpers for the explorer's
 * filter. Classes follow the Sacramento Valley index exactly as stored by
 * the API's scenario water-year-type table: 1=Wet, 2=Above normal,
 * 3=Below normal, 4=Dry, 5=Critical. An empty selection means "all years".
 * No React and no store imports (the store slice depends on this module).
 */

export const WYT_CLASSES = [1, 2, 3, 4, 5] as const

export const WYT_LABELS: Record<number, string> = {
  1: "Wet",
  2: "Above normal",
  3: "Below normal",
  4: "Dry",
  5: "Critical",
}

/** Keep only the values whose year (by index) is in the selected classes. */
export function filterSeriesByWyt(
  series: number[],
  selected: number[],
  classForIndex: (yearIndex: number) => number,
): number[] {
  if (selected.length === 0) return series
  const allow = new Set(selected)
  return series.filter((_, i) => allow.has(classForIndex(i)))
}

/**
 * The wyt selection a variable's data path should actually use: the stored
 * selection when the variable supports water-year-type filtering and a class
 * is selected, otherwise undefined (no `wyt=` request param, no mock-side
 * filtering). Variables that opt out (`wytApplicable: false` in the registry:
 * metrics that do not decompose by water-year type, e.g. salmon population
 * metrics, welfare loss) keep the stored selection INERT rather than cleared,
 * so it revives when the user switches back to a variable it applies to.
 */
export function effectiveWytSelection(
  wytApplicable: boolean,
  selected: number[],
): number[] | undefined {
  return wytApplicable && selected.length > 0 ? selected : undefined
}

/**
 * Single-select toggle: choosing a class replaces the selection (one water
 * year type shown at a time, per the team ruling), and choosing the active
 * class clears it back to all years. The selection stays an array so the
 * session shape, the live `wyt=` request serialization, and the series
 * filter are unchanged.
 */
export function toggleWytClass(selected: number[], wyt: number): number[] {
  return selected.includes(wyt) ? [] : [wyt]
}

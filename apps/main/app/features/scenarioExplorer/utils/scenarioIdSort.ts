/** Baseline scenario (Current Operations) - listed first within baseline theme */
export const PRIMARY_SCENARIO_BASELINE_ID = "s0020"

const SCENARIO_ID_NUMERIC = /^s(\d+)$/i

export function scenarioIdNumericKey(id: string): number | null {
  const m = SCENARIO_ID_NUMERIC.exec(id)
  return m ? parseInt(m[1]!, 10) : null
}

/** Ascending numeric short code (sNNNN) when present, else lexical. */
export function compareScenarioIdsByValue(a: string, b: string): number {
  const na = scenarioIdNumericKey(a)
  const nb = scenarioIdNumericKey(b)
  if (na !== null && nb !== null && na !== nb) return na - nb
  if (na !== null && nb === null) return -1
  if (na === null && nb !== null) return 1
  return a.localeCompare(b)
}

/**
 * Order within a theme subgroup: primary baseline first, then ascending short code.
 * Matches default sidebar ordering and per-theme radar palette indices.
 */
export function compareScenarioIdsForThemeSubgroupOrder(
  a: string,
  b: string,
): number {
  if (a === PRIMARY_SCENARIO_BASELINE_ID) return -1
  if (b === PRIMARY_SCENARIO_BASELINE_ID) return 1
  return compareScenarioIdsByValue(a, b)
}

/** Per-theme palette index from `compareScenarioIdsForThemeSubgroupOrder`. */
export function buildIndexWithinThemeMap(
  ids: readonly string[],
  getThemeForScenario: (id: string) => string,
): Map<string, number> {
  const byTheme = new Map<string, string[]>()
  for (const id of ids) {
    const theme = String(getThemeForScenario(id))
    const list = byTheme.get(theme) ?? []
    list.push(id)
    byTheme.set(theme, list)
  }
  const map = new Map<string, number>()
  for (const group of byTheme.values()) {
    const sorted = [...group].sort(compareScenarioIdsForThemeSubgroupOrder)
    sorted.forEach((id, i) => map.set(id, i))
  }
  return map
}
